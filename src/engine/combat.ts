// src/engine/combat.ts
// 战斗系统：回合制战斗、出手顺序、伤害计算、敌人AI

import type { PlayerState } from '@/types/player'
import type { DamageTypeId } from '@/types/damage'
import type { Enemy, EnemySkill } from '@/types/enemy'
import type { BattleSkill } from '@/types/skill'
import type { ConsumableItem, ConsumableStatusEffect, WeaponItem } from '@/types/item'
import { ItemCategory, ConsumableType } from '@/types/item'
import { EnemySkillTargetType } from '@/types/enemy'
import { BattleSkillTargetType } from '@/types/skill'
import { AttributeType } from '@/types/effect'
import { EffectType } from '@/types/effect'
import type { AttributeEffect } from '@/types/effect'
import type { EffectResult } from '@/types/effect'
import { getRegistry } from './registry'
import {
  calcTurnOrder,
  calcDamageAfterDefense,
  calcAbsorbedDamage,
  calcEscapeChance,
  calcStaminaCost,
  scaleEnemyByCorruption,
  calcDefenseDamageReduction,
  calcAttributeScalingBonus,
} from './formula'
import {
  weightedSelect,
  randomInt,
  randomPick,
  chance,
  rollDiceExpression,
  maxDiceExpression,
} from './dice'
import { getEffectResolver } from './effect'
import { applyStatus, updateStatusTurns, removeBattleEndStatuses } from './status'
import { StatusAffectedAttribute } from '@/types/status'
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
  /** 玩家技能冷却（技能ID → 剩余回合数，每次玩家回合递减，到 0 移除） */
  playerSkillCooldowns: Record<string, number>
  /** 玩家是否在本回合防守 */
  isPlayerDefending: boolean

  /** 战斗日志 */
  logs: string[]

  /** 是否初见（逃跑概率加倍） */
  isFirstEncounter: boolean
}

// ============================================================
// 战斗日志角色标记
// 我方行动日志以 LOG_ROLE_PLAYER 开头、敌方以 LOG_ROLE_ENEMY 开头，
// 渲染层据此为文本着色（我方绿 / 敌方红，颜色随昼夜主题自适应）。
// ============================================================

/** 我方行动日志前缀（控制字符，渲染时剥离） */
export const LOG_ROLE_PLAYER = '\u0001'
/** 敌方行动日志前缀（控制字符，渲染时剥离） */
export const LOG_ROLE_ENEMY = '\u0002'

/** 追加我方行动日志 */
function pushPlayerLog(battle: BattleState, text: string): void {
  battle.logs.push(LOG_ROLE_PLAYER + text)
}

/** 追加敌方行动日志 */
function pushEnemyLog(battle: BattleState, text: string): void {
  battle.logs.push(LOG_ROLE_ENEMY + text)
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

/** 获取玩家技能剩余冷却回合数（0 = 可用） */
export function getPlayerSkillCooldown(battle: BattleState, skillId: string): number {
  return battle.playerSkillCooldowns[skillId] ?? 0
}

/** 敌我距离限制在 [1, 5] */
function clampDistance(d: number): number {
  return Math.max(MIN_BATTLE_DISTANCE, Math.min(MAX_BATTLE_DISTANCE, d))
}

// ============================================================
// d100 判定系统
// 使用技能/投掷武器/敌人攻击时投掷 d100，判定顺序：
//  1. roll ≤ 暴击阈值(5+暴击修正) → 暴击（暴击命中取骰子最大值、防御减半；暴击落空无伤害）
//  2. roll > 命中阈值(100-防御方敏捷/2+命中修正) → 未命中
//  3. 其余 → 普通命中
// ============================================================

/** 武器熟练度满级（此时 d100 判定获得奖励骰：取两次最小值作为判定值） */
export const MAX_WEAPON_PROFICIENCY = 10

/** 判定结果类型 */
type HitResult = 'critHit' | 'hit' | 'miss' | 'critMiss'

/** 攻击目标抽象（供伤害结算使用） */
interface DamageTarget {
  name: string
  agility: number
  /** 对应伤害类型的防御比例（暴击时减半） */
  defenseRatio: number
}

/** 攻击参数（玩家技能 / 敌人技能 / 投掷武器通用） */
interface AttackSetup {
  /** 伤害骰子表达式 */
  dice: string
  /** 伤害倍率（投掷武器时即投掷伤害倍率） */
  damageMultiplier: number
  /** 额外固定伤害 */
  bonusDamage: number
  /** 加成属性伤害修正（属性-50)/5，向下取整，可为负 */
  attributeBonus: number
  /** 命中修正（d100 点数制，可为负） */
  accuracyModifier: number
  /** 暴击修正（d100 点数制，可为负） */
  criticalModifier: number
  /** 是否投掷武器（不考虑命中/暴击修正与属性加成，暴击固定 ≤5） */
  isThrow?: boolean
  /** 伤害类型穿透比例 */
  penetration: number
  /** 描述文本（按判定结果随机抽取） */
  narrativeTexts?: { hit?: string[]; miss?: string[]; critHit?: string[]; critMiss?: string[] }
  /** 攻击者称谓（"你" / 敌人名） */
  attackerLabel: string
  /** 攻击方（我方行动日志绿字 / 敌方红字） */
  side: 'player' | 'enemy'
  /** 行动称谓（技能名） */
  actionLabel: string
  /** 武器称谓（占位符 {weapon}） */
  weaponLabel?: string
}

/**
 * 投掷 d100 判定值
 * 熟练度满级时提供奖励骰：取两次投掷的最小值
 */
function rollBattleCheck(haveBonusDie: boolean): number {
  const first = randomInt(1, 100)
  if (!haveBonusDie) return first
  return Math.min(first, randomInt(1, 100))
}

/** 根据判定值与阈值确定结果 */
function resolveHitResult(roll: number, critThreshold: number, hitThreshold: number): HitResult {
  if (roll <= critThreshold) {
    return roll <= hitThreshold ? 'critHit' : 'critMiss'
  }
  return roll > hitThreshold ? 'miss' : 'hit'
}

/** 描述文本占位符替换：{damage} {target} {weapon} {name} 等 */
function fillNarrative(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => {
    const value = vars[key]
    return value === undefined ? m : String(value)
  })
}

// ============================================================
// 伤害计算详情（弹窗展示）
// 命中时把计算详情编码在日志行尾部（LOG_CALC_SEP 分隔），
// 伤害数值在正文中以 ⟦数值⟧ 标记，渲染层解析为可点击文本。
// ============================================================

/** 日志行内计算详情分隔符（控制字符，渲染时剥离） */
export const LOG_CALC_SEP = '\u0003'
/** 可点击伤害数值开始标记 */
export const DMG_TOKEN_START = '⟦'
/** 可点击伤害数值结束标记 */
export const DMG_TOKEN_END = '⟧'

/** 伤害计算详情（点击伤害数值后弹窗展示） */
export interface DamageCalcDetail {
  /** 攻击者称谓（"你" / 敌人名） */
  attackerLabel: string
  /** 行动称谓（技能名） */
  actionLabel: string
  /** 目标名 */
  targetName: string
  /** 伤害骰子表达式（直接伤害为空串） */
  dice: string
  /** 骰子投掷结果（暴击为最大值） */
  diceValue: number
  /** 是否暴击 */
  isCrit: boolean
  /** 伤害倍率 */
  damageMultiplier: number
  /** 额外固定伤害 */
  bonusDamage: number
  /** 加成属性伤害修正 */
  attributeBonus: number
  /** 原始伤害（减免前） */
  rawDamage: number
  /** 伤害类型穿透比例 */
  penetration: number
  /** 有效防御比例（暴击时减半） */
  effectiveDefense: number
  /** 最终伤害 */
  finalDamage: number
}

/** 将伤害数值包成可点击标记 */
function dmgToken(value: number): string {
  return `${DMG_TOKEN_START}${value}${DMG_TOKEN_END}`
}

/** 在日志行尾部追加计算详情元数据 */
function withCalcMeta(text: string, calc: DamageCalcDetail): string {
  return `${text}${LOG_CALC_SEP}${JSON.stringify(calc)}`
}

/**
 * 结算一次攻击判定与伤害（含判定过程日志与描述文本）
 * 判定的过程和结果显示在抽取的命中/暴击/未命中文本之前。
 *
 * @param setup - 攻击参数
 * @param target - 攻击目标（防御比例已按伤害类型取好）
 * @param haveBonusDie - 是否拥有奖励骰（熟练度满级）
 * @param logs - 战斗日志（直接追加）
 * @param sharedRoll - 全体攻击共享判定时传入同一 d100 值（此时忽略奖励骰）
 * @returns 判定结果与伤害（未命中/暴击落空时伤害为 0，可为负数即回复血量）
 */
function resolveAttack(
  setup: AttackSetup,
  target: DamageTarget,
  haveBonusDie: boolean,
  logs: string[],
  sharedRoll?: number,
): { result: HitResult; damage: number; rawDamage: number; absorbed: number } {
  const critThreshold = setup.isThrow ? 5 : 5 + setup.criticalModifier
  const hitThreshold = setup.isThrow
    ? 100 - target.agility / 2
    : 100 - target.agility / 2 + setup.accuracyModifier
  // 阈值截取到 [1,100]；暴击阈值 <1 视为无法暴击
  const critClamped = critThreshold < 1 ? 0 : Math.min(100, Math.max(1, critThreshold))
  const hitClamped = Math.min(100, Math.max(1, hitThreshold))

  const roll = sharedRoll ?? rollBattleCheck(haveBonusDie)
  const result = resolveHitResult(roll, critClamped, hitClamped)

  const resultLabel =
    result === 'critHit'
      ? '暴击！'
      : result === 'critMiss'
        ? '暴击落空！'
        : result === 'miss'
          ? '未命中'
          : '命中！'
  const rolePrefix = setup.side === 'player' ? LOG_ROLE_PLAYER : LOG_ROLE_ENEMY
  logs.push(
    `${rolePrefix}${setup.attackerLabel} d100 → ${roll}（暴击≤${critClamped}，未命中>${hitClamped}）→ ${resultLabel}`,
  )

  let damage = 0
  let rawDamage = 0
  let effectiveDefense = target.defenseRatio
  let calcDetail: DamageCalcDetail | null = null
  if (result === 'hit' || result === 'critHit') {
    const isCrit = result === 'critHit'
    const diceValue = isCrit ? maxDiceExpression(setup.dice) : rollDiceExpression(setup.dice)
    rawDamage = diceValue * setup.damageMultiplier + setup.bonusDamage + setup.attributeBonus
    // 暴击无视敌人 50% 防御
    effectiveDefense = isCrit ? target.defenseRatio / 2 : target.defenseRatio
    damage = calcDamageAfterDefense(rawDamage, setup.penetration, effectiveDefense)
    calcDetail = {
      attackerLabel: setup.attackerLabel,
      actionLabel: setup.actionLabel,
      targetName: target.name,
      dice: setup.dice,
      diceValue,
      isCrit,
      damageMultiplier: setup.damageMultiplier,
      bonusDamage: setup.bonusDamage,
      attributeBonus: setup.attributeBonus,
      rawDamage,
      penetration: setup.penetration,
      effectiveDefense,
      finalDamage: damage,
    }
  }
  const absorbed = calcAbsorbedDamage(rawDamage, setup.penetration, effectiveDefense)

  // 描述文本（命中/暴击/未命中均有对应文本，随机抽取）
  // 命中时伤害数值包成可点击标记，并在行尾编码计算详情
  const texts = setup.narrativeTexts?.[result]
  if (texts && texts.length > 0) {
    const template = randomPick(texts)
    if (template !== undefined) {
      let text =
        rolePrefix +
        fillNarrative(template, {
          damage: dmgToken(damage),
          target: target.name,
          weapon: setup.weaponLabel ?? '',
          name: setup.actionLabel,
        })
      if (calcDetail) text = withCalcMeta(text, calcDetail)
      logs.push(text)
    }
  } else if (result === 'miss' || result === 'critMiss') {
    logs.push(
      `${rolePrefix}${setup.attackerLabel} 使用 ${setup.actionLabel} 对 ${target.name} 未命中`,
    )
  } else {
    const critSuffix = result === 'critHit' ? '（暴击！）' : ''
    let text = `${rolePrefix}${setup.attackerLabel} 使用 ${setup.actionLabel} 对 ${target.name} 造成 ${dmgToken(damage)} 点伤害${critSuffix}`
    if (calcDetail) text = withCalcMeta(text, calcDetail)
    logs.push(text)
  }

  return { result, damage, rawDamage, absorbed }
}

/** 获取玩家当前武器信息（未装备武器时使用徒手默认骰子） */
function getPlayerWeaponInfo(player: PlayerState): {
  dice: string
  damageTypeId: string
  name: string
  weaponTypeId: string
} {
  const registry = getRegistry()
  const weaponId = player.equipment.weapon
  if (weaponId) {
    const config = registry.getItem(weaponId)
    if (config && 'weaponStats' in config) {
      return {
        dice: config.weaponStats.baseDamage,
        damageTypeId: config.weaponStats.damageTypeId,
        name: config.name,
        weaponTypeId: (config as { weaponTypeId?: string }).weaponTypeId ?? 'unarmed',
      }
    }
  }
  // 徒手：使用武器类型默认骰子
  const unarmedType = registry.getWeaponType('unarmed')
  return {
    dice: unarmedType?.defaultStats.defaultDamageDice ?? '1d4',
    damageTypeId: unarmedType?.primaryDamageTypeId ?? 'blunt',
    name: '拳头',
    weaponTypeId: 'unarmed',
  }
}

/** 获取玩家加成属性的当前值（含临时修正） */
function getPlayerAttributeValue(player: PlayerState, attribute: AttributeType): number {
  switch (attribute) {
    case AttributeType.AGILITY:
      return player.attributes.agility + player.attributes.agilityModifier
    case AttributeType.INTELLIGENCE:
      return player.attributes.intelligence + player.attributes.intelligenceModifier
    case AttributeType.CONSTITUTION:
      return player.attributes.constitution + player.attributes.constitutionModifier
    case AttributeType.STRENGTH:
    default:
      return player.attributes.strength + player.attributes.strengthModifier
  }
}

/** 对敌人应用伤害（含上限/下限钳制与击败日志） */
function applyEnemyHit(
  battle: BattleState,
  target: BattleEnemy,
  result: HitResult,
  damage: number,
): void {
  if (result === 'miss' || result === 'critMiss') return
  target.hp = Math.min(target.maxHp, Math.max(0, target.hp - damage))
  if (target.hp <= 0) {
    pushEnemyLog(battle, `${target.config.name} 被击败了！`)
  }
}

/** 玩家技能命中/暴击后对玩家自身施加的效果（未命中不施加） */
function applyPlayerHitEffects(
  player: PlayerState,
  battle: BattleState,
  result: HitResult,
  stats: { onHitEffects?: EffectResult[]; onCritEffects?: EffectResult[] },
): void {
  if (result === 'miss' || result === 'critMiss') return
  if (stats.onHitEffects && stats.onHitEffects.length > 0) {
    const logs = getEffectResolver().executeEffectResults(player, stats.onHitEffects)
    if (logs && logs.length > 0) battle.logs.push(...logs)
  }
  if (result === 'critHit' && stats.onCritEffects && stats.onCritEffects.length > 0) {
    const logs = getEffectResolver().executeEffectResults(player, stats.onCritEffects)
    if (logs && logs.length > 0) battle.logs.push(...logs)
  }
}

/** 敌人对自身/友方施加效果（跳过 d100，支持 hp/力量/敏捷 属性变动） */
function applyEnemySelfEffects(
  battle: BattleState,
  targets: BattleEnemy[],
  effects: EffectResult[] | undefined,
): void {
  if (!effects || effects.length === 0) return
  for (const target of targets) {
    for (const er of effects) {
      const effect = er.effect
      if (effect.type !== EffectType.ATTRIBUTE) continue
      const change = effect as AttributeEffect
      if (change.attribute === 'hp') {
        target.hp = Math.min(target.maxHp, Math.max(0, target.hp + change.value))
        if (change.value > 0) {
          pushEnemyLog(battle, `${target.config.name} 恢复了 ${change.value} 点生命值`)
        }
      } else if (change.attribute === 'strength') {
        target.strength = Math.max(0, target.strength + change.value)
      } else if (change.attribute === 'agility') {
        target.agility = Math.max(0, target.agility + change.value)
      }
    }
  }
}

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
      existing.stacks = Math.min(existing.stacks + 1, 5)
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

    // 触发周期到期的战斗效果（单效果配置，战斗内按回合结算）
    const effectConfig = statusConfig.battleEffects
    if (
      effectConfig &&
      status.turnsActive >= effectConfig.interval &&
      status.turnsActive % effectConfig.interval === 0
    ) {
      if ((effectConfig.triggerChance ?? 1) <= 0 || !chance(effectConfig.triggerChance ?? 1)) {
        // 未触发
      } else {
        const stackMultiplier = effectConfig.scalesWithStacks ? status.stacks : 1
        let totalValue = 0
        for (const change of effectConfig.attributeChanges) {
          if (change.attribute !== StatusAffectedAttribute.HP) continue
          const delta =
            change.operation === 'percentMax'
              ? -(change.value / 100) * enemy.maxHp
              : change.value * (change.operation === 'add' ? stackMultiplier : 1)
          enemy.hp = Math.max(0, enemy.hp + delta)
          totalValue += delta
        }

        if (totalValue < 0) {
          logs.push(
            `${LOG_ROLE_ENEMY}${enemy.config.name} 因${statusConfig.name}损失了 ${Math.abs(Math.round(totalValue))} 点生命值`,
          )
        } else if (effectConfig.triggerText) {
          logs.push(`${LOG_ROLE_ENEMY}${enemy.config.name} 的${statusConfig.name}效果发作了`)
        }
      }
    }

    // 递减剩余回合
    status.remainingTurns -= 1
    if (status.remainingTurns <= 0) {
      enemy.statuses = enemy.statuses.filter((s) => s !== status)
      logs.push(`${LOG_ROLE_ENEMY}${enemy.config.name} 身上的${statusConfig.name}消失了`)
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
    playerSkillCooldowns: {},
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

  // 玩家技能冷却递减（每次玩家回合开始时结算）
  for (const skillId of Object.keys(battle.playerSkillCooldowns)) {
    const cd = battle.playerSkillCooldowns[skillId]
    if (cd !== undefined) {
      battle.playerSkillCooldowns[skillId] = cd - 1
      if (battle.playerSkillCooldowns[skillId]! <= 0) {
        delete battle.playerSkillCooldowns[skillId]
      }
    }
  }

  switch (actionType) {
    case PlayerActionType.BATTLE_SKILL: {
      const skill = skillId
        ? getRegistry().getBattleSkill(skillId)
        : getRegistry().getBattleSkill('basic_attack')

      // 冷却校验：冷却中的技能无法使用（返回时不消耗回合，保持玩家回合）
      if (skill && (battle.playerSkillCooldowns[skill.id] ?? 0) > 0) {
        battle.logs.push(
          `「${skill.name}」冷却中（剩余 ${battle.playerSkillCooldowns[skill.id]} 回合）`,
        )
        return battle.logs
      }

      // 距离校验：不在攻击范围内的技能无法使用（返回时不消耗回合，保持玩家回合）
      const skillDistance = skill ? getPlayerBattleSkillDistance(player, skill) : 1
      if (!canSkillHitAtDistance(skillDistance, battle.distance)) {
        const skillName = skill?.name ?? '普通攻击'
        battle.logs.push(`距离太远，无法使用「${skillName}」（当前距离 ${battle.distance}）`)
        return battle.logs
      }

      if (skill) {
        executePlayerBattleSkill(player, battle, skill.id)
        // 实装冷却：使用后立即进入冷却（下次玩家回合递减）
        const cooldown = skill.cooldown ?? 0
        if (cooldown > 0) {
          battle.playerSkillCooldowns[skill.id] = cooldown
        }
      } else {
        battle.logs.push('未找到可用的攻击技能')
      }

      // 技能附带位移（在结算后生效）
      const move = skill?.moveDistance ?? 0
      if (move !== 0) {
        const before = battle.distance
        battle.distance = clampDistance(battle.distance - move)
        if (battle.distance < before) {
          pushPlayerLog(battle, `你向前突进，与敌人的距离缩短到 ${battle.distance}`)
        } else if (battle.distance > before) {
          pushPlayerLog(battle, `你向后跳跃，与敌人的距离拉开到 ${battle.distance}`)
        }
      }
      break
    }

    case PlayerActionType.DEFEND:
      battle.isPlayerDefending = true
      pushPlayerLog(battle, '你摆出防守姿态，准备抵御敌人的攻击')
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
        pushPlayerLog(battle, `你向前移动，与敌人的距离缩短到 ${battle.distance}`)
      }
      break

    case PlayerActionType.MOVE_AWAY:
      if (battle.distance >= MAX_BATTLE_DISTANCE) {
        battle.logs.push('你已退到最远距离，无法再远离')
      } else {
        battle.distance += 1
        pushPlayerLog(battle, `你向后撤退，与敌人的距离拉开到 ${battle.distance}`)
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
    pushPlayerLog(battle, '你被击败了……')
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
 * 执行玩家战斗技能（普攻也是一种技能）
 * 投掷 d100 判定：暴击优先，其次未命中/普通命中；多段释放依次判定。
 */
function executePlayerBattleSkill(player: PlayerState, battle: BattleState, skillId: string): void {
  const registry = getRegistry()
  const skillConfig = registry.getBattleSkill(skillId)

  if (!skillConfig) {
    battle.logs.push(`技能 ${skillId} 未找到`)
    return
  }

  const stats = skillConfig.stats

  // 检查体力消耗
  const skillStaminaCost = skillConfig.costs.find((c) => c.costType === 'stamina')?.value ?? 10
  const staminaCost = calcStaminaCost(
    skillStaminaCost,
    player.attributes.coefficients.staminaConsumptionCoefficient,
  )

  if (player.survival.stamina < staminaCost) {
    pushPlayerLog(battle, `体力不足，无法使用 ${skillConfig.name}（需要 ${staminaCost} 点体力）`)
    return
  }

  player.survival.stamina -= staminaCost

  // 武器信息与熟练度（满级提供 d100 奖励骰）
  const weaponInfo = getPlayerWeaponInfo(player)
  const proficiency = player.skills.weaponProficiencies[weaponInfo.weaponTypeId]?.level ?? 0
  const haveBonusDie = proficiency >= MAX_WEAPON_PROFICIENCY

  const damageTypeId = skillConfig.damageTypeId ?? weaponInfo.damageTypeId

  const setup: AttackSetup = {
    dice: weaponInfo.dice,
    damageMultiplier: stats.damageMultiplier ?? 1,
    bonusDamage: stats.bonusDamage ?? 0,
    attributeBonus: calcAttributeScalingBonus(
      getPlayerAttributeValue(player, stats.scalingAttribute ?? AttributeType.STRENGTH),
    ),
    accuracyModifier: stats.accuracyModifier ?? 0,
    criticalModifier: stats.criticalModifier ?? 0,
    penetration: getDefensePenetration(damageTypeId),
    narrativeTexts: stats.narrativeTexts,
    attackerLabel: '你',
    side: 'player',
    actionLabel: skillConfig.name,
    weaponLabel: weaponInfo.name,
  }

  const targetType = skillConfig.targetType ?? BattleSkillTargetType.SINGLE_ENEMY
  const hitCount = Math.max(1, stats.hitCount ?? 1)

  // 目标为自身：跳过 d100，直接施加效果
  if (targetType === BattleSkillTargetType.SELF) {
    applyPlayerHitEffects(player, battle, 'hit', stats)
    const texts = stats.narrativeTexts?.hit
    if (texts && texts.length > 0) {
      const template = randomPick(texts)
      if (template !== undefined) {
        pushPlayerLog(
          battle,
          fillNarrative(template, {
            damage: '',
            target: '你',
            weapon: weaponInfo.name,
            name: skillConfig.name,
          }),
        )
      }
    }
    return
  }

  if (targetType === BattleSkillTargetType.ALL_ENEMIES) {
    // 全体攻击：每次释放判定一次 d100（各敌人按自身敏捷分别判定），各敌人单独投掷伤害
    for (let i = 0; i < hitCount; i++) {
      const living = getLivingEnemies(battle)
      if (living.length === 0) return
      const roll = rollBattleCheck(haveBonusDie)
      for (const target of living) {
        resolveAndApplyPlayerHit(
          player,
          battle,
          setup,
          target,
          damageTypeId,
          haveBonusDie,
          roll,
          stats,
        )
      }
    }
    return
  }

  // 单目标（默认 / 随机）：释放次数大于 1 时依次进行判定
  for (let i = 0; i < hitCount; i++) {
    const target =
      targetType === BattleSkillTargetType.RANDOM_ENEMY
        ? resolveRandomTarget(battle)
        : resolveTarget(battle)
    if (!target) return
    resolveAndApplyPlayerHit(
      player,
      battle,
      setup,
      target,
      damageTypeId,
      haveBonusDie,
      undefined,
      stats,
    )
  }
}

/** 对单个敌人结算玩家技能攻击（判定 + 伤害 + 效果），写入日志 */
function resolveAndApplyPlayerHit(
  player: PlayerState,
  battle: BattleState,
  setup: AttackSetup,
  target: BattleEnemy,
  damageTypeId: string,
  haveBonusDie: boolean,
  sharedRoll: number | undefined,
  stats: { onHitEffects?: EffectResult[]; onCritEffects?: EffectResult[] },
): void {
  const dt: DamageTarget = {
    name: target.config.name,
    agility: target.agility,
    defenseRatio: getEnemyDefenseRatio(target, damageTypeId),
  }
  const { result, damage } = resolveAttack(setup, dt, haveBonusDie, battle.logs, sharedRoll)
  applyEnemyHit(battle, target, result, damage)
  applyPlayerHitEffects(player, battle, result, stats)
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
 * 投掷 d100 判定——闪避不考虑命中修正（100-敌人敏捷/2），暴击不考虑暴击修正（固定 ≤5）。
 * 伤害不考虑属性加成：伤害 = 骰子投掷结果 × 投掷伤害倍率（默认 2）；暴击时骰子取最大值。
 * @returns 是否出手（未命中也消耗武器）
 */
function throwWeapon(player: PlayerState, battle: BattleState, weapon: WeaponItem): boolean {
  const target = resolveTarget(battle)
  if (!target) return false

  const stats = weapon.weaponStats
  const multiplier = stats.throwDamageMultiplier ?? 2

  const setup: AttackSetup = {
    dice: stats.baseDamage,
    damageMultiplier: multiplier,
    bonusDamage: 0,
    attributeBonus: 0,
    accuracyModifier: 0,
    criticalModifier: 0,
    isThrow: true,
    penetration: getDefensePenetration(stats.damageTypeId),
    attackerLabel: '你',
    side: 'player',
    actionLabel: `投掷${weapon.name}`,
    weaponLabel: weapon.name,
  }

  const dt: DamageTarget = {
    name: target.config.name,
    agility: target.agility,
    defenseRatio: getEnemyDefenseRatio(target, stats.damageTypeId),
  }
  const { result, damage } = resolveAttack(setup, dt, false, battle.logs)
  applyEnemyHit(battle, target, result, damage)
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
      // 直接伤害（不走 d100 判定，仅投掷武器走）
      if (enemyEffects.damage) {
        const dmg = enemyEffects.damage
        const rawDamage = dmg.baseDamage
        const finalDamage = calcDamageAfterDefense(
          rawDamage,
          getDefensePenetration(dmg.damageTypeId),
          getEnemyDefenseRatio(target, dmg.damageTypeId),
        )
        target.hp = Math.min(target.maxHp, Math.max(0, target.hp - finalDamage))
        const calc: DamageCalcDetail = {
          attackerLabel: '你',
          actionLabel: consumable.name,
          targetName: target.config.name,
          dice: '',
          diceValue: rawDamage,
          isCrit: false,
          damageMultiplier: 1,
          bonusDamage: 0,
          attributeBonus: 0,
          rawDamage,
          penetration: getDefensePenetration(dmg.damageTypeId),
          effectiveDefense: getEnemyDefenseRatio(target, dmg.damageTypeId),
          finalDamage,
        }
        battle.logs.push(
          withCalcMeta(
            `${LOG_ROLE_PLAYER}${consumable.name} 对 ${target.config.name} 造成 ${dmgToken(finalDamage)} 点伤害` +
              (target.hp <= 0 ? `，${target.config.name} 被击败了!` : ''),
            calc,
          ),
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
    LOG_ROLE_PLAYER +
      (consumable.useText
        ? `${consumable.useText}${selfText ? `（${selfText}）` : ''}`
        : `你使用了 ${consumable.name}${selfText ? `（${selfText}）` : ''}`),
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
    pushPlayerLog(battle, '你成功逃离了战斗！')
  } else {
    pushPlayerLog(battle, '逃跑失败！')
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
      pushEnemyLog(battle, `${enemy.config.name} 在状态侵蚀下倒下了！`)
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
        pushEnemyLog(battle, `${enemy.config.name} 正在蓄力...`)
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
        battle.logs.push(
          `${LOG_ROLE_ENEMY}${enemy.config.name} 向前逼近，距离缩短到 ${battle.distance}`,
        )
      } else {
        // 已贴身仍无技能可命中 → 勉强出手（按未命中处理，避免空转）
        const fallback = selectFallbackSkill(enemy, battle)
        if (fallback) {
          battle.logs.push(`${LOG_ROLE_ENEMY}${enemy.config.name} 勉强出手，但未能命中你！`)
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
    if ((selectedSkill.chargeTime ?? 0) > 0) {
      enemy.chargingSkillId = selectedSkill.id
      enemy.chargeRemainingTurns = selectedSkill.chargeTime ?? 0
      if (selectedSkill.chargeText && selectedSkill.chargeText.length > 0) {
        const text =
          selectedSkill.chargeText[Math.floor(Math.random() * selectedSkill.chargeText.length)]
        battle.logs.push(`${LOG_ROLE_ENEMY}${enemy.config.name} ${text}`)
      } else {
        battle.logs.push(`${LOG_ROLE_ENEMY}${enemy.config.name} 正在蓄力...`)
      }
      continue
    }

    // 执行伤害（d100 判定 + 骰子伤害 + 效果）
    executeEnemySkillHit(player, battle, enemy, selectedSkill)

    // 检查玩家死亡
    if (player.survival.hp <= 0) {
      return
    }
  }
}

/**
 * 执行敌人技能攻击（含蓄力技能）
 * 与玩家技能对称的 d100 判定：暴击优先，其次未命中/普通命中；多段释放依次判定。
 * SELF / 全体敌人（友方）目标跳过 d100，直接施加效果。
 */
function executeEnemySkillHit(
  player: PlayerState,
  battle: BattleState,
  enemy: BattleEnemy,
  skill: EnemySkill,
): void {
  const damageTypeId = skill.damageTypeId
  const penetration = getDefensePenetration(damageTypeId)
  const { total: playerDefenseRatio, gearPieces } = getPlayerDefenseInfo(player, damageTypeId)
  const stats = skill.stats

  // 实装冷却：技能出手后立即进入冷却（直接攻击与蓄力释放都走这里，蓄力从释放回合起算）
  const cooldown = skill.cooldown ?? 0
  if (cooldown > 0) {
    enemy.skillCooldowns[skill.id] = cooldown
  }

  const targetType = skill.targetType ?? EnemySkillTargetType.SINGLE_PLAYER

  // SELF / 全体敌人（友方）：跳过 d100，直接施加效果
  if (targetType === EnemySkillTargetType.SELF || targetType === EnemySkillTargetType.ALL_ENEMIES) {
    const targets =
      targetType === EnemySkillTargetType.SELF ? [enemy] : battle.enemies.filter((e) => e.hp > 0)
    applyEnemySelfEffects(battle, targets, stats.onHitEffects)
    const texts = stats.narrativeTexts?.hit
    if (texts && texts.length > 0) {
      const template = randomPick(texts)
      if (template !== undefined) {
        battle.logs.push(
          `${LOG_ROLE_ENEMY}${fillNarrative(template, { damage: '', target: '自身', weapon: '', name: skill.name })}`,
        )
      }
    }
    return
  }

  // 攻击玩家（SINGLE_PLAYER）
  const hitCount = Math.max(1, stats.hitCount ?? 1)
  const scalingAttribute = stats.scalingAttribute ?? 'strength'
  const attributeValue = scalingAttribute === 'agility' ? enemy.agility : enemy.strength

  const setup: AttackSetup = {
    dice: stats.baseDamage ?? '1d4',
    damageMultiplier: 1,
    bonusDamage: 0,
    attributeBonus: calcAttributeScalingBonus(attributeValue),
    accuracyModifier: stats.accuracyModifier ?? 0,
    criticalModifier: stats.criticalModifier ?? 0,
    penetration,
    narrativeTexts: stats.narrativeTexts,
    attackerLabel: enemy.config.name,
    side: 'enemy',
    actionLabel: skill.name,
  }

  for (let i = 0; i < hitCount; i++) {
    if (player.survival.hp <= 0) return

    const dt: DamageTarget = {
      name: '你',
      agility: player.attributes.agility + player.attributes.agilityModifier,
      defenseRatio: playerDefenseRatio,
    }
    const { result, damage, absorbed } = resolveAttack(setup, dt, false, battle.logs)

    if (result === 'miss' || result === 'critMiss') continue

    // 玩家防守时减半伤害
    const finalDamage = battle.isPlayerDefending ? calcDefenseDamageReduction(damage) : damage

    player.survival.hp = Math.min(
      player.survival.maxHp,
      Math.max(0, player.survival.hp - finalDamage),
    )
    if (player.survival.hp <= 0) {
      battle.logs.push('你被击倒了！')
      return
    }

    // 命中后按贡献比例扣减防具耐久（归零卸下并提示）
    applyArmorDurabilityDrain(player, absorbed, gearPieces, playerDefenseRatio, battle.logs)

    // 命中后效果
    if (stats.onHitEffects && stats.onHitEffects.length > 0) {
      const effectLogs = getEffectResolver().executeEffectResults(player, stats.onHitEffects)
      if (effectLogs && effectLogs.length > 0) battle.logs.push(...effectLogs)
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

  executeEnemySkillHit(player, battle, enemy, skill)
}

// ============================================================
// 敌人AI
// ============================================================

/**
 * 技能是否可用（次数/冷却/使用条件，不含距离判定）
 */
function isSkillAvailable(enemy: BattleEnemy, battle: BattleState, skill: EnemySkill): boolean {
  // 检查使用次数上限（默认 -1 表示无限次使用）
  const useCount = enemy.skillUseCount[skill.id] ?? 0
  const maxUses = skill.maxUses ?? -1
  if (maxUses >= 0 && useCount >= maxUses) return false

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
    const priority = skill.priority ?? 0
    const group = priorityGroups.get(priority)
    if (group) {
      group.push(skill)
    } else {
      priorityGroups.set(priority, [skill])
    }
    if (priority > maxPriority) {
      maxPriority = priority
    }
  }

  const topGroup = priorityGroups.get(maxPriority)
  if (!topGroup) return undefined
  return weightedSelect(
    topGroup,
    topGroup.map((s) => s.weight ?? 1),
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
