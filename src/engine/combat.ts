// src/engine/combat.ts
// 战斗系统：回合制战斗、出手顺序、伤害计算、敌人AI

import type { PlayerState } from '@/types/player'
import type { Enemy, EnemySkill } from '@/types/enemy'
import { EnemyType, EnemySkillTargetType } from '@/types/enemy'
import { getRegistry } from './registry'
import {
  calcTurnOrder,
  calcPlayerBaseDamage,
  calcHitChance,
  calcCriticalChance,
  calcCriticalMultiplier,
  calcFinalDamage,
  calcEnemyFinalDamage,
  calcEnemyHitChance,
  calcEscapeChance,
  calcObserveChance,
  calcStaminaCost,
  scaleEnemyByCorruption,
  calcDefenseDamageReduction,
} from './formula'
import { weightedSelect, randomInt, chance } from './dice'
import { getEffectResolver } from './effect'
import { updateStatusTurns, removeBattleEndStatuses, triggerStatusEffects } from './status'
import { addItem } from './inventory'

// ============================================================
// 战斗状态枚举
// ============================================================

/** 战斗阶段 */
export enum BattlePhase {
  /** 战斗开始 */
  START = 'start',
  /** 玩家回合 */
  PLAYER_TURN = 'playerTurn',
  /** 敌人回合 */
  ENEMY_TURN = 'enemyTurn',
  /** 战斗结束 */
  END = 'end',
}

/** 战斗结果 */
export enum BattleResult {
  /** 战斗进行中 */
  ONGOING = 'ongoing',
  /** 玩家胜利 */
  VICTORY = 'victory',
  /** 玩家战败 */
  DEFEAT = 'defeat',
  /** 玩家逃跑成功 */
  ESCAPED = 'escaped',
}

/** 玩家战斗操作类型 */
export enum PlayerActionType {
  /** 战斗技能 */
  BATTLE_SKILL = 'battleSkill',
  /** 防守 */
  DEFEND = 'defend',
  /** 使用物品 */
  USE_ITEM = 'useItem',
  /** 观察/分析 */
  OBSERVE = 'observe',
  /** 逃跑 */
  ESCAPE = 'escape',
}

// ============================================================
// 战斗状态接口
// ============================================================

/** 战斗运行时状态 */
export interface BattleState {
  /** 当前阶段 */
  phase: BattlePhase
  /** 当前回合数 */
  turn: number
  /** 战斗结果 */
  result: BattleResult

  /** 敌人列表（可被缩放后的副本） */
  enemies: BattleEnemy[]
  /** 玩家是否在本回合防守 */
  isPlayerDefending: boolean

  /** 战斗日志 */
  logs: string[]

  /** 是否初见（逃跑概率加倍） */
  isFirstEncounter: boolean
}

/** 战斗中的敌人实例 */
export interface BattleEnemy {
  /** 敌人配置 */
  config: Enemy
  /** 当前生命值 */
  hp: number
  /** 缩放后的最大生命值 */
  maxHp: number
  /** 缩放后的力量 */
  strength: number
  /** 缩放后的敏捷 */
  agility: number
  /** 缩放后的防御 */
  defenses: Record<string, number>
  /** 技能使用计数（追踪 maxUses） */
  skillUseCount: Record<string, number>
  /** 技能冷却跟踪 */
  skillCooldowns: Record<string, number>
  /** 蓄力跟踪 */
  chargingSkillId: string | null
  /** 蓄力剩余回合 */
  chargeRemainingTurns: number
}

// ============================================================
// 战斗工厂
// ============================================================

/**
 * 创建新战斗状态
 *
 * @param player - 当前玩家状态
 * @param enemyIds - 敌人配置ID列表
 * @returns 战斗状态
 */
export function createBattle(player: PlayerState, enemyIds: string[]): BattleState {
  const registry = getRegistry()
  const corruption = player.progress.corruption

  const enemies: BattleEnemy[] = enemyIds
    .map((id) => registry.getEnemy(id))
    .filter((enemy): enemy is Enemy => enemy !== undefined)
    .map((enemy) => {
      const scaled = scaleEnemyByCorruption(enemy, corruption)
      return {
        config: enemy,
        hp: scaled.hp,
        maxHp: scaled.hp,
        strength: scaled.strength,
        agility: scaled.agility,
        defenses: scaled.defenses,
        skillUseCount: {},
        skillCooldowns: {},
        chargingSkillId: null,
        chargeRemainingTurns: 0,
      }
    })

  return {
    phase: BattlePhase.START,
    turn: 0,
    result: BattleResult.ONGOING,
    enemies,
    isPlayerDefending: false,
    logs: [],
    isFirstEncounter: true,
  }
}

// ============================================================
// 战斗流程
// ============================================================

/**
 * 开始战斗
 * 初始化战斗状态，计算出手顺序
 *
 * @param battle - 战斗状态（会被直接修改）
 * @returns 战斗日志
 */
export function startBattle(battle: BattleState): string[] {
  battle.phase = BattlePhase.START
  battle.turn = 0
  battle.logs = []

  const enemyNames = battle.enemies.map((e) => e.config.name).join('、')
  battle.logs.push(`⚔ 战斗开始！${enemyNames}出现了！`)

  // 进入玩家回合
  battle.phase = BattlePhase.PLAYER_TURN
  return [...battle.logs]
}

/**
 * 执行玩家操作
 *
 * @param player - 玩家状态（会被直接修改）
 * @param battle - 战斗状态（会被直接修改）
 * @param actionType - 操作类型
 * @param skillId - 战斗技能ID（仅 actionType === 'battleSkill' 时需要）
 * @param itemInstanceId - 物品实例ID（仅 actionType === 'useItem' 时需要）
 * @returns 战斗日志
 */
export function executePlayerAction(
  player: PlayerState,
  battle: BattleState,
  actionType: PlayerActionType,
  skillId?: string,
  itemInstanceId?: string,
): string[] {
  if (battle.result !== BattleResult.ONGOING) return battle.logs

  battle.logs = []
  battle.isPlayerDefending = false

  switch (actionType) {
    case PlayerActionType.BATTLE_SKILL:
      if (skillId) {
        executePlayerBattleSkill(player, battle, skillId)
      } else {
        executePlayerBasicAttack(player, battle)
      }
      break

    case PlayerActionType.DEFEND:
      battle.isPlayerDefending = true
      battle.logs.push('你摆出防守姿态，准备抵御敌人的攻击')
      break

    case PlayerActionType.USE_ITEM:
      if (itemInstanceId) {
        executePlayerUseItem(player, battle, itemInstanceId)
      } else {
        battle.logs.push('未选择要使用的物品')
      }
      break

    case PlayerActionType.OBSERVE:
      executePlayerObserve(player, battle)
      break

    case PlayerActionType.ESCAPE:
      executePlayerEscape(player, battle)
      if ((battle.result as BattleResult) === BattleResult.ESCAPED) {
        removeBattleEndStatuses(player)
        return battle.logs
      }
      break
  }

  // 检查敌人是否全灭
  if (checkAllEnemiesDefeated(battle)) {
    battle.result = BattleResult.VICTORY
    battle.phase = BattlePhase.END
    battle.logs.push('战斗胜利！')
    removeBattleEndStatuses(player)
    return battle.logs
  }

  // 进入敌人回合
  battle.phase = BattlePhase.ENEMY_TURN
  executeEnemyTurn(player, battle)

  // 检查玩家是否战败
  if (player.survival.hp <= 0) {
    battle.result = BattleResult.DEFEAT
    battle.phase = BattlePhase.END
    battle.logs.push('你被击败了……')
    return battle.logs
  }

  // 回合数+1，回到玩家回合
  battle.turn += 1
  battle.phase = BattlePhase.PLAYER_TURN

  // 更新回合状态
  const statusLogs = updateStatusTurns(player)
  if (statusLogs.length > 0) {
    battle.logs.push(...statusLogs)
  }

  return battle.logs
}

// ============================================================
// 玩家操作实现
// ============================================================

/**
 * 执行玩家普攻
 * 使用当前装备的武器进行攻击
 */
function executePlayerBasicAttack(player: PlayerState, battle: BattleState): void {
  const registry = getRegistry()
  const weaponId = player.equipment.weapon
  let weaponDamage = 0
  let weaponTypeId = 'unarmed'
  let accuracyBonus = 0
  let critChanceBonus = 0
  let critMultiplierBonus = 0
  let damageTypeId = 'blunt'

  if (weaponId) {
    const weaponConfig = registry.getItem(weaponId)
    if (weaponConfig && 'weaponStats' in weaponConfig) {
      const stats = (
        weaponConfig as {
          weaponStats: {
            baseDamage: number
            damageTypeId: string
            accuracyModifier: number
            criticalChanceModifier: number
            criticalMultiplier: number
          }
        }
      ).weaponStats
      weaponDamage = stats.baseDamage
      damageTypeId = stats.damageTypeId
      accuracyBonus = stats.accuracyModifier
      critChanceBonus = stats.criticalChanceModifier
      critMultiplierBonus = stats.criticalMultiplier
      weaponTypeId = (weaponConfig as { weaponTypeId?: string }).weaponTypeId ?? 'unarmed'
    }
  }

  // 武器熟练度加成
  const proficiency = player.skills.weaponProficiencies[weaponTypeId]?.level ?? 0
  const proficiencyDamageBonus = proficiency * 2
  const proficiencyHitBonus = proficiency * 0.03
  const proficiencyCritBonus = proficiency * 0.02
  const proficiencyCritMultBonus = proficiency * 0.1

  // 选择目标（当前存活的第一敌人）
  const target = battle.enemies.find((e) => e.hp > 0)
  if (!target) return

  // 命中判定
  const effectiveAgility = player.attributes.agility + player.attributes.agilityModifier
  const hitChance = calcHitChance(
    effectiveAgility,
    proficiencyHitBonus,
    accuracyBonus,
    target.agility,
  )

  if (!chance(hitChance)) {
    battle.logs.push(`你对 ${target.config.name} 发动攻击，但没有命中!`)
    return
  }

  // 暴击判定
  const critChance = calcCriticalChance(proficiencyCritBonus, critChanceBonus)
  const isCritical = chance(critChance)
  const critMultiplier = calcCriticalMultiplier(proficiencyCritMultBonus, critMultiplierBonus)

  // 计算伤害
  const baseDamage = calcPlayerBaseDamage(effectiveAgility, weaponDamage, proficiencyDamageBonus)
  const targetDefense = target.defenses[damageTypeId] ?? 0
  const finalDamage = calcFinalDamage(baseDamage, isCritical, critMultiplier, targetDefense)

  // 应用伤害
  target.hp -= finalDamage
  if (target.hp < 0) target.hp = 0

  // 日志
  const critText = isCritical ? '暴击！' : ''
  battle.logs.push(
    `你对 ${target.config.name} 造成了 ${finalDamage} 点伤害${critText}` +
      (target.hp <= 0 ? `，${target.config.name} 被击败了!` : ''),
  )

  // 获得力量经验（近战攻击）
  if (weaponTypeId !== 'unarmed' || player.equipment.weapon) {
    player.attributes.strengthExp += 2
  }
}

/**
 * 执行玩家战斗技能
 */
function executePlayerBattleSkill(player: PlayerState, battle: BattleState, skillId: string): void {
  const registry = getRegistry()
  const skillConfig = registry.getBattleSkill(skillId)

  if (!skillConfig) {
    battle.logs.push(`技能 ${skillId} 未找到`)
    executePlayerBasicAttack(player, battle)
    return
  }

  // 检查体力消耗
  const effectiveAgility = player.attributes.agility + player.attributes.agilityModifier
  const skillStaminaCost = skillConfig.costs.find((c) => c.costType === 'stamina')?.value ?? 10
  const staminaCost = calcStaminaCost(
    skillStaminaCost,
    player.attributes.coefficients.staminaConsumptionCoefficient,
  )

  if (player.survival.stamina < staminaCost) {
    battle.logs.push(`体力不足，无法使用 ${skillConfig.name}（需要 ${staminaCost} 点体力）`)
    executePlayerBasicAttack(player, battle)
    return
  }

  player.survival.stamina -= staminaCost

  // 技能命中与伤害（简化实现，后续可扩展）
  const target = battle.enemies.find((e) => e.hp > 0)
  if (!target) return

  // 计算武器熟练度加成
  const weaponTypeId = player.equipment.weapon
    ? ((registry.getItem(player.equipment.weapon) as { weaponTypeId?: string })?.weaponTypeId ??
      'unarmed')
    : 'unarmed'
  const proficiency = player.skills.weaponProficiencies[weaponTypeId]?.level ?? 0

  const hitChance = calcHitChance(
    effectiveAgility,
    proficiency * 0.03,
    (skillConfig as { accuracyModifier?: number }).accuracyModifier ?? 0,
    target.agility,
  )

  if (!chance(hitChance)) {
    battle.logs.push(`你的 ${skillConfig.name} 没有命中!`)
    return
  }

  const isCritical = chance(
    calcCriticalChance(
      proficiency * 0.02,
      (skillConfig as { critChanceModifier?: number }).critChanceModifier ?? 0,
    ),
  )
  const critMultiplier = calcCriticalMultiplier(
    proficiency * 0.1,
    (skillConfig as { critMultiplierModifier?: number }).critMultiplierModifier ?? 0,
  )

  const baseDamage =
    (skillConfig as { baseDamage?: number }).baseDamage ??
    calcPlayerBaseDamage(effectiveAgility, 0, proficiency * 2)
  const damageTypeId = (skillConfig as { damageTypeId?: string }).damageTypeId ?? 'blunt'
  const targetDefense = target.defenses[damageTypeId] ?? 0
  const finalDamage = calcFinalDamage(baseDamage, isCritical, critMultiplier, targetDefense)

  target.hp -= finalDamage
  if (target.hp < 0) target.hp = 0

  const critText = isCritical ? '暴击！' : ''
  battle.logs.push(
    `你使用 ${skillConfig.name} 对 ${target.config.name} 造成了 ${finalDamage} 点伤害${critText}` +
      (target.hp <= 0 ? `，${target.config.name} 被击败了!` : ''),
  )
}

/**
 * 执行玩家使用物品
 */
function executePlayerUseItem(player: PlayerState, battle: BattleState, instanceId: string): void {
  battle.logs.push('战斗中使用物品尚未完全实现')
}

/**
 * 执行玩家观察/分析
 */
function executePlayerObserve(player: PlayerState, battle: BattleState): void {
  const effectiveIntelligence =
    player.attributes.intelligence + player.attributes.intelligenceModifier
  const successChance = calcObserveChance(effectiveIntelligence)

  const target = battle.enemies.find((e) => e.hp > 0)
  if (!target) return

  if (chance(successChance)) {
    const defenseInfo = Object.entries(target.defenses)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ')

    battle.logs.push(
      `【分析成功】${target.config.name} - ` +
        `HP:${target.hp}/${target.maxHp}, ` +
        `力量:${target.strength}, 敏捷:${target.agility}` +
        (defenseInfo ? `, 防御[${defenseInfo}]` : ''),
    )
  } else {
    battle.logs.push('你试图分析敌人，但未能获得有效信息')
  }
}

/**
 * 执行玩家逃跑
 */
function executePlayerEscape(player: PlayerState, battle: BattleState): void {
  const canEscape = battle.enemies.every((e) => !e.config.canNotEscape)
  if (!canEscape) {
    battle.logs.push('无法逃跑！')
    return
  }

  const effectiveAgility = player.attributes.agility + player.attributes.agilityModifier
  // 取最高敏捷的敌人计算逃跑概率
  const maxEnemyAgility = Math.max(...battle.enemies.map((e) => e.agility))
  const difficultyModifier = Math.max(
    ...battle.enemies.map((e) => e.config.escapeDifficultyModifier),
  )
  const escapeChance = calcEscapeChance(
    effectiveAgility,
    maxEnemyAgility,
    battle.isFirstEncounter,
    difficultyModifier,
  )

  battle.isFirstEncounter = false

  if (chance(escapeChance)) {
    battle.result = BattleResult.ESCAPED
    battle.phase = BattlePhase.END
    battle.logs.push('你成功逃离了战斗！')
  } else {
    battle.logs.push('逃跑失败！')
  }
}

// ============================================================
// 敌人回合
// ============================================================

/**
 * 执行敌人回合
 * 所有存活的敌人依次行动
 */
function executeEnemyTurn(player: PlayerState, battle: BattleState): void {
  const registry = getRegistry()

  for (const enemy of battle.enemies) {
    if (enemy.hp <= 0) continue

    // 处理蓄力
    if (enemy.chargingSkillId) {
      enemy.chargeRemainingTurns -= 1
      if (enemy.chargeRemainingTurns <= 0) {
        executeEnemyChargedSkill(player, enemy, battle)
        enemy.chargingSkillId = null
        continue
      } else {
        battle.logs.push(`${enemy.config.name} 正在蓄力...`)
        continue
      }
    }

    // 选择技能
    const selectedSkill = selectEnemySkill(enemy, battle)

    if (!selectedSkill) {
      // 无可用技能时跳过
      continue
    }

    // 减少冷却
    for (const skillId of Object.keys(enemy.skillCooldowns)) {
      const currentCooldown = enemy.skillCooldowns[skillId]
      if (currentCooldown !== undefined) {
        enemy.skillCooldowns[skillId] = currentCooldown - 1
        if (enemy.skillCooldowns[skillId]! <= 0) {
          delete enemy.skillCooldowns[skillId]
        }
      }
    }

    // 检查蓄力
    if (selectedSkill.chargeTime > 0) {
      enemy.chargingSkillId = selectedSkill.id
      enemy.chargeRemainingTurns = selectedSkill.chargeTime
      if (selectedSkill.chargeText && selectedSkill.chargeText.length > 0) {
        const text =
          selectedSkill.chargeText[Math.floor(Math.random() * selectedSkill.chargeText.length)]
        battle.logs.push(`${enemy.config.name} ${text}`)
      } else {
        battle.logs.push(`${enemy.config.name} 正在蓄力...`)
      }
      continue
    }

    // 执行伤害
    const damageTypeId = selectedSkill.damageTypeId
    const targetDefense =
      player.attributes.defenses[damageTypeId as keyof typeof player.attributes.defenses] ?? 0

    let finalDamage = calcEnemyFinalDamage(
      enemy.strength,
      selectedSkill.stats.baseDamage,
      selectedSkill.stats.strengthScaling,
      targetDefense,
      selectedSkill.stats.damageVariance,
    )

    // 玩家防守时减半伤害
    if (battle.isPlayerDefending) {
      finalDamage = calcDefenseDamageReduction(finalDamage)
    }

    // 命中判定
    const hitChance = calcEnemyHitChance(
      enemy.agility,
      selectedSkill.stats.accuracyModifier,
      player.attributes.agility + player.attributes.agilityModifier,
    )

    if (!chance(hitChance)) {
      battle.logs.push(`${enemy.config.name} 的攻击没有命中！`)
      continue
    }

    // 暴击判定
    const isCritical = chance(selectedSkill.stats.criticalChance)
    if (isCritical) {
      finalDamage = Math.ceil(finalDamage * selectedSkill.stats.criticalMultiplier)
    }

    player.survival.hp -= finalDamage
    if (player.survival.hp < 0) player.survival.hp = 0

    const critText = isCritical ? '暴击！' : ''
    const useText = selectedSkill.useTextTemplate
      ? selectedSkill.useTextTemplate.replace('{damage}', String(finalDamage))
      : `${enemy.config.name} 使用了 ${selectedSkill.name}，造成了 ${finalDamage} 点伤害${critText}`

    battle.logs.push(useText)

    // 命中后效果
    if (selectedSkill.onHitEffects && selectedSkill.onHitEffects.length > 0) {
      getEffectResolver().executeEffectResults(player, selectedSkill.onHitEffects)
    }

    // 检查玩家死亡
    if (player.survival.hp <= 0) {
      return
    }
  }
}

/**
 * 执行敌人的蓄力技能
 */
function executeEnemyChargedSkill(
  player: PlayerState,
  enemy: BattleEnemy,
  battle: BattleState,
): void {
  const skill = enemy.config.skills.find((s) => s.id === enemy.chargingSkillId)
  if (!skill) return

  const damageTypeId = skill.damageTypeId
  const targetDefense =
    player.attributes.defenses[damageTypeId as keyof typeof player.attributes.defenses] ?? 0

  // 蓄力技能有额外伤害加成
  const chargeBonus = 1.5
  let finalDamage = calcEnemyFinalDamage(
    enemy.strength,
    skill.stats.baseDamage * chargeBonus,
    skill.stats.strengthScaling,
    targetDefense,
    skill.stats.damageVariance,
  )

  if (battle.isPlayerDefending) {
    finalDamage = calcDefenseDamageReduction(finalDamage)
  }

  player.survival.hp -= finalDamage
  if (player.survival.hp < 0) player.survival.hp = 0

  const useText = skill.useTextTemplate
    ? skill.useTextTemplate.replace('{damage}', String(finalDamage))
    : `${enemy.config.name} 的蓄力攻击造成了 ${finalDamage} 点伤害！`

  battle.logs.push(useText)
}

// ============================================================
// 敌人AI
// ============================================================

/**
 * 敌人AI选择技能
 * 根据优先级和概率选择可用技能
 */
function selectEnemySkill(enemy: BattleEnemy, battle: BattleState): EnemySkill | undefined {
  const availableSkills = enemy.config.skills.filter((skill) => {
    // 检查使用次数上限
    const useCount = enemy.skillUseCount[skill.id] ?? 0
    if (skill.maxUses >= 0 && useCount >= skill.maxUses) return false

    // 检查冷却
    const cd = enemy.skillCooldowns[skill.id]
    if (cd !== undefined && cd > 0) return false

    // 检查使用条件
    if (skill.useCondition) {
      const cond = skill.useCondition
      const hpRatio = enemy.hp / enemy.maxHp

      if (cond.hpBelowRatio !== undefined && hpRatio > cond.hpBelowRatio) return false
      if (cond.hpAboveRatio !== undefined && hpRatio < cond.hpAboveRatio) return false
      if (cond.minTurn !== undefined && battle.turn < cond.minTurn) return false
      if (cond.maxTurn !== undefined && battle.turn > cond.maxTurn) return false
    }

    return true
  })

  if (availableSkills.length === 0) return undefined

  // 按优先级分组
  const priorityGroups = new Map<number, EnemySkill[]>()
  let maxPriority = -Infinity

  for (const skill of availableSkills) {
    const group = priorityGroups.get(skill.priority)
    if (group) {
      group.push(skill)
    } else {
      priorityGroups.set(skill.priority, [skill])
    }
    if (skill.priority > maxPriority) {
      maxPriority = skill.priority
    }
  }

  // 取最高优先级组
  const topGroup = priorityGroups.get(maxPriority)
  if (!topGroup) return undefined

  // 按权重随机选择
  return weightedSelect(
    topGroup,
    topGroup.map((s) => s.weight),
  )
}

// ============================================================
// 战斗结算
// ============================================================

/**
 * 执行战斗结算
 * 在战斗胜利时调用，生成战利品
 *
 * @param player - 玩家状态（会被直接修改）
 * @param battle - 战斗状态
 * @returns 结算日志
 */
export function settleBattle(player: PlayerState, battle: BattleState): string[] {
  const logs: string[] = []

  if (battle.result === BattleResult.VICTORY) {
    for (const enemy of battle.enemies) {
      if (enemy.hp <= 0) {
        // 掉落战利品
        const lootLogs = generateLoot(player, enemy)
        logs.push(...lootLogs)

        // 设置击败标志位
        if (enemy.config.defeatFlag) {
          player.flags[enemy.config.defeatFlag] = true
        }

        // 执行击败效果
        if (enemy.config.onDefeatEffects && enemy.config.onDefeatEffects.length > 0) {
          getEffectResolver().executeEffectResults(player, enemy.config.onDefeatEffects)
        }
      }
    }

    // 统计
    player.statistics.enemiesKilled += battle.enemies.filter((e) => e.hp <= 0).length
    player.statistics.totalBattles += 1
  }

  if (battle.result === BattleResult.ESCAPED) {
    player.statistics.escapesAttempted += 1
  }

  return logs
}

/**
 * 生成战利品
 */
function generateLoot(player: PlayerState, enemy: BattleEnemy): string[] {
  const logs: string[] = []
  const lootPool = enemy.config.loot

  for (const loot of lootPool) {
    // 概率判定
    let probability = loot.probability

    // 玩家技能影响掉落概率
    if (loot.affectedByPlayerSkill) {
      const skill = player.skills.survivalSkills[loot.affectedByPlayerSkill.skillId]
      if (skill) {
        probability += skill.level * loot.affectedByPlayerSkill.bonusPerLevel
      }
    }

    if (!chance(probability)) continue

    // 随机数量
    const quantity = randomInt(loot.minQuantity, loot.maxQuantity)
    if (quantity <= 0) continue

    addItem(player, loot.itemId, quantity)
    logs.push(`获得战利品 ${loot.itemId} ×${quantity}`)
  }

  return logs
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 检查是否所有敌人都被击败
 */
function checkAllEnemiesDefeated(battle: BattleState): boolean {
  return battle.enemies.every((e) => e.hp <= 0)
}

/**
 * 获取敌人名称（含变体支持）
 */
export function getEnemyDisplayName(enemy: Enemy, sanLevel: number): string {
  if (enemy.nameVariations && enemy.nameVariations.length > 0) {
    for (const variation of enemy.nameVariations) {
      if (
        isNameVariationMatch(
          variation.condition as { sanLevel?: { min?: number; max?: number } },
          sanLevel,
        )
      ) {
        return variation.name
      }
    }
  }
  return enemy.name
}

/**
 * 检查名称变体是否匹配SAN等级
 */
function isNameVariationMatch(
  condition: { sanLevel?: { min?: number; max?: number } } | undefined,
  sanLevel: number,
): boolean {
  if (!condition || !condition.sanLevel) return false
  const { min, max } = condition.sanLevel
  if (min !== undefined && sanLevel < min) return false
  if (max !== undefined && sanLevel > max) return false
  return true
}
