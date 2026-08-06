// src/engine/combat.ts
// 战斗系统：回合制战斗、出手顺序、伤害计算、敌人AI

import type { PlayerState, PlayerDefenses } from '@/types/player'
import type { DamageTypeId } from '@/types/damage'
import type { Enemy, EnemySkill } from '@/types/enemy'
import type { BattleSkill } from '@/types/skill'
import type { ConsumableItem, ConsumableStatusEffect, WeaponItem } from '@/types/item'
import { ItemCategory, ConsumableType } from '@/types/item'
import { EnemyType, EnemySkillTargetType } from '@/types/enemy'
import { BattleSkillTargetType } from '@/types/skill'
import { getRegistry } from './registry'
import {
  calcTurnOrder,
  calcPlayerBaseDamage,
  calcHitChance,
  calcCriticalChance,
  calcCriticalMultiplier,
  calcDamageAfterDefense,
  calcAbsorbedDamage,
  calcEnemyHitChance,
  calcEscapeChance,
  calcStaminaCost,
  scaleEnemyByCorruption,
  calcDefenseDamageReduction,
} from './formula'
import { weightedSelect, randomInt, chance } from './dice'
import { getEffectResolver } from './effect'
import {
  applyStatus,
  updateStatusTurns,
  removeBattleEndStatuses,
  triggerStatusEffects,
} from './status'
import { addItem, unequipSlot, recalculateCarryWeight } from './inventory'

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
  /** 逃跑 */
  ESCAPE = 'escape',
  /** 靠近（距离 -1） */
  MOVE_CLOSER = 'moveCloser',
  /** 远离（距离 +1） */
  MOVE_AWAY = 'moveAway',
  /** 结束战斗（结算胜利奖励并退出战斗，仅胜利时可用） */
  END_BATTLE = 'endBattle',
}

/** 敌我距离的下限（贴身）与上限 */
export const MIN_BATTLE_DISTANCE = 1
export const MAX_BATTLE_DISTANCE = 5

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

  /** 敌我当前距离（1-5，1=贴身） */
  distance: number

  /** 敌人列表（可被缩放后的副本） */
  enemies: BattleEnemy[]
  /** 玩家当前选中的攻击目标实例ID（null=自动取第一个存活敌人） */
  targetEnemyId: string | null
  /** 玩家是否在本回合防守 */
  isPlayerDefending: boolean

  /** 战斗日志 */
  logs: string[]

  /** 是否初见（逃跑概率加倍） */
  isFirstEncounter: boolean
}

/** 敌人身上的状态实例（战斗内最小状态系统，按回合结算） */
export interface EnemyStatusInstance {
  /** 状态配置ID */
  statusId: string
  /** 叠层数 */
  stacks: number
  /** 剩余回合数（每敌方回合递减，到 0 移除） */
  remainingTurns: number
  /** 已存续回合数（用于按 StatusEffectConfig.interval 触发） */
  turnsActive: number
}

/** 战斗中的敌人实例 */
export interface BattleEnemy {
  /** 敌人实例唯一ID（同一配置的多个敌人可通过此区分） */
  instanceId: string
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
  /** 敌人当前携带的状态（战斗内生效，战斗结束即清除） */
  statuses: EnemyStatusInstance[]
}

// ============================================================
// 距离系统
// ============================================================

/**
 * 解析技能的实际攻击距离：
 * 技能未设置 → 取当前装备武器的距离；武器也未设置 → 1；-1 表示不限距离
 */
export function getPlayerBattleSkillDistance(player: PlayerState, skill: BattleSkill): number {
  if (skill.attackDistance !== undefined) return skill.attackDistance
  const weaponId = player.equipment.weapon
  if (weaponId) {
    const item = getRegistry().getItem(weaponId)
    if (item && 'weaponStats' in item) {
      const stats = (item as { weaponStats?: { attackDistance?: number } }).weaponStats
      if (stats && stats.attackDistance !== undefined) return stats.attackDistance
    }
  }
  return 1
}

/** 判断某攻击距离在当前敌我距离下是否可命中（-1 表示不限距离，总是可命中） */
export function canSkillHitAtDistance(skillDistance: number, currentDistance: number): boolean {
  return skillDistance === -1 || skillDistance >= currentDistance
}

/**
 * 玩家当前可用的战斗技能列表
 * 可用性判定（与 battleSkills 的等级记录无关）：
 *  1. 技能有 weaponRestriction 时：与当前装备武器类型相同，且 unlockLevel（默认0）≤ 当前武器熟练度，且未锁定
 *  2. 技能无 weaponRestriction：未锁定即可用（含默认普攻 basic_attack）
 *  3. 技能ID出现在 unlockedBattleSkillIds 中：直接可用（无视武器限制与锁定）
 */
export function getPlayerBattleSkills(player: PlayerState): BattleSkill[] {
  const registry = getRegistry()

  // 当前装备武器的武器类型（未装备武器视为徒手）
  const weaponId = player.equipment.weapon
  const weaponTypeId = weaponId
    ? ((registry.getItem(weaponId) as { weaponTypeId?: string })?.weaponTypeId ?? 'unarmed')
    : 'unarmed'
  // 当前武器熟练度等级
  const weaponProficiency = player.skills.weaponProficiencies[weaponTypeId]?.level ?? 0
  // 已解锁的技能ID集合（通过事件/道具等解锁）
  const unlockedIds = new Set(player.skills.unlockedBattleSkillIds)

  return Object.values(registry.getAllBattleSkills()).filter((skill) => {
    // 条件3：已解锁（无视武器限制与锁定）
    if (unlockedIds.has(skill.id)) return true

    // 锁定（需通过其他方式解锁）→ 不可用
    if (skill.lock) return false

    // 条件2：无武器限制 → 可用
    if (!skill.weaponRestriction) return true

    // 条件1：武器类型匹配 + 熟练度达到解锁等级
    if (skill.weaponRestriction !== weaponTypeId) return false
    const unlockLevel = skill.unlockLevel ?? 0
    return weaponProficiency >= unlockLevel
  })
}

/** 敌我距离限制在 [1, 5] */
function clampDistance(d: number): number {
  return Math.max(MIN_BATTLE_DISTANCE, Math.min(MAX_BATTLE_DISTANCE, d))
}

/** 普攻占位配置（无攻击距离设置，让普攻距离取武器距离） */
const basicAttackDummy = { id: 'basic_attack', isDefaultAttack: true } as BattleSkill

// ============================================================
// 防御计算（穿透 + 减免 + 防具耐久）
// ============================================================

/** 获取伤害类型的穿透比例（找不到默认 0） */
function getDefensePenetration(damageTypeId: string): number {
  return getRegistry().getDamageType(damageTypeId)?.defensePenetration ?? 0
}

/** 获取敌人的防御比例（对应伤害类型的减免比例，无对应键或未定义视为 0） */
function getEnemyDefenseRatio(enemy: BattleEnemy, damageTypeId: string): number {
  return enemy.defenses[damageTypeId] ?? 0
}

/** 单件防具对某伤害类型的减免贡献（供耐久分摊） */
interface GearDefenseContribution {
  instanceId: string
  slot: keyof PlayerState['equipment']
  /** 该防具对伤害类型的减免比例 */
  ratio: number
  /** 耐久扣除系数（默认 1） */
  coefficient: number
  name: string
}

/**
 * 计算玩家对某伤害类型的总防御比例
 * = 基础/状态防御（attributes.defenses[伤害类型id]）+ 已装备且未破损（durability>0）的防具 defenseStats 之和
 * 战斗结算与属性面板共用此口径（防具破损后自动不计入）
 */
export function calcPlayerTotalDefense(player: PlayerState, damageTypeId: string): number {
  let total = player.attributes.defenses[damageTypeId as DamageTypeId] ?? 0

  const registry = getRegistry()
  const slots = Object.keys(player.equipment) as Array<keyof PlayerState['equipment']>
  for (const slot of slots) {
    const itemId = player.equipment[slot]
    if (!itemId) continue
    const itemConfig = registry.getItem(itemId)
    if (!itemConfig || !('defenseStats' in itemConfig)) continue
    // 只统计装备中且未破损的防具实例
    const invItem = player.inventory.find((i) => i.itemId === itemId && i.equippedSlot === slot)
    if (!invItem || invItem.durability <= 0) continue
    total += itemConfig.defenseStats[damageTypeId as DamageTypeId] ?? 0
  }

  return total
}

/**
 * 计算玩家对某伤害类型的总防御比例及防具贡献明细
 * @returns 总防御比例与各防具贡献（用于按比例分摊耐久扣除）
 */
function getPlayerDefenseInfo(
  player: PlayerState,
  damageTypeId: string,
): { total: number; gearPieces: GearDefenseContribution[] } {
  const total = calcPlayerTotalDefense(player, damageTypeId)

  const registry = getRegistry()
  const gearPieces: GearDefenseContribution[] = []
  const slots = Object.keys(player.equipment) as Array<keyof PlayerState['equipment']>
  for (const slot of slots) {
    const itemId = player.equipment[slot]
    if (!itemId) continue
    const itemConfig = registry.getItem(itemId)
    if (!itemConfig || !('defenseStats' in itemConfig)) continue
    // 只统计装备中且未破损的防具实例
    const invItem = player.inventory.find((i) => i.itemId === itemId && i.equippedSlot === slot)
    if (!invItem || invItem.durability <= 0) continue

    const ratio = itemConfig.defenseStats[damageTypeId as DamageTypeId] ?? 0
    if (ratio === 0) continue

    gearPieces.push({
      instanceId: invItem.instanceId,
      slot,
      ratio,
      coefficient:
        (itemConfig as { durabilityDrainCoefficient?: number }).durabilityDrainCoefficient ?? 1,
      name: itemConfig.name,
    })
  }

  return { total, gearPieces }
}

/**
 * 玩家受击后按各防具贡献比例分摊扣减耐久
 * 规则：扣耐久 = 实际减免的伤害量 × (该防具比例 / 总防御比例) × 系数
 * 归零的那一下按全部减免计算（本次已全额生效），归零后卸下该防具，不再减免
 */
function applyArmorDurabilityDrain(
  player: PlayerState,
  absorbedDamage: number,
  gearPieces: GearDefenseContribution[],
  totalDefenseRatio: number,
  logs: string[],
): void {
  if (absorbedDamage <= 0 || totalDefenseRatio <= 0 || gearPieces.length === 0) return

  for (const gear of gearPieces) {
    const share = gear.ratio / totalDefenseRatio
    const drain = Math.max(1, Math.round(absorbedDamage * share * gear.coefficient))
    const invItem = player.inventory.find((i) => i.instanceId === gear.instanceId)
    if (!invItem) continue

    invItem.durability -= drain
    if (invItem.durability <= 0) {
      invItem.durability = 0
      unequipSlot(player, gear.slot)
      logs.push(`你的「${gear.name}」破损了，已失去防护效果`)
    }
  }
}

// ============================================================
// 敌人状态（战斗内最小系统，按回合结算）
// ============================================================

/**
 * 敌人状态的持续回合数换算：
 * durationMinutes > 0 → 按"1 战斗回合 ≈ 10 游戏分钟"折算（临时约定，可调整）
 * durationMinutes <= 0 → 视为永久（战斗结束自动清除）
 */
function enemyStatusDurationTurns(durationMinutes: number): number {
  if (durationMinutes <= 0) return 9999
  return Math.max(1, Math.round(durationMinutes / 10))
}

/**
 * 向敌人施加状态（战斗中）
 * 已存在同状态时叠层并刷新持续回合；叠加概率由 ConsumableStatusEffect.probability 决定
 */
function applyEnemyStatuses(
  battle: BattleState,
  enemy: BattleEnemy,
  statusEffects: ConsumableStatusEffect[],
  sourceName: string,
): void {
  const registry = getRegistry()
  for (const se of statusEffects) {
    if (!chance(se.probability)) continue
    const statusConfig = registry.getStatus(se.statusId)
    if (!statusConfig) continue

    const existing = enemy.statuses.find((s) => s.statusId === se.statusId)
    if (existing) {
      existing.stacks = Math.min(existing.stacks + 1, statusConfig.defaultDuration.maxValue ?? 5)
      existing.remainingTurns = enemyStatusDurationTurns(se.durationMinutes)
      battle.logs.push(
        `${enemy.config.name} 的${statusConfig.name}层数+1（当前 ${existing.stacks} 层）`,
      )
    } else {
      enemy.statuses.push({
        statusId: se.statusId,
        stacks: 1,
        remainingTurns: enemyStatusDurationTurns(se.durationMinutes),
        turnsActive: 0,
      })
      battle.logs.push(`${sourceName}使 ${enemy.config.name} 陷入${statusConfig.name}！`)
    }
  }
}

/**
 * 战斗开始时为敌人施加开场状态（对应 TriggerBattleResult.buffs）
 * 对全体敌人生效，必定命中；日志直接追加到 battle.logs
 */
export function applyBattleStartStatuses(
  battle: BattleState,
  buffs?: { statusId: string; durationMinutes: number }[],
): void {
  if (!buffs || buffs.length === 0) return
  const statusEffects: ConsumableStatusEffect[] = buffs.map((b) => ({
    statusId: b.statusId,
    durationMinutes: b.durationMinutes,
    probability: 1,
  }))
  for (const enemy of battle.enemies) {
    applyEnemyStatuses(battle, enemy, statusEffects, '战斗开始时')
  }
}

/**
 * 敌方回合开始时结算其身上的状态：
 * 按 StatusEffectConfig.interval 触发（HP/力量/敏捷类变动），随后递减剩余回合，到期移除
 */
function tickEnemyStatuses(battle: BattleState, enemy: BattleEnemy, logs: string[]): void {
  if (enemy.statuses.length === 0) return

  for (const status of [...enemy.statuses]) {
    const statusConfig = getRegistry().getStatus(status.statusId)
    if (!statusConfig) continue

    status.turnsActive += 1

    // 触发周期到期的效果
    for (const effectConfig of statusConfig.effects) {
      if (
        status.turnsActive < effectConfig.interval ||
        status.turnsActive % effectConfig.interval !== 0
      ) {
        continue
      }
      if (!chance(effectConfig.triggerChance)) continue

      const stackMultiplier = effectConfig.scalesWithStacks ? status.stacks : 1
      let totalValue = 0
      for (const change of effectConfig.attributeChanges) {
        const value = change.value * stackMultiplier
        if (change.attribute === 'hp') {
          enemy.hp = Math.max(0, enemy.hp + value)
          totalValue += value
        } else if (change.attribute === 'strength') {
          enemy.strength = Math.max(0, enemy.strength + value)
        } else if (change.attribute === 'agility') {
          enemy.agility = Math.max(0, enemy.agility + value)
        }
      }

      if (totalValue < 0) {
        logs.push(
          `${enemy.config.name} 因${statusConfig.name}损失了 ${Math.abs(Math.round(totalValue))} 点生命值`,
        )
      } else if (effectConfig.triggerText) {
        logs.push(`${enemy.config.name} 的${statusConfig.name}效果发作了`)
      }
    }

    // 递减剩余回合
    status.remainingTurns -= 1
    if (status.remainingTurns <= 0) {
      enemy.statuses = enemy.statuses.filter((s) => s !== status)
      logs.push(`${enemy.config.name} 身上的${statusConfig.name}消失了`)
    }
  }
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
    .map((enemy, index) => {
      const scaled = scaleEnemyByCorruption(enemy, corruption)
      return {
        // 实例唯一ID：同一配置的多个敌人用下标区分
        instanceId: `${enemy.id}#${index}`,
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
        statuses: [],
      }
    })

  // 初始距离：以双方技能的最远攻击距离为准，限制在 [1, 5]
  const maxPlayerDist = Math.max(
    MIN_BATTLE_DISTANCE,
    ...getPlayerBattleSkills(player).map((s) => getPlayerBattleSkillDistance(player, s)),
  )
  const maxEnemyDist = Math.max(
    MIN_BATTLE_DISTANCE,
    ...enemies.flatMap((e) => e.config.skills.map((s) => s.attackDistance ?? 1)),
  )
  const distance = clampDistance(Math.max(maxPlayerDist, maxEnemyDist))

  return {
    phase: BattlePhase.START,
    turn: 0,
    result: BattleResult.ONGOING,
    distance,
    enemies,
    targetEnemyId: null,
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
  battle.logs.push(`⚔ 战斗开始！${enemyNames}出现了！（距离 ${battle.distance}）`)

  // 进入玩家回合
  battle.phase = BattlePhase.PLAYER_TURN
  return [...battle.logs]
}

// ============================================================
// 目标选择（多敌人）
// ============================================================

/**
 * 设置玩家当前攻击目标
 * @param enemyInstanceId - 敌人实例ID（不存在的ID会被忽略）
 */
export function selectBattleTarget(battle: BattleState, enemyInstanceId: string): void {
  if (battle.enemies.some((e) => e.instanceId === enemyInstanceId)) {
    battle.targetEnemyId = enemyInstanceId
  }
}

/** 所有存活的敌人 */
function getLivingEnemies(battle: BattleState): BattleEnemy[] {
  return battle.enemies.filter((e) => e.hp > 0)
}

/**
 * 解析玩家当前攻击目标：
 * 优先取选中的目标（若存活），否则回退到第一个存活敌人
 */
function resolveTarget(battle: BattleState): BattleEnemy | undefined {
  const living = getLivingEnemies(battle)
  if (living.length === 0) return undefined
  if (battle.targetEnemyId) {
    const selected = living.find((e) => e.instanceId === battle.targetEnemyId)
    if (selected) return selected
  }
  return living[0]
}

/** 随机一个存活敌人 */
function resolveRandomTarget(battle: BattleState): BattleEnemy | undefined {
  const living = getLivingEnemies(battle)
  if (living.length === 0) return undefined
  return living[randomInt(0, living.length - 1)]
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
    case PlayerActionType.BATTLE_SKILL: {
      const skill = skillId ? getRegistry().getBattleSkill(skillId) : undefined

      // 距离校验：不在攻击范围内的技能无法使用（返回时不消耗回合，保持玩家回合）
      const skillDistance = skill
        ? getPlayerBattleSkillDistance(player, skill)
        : getPlayerBattleSkillDistance(player, basicAttackDummy)
      if (!canSkillHitAtDistance(skillDistance, battle.distance)) {
        const skillName = skill?.name ?? '普通攻击'
        battle.logs.push(`距离太远，无法使用「${skillName}」（当前距离 ${battle.distance}）`)
        return battle.logs
      }

      if (skill && skill.isDefaultAttack) {
        executePlayerBasicAttack(player, battle)
      } else if (skill) {
        executePlayerBattleSkill(player, battle, skillId as string)
      } else {
        executePlayerBasicAttack(player, battle)
      }

      // 技能附带位移（在结算后生效）
      const move = skill?.moveDistance ?? 0
      if (move !== 0) {
        const before = battle.distance
        battle.distance = clampDistance(battle.distance - move)
        if (battle.distance < before) {
          battle.logs.push(`你向前突进，与敌人的距离缩短到 ${battle.distance}`)
        } else if (battle.distance > before) {
          battle.logs.push(`你向后跳跃，与敌人的距离拉开到 ${battle.distance}`)
        }
      }
      break
    }

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

    case PlayerActionType.ESCAPE:
      executePlayerEscape(player, battle)
      if ((battle.result as BattleResult) === BattleResult.ESCAPED) {
        removeBattleEndStatuses(player)
        return battle.logs
      }
      break

    case PlayerActionType.MOVE_CLOSER:
      if (battle.distance <= MIN_BATTLE_DISTANCE) {
        battle.logs.push('你已经与敌人贴身，无法再靠近')
      } else {
        battle.distance -= 1
        battle.logs.push(`你向前移动，与敌人的距离缩短到 ${battle.distance}`)
      }
      break

    case PlayerActionType.MOVE_AWAY:
      if (battle.distance >= MAX_BATTLE_DISTANCE) {
        battle.logs.push('你已退到最远距离，无法再远离')
      } else {
        battle.distance += 1
        battle.logs.push(`你向后撤退，与敌人的距离拉开到 ${battle.distance}`)
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

  // 选择目标（优先玩家选中的目标，其次第一个存活敌人）
  const target = resolveTarget(battle)
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

  // 计算伤害（穿透 + 防御减免）
  const baseDamage = calcPlayerBaseDamage(effectiveAgility, weaponDamage, proficiencyDamageBonus)
  const defensePenetration = getDefensePenetration(damageTypeId)
  const defenseRatio = getEnemyDefenseRatio(target, damageTypeId)
  // 原始伤害 X = 基础伤害 × 浮动 × 暴击倍率
  const variance = 1 + (Math.random() * 2 - 1) * 0.1
  const rawDamage = baseDamage * variance * (isCritical ? critMultiplier : 1)
  const finalDamage = calcDamageAfterDefense(rawDamage, defensePenetration, defenseRatio)

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

  // 技能命中与伤害（对单个目标结算）
  const weaponTypeId = player.equipment.weapon
    ? ((registry.getItem(player.equipment.weapon) as { weaponTypeId?: string })?.weaponTypeId ??
      'unarmed')
    : 'unarmed'
  const proficiency = player.skills.weaponProficiencies[weaponTypeId]?.level ?? 0

  const living = getLivingEnemies(battle)
  if (living.length === 0) return

  const targetType = skillConfig.targetType ?? BattleSkillTargetType.SINGLE_ENEMY

  if (targetType === BattleSkillTargetType.ALL_ENEMIES) {
    // 全体攻击：对每个存活敌人分别结算
    for (const target of living) {
      applyPlayerSkillDamage(player, battle, skillConfig, target, effectiveAgility, proficiency)
    }
  } else if (targetType === BattleSkillTargetType.RANDOM_ENEMY) {
    const target = resolveRandomTarget(battle)
    if (target) {
      applyPlayerSkillDamage(player, battle, skillConfig, target, effectiveAgility, proficiency)
    }
  } else {
    // 单目标（默认）：优先玩家选中的目标
    const target = resolveTarget(battle)
    if (target) {
      applyPlayerSkillDamage(player, battle, skillConfig, target, effectiveAgility, proficiency)
    }
  }
}

/**
 * 对单个敌人结算玩家技能伤害（命中/暴击/伤害），写入日志
 */
function applyPlayerSkillDamage(
  player: PlayerState,
  battle: BattleState,
  skillConfig: BattleSkill,
  target: BattleEnemy,
  effectiveAgility: number,
  proficiency: number,
): void {
  const hitChance = calcHitChance(
    effectiveAgility,
    proficiency * 0.03,
    (skillConfig as { accuracyModifier?: number }).accuracyModifier ?? 0,
    target.agility,
  )

  if (!chance(hitChance)) {
    battle.logs.push(`你的 ${skillConfig.name} 对 ${target.config.name} 没有命中!`)
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
  // 穿透 + 防御减免
  const defensePenetration = getDefensePenetration(damageTypeId)
  const defenseRatio = getEnemyDefenseRatio(target, damageTypeId)
  // 原始伤害 X = 基础伤害 × 浮动 × 暴击倍率
  const variance = 1 + (Math.random() * 2 - 1) * 0.1
  const rawDamage = baseDamage * variance * (isCritical ? critMultiplier : 1)
  const finalDamage = calcDamageAfterDefense(rawDamage, defensePenetration, defenseRatio)

  target.hp -= finalDamage
  if (target.hp < 0) target.hp = 0

  const critText = isCritical ? '暴击！' : ''
  battle.logs.push(
    `你使用 ${skillConfig.name} 对 ${target.config.name} 造成了 ${finalDamage} 点伤害${critText}` +
      (target.hp <= 0 ? `，${target.config.name} 被击败了!` : ''),
  )
}

/**
 * 执行玩家使用物品（战斗内）
 * 支持三类：
 *  1. 未装备的武器 → 投掷（伤害 = 基础伤害 × throwDamageMultiplier，默认 2）
 *  2. 药品（MEDICINE）→ 仅对玩家生效（effects + applyStatus）
 *  3. 道具（consumableTool）→ 对玩家生效 + 对敌人生效（applyEnemyStatus）
 * 统一消耗 1 数量
 */
function executePlayerUseItem(player: PlayerState, battle: BattleState, instanceId: string): void {
  const registry = getRegistry()
  const invIndex = player.inventory.findIndex((i) => i.instanceId === instanceId)
  if (invIndex === -1) {
    battle.logs.push('物品未找到')
    return
  }

  const invItem = player.inventory[invIndex]
  if (!invItem) {
    battle.logs.push('物品未找到')
    return
  }

  const itemConfig = registry.getItem(invItem.itemId)
  if (!itemConfig) {
    battle.logs.push('物品配置未找到')
    return
  }

  let used = false
  if (itemConfig.category === ItemCategory.WEAPON && !invItem.equippedSlot) {
    // 未装备的武器 → 投掷
    used = throwWeapon(player, battle, itemConfig as WeaponItem)
  } else if (itemConfig.category === ItemCategory.CONSUMABLE) {
    // 消耗品（药品 / 道具）
    used = useConsumableInBattle(player, battle, itemConfig as ConsumableItem)
  } else {
    battle.logs.push(`${itemConfig.name} 无法在战斗中使用`)
  }

  if (!used) return

  // 消耗 1 数量
  if (invItem.quantity <= 1) {
    player.inventory.splice(invIndex, 1)
  } else {
    invItem.quantity -= 1
  }
  recalculateCarryWeight(player)
}

/**
 * 投掷未装备武器：
 * 伤害 = weaponStats.baseDamage × throwDamageMultiplier（默认 2）× 浮动 × 暴击倍率
 * 命中/暴击沿用武器配置的命中修正与暴击率/倍率；穿透与防御正常结算
 * @returns 是否出手（未命中也消耗武器）
 */
function throwWeapon(player: PlayerState, battle: BattleState, weapon: WeaponItem): boolean {
  const target = resolveTarget(battle)
  if (!target) return false

  const stats = weapon.weaponStats
  const multiplier = stats.throwDamageMultiplier ?? 2

  // 命中判定（投掷不吃武器熟练度加成）
  const hitChance = calcHitChance(
    player.attributes.agility + player.attributes.agilityModifier,
    0,
    stats.accuracyModifier,
    target.agility,
  )
  if (!chance(hitChance)) {
    battle.logs.push(`你投掷了 ${weapon.name}，但没有命中 ${target.config.name}`)
    return true
  }

  // 暴击判定
  const isCritical = chance(calcCriticalChance(0, stats.criticalChanceModifier))
  const critMultiplier = isCritical ? stats.criticalMultiplier : 1

  // 原始伤害 = 基础伤害 × 投掷倍率 × 浮动 × 暴击倍率
  const variance = 1 + (Math.random() * 2 - 1) * stats.damageVariance
  const rawDamage = stats.baseDamage * multiplier * variance * critMultiplier
  const finalDamage = calcDamageAfterDefense(
    rawDamage,
    getDefensePenetration(stats.damageTypeId),
    getEnemyDefenseRatio(target, stats.damageTypeId),
  )

  target.hp -= finalDamage
  if (target.hp < 0) target.hp = 0

  const critText = isCritical ? '暴击！' : ''
  battle.logs.push(
    `你投掷了 ${weapon.name}，对 ${target.config.name} 造成 ${finalDamage} 点伤害${critText}` +
      (target.hp <= 0 ? `，${target.config.name} 被击败了!` : ''),
  )
  return true
}

/**
 * 战斗中使用消耗品：
 * - 药品/道具均先对玩家生效（effects + applyStatus）
 * - 道具额外对敌人生效（applyEnemyStatus：all=true 全体敌人 / false 当前目标；含直接伤害与施加状态）
 */
function useConsumableInBattle(
  player: PlayerState,
  battle: BattleState,
  consumable: ConsumableItem,
): boolean {
  const resolver = getEffectResolver()

  // 1. 对玩家生效（与背包使用一致：effects + applyStatus）
  const selfLogs = resolver.executeEffectResults(player, consumable.effects)
  if (consumable.applyStatus) {
    for (const se of consumable.applyStatus) {
      if (!chance(se.probability)) continue
      selfLogs.push(applyStatus(player, se.statusId, se.durationMinutes, consumable.name))
    }
  }

  // 2. 道具额外对敌人生效
  const enemyEffects = consumable.applyEnemyStatus
  if (consumable.consumableType === ConsumableType.TOOL && enemyEffects) {
    const targets = enemyEffects.all
      ? battle.enemies.filter((e) => e.hp > 0)
      : [resolveTarget(battle)].filter((t): t is BattleEnemy => t !== undefined)

    for (const target of targets) {
      // 直接伤害
      if (enemyEffects.damage) {
        const dmg = enemyEffects.damage
        const variance = 1 + (Math.random() * 2 - 1) * 0.1
        const rawDamage = dmg.baseDamage * variance
        const finalDamage = calcDamageAfterDefense(
          rawDamage,
          getDefensePenetration(dmg.damageTypeId),
          getEnemyDefenseRatio(target, dmg.damageTypeId),
        )
        target.hp -= finalDamage
        if (target.hp < 0) target.hp = 0
        battle.logs.push(
          `${consumable.name} 对 ${target.config.name} 造成 ${finalDamage} 点伤害` +
            (target.hp <= 0 ? `，${target.config.name} 被击败了!` : ''),
        )
      }
      // 施加状态
      if (enemyEffects.applyStatus) {
        applyEnemyStatuses(battle, target, enemyEffects.applyStatus, consumable.name)
      }
    }
  }

  const selfText = selfLogs.filter(Boolean).join('；')
  battle.logs.push(
    consumable.useText
      ? `${consumable.useText}${selfText ? `（${selfText}）` : ''}`
      : `你使用了 ${consumable.name}${selfText ? `（${selfText}）` : ''}`,
  )
  return true
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
  let haveMove = false

  for (const enemy of battle.enemies) {
    if (enemy.hp <= 0) continue

    // 敌方回合开始时结算身上的状态（中毒等持续伤害，可能致死）
    tickEnemyStatuses(battle, enemy, battle.logs)
    if (enemy.hp <= 0) {
      battle.logs.push(`${enemy.config.name} 在状态侵蚀下倒下了！`)
      continue
    }

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

    // 选择技能（已在可用技能中过滤攻击距离）
    const selectedSkill = selectEnemySkill(enemy, battle)

    if (!selectedSkill) {
      // 当前距离没有能命中的技能
      if (battle.distance > MIN_BATTLE_DISTANCE) {
        // 向前逼近
        if (!haveMove) {
          haveMove = true
          battle.distance -= 1
        }
        battle.logs.push(`${enemy.config.name} 向前逼近，距离缩短到 ${battle.distance}`)
      } else {
        // 已贴身仍无技能可命中 → 勉强出手（按未命中处理，避免空转）
        const fallback = selectFallbackSkill(enemy, battle)
        if (fallback) {
          battle.logs.push(`${enemy.config.name} 勉强出手，但未能命中你！`)
        }
      }
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
    const defensePenetration = getDefensePenetration(damageTypeId)
    const { total: playerDefenseRatio, gearPieces } = getPlayerDefenseInfo(player, damageTypeId)

    // 原始伤害 X = (基础伤害 + 力量×系数) × 浮动
    const variance = 1 + (Math.random() * 2 - 1) * selectedSkill.stats.damageVariance
    const rawDamage =
      (selectedSkill.stats.baseDamage + enemy.strength * selectedSkill.stats.strengthScaling) *
      variance
    // 穿透 + 防御减免后的最终伤害，以及防具实际减免量（用于耐久扣除）
    const finalBase = calcDamageAfterDefense(rawDamage, defensePenetration, playerDefenseRatio)
    const absorbed = calcAbsorbedDamage(rawDamage, defensePenetration, playerDefenseRatio)

    // 玩家防守时减半伤害
    let finalDamage = battle.isPlayerDefending ? calcDefenseDamageReduction(finalBase) : finalBase

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

    // 命中后按贡献比例扣减防具耐久（归零卸下并提示）
    applyArmorDurabilityDrain(player, absorbed, gearPieces, playerDefenseRatio, battle.logs)

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

  // 蓄力期间玩家可拉开距离：释放时若超出射程则落空
  const skillDistance = skill.attackDistance ?? 1
  if (!canSkillHitAtDistance(skillDistance, battle.distance)) {
    battle.logs.push(`${enemy.config.name} 的蓄力攻击落空了（距离太远）`)
    return
  }

  const damageTypeId = skill.damageTypeId
  const defensePenetration = getDefensePenetration(damageTypeId)
  const { total: playerDefenseRatio, gearPieces } = getPlayerDefenseInfo(player, damageTypeId)

  // 蓄力技能有额外伤害加成
  const chargeBonus = 1.5
  // 原始伤害 X = (基础伤害×蓄力加成 + 力量×系数) × 浮动
  const variance = 1 + (Math.random() * 2 - 1) * skill.stats.damageVariance
  const rawDamage =
    (skill.stats.baseDamage * chargeBonus + enemy.strength * skill.stats.strengthScaling) * variance
  // 穿透 + 防御减免后的最终伤害，以及防具实际减免量（用于耐久扣除）
  const finalBase = calcDamageAfterDefense(rawDamage, defensePenetration, playerDefenseRatio)
  const absorbed = calcAbsorbedDamage(rawDamage, defensePenetration, playerDefenseRatio)

  // 玩家防守时减半伤害
  const finalDamage = battle.isPlayerDefending ? calcDefenseDamageReduction(finalBase) : finalBase

  player.survival.hp -= finalDamage
  if (player.survival.hp < 0) player.survival.hp = 0

  const useText = skill.useTextTemplate
    ? skill.useTextTemplate.replace('{damage}', String(finalDamage))
    : `${enemy.config.name} 的蓄力攻击造成了 ${finalDamage} 点伤害！`

  battle.logs.push(useText)

  // 命中后按贡献比例扣减防具耐久（归零卸下并提示）
  applyArmorDurabilityDrain(player, absorbed, gearPieces, playerDefenseRatio, battle.logs)
}

// ============================================================
// 敌人AI
// ============================================================

/**
 * 技能是否可用（次数/冷却/使用条件，不含距离判定）
 */
function isSkillAvailable(enemy: BattleEnemy, battle: BattleState, skill: EnemySkill): boolean {
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
}

/**
 * 从技能组中按优先级+权重选取一个
 */
function pickSkillByPriority(skills: EnemySkill[]): EnemySkill | undefined {
  if (skills.length === 0) return undefined

  const priorityGroups = new Map<number, EnemySkill[]>()
  let maxPriority = -Infinity
  for (const skill of skills) {
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

  const topGroup = priorityGroups.get(maxPriority)
  if (!topGroup) return undefined
  return weightedSelect(
    topGroup,
    topGroup.map((s) => s.weight),
  )
}

/**
 * 敌人AI选择技能
 * 在可用技能中过滤出当前距离可命中的，再按优先级和概率选取
 */
function selectEnemySkill(enemy: BattleEnemy, battle: BattleState): EnemySkill | undefined {
  const availableSkills = enemy.config.skills.filter((skill) => {
    if (!isSkillAvailable(enemy, battle, skill)) return false

    // 检查攻击距离（不在范围内无法命中）
    const dist = skill.attackDistance ?? 1
    if (!canSkillHitAtDistance(dist, battle.distance)) return false

    return true
  })

  return pickSkillByPriority(availableSkills)
}

/**
 * 敌人在贴身（距离1）仍无技能可命中时的兜底技能
 * 忽略距离限制，取优先级最高的可用技能"勉强出手"（按未命中处理）
 */
function selectFallbackSkill(enemy: BattleEnemy, battle: BattleState): EnemySkill | undefined {
  const availableSkills = enemy.config.skills.filter((skill) =>
    isSkillAvailable(enemy, battle, skill),
  )
  return pickSkillByPriority(availableSkills)
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
    const probability = loot.probability

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
