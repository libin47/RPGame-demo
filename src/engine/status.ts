// src/engine/status.ts
// 状态管理系统：状态施加、移除、刷新、属性修正合并、周期效果触发、属性驱动状态协调
//
// 计时约定（对应 StatusConfig.defaultDuration，单位为分钟，-1=永久）：
//   - 非战斗：经 updateStatusTimers(elapsedMinutes) 按分钟推进；触发 effects
//   - 战斗：每一回合按 1 分钟折算，updateStatusTurns() 触发 battleEffects 并扣除 1 分钟
//
// 修饰（modifier）：施加时写入，移除/过期时撤销，影响 *Modifier / defenses / coefficients / 温度区间
// 周期效果（effects/battleEffects）：达到 interval 触发，支持 triggerChance / triggerRollAtt 判定，支持 {value} 通配符

import type { PlayerState, ActiveStatus } from '@/types/player'
import type {
  StatusConfig,
  AttStatusConfig,
  ModifierConfig,
  StatusEffectConfig,
  StatusAttributeChange,
} from '@/types/status'
import { StatusStackingRule, StatusAffectedAttribute, StatusType } from '@/types/status'
import type { DamageTypeId } from '@/types/damage'
import { getRegistry } from './registry'
import { getEffectResolver } from './effect'
import { evaluateConditions } from './event'
import { chance, randomPick, randomInt } from './dice'

// ============================================================
// 状态叙事文本颜色标记
// 渲染层据此按 statusType 着色（buff绿 / debuff红 / neutral灰 / special紫）
// 该控制字符在渲染时应被剥离。
// ============================================================

/** 状态类型 → 着色标记字符 */
export const STATUS_NARR_MARKER: Record<StatusType, string> = {
  [StatusType.BUFF]: '\u0005',
  [StatusType.DEBUFF]: '\u0006',
  [StatusType.NEUTRAL]: '\u0007',
  [StatusType.SPECIAL]: '\u0008',
}

/** 着色标记字符 → 状态类型（供渲染层解析） */
export function markerToStatusType(marker: string): StatusType {
  switch (marker) {
    case STATUS_NARR_MARKER[StatusType.BUFF]:
      return StatusType.BUFF
    case STATUS_NARR_MARKER[StatusType.NEUTRAL]:
      return StatusType.NEUTRAL
    case STATUS_NARR_MARKER[StatusType.SPECIAL]:
      return StatusType.SPECIAL
    default:
      return StatusType.DEBUFF
  }
}

/** 为状态类型生成叙事前缀（剥离时可直接去掉首字符） */
function narrPrefix(statusType: StatusType): string {
  return STATUS_NARR_MARKER[statusType] ?? STATUS_NARR_MARKER[StatusType.DEBUFF]
}

/** 从字符串数组中随机取一条（空则返回空串） */
function pick(arr?: string[]): string {
  if (!arr || arr.length === 0) return ''
  return randomPick(arr) ?? ''
}

/** 填充 {value} 通配符（用于状态效果触发文本） */
function fillValue(template: string, value: number): string {
  return template.replace(/\{value\}/g, String(Math.round(value)))
}

// ============================================================
// 状态施加 / 移除
// ============================================================

/**
 * 向玩家施加一个状态
 *
 * 时间与叠层（遵循 StatusStackingRule）：
 * - NONE: 已存在时不施加（不刷新时间）
 * - REFRESH: 已存在时仅刷新持续时间
 * - STACK_INDEPENDENT: 独立叠加（新增实例）
 * - STACK_REFRESH: 层数+1 且刷新所有层持续时间
 * - STACK_NO_REFRESH: 层数+1 保持原持续时间
 *
 * 施加时会写入 modifier 修正并执行 onApplyEffects。
 *
 * @param player - 玩家状态（会被直接修改）
 * @param statusId - 状态配置ID
 * @param durationOverride - 持续时间覆盖（分钟，-1=永久；默认取配置 defaultDuration）
 * @param sourceId - 来源描述
 * @returns 执行日志
 */
export function applyStatus(
  player: PlayerState,
  statusId: string,
  durationOverride?: number,
  sourceId?: string,
): string {
  const statusConfig = getRegistry().getStatus(statusId)
  if (!statusConfig) return `状态 ${statusId} 未找到`

  const existingIndex = player.activeStatuses.findIndex((s) => s.statusId === statusId)
  const existing = existingIndex >= 0 ? player.activeStatuses[existingIndex] : undefined
  const currentTime = player.progress.day * 1440 + player.progress.timeMinutes
  const isPermanent = (durationOverride ?? statusConfig.defaultDuration) === -1
  const duration = isPermanent ? -1 : (durationOverride ?? statusConfig.defaultDuration)

  switch (statusConfig.stackingRule) {
    case StatusStackingRule.NONE:
      if (existing) return `${statusConfig.name} 已存在，无法叠加`
      break
    case StatusStackingRule.REFRESH:
      if (existing) {
        existing.remainingDuration = isPermanent ? -1 : duration
        existing.appliedTime = currentTime
        return `${statusConfig.name} 持续时间已刷新`
      }
      break
    case StatusStackingRule.STACK_INDEPENDENT:
      break
    case StatusStackingRule.STACK_REFRESH:
      if (existing) {
        existing.stackCount = Math.min(existing.stackCount + 1, getMaxStack(statusConfig))
        existing.remainingDuration = isPermanent ? -1 : duration
        existing.appliedTime = currentTime
        return `${statusConfig.name} 层数+1，当前 ${existing.stackCount} 层`
      }
      break
    case StatusStackingRule.STACK_NO_REFRESH:
      if (existing) {
        existing.stackCount = Math.min(existing.stackCount + 1, getMaxStack(statusConfig))
        return `${statusConfig.name} 层数+1，当前 ${existing.stackCount} 层`
      }
      break
  }

  const newStatus: ActiveStatus = {
    statusId,
    remainingDuration: isPermanent ? -1 : Math.max(0, duration),
    durationUnit: isPermanent ? 'permanent' : 'minute',
    stackCount: 1,
    sourceId,
    appliedTime: currentTime,
    effectAccum: 0,
    battleEffectAccum: 0,
  }
  player.activeStatuses.push(newStatus)

  // 写入 modifier 修正
  if (statusConfig.modifier) mutateModifier(player, statusConfig.modifier, 1)

  // 施加时效果（仅一次）
  if (statusConfig.onApplyEffects && statusConfig.onApplyEffects.length > 0) {
    getEffectResolver().executeEffectResults(player, statusConfig.onApplyEffects)
  }

  return `施加了 ${statusConfig.name}`
}

/**
 * 从玩家身上移除一个状态（撤销 modifier，执行 onRemoveEffects）
 */
export function removeStatus(
  player: PlayerState,
  statusId: string,
  removeAllStacks: boolean = true,
): string {
  const statusConfig = getRegistry().getStatus(statusId)

  if (removeAllStacks) {
    const index = player.activeStatuses.findIndex((s) => s.statusId === statusId)
    if (index === -1)
      return statusConfig ? `${statusConfig.name} 不存在` : `状态 ${statusId} 不存在`

    const removed = player.activeStatuses.splice(index, 1)[0]
    void removed
    if (statusConfig) {
      if (statusConfig.modifier) mutateModifier(player, statusConfig.modifier, -1)
      if (statusConfig.onRemoveEffects)
        getEffectResolver().executeEffectResults(player, statusConfig.onRemoveEffects)
    }
    return statusConfig ? `${statusConfig.name} 已移除` : `状态已移除`
  }

  // 只减一层
  const existing = player.activeStatuses.find((s) => s.statusId === statusId)
  if (!existing) return statusConfig ? `${statusConfig.name} 不存在` : `状态 ${statusId} 不存在`

  existing.stackCount -= 1
  if (existing.stackCount <= 0) {
    const idx = player.activeStatuses.indexOf(existing)
    player.activeStatuses.splice(idx, 1)
    if (statusConfig) {
      if (statusConfig.modifier) mutateModifier(player, statusConfig.modifier, -1)
      if (statusConfig.onRemoveEffects)
        getEffectResolver().executeEffectResults(player, statusConfig.onRemoveEffects)
    }
  }
  return statusConfig ? `${statusConfig.name} 层数-1` : `状态层数-1`
}

/**
 * 检查玩家是否拥有某状态
 */
export function hasStatus(player: PlayerState, statusId: string): boolean {
  return player.activeStatuses.some((s) => s.statusId === statusId)
}

/**
 * 获取某状态的叠层数
 */
export function getStatusStackCount(player: PlayerState, statusId: string): number {
  const status = player.activeStatuses.find((s) => s.statusId === statusId)
  return status?.stackCount ?? 0
}

// ============================================================
// 属性驱动状态协调（AttStatusConfig）
// ============================================================

/**
 * 协调所有"属性驱动"的状态（AttStatusConfig）
 * 遍历全部带 conditions 的状态，条件满足但未施加 → 施加；条件不满足但已施加 → 移除。
 * 在玩家属性/温暖度变化或每次操作后调用。返回叙事日志（含 start/end 文本与着色标记）。
 */
export function reconcileAttributeStatuses(player: PlayerState): string[] {
  const logs: string[] = []
  const statuses = getRegistry().getAllStatuses()

  for (const statusConfig of Object.values(statuses)) {
    if (!('conditions' in statusConfig)) continue // 仅 AttStatusConfig
    const att = statusConfig as AttStatusConfig

    const satisfied = att.conditions ? evaluateConditions(att.conditions, player) : false
    const active = hasStatus(player, statusConfig.id)

    if (satisfied && !active) {
      applyStatus(player, statusConfig.id, statusConfig.defaultDuration)
      const start = pick(statusConfig.description.start)
      if (start) logs.push(narrPrefix(statusConfig.statusType) + start)
    } else if (!satisfied && active) {
      removeStatus(player, statusConfig.id)
      const end = pick(statusConfig.description.end)
      if (end) logs.push(narrPrefix(statusConfig.statusType) + end)
    }
  }
  return logs
}

// ============================================================
// 状态更新（时间流逝 / 战斗回合）
// ============================================================

/**
 * 非战斗推进：按经过分钟数更新所有状态
 *  1. 扣减剩余持续时间（永久状态除外）
 *  2. 累计并触发非战斗效果 effects（达到 interval 触发一次）
 *  3. 到期自动移除（撤销 modifier、执行 onRemoveEffects、输出 end 文本）
 *
 * @returns 叙事日志（带状态类型着色标记）
 */
export function updateStatusTimers(player: PlayerState, elapsedMinutes: number): string[] {
  const logs: string[] = []
  if (elapsedMinutes <= 0) return logs

  for (let i = player.activeStatuses.length - 1; i >= 0; i--) {
    const status = player.activeStatuses[i]
    if (!status) continue

    const statusConfig = getRegistry().getStatus(status.statusId)

    // 1. 扣减持续时间
    if (status.durationUnit !== 'permanent') {
      status.remainingDuration -= elapsedMinutes
    }

    // 2. 触发非战斗周期效果 effects（单效果配置）
    if (statusConfig?.effects) {
      const ec = statusConfig.effects
      status.effectAccum = (status.effectAccum ?? 0) + elapsedMinutes
      const interval = Math.max(1, ec.interval)
      const times = Math.floor(status.effectAccum / interval)
      status.effectAccum = status.effectAccum % interval

      // 未到触发周期：显示 normalText
      if (times <= 0) {
        logs.push(pick(statusConfig.description.normalText))
        continue
      }
      // 一次操作跨越多个触发周期：以 summary 取代多条 triggerText
      if (times > 1 && statusConfig.description.summary?.length) {
        logs.push(narrPrefix(statusConfig.statusType) + pick(statusConfig.description.summary))
      }
      for (let t = 0; t < times; t++) {
        if (!shouldTrigger(ec, player)) continue
        const result = applyStatusChanges(player, status, ec)
        if (times === 1 && statusConfig.description.triggerText?.length) {
          logs.push(
            narrPrefix(statusConfig.statusType) + pick(statusConfig.description.triggerText),
          )
        }
        if (result.text) logs.push(narrPrefix(statusConfig.statusType) + result.text)
      }
    }

    // 3. 到期移除
    if (status.durationUnit !== 'permanent' && status.remainingDuration <= 0) {
      if (statusConfig) {
        if (statusConfig.modifier) mutateModifier(player, statusConfig.modifier, -1)
        if (statusConfig.onRemoveEffects)
          getEffectResolver().executeEffectResults(player, statusConfig.onRemoveEffects)
        const end = pick(statusConfig.description.end)
        if (end) logs.push(narrPrefix(statusConfig.statusType) + end)
      }
      player.activeStatuses.splice(i, 1)
    }
  }

  return logs
}

/**
 * 战斗推进：每一回合结算（战斗一回合 = 1 分钟）
 *  1. 扣减 1 分钟（永久除外）
 *  2. 触发战斗效果 battleEffects（达到 interval 触发一次）
 *  3. 到期/效果触发输出叙事日志
 *
 * @returns 叙事日志（战斗日志，带状态类型着色标记）
 */
export function updateStatusTurns(player: PlayerState): string[] {
  const logs: string[] = []

  for (let i = player.activeStatuses.length - 1; i >= 0; i--) {
    const status = player.activeStatuses[i]
    if (!status) continue

    const statusConfig = getRegistry().getStatus(status.statusId)

    if (status.durationUnit !== 'permanent') {
      status.remainingDuration -= 1
    }

    // 触发战斗效果 battleEffects（单效果配置）
    if (statusConfig?.battleEffects) {
      const bec = statusConfig.battleEffects
      status.battleEffectAccum = (status.battleEffectAccum ?? 0) + 1
      const interval = Math.max(1, bec.interval)
      const times = Math.floor(status.battleEffectAccum / interval)
      status.battleEffectAccum = status.battleEffectAccum % interval
      for (let t = 0; t < times; t++) {
        if (!shouldTrigger(bec, player)) {
          logs.push(pick(statusConfig.description.normalText))
          continue
        }
        const result = applyStatusChanges(player, status, bec)
        const desc = pick(statusConfig.description.triggerText)
        if (desc) logs.push(narrPrefix(statusConfig.statusType) + desc)
        if (result.text) logs.push(narrPrefix(statusConfig.statusType) + result.text)
      }
    }

    // 到期移除
    if (status.durationUnit !== 'permanent' && status.remainingDuration <= 0) {
      if (statusConfig) {
        if (statusConfig.modifier) mutateModifier(player, statusConfig.modifier, -1)
        if (statusConfig.onRemoveEffects)
          getEffectResolver().executeEffectResults(player, statusConfig.onRemoveEffects)
        const end = pick(statusConfig.description.end)
        if (end) logs.push(narrPrefix(statusConfig.statusType) + end)
      }
      player.activeStatuses.splice(i, 1)
    }
  }

  return logs
}

// ============================================================
// 周期效果判定与执行
// ============================================================

/**
 * 判定某状态效果本次是否触发
 * - conditions（Conditions）不满足 → 不触发
 * - triggerChance / triggerRollAtt 最多一个；同时出现时优先依据 triggerChance
 * - triggerRollAtt：以对应属性做 d100 检定，当 roll ≤ 阈值（普通/困难/极难 = 属性/1、/2、/4）视为"检定成功"即豁免（不触发）
 */
function shouldTrigger(ec: StatusEffectConfig, player: PlayerState): boolean {
  if (ec.conditions && !evaluateConditions(ec.conditions, player)) return false

  if (ec.triggerChance !== undefined) {
    return chance(ec.triggerChance)
  }

  if (ec.triggerRollAtt) {
    const attr = getRollAttrValue(player, ec.triggerRollAtt)
    const divisor = ec.triggerRollLevel === '困难' ? 2 : ec.triggerRollLevel === '极难' ? 4 : 1
    const threshold = Math.max(1, Math.floor(attr / divisor))
    const roll = randomInt(1, 100)
    // roll ≤ 阈值 → 检定成功 → 豁免（不触发）
    return roll > threshold
  }

  return true
}

/** 获取 d100 检定用的属性值（含临时修正） */
function getRollAttrValue(
  player: PlayerState,
  att: '力量' | '敏捷' | '智力' | '体质' | '幸运' | 'san',
): number {
  switch (att) {
    case '力量':
      return player.attributes.strength + player.attributes.strengthModifier
    case '敏捷':
      return player.attributes.agility + player.attributes.agilityModifier
    case '智力':
      return player.attributes.intelligence + player.attributes.intelligenceModifier
    case '体质':
      return player.attributes.constitution + player.attributes.constitutionModifier
    case '幸运':
      return player.attributes.luck + player.attributes.luckModifier
    case 'san':
      return player.survival.san
    default:
      return 0
  }
}

/**
 * 执行单个状态效果的全部属性变动，返回触发文本（{value} 已填充）
 */
function applyStatusChanges(
  player: PlayerState,
  status: ActiveStatus,
  ec: StatusEffectConfig,
): { text: string; value: number } {
  const stackMultiplier = ec.scalesWithStacks ? status.stackCount : 1
  let displayValue = 0

  for (const ch of ec.attributeChanges) {
    const applied = applySingleChange(player, ch, stackMultiplier)
    if (isSurvivalStat(ch.attribute)) displayValue += Math.abs(applied)
  }
  // 兜底：若没有生存属性变动（如仅系数），回退到首项变动的绝对值
  if (displayValue === 0 && ec.attributeChanges.length > 0) {
    displayValue = Math.abs(ec.attributeChanges[0]!.value * stackMultiplier)
  }

  const text = ec.triggerText ? fillValue(ec.triggerText, displayValue) : ''
  return { text, value: displayValue }
}

/** 是否为生存四项属性 */
function isSurvivalStat(attr: StatusAffectedAttribute | string): boolean {
  return (
    attr === StatusAffectedAttribute.HP ||
    attr === StatusAffectedAttribute.SATIETY ||
    attr === StatusAffectedAttribute.STAMINA ||
    attr === StatusAffectedAttribute.SAN
  )
}

/**
 * 生存四项属性的当前值/最大值读取与写入
 */
const SURVIVAL_FIELD: Record<string, 'hp' | 'satiety' | 'stamina' | 'san'> = {
  [StatusAffectedAttribute.HP]: 'hp',
  [StatusAffectedAttribute.SATIETY]: 'satiety',
  [StatusAffectedAttribute.STAMINA]: 'stamina',
  [StatusAffectedAttribute.SAN]: 'san',
}

const SURVIVAL_MAX_FIELD: Record<string, 'maxHp' | 'maxSatiety' | 'maxStamina' | 'maxSan'> = {
  [StatusAffectedAttribute.HP]: 'maxHp',
  [StatusAffectedAttribute.SATIETY]: 'maxSatiety',
  [StatusAffectedAttribute.STAMINA]: 'maxStamina',
  [StatusAffectedAttribute.SAN]: 'maxSan',
}

/**
 * 执行单个属性变动（仅支持生存四项属性，返回实际变动量）
 * - add：加减值（value × 叠层系数）
 * - multiply：当前值乘以系数 value
 * - set：设置为 value（clamp 到 [0, max]）
 * - percentMax：按最大值的百分比扣除（value 为百分比，如 5 = 5% × max）
 * 其余属性（基础/系数/防御/温度等）的持续修正统一走 modifier，
 * 不再作为周期 StatusAttributeChange 处理。
 */
function applySingleChange(
  player: PlayerState,
  attrChange: StatusAttributeChange,
  stackMultiplier: number,
): number {
  const { attribute, operation, value } = attrChange
  const field = SURVIVAL_FIELD[attribute]
  const maxField = SURVIVAL_MAX_FIELD[attribute]
  if (!field || !maxField) return 0

  const max = player.survival[maxField]
  const before = player.survival[field]

  let after: number
  if (operation === 'add') {
    after = before + value * stackMultiplier
  } else if (operation === 'set') {
    after = value
  } else if (operation === 'multiply') {
    after = before * value
  } else {
    // percentMax：按最大值的百分比扣除（value 正数为扣减）
    after = before - (max * Math.abs(value)) / 100
  }

  player.survival[field] = clampStat(after, 0, max)
  return player.survival[field] - before
}

// ============================================================
// Modifier 应用 / 撤销
// ============================================================

/**
 * 对玩家应用或撤销一个状态的 modifier 修正
 * @param m - ModifierConfig
 * @param sign - 1 施加 / -1 撤销
 */
export function mutateModifier(player: PlayerState, m: ModifierConfig, sign: 1 | -1): void {
  const at = player.attributes
  const s = sign

  if (m.strengthModifier !== undefined) at.strengthModifier += m.strengthModifier * s
  if (m.agilityModifier !== undefined) at.agilityModifier += m.agilityModifier * s
  if (m.intelligenceModifier !== undefined) at.intelligenceModifier += m.intelligenceModifier * s
  if (m.constitutionModifier !== undefined) at.constitutionModifier += m.constitutionModifier * s
  if (m.luckModifier !== undefined) at.luckModifier += m.luckModifier * s
  if (m.carryWeightModifier !== undefined)
    at.coefficients.carryWeightModifier += m.carryWeightModifier * s

  if (m.defenses) {
    for (const [k, v] of Object.entries(m.defenses)) {
      if (typeof v !== 'number') continue
      const key = k as DamageTypeId
      at.defenses[key] = (at.defenses[key] ?? 0) + v * s
    }
  }

  if (m.coefficients) {
    const c = m.coefficients
    const cc = at.coefficients
    if (c.recoveryRateCoefficient !== undefined)
      cc.recoveryRateCoefficient += c.recoveryRateCoefficient * s
    if (c.satietyLossCoefficient !== undefined)
      cc.satietyLossCoefficient += c.satietyLossCoefficient * s
    if (c.staminaConsumptionCoefficient !== undefined)
      cc.staminaConsumptionCoefficient += c.staminaConsumptionCoefficient * s
    if (c.staminaRecoveryCoefficient !== undefined)
      cc.staminaRecoveryCoefficient += c.staminaRecoveryCoefficient * s
    if (c.staminaRecoveryFix !== undefined) cc.staminaRecoveryFix += c.staminaRecoveryFix * s
    if (c.sanModifier !== undefined) cc.sanModifier += c.sanModifier * s
    if (c.sanRecoveryCoefficient !== undefined)
      cc.sanRecoveryCoefficient += c.sanRecoveryCoefficient * s
  }

  if (m.temperatureLowModifier !== undefined)
    at.coefficients.temperatureLowModifier += m.temperatureLowModifier * s
  if (m.temperatureHighModifier !== undefined)
    at.coefficients.temperatureHighModifier += m.temperatureHighModifier * s
}

// ============================================================
// 查询与辅助
// ============================================================

/**
 * 获取玩家当前激活状态的面板信息（属性界面显示用）
 */
export function getActiveStatusDetails(player: PlayerState): {
  statusId: string
  name: string
  stackCount: number
  statusType: StatusType
  tooltip?: string
  remainingMinutes: number
  isPermanent: boolean
}[] {
  return player.activeStatuses
    .map((status) => {
      const statusConfig = getRegistry().getStatus(status.statusId)
      if (!statusConfig) return null
      return {
        statusId: status.statusId,
        name: statusConfig.name,
        stackCount: status.stackCount,
        statusType: statusConfig.statusType,
        tooltip: statusConfig.description?.tooltip,
        remainingMinutes: status.remainingDuration,
        isPermanent: status.durationUnit === 'permanent',
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
}

/** 获取状态最大叠层数 */
function getMaxStack(statusConfig: StatusConfig): number {
  switch (statusConfig.stackingRule) {
    case StatusStackingRule.NONE:
    case StatusStackingRule.REFRESH:
      return 1
    default:
      return 10
  }
}

/** 将数值限制在 [min, max] 范围 */
function clampStat(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ============================================================
// 战斗结束 / 休息移除
// ============================================================

/** 移除战斗结束时应移除的状态（撤销 modifier，执行 onRemoveEffects） */
export function removeBattleEndStatuses(player: PlayerState): void {
  const registry = getRegistry()
  for (let i = player.activeStatuses.length - 1; i >= 0; i--) {
    const status = player.activeStatuses[i]
    if (!status) continue
    const statusConfig = registry.getStatus(status.statusId)
    if (statusConfig?.removeOnBattleEnd) {
      if (statusConfig.modifier) mutateModifier(player, statusConfig.modifier, -1)
      if (statusConfig.onRemoveEffects)
        getEffectResolver().executeEffectResults(player, statusConfig.onRemoveEffects)
      player.activeStatuses.splice(i, 1)
    }
  }
}

/** 移除休息/睡觉时应移除的状态（撤销 modifier，执行 onRemoveEffects） */
export function removeRestStatuses(player: PlayerState): void {
  const registry = getRegistry()
  for (let i = player.activeStatuses.length - 1; i >= 0; i--) {
    const status = player.activeStatuses[i]
    if (!status) continue
    const statusConfig = registry.getStatus(status.statusId)
    if (statusConfig?.removeOnRest) {
      if (statusConfig.modifier) mutateModifier(player, statusConfig.modifier, -1)
      if (statusConfig.onRemoveEffects)
        getEffectResolver().executeEffectResults(player, statusConfig.onRemoveEffects)
      player.activeStatuses.splice(i, 1)
    }
  }
}
