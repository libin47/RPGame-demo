// src/engine/status.ts
// 状态管理系统：状态施加、移除、刷新、属性修正合并

import type { PlayerState, ActiveStatus } from '@/types/player'
import type { StatusConfig } from '@/types/status'
import { StatusType, StatusStackingRule } from '@/types/status'
import { StatusAffectedAttribute } from '@/types/status'
import type { StatusAttributeChange } from '@/types/status'
import { getRegistry } from './registry'
import { getEffectResolver } from './effect'
import { evaluateCondition } from './event'
import { chance } from './dice'

// ============================================================
// 状态施加
// ============================================================

/**
 * 向玩家施加一个状态
 *
 * 根据状态的叠加规则处理：
 * - NONE: 已存在时不施加
 * - REFRESH: 已存在时刷新持续时间
 * - STACK_INDEPENDENT: 独立叠加（多层分别计时）
 * - STACK_REFRESH: 叠层 + 刷新时间
 * - STACK_NO_REFRESH: 仅叠层不刷新时间
 *
 * @param player - 玩家状态（会被直接修改）
 * @param statusId - 状态配置ID
 * @param durationOverride - 持续时间覆盖（可选，不填则使用状态模板默认值）
 * @param sourceId - 来源描述（如"毒蛇之咬"）
 * @returns 执行日志
 */
export function applyStatus(
  player: PlayerState,
  statusId: string,
  durationOverride?: number,
  sourceId?: string,
): string {
  const registry = getRegistry()
  const statusConfig = registry.getStatus(statusId)
  if (!statusConfig) return `状态 ${statusId} 未找到`

  // 查找是否已存在同状态
  const existingIndex = player.activeStatuses.findIndex((s) => s.statusId === statusId)
  const existing = existingIndex >= 0 ? player.activeStatuses[existingIndex] : undefined
  const currentTime = player.progress.day * 1440 + player.progress.timeMinutes

  switch (statusConfig.stackingRule) {
    case StatusStackingRule.NONE:
      // 已存在时忽略
      if (existing) {
        return `${statusConfig.name} 已存在，无法叠加`
      }
      break

    case StatusStackingRule.REFRESH:
      // 已存在时仅刷新时间
      if (existing) {
        existing.remainingDuration = durationOverride ?? statusConfig.defaultDuration.value
        existing.appliedTime = currentTime
        return `${statusConfig.name} 持续时间已刷新`
      }
      break

    case StatusStackingRule.STACK_INDEPENDENT:
      // 独立叠加，直接新增（不检查是否存在）
      break

    case StatusStackingRule.STACK_REFRESH:
      // 叠层 + 刷新时间
      if (existing) {
        existing.stackCount = Math.min(existing.stackCount + 1, getMaxStack(statusConfig))
        existing.remainingDuration = durationOverride ?? statusConfig.defaultDuration.value
        existing.appliedTime = currentTime
        return `${statusConfig.name} 层数+1，当前 ${existing.stackCount} 层`
      }
      break

    case StatusStackingRule.STACK_NO_REFRESH:
      // 仅叠层
      if (existing) {
        existing.stackCount = Math.min(existing.stackCount + 1, getMaxStack(statusConfig))
        return `${statusConfig.name} 层数+1，当前 ${existing.stackCount} 层`
      }
      break
  }

  // 创建新状态实例
  const durationUnit = statusConfig.defaultDuration.unit
  const duration = durationOverride ?? statusConfig.defaultDuration.value
  const clampedDuration = Math.max(
    statusConfig.defaultDuration.minValue ?? 0,
    Math.min(duration, statusConfig.defaultDuration.maxValue ?? duration),
  )

  const newStatus: ActiveStatus = {
    statusId,
    remainingDuration: clampedDuration,
    durationUnit,
    stackCount: 1,
    sourceId,
    appliedTime: currentTime,
  }

  player.activeStatuses.push(newStatus)

  // 执行施加时效果
  if (statusConfig.onApplyEffects && statusConfig.onApplyEffects.length > 0) {
    getEffectResolver().executeEffectResults(player, statusConfig.onApplyEffects)
  }

  return `施加了 ${statusConfig.name}`
}

/**
 * 从玩家身上移除一个状态
 *
 * @param player - 玩家状态（会被直接修改）
 * @param statusId - 状态配置ID
 * @param removeAllStacks - 是否移除所有叠层（false则只减一层）
 * @returns 执行日志
 */
export function removeStatus(
  player: PlayerState,
  statusId: string,
  removeAllStacks: boolean = true,
): string {
  const registry = getRegistry()
  const statusConfig = registry.getStatus(statusId)

  if (removeAllStacks) {
    const index = player.activeStatuses.findIndex((s) => s.statusId === statusId)
    if (index === -1)
      return statusConfig ? `${statusConfig.name} 不存在` : `状态 ${statusId} 不存在`

    const removed = player.activeStatuses.splice(index, 1)[0]

    // 执行移除时效果
    if (statusConfig && statusConfig.onRemoveEffects) {
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
// 状态更新（时间流逝）
// ============================================================

/**
 * 更新所有状态的时间
 * 当游戏时间推进时调用，减少状态的剩余持续时间
 *
 * @param player - 玩家状态（会被直接修改）
 * @param elapsedMinutes - 经过的游戏分钟数
 * @returns 状态效果触发日志列表
 */
export function updateStatusTimers(player: PlayerState, elapsedMinutes: number): string[] {
  const logs: string[] = []
  if (elapsedMinutes <= 0) return logs

  for (let i = player.activeStatuses.length - 1; i >= 0; i--) {
    const status = player.activeStatuses[i]
    if (!status) continue

    // 永久状态不减少时间
    if (status.durationUnit === 'permanent') continue

    // 减少持续时间（按分钟）
    if (status.durationUnit === 'minute' || status.durationUnit === 'hour') {
      const decrease = status.durationUnit === 'hour' ? elapsedMinutes : elapsedMinutes
      status.remainingDuration -= decrease
    }

    // 状态过期自动移除
    if (status.remainingDuration <= 0) {
      const registry = getRegistry()
      const statusConfig = registry.getStatus(status.statusId)
      if (statusConfig && statusConfig.onRemoveEffects) {
        const removeLogs = getEffectResolver().executeEffectResults(
          player,
          statusConfig.onRemoveEffects,
        )
        logs.push(...removeLogs)
      }
      player.activeStatuses.splice(i, 1)
      logs.push(statusConfig ? `${statusConfig.name} 效果已结束` : `状态已结束`)
    }
  }

  return logs
}

/**
 * 更新战斗回合状态（减少按"回合"计时的状态）
 *
 * @param player - 玩家状态（会被直接修改）
 * @returns 状态效果触发日志
 */
export function updateStatusTurns(player: PlayerState): string[] {
  const logs: string[] = []
  const registry = getRegistry()

  for (let i = player.activeStatuses.length - 1; i >= 0; i--) {
    const status = player.activeStatuses[i]
    if (!status) continue
    if (status.durationUnit !== 'turn') continue

    status.remainingDuration -= 1

    if (status.remainingDuration <= 0) {
      const statusConfig = registry.getStatus(status.statusId)
      if (statusConfig && statusConfig.onRemoveEffects) {
        const removeLogs = getEffectResolver().executeEffectResults(
          player,
          statusConfig.onRemoveEffects,
        )
        logs.push(...removeLogs)
      }
      player.activeStatuses.splice(i, 1)
      logs.push(statusConfig ? `${statusConfig.name} 效果已结束` : `回合状态已结束`)
    }
  }

  return logs
}

// ============================================================
// 状态效果触发
// ============================================================

/**
 * 触发所有状态的周期性效果
 * 检查状态的时间间隔，当达到触发条件时执行状态效果
 *
 * @param player - 玩家状态（会被直接修改）
 * @returns 触发日志列表
 */
export function triggerStatusEffects(player: PlayerState): string[] {
  const logs: string[] = []
  const registry = getRegistry()
  const currentTime = player.progress.day * 1440 + player.progress.timeMinutes

  for (const status of player.activeStatuses) {
    const statusConfig = registry.getStatus(status.statusId)
    if (!statusConfig) continue

    for (const effectConfig of statusConfig.effects) {
      // 检查触发条件
      if (effectConfig.condition && !evaluateCondition(effectConfig.condition, player)) {
        continue
      }

      // 概率判定
      if (!chance(effectConfig.triggerChance)) {
        continue
      }

      // 计算效果强度（受叠层影响）
      const stackMultiplier = effectConfig.scalesWithStacks ? status.stackCount : 1

      // 执行属性变动
      for (const attrChange of effectConfig.attributeChanges) {
        applyAttributeChange(player, attrChange, stackMultiplier)
      }

      if (effectConfig.triggerText) {
        logs.push(effectConfig.triggerText)
      }
    }
  }

  return logs
}

// ============================================================
// 属性修正合并
// ============================================================

/**
 * 计算所有状态对玩家属性的修正值总和
 * 遍历所有激活状态，累加它们的属性修正
 *
 * @param player - 当前玩家状态
 * @returns 各属性的修正值映射
 */
export function calculateStatusModifiers(
  player: PlayerState,
): Partial<Record<StatusAffectedAttribute, number>> {
  const modifiers: Partial<Record<StatusAffectedAttribute, number>> = {}
  const registry = getRegistry()

  for (const status of player.activeStatuses) {
    const statusConfig = registry.getStatus(status.statusId)
    if (!statusConfig) continue

    for (const effectConfig of statusConfig.effects) {
      const stackMultiplier = effectConfig.scalesWithStacks ? status.stackCount : 1

      for (const attrChange of effectConfig.attributeChanges) {
        const currentVal = modifiers[attrChange.attribute] ?? 0

        switch (attrChange.operation) {
          case 'add':
            modifiers[attrChange.attribute] = currentVal + attrChange.value * stackMultiplier
            break
          case 'multiply':
            modifiers[attrChange.attribute] =
              (modifiers[attrChange.attribute] ?? 1) * (1 + attrChange.value * stackMultiplier) - 1
            break
          case 'set':
            modifiers[attrChange.attribute] = attrChange.value * stackMultiplier
            break
        }
      }
    }
  }

  return modifiers
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取状态最大叠层数（根据配置推断）
 */
function getMaxStack(statusConfig: StatusConfig): number {
  // 可叠加状态最多 10 层，不可叠加为 1 层
  switch (statusConfig.stackingRule) {
    case StatusStackingRule.NONE:
    case StatusStackingRule.REFRESH:
      return 1
    default:
      return 10
  }
}

/**
 * 执行单个属性变动
 */
function applyAttributeChange(
  player: PlayerState,
  attrChange: StatusAttributeChange,
  stackMultiplier: number,
): void {
  const value = attrChange.value * stackMultiplier

  switch (attrChange.attribute) {
    case StatusAffectedAttribute.HP:
      player.survival.hp = clampStat(player.survival.hp + value, 0, player.survival.maxHp)
      break
    case StatusAffectedAttribute.SATIETY:
      player.survival.satiety = clampStat(
        player.survival.satiety + value,
        0,
        player.survival.maxSatiety,
      )
      break
    case StatusAffectedAttribute.STAMINA:
      player.survival.stamina = clampStat(
        player.survival.stamina + value,
        0,
        player.survival.maxStamina,
      )
      break
    case StatusAffectedAttribute.SAN:
      player.survival.san = clampStat(player.survival.san + value, 0, player.survival.maxSan)
      break
    case StatusAffectedAttribute.STRENGTH:
      player.attributes.strengthModifier += value
      break
    case StatusAffectedAttribute.AGILITY:
      player.attributes.agilityModifier += value
      break
    case StatusAffectedAttribute.INTELLIGENCE:
      player.attributes.intelligenceModifier += value
      break
    case StatusAffectedAttribute.CONSTITUTION:
      player.attributes.constitutionModifier += value
      break
    case StatusAffectedAttribute.RECOVERY_RATE_COEFFICIENT:
      player.attributes.coefficients.recoveryRateCoefficient += value
      break
    case StatusAffectedAttribute.SATIETY_LOSS_COEFFICIENT:
      player.attributes.coefficients.satietyLossCoefficient += value
      break
    case StatusAffectedAttribute.STAMINA_CONSUMPTION_COEFFICIENT:
      player.attributes.coefficients.staminaConsumptionCoefficient += value
      break
    case StatusAffectedAttribute.STAMINA_RECOVERY_COEFFICIENT:
      player.attributes.coefficients.staminaRecoveryCoefficient += value
      break
    case StatusAffectedAttribute.STAMINA_RECOVERY_FIX:
      player.attributes.coefficients.staminaRecoveryFix += value
      break
    case StatusAffectedAttribute.SLASH_DEFENSE:
      player.attributes.defenses.slashDefense = clampStat(
        player.attributes.defenses.slashDefense + value,
        0,
        100,
      )
      break
    case StatusAffectedAttribute.BLUNT_DEFENSE:
      player.attributes.defenses.bluntDefense = clampStat(
        player.attributes.defenses.bluntDefense + value,
        0,
        100,
      )
      break
    case StatusAffectedAttribute.RANGED_DEFENSE:
      player.attributes.defenses.rangedDefense = clampStat(
        player.attributes.defenses.rangedDefense + value,
        0,
        100,
      )
      break
    case StatusAffectedAttribute.POISON_DEFENSE:
      player.attributes.defenses.poisonDefense = clampStat(
        player.attributes.defenses.poisonDefense + value,
        0,
        100,
      )
      break
    case StatusAffectedAttribute.FIRE_DEFENSE:
      player.attributes.defenses.fireDefense = clampStat(
        player.attributes.defenses.fireDefense + value,
        0,
        100,
      )
      break
    case StatusAffectedAttribute.TEMPERATURE_LOW:
      player.attributes.coefficients.temperatureLowModifier += value
      break
    case StatusAffectedAttribute.TEMPERATURE_HIGH:
      player.attributes.coefficients.temperatureHighModifier += value
      break
    case StatusAffectedAttribute.CARRY_WEIGHT_MODIFIER:
      player.attributes.coefficients.carryWeightModifier += value
      break
    case StatusAffectedAttribute.SAN_MODIFIER:
      player.attributes.coefficients.sanModifier += value
      break
  }
}

/**
 * 将数值限制在 [min, max] 范围内
 */
function clampStat(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * 移除所有战斗结束时应移除的状态
 */
export function removeBattleEndStatuses(player: PlayerState): void {
  const registry = getRegistry()

  for (let i = player.activeStatuses.length - 1; i >= 0; i--) {
    const status = player.activeStatuses[i]
    if (!status) continue

    const statusConfig = registry.getStatus(status.statusId)

    if (statusConfig && statusConfig.removeOnBattleEnd) {
      if (statusConfig.onRemoveEffects) {
        const resolver = getEffectResolver()
        resolver.executeEffectResults(player, statusConfig.onRemoveEffects)
      }
      player.activeStatuses.splice(i, 1)
    }
  }
}

/**
 * 移除所有休息/睡觉时应移除的状态
 */
export function removeRestStatuses(player: PlayerState): void {
  const registry = getRegistry()

  for (let i = player.activeStatuses.length - 1; i >= 0; i--) {
    const status = player.activeStatuses[i]
    if (!status) continue

    const statusConfig = registry.getStatus(status.statusId)

    if (statusConfig && statusConfig.removeOnRest) {
      if (statusConfig.onRemoveEffects) {
        const resolver = getEffectResolver()
        resolver.executeEffectResults(player, statusConfig.onRemoveEffects)
      }
      player.activeStatuses.splice(i, 1)
    }
  }
}
