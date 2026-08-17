// src/engine/effect.ts

import type { PlayerState } from '@/types/player'
import type { EffectResult, Effect } from '@/types/effect'
import { EffectType, AttributeType, AttributeOperation, ItemChangeType } from '@/types/effect'
import type { DamageTypeId } from '@/types/damage'
import { getRegistry } from './registry'
import { applyStatus, removeStatus } from './status'
import { addItem, removeItem, equipItemById, unequipByItemId } from './inventory'
import { executeMoveCampsite } from './campsite'
import {
  calcStaminaConsumptionCoefficient,
  calcStaminaRecoveryCoefficient,
  calcSanRecoveryCoefficient,
} from './formula'

// ============================================================
// 属性变动监听（供 runtime 层订阅：基础属性/经验变动时展示提醒）
// ============================================================

/** 基础属性键（与 PlayerAttributes 中可成长的属性一致） */
export type GrowthAttributeKey = 'strength' | 'agility' | 'intelligence' | 'constitution'

/** 可触发变动通知的属性键（基础属性 + 生存属性 SAN） */
export type AttributeChangeKey = GrowthAttributeKey | 'san'

/**
 * 基础属性变动记录
 * 经验变动与基础值（等级）变动可同时发生（如获得经验触发升级）；
 * 生存属性（SAN）仅记录增减量 delta
 */
export interface AttributeChangeRecord {
  /** 属性键 */
  attribute: AttributeChangeKey
  /** 本次经验原始增减量（经验变动时为数字；仅基础值变动时缺省） */
  expDelta?: number
  /** 基础值（等级）变动前 */
  oldValue?: number
  /** 基础值（等级）变动后 */
  newValue?: number
  /** 基础值变化是否由升级（经验达标）产生 */
  levelUp?: boolean
  /** 生存属性（SAN）的实际增减量 */
  delta?: number
}

/** 属性变动监听器回调 */
export type AttributeChangeListener = (change: AttributeChangeRecord) => void

const attributeChangeListeners = new Set<AttributeChangeListener>()

/**
 * 注册属性变动监听器
 * 基础属性值或经验值发生变动后触发（获得经验、升级、直接修改基础值等）
 *
 * @param listener - 回调，参数为属性变动记录
 * @returns 注销函数
 */
export function onAttributeChanged(listener: AttributeChangeListener): () => void {
  attributeChangeListeners.add(listener)
  return () => {
    attributeChangeListeners.delete(listener)
  }
}

/** 触发属性变动监听器 */
function notifyAttributeChanged(change: AttributeChangeRecord): void {
  for (const listener of attributeChangeListeners) {
    listener(change)
  }
}

/**
 * 应用 SAN 值变动（钳制到 0~maxSan）并触发属性变动通知
 * 供效果结算（setAttributeValue）与运行时按钮消耗/休息恢复统一调用，
 * 保证钳制逻辑与通知逻辑只有一份。
 *
 * @param player - 玩家状态（会被直接修改）
 * @param delta - 期望增减量（实际应用值可能因钳制而不同）
 */
export function applySanDelta(player: PlayerState, delta: number): void {
  const oldValue = player.survival.san
  const newValue = Math.max(0, Math.min(player.survival.san + delta, player.survival.maxSan))
  if (newValue === oldValue) return
  player.survival.san = newValue
  notifyAttributeChanged({ attribute: 'san', delta: newValue - oldValue })
}

/**
 * 效果解析执行器
 *
 * 负责解析 EffectResult 并修改 PlayerState。
 * 所有效果都在此模块中统一处理，确保状态变更的一致性和可追踪性。
 *
 * 当前实现覆盖：
 * - 属性变动（生存属性、基础属性、经验值）
 * - 物品变动（获得、移除、装备、卸下）
 * - 标志位设置
 * - 技能解锁
 * - 配方解锁
 *
 * 后续需实现：
 * - 状态施加/移除（需要战斗/时间系统）
 * - 场景切换（需要场景管理器配合）
 * - 战斗触发（需要战斗系统）
 * - CG触发（需要CG系统）
 * - 事件触发（需要事件管理器配合）
 * - 复合效果
 */
export class EffectResolver {
  private registry = getRegistry()

  /**
   * 执行一组效果结果
   *
   * @param player - 当前玩家状态（会被直接修改）
   * @param effects - 要执行的效果结果列表
   * @returns 执行日志（描述发生了什么）
   */
  executeEffectResults(player: PlayerState, effects: EffectResult[]): string[] {
    const logs: string[] = []

    for (const effectResult of effects) {
      // 概率判定
      if (effectResult.probability !== undefined && effectResult.probability < 1) {
        if (Math.random() > effectResult.probability) {
          continue
        }
      }

      // 条件判定（后续集成条件评估器后启用）
      // if (effectResult.condition) { ... }

      const log = this.executeEffect(player, effectResult.effect)
      if (log) {
        logs.push(log)
      }
    }

    return logs
  }

  /**
   * 执行单个效果
   * 返回执行描述文本，失败返回 null
   */
  private executeEffect(player: PlayerState, effect: Effect): string | null {
    switch (effect.type) {
      case EffectType.ATTRIBUTE:
        return this.executeAttributeEffect(player, effect)

      case EffectType.ITEM:
        return this.executeItemEffect(player, effect)

      case EffectType.FLAG:
        return this.executeFlagEffect(player, effect)

      case EffectType.FLAG_NUM:
        return this.executeFlagNumEffect(player, effect)

      case EffectType.SKILL:
        return this.executeSkillEffect(player, effect)

      case EffectType.RECIPE:
        return this.executeRecipeEffect(player, effect)

      case EffectType.GAIN_EXP:
        return this.executeGainExpEffect(player, effect)

      // 复合效果：递归执行子效果
      case EffectType.COMPOSITE:
        return this.executeCompositeEffect(player, effect)

      // 营地建立/搬家
      case EffectType.CAMPSITE_MOVE:
        return this.executeCampsiteMoveEffect(player, effect)

      // 状态效果
      case EffectType.STATUS:
        return this.executeStatusEffect(player, effect)

      // 以下类型由运行时（useGame）处理，效果器仅返回描述日志
      case EffectType.SCENE:
        return '场景切换已请求'
      case EffectType.BATTLE:
        return '战斗已触发'
      case EffectType.CG:
        return 'CG已触发'
      case EffectType.EVENT:
        return '事件已触发'

      default:
        return null
    }
  }

  /**
   * 执行复合效果：按顺序递归执行子效果
   */
  private executeCompositeEffect(
    player: PlayerState,
    effect: Extract<Effect, { type: EffectType.COMPOSITE }>,
  ): string | null {
    const logs: string[] = []
    for (const subEffect of effect.effects) {
      const log = this.executeEffect(player, subEffect)
      if (log) {
        logs.push(log)
      }
    }
    return logs.length > 0 ? logs.join('；') : null
  }

  /**
   * 执行营地建立/搬家效果
   */
  private executeCampsiteMoveEffect(
    player: PlayerState,
    effect: Extract<Effect, { type: EffectType.CAMPSITE_MOVE }>,
  ): string | null {
    const result = executeMoveCampsite(player, effect.targetSceneId)
    if (!result.success) return `搬家失败：${result.message}`
    const parts = [result.message]
    if (result.migratedCount) parts.push(`迁移 ${result.migratedCount} 座建筑`)
    if (result.demolishedCount) parts.push(`拆除 ${result.demolishedCount} 座建筑`)
    return parts.join('，')
  }

  /**
   * 执行状态施加/移除效果
   */
  private executeStatusEffect(
    player: PlayerState,
    effect: Extract<Effect, { type: EffectType.STATUS }>,
  ): string | null {
    const { statusId, apply, duration, sourceId } = effect

    if (apply) {
      // 施加状态
      const log = applyStatus(player, statusId, duration, sourceId)
      return log
    } else {
      // 移除状态
      const log = removeStatus(player, statusId, true)
      return log
    }
  }

  // ============================================================
  // 属性变动
  // ============================================================

  /**
   * 执行属性变动效果
   */
  private executeAttributeEffect(
    player: PlayerState,
    effect: Extract<Effect, { type: EffectType.ATTRIBUTE }>,
  ): string | null {
    const { attribute, operation, value, subType } = effect

    // 获取属性当前值
    const currentValue = this.getAttributeValue(player, attribute, subType)
    if (currentValue === null) {
      return `未知属性: ${attribute}`
    }

    // 计算新值
    let newValue: number
    switch (operation) {
      case AttributeOperation.SET:
        newValue = value
        break
      case AttributeOperation.ADD:
        newValue = currentValue + value
        break
      case AttributeOperation.SUBTRACT:
        newValue = currentValue - value
        break
      case AttributeOperation.MULTIPLY:
        newValue = currentValue * value
        break
      case AttributeOperation.DIVIDE:
        if (value === 0) return '除数不能为0'
        newValue = currentValue / value
        break
      default:
        return `未知操作: ${operation}`
    }

    // 设置新值
    this.setAttributeValue(player, attribute, subType, newValue)

    return null
  }

  /**
   * 获取属性值
   * 根据属性类型从 PlayerState 中读取
   */
  private getAttributeValue(
    player: PlayerState,
    attribute: AttributeType | DamageTypeId,
    subType?: string,
  ): number | null {
    // 防御属性：以伤害类型 id 直接读写 defenses（与 damageTypes.ts 注册表一致）
    if (getRegistry().getDamageType(attribute)) {
      return player.attributes.defenses[attribute as DamageTypeId] ?? 0
    }

    switch (attribute) {
      // 生存属性
      case AttributeType.HP:
        return player.survival.hp
      case AttributeType.SATIETY:
        return player.survival.satiety
      case AttributeType.STAMINA:
        return player.survival.stamina
      case AttributeType.SAN:
        return player.survival.san

      // 基础属性
      case AttributeType.STRENGTH:
        return player.attributes.strength
      case AttributeType.AGILITY:
        return player.attributes.agility
      case AttributeType.INTELLIGENCE:
        return player.attributes.intelligence
      case AttributeType.CONSTITUTION:
        return player.attributes.constitution
      case AttributeType.LUCK:
        return player.attributes.luck

      // 经验值
      case AttributeType.STRENGTH_EXP:
        return player.attributes.strengthExp
      case AttributeType.AGILITY_EXP:
        return player.attributes.agilityExp
      case AttributeType.INTELLIGENCE_EXP:
        return player.attributes.intelligenceExp
      case AttributeType.CONSTITUTION_EXP:
        return player.attributes.constitutionExp

      // 武器熟练度（需要 subType 指定武器类型）
      case AttributeType.WEAPON_PROFICIENCY:
        if (!subType) return null
        return player.skills.weaponProficiencies[subType]?.level ?? 0

      // 武器熟练度经验（需要 subType 指定武器类型）
      case AttributeType.WEAPON_PROFICIENCY_EXP:
        if (!subType) return null
        return player.skills.weaponProficiencies[subType]?.exp ?? 0

      // 防御属性（以伤害类型 id 处理，见函数开头）

      // 系数属性
      case AttributeType.RECOVERY_RATE_COEFFICIENT:
        return player.attributes.coefficients.recoveryRateCoefficient
      case AttributeType.SATIETY_UPPER_LIMIT_COEFFICIENT:
        return player.attributes.coefficients.satietyUpperLimitCoefficient
      case AttributeType.SATIETY_LOSS_COEFFICIENT:
        return player.attributes.coefficients.satietyLossCoefficient
      case AttributeType.STAMINA_CONSUMPTION_COEFFICIENT:
        return player.attributes.coefficients.staminaConsumptionCoefficient
      case AttributeType.STAMINA_RECOVERY_COEFFICIENT:
        return player.attributes.coefficients.staminaRecoveryCoefficient
      case AttributeType.STAMINA_RECOVERY_FIX:
        return player.attributes.coefficients.staminaRecoveryFix
      case AttributeType.SAN_MODIFIER:
        return player.attributes.coefficients.sanModifier
      case AttributeType.TEMPERATURE_LOW:
        return player.attributes.coefficients.temperatureLowModifier
      case AttributeType.TEMPERATURE_HIGH:
        return player.attributes.coefficients.temperatureHighModifier
      case AttributeType.CARRY_WEIGHT_MODIFIER:
        return player.attributes.coefficients.carryWeightModifier

      default:
        return null
    }
  }

  /**
   * 设置属性值
   * 自动处理边界限制（生命值不超过上限、饱食度不小于0等）
   */
  private setAttributeValue(
    player: PlayerState,
    attribute: AttributeType | DamageTypeId,
    subType: string | undefined,
    newValue: number,
  ): void {
    // 防御属性：以伤害类型 id 直接读写 defenses（与 damageTypes.ts 注册表一致）
    if (getRegistry().getDamageType(attribute)) {
      player.attributes.defenses[attribute as DamageTypeId] = Math.max(0, newValue)
      return
    }

    switch (attribute) {
      // 生存属性（带边界限制）
      case AttributeType.HP:
        player.survival.hp = Math.max(0, Math.min(newValue, player.survival.maxHp))
        break
      case AttributeType.SATIETY:
        player.survival.satiety = Math.max(0, Math.min(newValue, player.survival.maxSatiety))
        break
      case AttributeType.STAMINA:
        player.survival.stamina = Math.max(0, Math.min(newValue, player.survival.maxStamina))
        break
      case AttributeType.SAN:
        applySanDelta(player, newValue - player.survival.san)
        break

      // 基础属性
      case AttributeType.STRENGTH: {
        const oldValue = player.attributes.strength
        player.attributes.strength = Math.max(0, Math.min(newValue, 100))
        if (oldValue !== player.attributes.strength) {
          notifyAttributeChanged({
            attribute: 'strength',
            oldValue,
            newValue: player.attributes.strength,
          })
        }
        // 力量变动影响最大负重与体力消耗系数
        this.recalculateMaxCarryWeight(player)
        this.recalculateStaminaConsumptionCoefficient(player)
        break
      }
      case AttributeType.AGILITY: {
        const oldValue = player.attributes.agility
        player.attributes.agility = Math.max(0, Math.min(newValue, 100))
        if (oldValue !== player.attributes.agility) {
          notifyAttributeChanged({
            attribute: 'agility',
            oldValue,
            newValue: player.attributes.agility,
          })
        }
        break
      }
      case AttributeType.INTELLIGENCE: {
        const oldValue = player.attributes.intelligence
        player.attributes.intelligence = Math.max(0, Math.min(newValue, 100))
        if (oldValue !== player.attributes.intelligence) {
          notifyAttributeChanged({
            attribute: 'intelligence',
            oldValue,
            newValue: player.attributes.intelligence,
          })
        }
        // 智力变动影响SAN恢复系数
        this.recalculateSanRecoveryCoefficient(player)
        break
      }
      case AttributeType.CONSTITUTION: {
        const oldValue = player.attributes.constitution
        player.attributes.constitution = Math.max(0, Math.min(newValue, 100))
        if (oldValue !== player.attributes.constitution) {
          notifyAttributeChanged({
            attribute: 'constitution',
            oldValue,
            newValue: player.attributes.constitution,
          })
        }
        // 体质变动影响生命值上限与体力恢复系数
        this.recalculateMaxHp(player)
        this.recalculateStaminaRecoveryCoefficient(player)
        break
      }
      case AttributeType.LUCK:
        player.attributes.luck = Math.max(-100, Math.min(newValue, 100))
        break

      // 经验值
      case AttributeType.STRENGTH_EXP: {
        const oldValue = player.attributes.strength
        const oldExp = player.attributes.strengthExp
        player.attributes.strengthExp = Math.max(0, newValue)
        this.checkAttributeLevelUp(player, 'strength')
        const newLevel = player.attributes.strength
        notifyAttributeChanged({
          attribute: 'strength',
          expDelta: newValue - oldExp,
          oldValue,
          newValue: newLevel,
          levelUp: newLevel > oldValue,
        })
        break
      }
      case AttributeType.AGILITY_EXP: {
        const oldValue = player.attributes.agility
        const oldExp = player.attributes.agilityExp
        player.attributes.agilityExp = Math.max(0, newValue)
        this.checkAttributeLevelUp(player, 'agility')
        const newLevel = player.attributes.agility
        notifyAttributeChanged({
          attribute: 'agility',
          expDelta: newValue - oldExp,
          oldValue,
          newValue: newLevel,
          levelUp: newLevel > oldValue,
        })
        break
      }
      case AttributeType.INTELLIGENCE_EXP: {
        const oldValue = player.attributes.intelligence
        const oldExp = player.attributes.intelligenceExp
        player.attributes.intelligenceExp = Math.max(0, newValue)
        this.checkAttributeLevelUp(player, 'intelligence')
        const newLevel = player.attributes.intelligence
        notifyAttributeChanged({
          attribute: 'intelligence',
          expDelta: newValue - oldExp,
          oldValue,
          newValue: newLevel,
          levelUp: newLevel > oldValue,
        })
        break
      }
      case AttributeType.CONSTITUTION_EXP: {
        const oldValue = player.attributes.constitution
        const oldExp = player.attributes.constitutionExp
        player.attributes.constitutionExp = Math.max(0, newValue)
        this.checkAttributeLevelUp(player, 'constitution')
        const newLevel = player.attributes.constitution
        notifyAttributeChanged({
          attribute: 'constitution',
          expDelta: newValue - oldExp,
          oldValue,
          newValue: newLevel,
          levelUp: newLevel > oldValue,
        })
        break
      }

      // 武器熟练度
      case AttributeType.WEAPON_PROFICIENCY:
        if (subType) {
          if (!player.skills.weaponProficiencies[subType]) {
            player.skills.weaponProficiencies[subType] = { level: 0, exp: 0 }
          }
          player.skills.weaponProficiencies[subType].level = Math.max(0, Math.min(newValue, 10))
        }
        break

      // 武器熟练度经验
      case AttributeType.WEAPON_PROFICIENCY_EXP:
        if (subType) {
          if (!player.skills.weaponProficiencies[subType]) {
            player.skills.weaponProficiencies[subType] = { level: 0, exp: 0 }
          }
          player.skills.weaponProficiencies[subType].exp = Math.max(0, newValue)
          this.checkWeaponProficiencyLevelUp(player, subType)
        }
        break

      // 防御属性（以伤害类型 id 处理，见函数开头）

      // 系数属性
      case AttributeType.RECOVERY_RATE_COEFFICIENT:
        player.attributes.coefficients.recoveryRateCoefficient = newValue
        break
      case AttributeType.SATIETY_UPPER_LIMIT_COEFFICIENT:
        player.attributes.coefficients.satietyUpperLimitCoefficient = newValue
        player.survival.maxSatiety = 100 * newValue
        if (player.survival.satiety > player.survival.maxSatiety) {
          player.survival.satiety = player.survival.maxSatiety
        }
        break
      case AttributeType.SATIETY_LOSS_COEFFICIENT:
        player.attributes.coefficients.satietyLossCoefficient = newValue
        break
      case AttributeType.STAMINA_CONSUMPTION_COEFFICIENT:
        player.attributes.coefficients.staminaConsumptionCoefficient = newValue
        break
      case AttributeType.STAMINA_RECOVERY_COEFFICIENT:
        player.attributes.coefficients.staminaRecoveryCoefficient = newValue
        break
      case AttributeType.STAMINA_RECOVERY_FIX:
        player.attributes.coefficients.staminaRecoveryFix = newValue
        player.survival.maxStamina = 100 + newValue
        if (player.survival.stamina > player.survival.maxStamina) {
          player.survival.stamina = player.survival.maxStamina
        }
        break
      case AttributeType.SAN_MODIFIER:
        player.attributes.coefficients.sanModifier = newValue
        this.recalculateMaxSan(player)
        break
      case AttributeType.TEMPERATURE_LOW:
        player.attributes.coefficients.temperatureLowModifier = newValue
        player.survival.comfortTempLow = 10 + newValue
        break
      case AttributeType.TEMPERATURE_HIGH:
        player.attributes.coefficients.temperatureHighModifier = newValue
        player.survival.comfortTempHigh = 25 + newValue
        break
      case AttributeType.CARRY_WEIGHT_MODIFIER:
        player.attributes.coefficients.carryWeightModifier = newValue
        this.recalculateMaxCarryWeight(player)
        break
    }
  }

  /**
   * 重新计算生命值上限（体质变动时调用）
   * 公式：体质 × 2
   */
  private recalculateMaxHp(player: PlayerState): void {
    const oldMaxHp = player.survival.maxHp
    const newMaxHp = player.attributes.constitution * 2
    player.survival.maxHp = newMaxHp

    // 按比例调整当前生命值
    if (oldMaxHp > 0) {
      player.survival.hp = Math.round((player.survival.hp / oldMaxHp) * newMaxHp)
    }
    if (player.survival.hp > newMaxHp) {
      player.survival.hp = newMaxHp
    }
  }

  /**
   * 重新计算SAN值上限
   */
  private recalculateMaxSan(player: PlayerState): void {
    const oldMaxSan = player.survival.maxSan
    const newMaxSan = 100 + player.attributes.coefficients.sanModifier
    player.survival.maxSan = Math.max(1, newMaxSan)

    // 按比例调整当前SAN值
    if (oldMaxSan > 0) {
      player.survival.san = Math.round((player.survival.san / oldMaxSan) * player.survival.maxSan)
    }
    if (player.survival.san > player.survival.maxSan) {
      player.survival.san = player.survival.maxSan
    }
  }

  /**
   * 重新计算最大负重
   * 公式：力量 × 2 + 负重修正
   */
  private recalculateMaxCarryWeight(player: PlayerState): void {
    player.survival.maxCarryWeight =
      player.attributes.strength * 2 + player.attributes.coefficients.carryWeightModifier
  }

  /**
   * 重新计算体力消耗系数（力量变动时调用）
   * 公式：100 / (力量 + 100)
   */
  private recalculateStaminaConsumptionCoefficient(player: PlayerState): void {
    player.attributes.coefficients.staminaConsumptionCoefficient =
      calcStaminaConsumptionCoefficient(player.attributes.strength)
  }

  /**
   * 重新计算体力恢复系数（体质变动时调用）
   * 公式：体质 / 50
   */
  private recalculateStaminaRecoveryCoefficient(player: PlayerState): void {
    player.attributes.coefficients.staminaRecoveryCoefficient = calcStaminaRecoveryCoefficient(
      player.attributes.constitution,
    )
  }

  /**
   * 重新计算SAN值恢复系数（智力变动时调用）
   * 公式：智力 / 50
   */
  private recalculateSanRecoveryCoefficient(player: PlayerState): void {
    player.attributes.coefficients.sanRecoveryCoefficient = calcSanRecoveryCoefficient(
      player.attributes.intelligence,
    )
  }

  /**
   * 检查基础属性是否升级
   * 升级所需经验 = 当前等级 × 100
   */
  private checkAttributeLevelUp(
    player: PlayerState,
    attribute: 'strength' | 'agility' | 'intelligence' | 'constitution',
  ): void {
    const expKey = `${attribute}Exp` as const
    const currentLevel = player.attributes[attribute]
    const currentExp = player.attributes[expKey]

    if (currentLevel >= 20) return

    const requiredExp = 100
    if (currentExp >= requiredExp) {
      // 升级
      player.attributes[attribute] += 1
      player.attributes[expKey] -= requiredExp

      // 升级后重算受该属性影响的派生数值/系数
      switch (attribute) {
        case 'strength':
          this.recalculateMaxCarryWeight(player)
          this.recalculateStaminaConsumptionCoefficient(player)
          break
        case 'constitution':
          this.recalculateMaxHp(player)
          this.recalculateStaminaRecoveryCoefficient(player)
          break
        case 'intelligence':
          this.recalculateSanRecoveryCoefficient(player)
          break
      }

      // 递归检查是否连续升级
      this.checkAttributeLevelUp(player, attribute)
    }
  }

  /**
   * 检查武器熟练度是否升级
   * 升级所需经验 = 当前等级 × 100
   */
  private checkWeaponProficiencyLevelUp(player: PlayerState, weaponTypeId: string): void {
    const proficiency = player.skills.weaponProficiencies[weaponTypeId]
    if (!proficiency) return
    if (proficiency.level >= 10) return

    const requiredExp = proficiency.level * 100
    if (proficiency.exp >= requiredExp) {
      proficiency.level += 1
      proficiency.exp -= requiredExp

      this.checkWeaponProficiencyLevelUp(player, weaponTypeId)
    }
  }

  // ============================================================
  // 物品变动
  // ============================================================

  /**
   * 执行物品变动效果
   */
  private executeItemEffect(
    player: PlayerState,
    effect: Extract<Effect, { type: EffectType.ITEM }>,
  ): string | null {
    const { itemId, changeType, quantity } = effect
    const itemConfig = this.registry.getItem(itemId)

    if (!itemConfig) {
      return `未知物品: ${itemId}`
    }

    const count = quantity ?? 1
    const itemName = itemConfig.name

    switch (changeType) {
      case ItemChangeType.ADD: {
        // 通过引擎 addItem 添加（自动处理堆叠/新实例，叠加时跳过已装备实例）
        const added = addItem(player, itemId, count)
        return `获得 ${itemName} ×${added}`
      }

      case ItemChangeType.REMOVE: {
        // 通过引擎 removeItem 移除（已装备的实例会被先卸下再移除）
        const removed = removeItem(player, itemId, count)
        if (removed <= 0) {
          return `背包中没有 ${itemName}`
        }
        return `失去 ${itemName} ×${removed}`
      }

      case ItemChangeType.EQUIP: {
        // 通过引擎装备函数（优先装备背包中已有实例；背包中没有时自动加入再装备）
        const ok = equipItemById(player, itemId)
        if (!ok) {
          return `${itemName} 无法装备`
        }
        return `装备了 ${itemName}`
      }

      case ItemChangeType.UNEQUIP: {
        // 通过引擎卸下函数（物品留在背包，仅清除装备标记）
        const ok = unequipByItemId(player, itemId)
        if (!ok) {
          return `${itemName} 并未装备`
        }
        return `卸下了 ${itemName}`
      }

      default:
        return `未知物品操作: ${changeType}`
    }
  }

  // ============================================================
  // 标志位操作
  // ============================================================

  /**
   * 执行标志位效果
   */
  private executeFlagEffect(
    player: PlayerState,
    effect: Extract<Effect, { type: EffectType.FLAG }>,
  ): string | null {
    const { flagId, operation, value } = effect

    switch (operation) {
      case 'set':
        player.flags[flagId] = value ?? true
        break

      case 'toggle': {
        const currentVal = player.flags[flagId]
        if (typeof currentVal === 'boolean') {
          player.flags[flagId] = !currentVal
        } else {
          return `标志位 ${flagId} 不是布尔类型，无法反转`
        }
        break
      }

      default:
        return `未知标志位操作: ${operation}`
    }

    return null
  }
  /**
   * 执行标志位效果
   */
  private executeFlagNumEffect(
    player: PlayerState,
    effect: Extract<Effect, { type: EffectType.FLAG_NUM }>,
  ): string | null {
    const { flagId, operation, value } = effect

    switch (operation) {
      case 'set':
        player.flagsNum[flagId] = value ?? 0
        break

      case 'add': {
        const currentNum = typeof player.flagsNum[flagId] === 'number' ? player.flagsNum[flagId] : 0
        player.flagsNum[flagId] = currentNum + (typeof value === 'number' ? value : 1)
        break
      }

      case 'subtract': {
        const currentNum = typeof player.flagsNum[flagId] === 'number' ? player.flagsNum[flagId] : 0
        player.flagsNum[flagId] = Math.max(0, currentNum - (typeof value === 'number' ? value : 1))
        break
      }

      default:
        return `未知标志位操作: ${operation}`
    }

    return null
  }

  // ============================================================
  // 技能解锁
  // ============================================================

  /**
   * 执行技能效果（解锁或锁住）
   */
  private executeSkillEffect(
    player: PlayerState,
    effect: Extract<Effect, { type: EffectType.SKILL }>,
  ): string | null {
    const { skillId, unlock } = effect

    if (unlock) {
      // 解锁技能
      if (player.skills.unlockedBattleSkillIds.includes(skillId)) {
        return null // 已解锁
      }
      player.skills.unlockedBattleSkillIds.push(skillId)

      // 获取技能名称
      const skillConfig = this.registry.getBattleSkill(skillId)
      const skillName = skillConfig ? skillConfig.name : skillId
      return `解锁技能: ${skillName}`
    } else {
      // 锁住技能
      const index = player.skills.unlockedBattleSkillIds.indexOf(skillId)
      if (index === -1) {
        return null // 未解锁
      }
      player.skills.unlockedBattleSkillIds.splice(index, 1)
      return `失去技能: ${skillId}`
    }
  }

  // ============================================================
  // 配方解锁
  // ============================================================

  /**
   * 执行配方效果（解锁或锁住）
   */
  private executeRecipeEffect(
    player: PlayerState,
    effect: Extract<Effect, { type: EffectType.RECIPE }>,
  ): string | null {
    const { recipeId, recipeType, unlock } = effect

    // 根据配方类型选择对应的已解锁配方列表
    let recipeList: string[] | null = null

    switch (recipeType) {
      case 'craft':
        recipeList = player.unlockedRecipes.craftRecipes
        break
      case 'cook':
        recipeList = player.unlockedRecipes.cookRecipes
        break
      case 'build':
        recipeList = player.unlockedRecipes.buildRecipes
        break
    }

    if (!recipeList) return `未知配方类型: ${recipeType}`

    if (unlock) {
      if (recipeList.includes(recipeId)) return null // 已解锁
      recipeList.push(recipeId)
      return `解锁配方: ${recipeId}`
    } else {
      const index = recipeList.indexOf(recipeId)
      if (index === -1) return null // 未解锁
      recipeList.splice(index, 1)
      return `失去配方: ${recipeId}`
    }
  }

  // ============================================================
  // 获得经验
  // ============================================================

  /**
   * 执行获得经验效果（公开方法，供 crafting 等模块调用）
   */
  executeGainExpEffect(
    player: PlayerState,
    effect: Extract<Effect, { type: EffectType.GAIN_EXP }>,
  ): string | null {
    const { target, targetId, amount } = effect

    switch (target) {
      case 'weaponProficiency': {
        if (!player.skills.weaponProficiencies[targetId]) {
          player.skills.weaponProficiencies[targetId] = { level: 0, exp: 0 }
        }
        player.skills.weaponProficiencies[targetId].exp += amount
        this.checkWeaponProficiencyLevelUp(player, targetId)
        return `获得 ${targetId} 熟练度 +${amount}`
      }

      case 'attribute': {
        // 基础属性经验（仅在 4 个可成长属性上结算并触发变动通知）
        const attrKey: GrowthAttributeKey | null =
          targetId === 'strength' ||
          targetId === 'agility' ||
          targetId === 'intelligence' ||
          targetId === 'constitution'
            ? targetId
            : null
        if (attrKey) {
          const oldValue = player.attributes[attrKey]
          const expKey = `${attrKey}Exp` as const
          player.attributes[expKey] += amount
          this.checkAttributeLevelUp(player, attrKey)
          const newValue = player.attributes[attrKey]
          notifyAttributeChanged({
            attribute: attrKey,
            expDelta: amount,
            oldValue,
            newValue,
            levelUp: newValue > oldValue,
          })
        }
        return `获得 ${targetId} 经验 +${amount}`
      }

      default:
        return `未知经验目标: ${target}`
    }
  }
}

/**
 * 全局效果解析器单例
 */
let effectResolver: EffectResolver | null = null

export function getEffectResolver(): EffectResolver {
  if (!effectResolver) {
    effectResolver = new EffectResolver()
  }
  return effectResolver
}
