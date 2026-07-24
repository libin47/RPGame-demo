// src/engine/effect.ts

import type { PlayerState } from '@/types/player'
import type { EffectResult, Effect } from '@/types/effect'
import { EffectType, AttributeType, AttributeOperation, ItemChangeType } from '@/types/effect'
import { FlagOperation } from '@/types/flag'
import { getRegistry } from './registry'
import { applyStatus, removeStatus } from './status'

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

      case EffectType.SKILL:
        return this.executeSkillEffect(player, effect)

      case EffectType.RECIPE:
        return this.executeRecipeEffect(player, effect)

      case EffectType.GAIN_EXP:
        return this.executeGainExpEffect(player, effect)

      // 复合效果：递归执行子效果
      case EffectType.COMPOSITE:
        return this.executeCompositeEffect(player, effect)

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
    attribute: AttributeType,
    subType?: string,
  ): number | null {
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

      // 防御属性
      case AttributeType.SLASH_DEFENSE:
        return player.attributes.defenses.slashDefense
      case AttributeType.BLUNT_DEFENSE:
        return player.attributes.defenses.bluntDefense
      case AttributeType.RANGED_DEFENSE:
        return player.attributes.defenses.rangedDefense
      case AttributeType.POISON_DEFENSE:
        return player.attributes.defenses.poisonDefense
      case AttributeType.FIRE_DEFENSE:
        return player.attributes.defenses.fireDefense

      // 技能等级（需要 subType 指定技能ID）
      case AttributeType.SKILL_LEVEL:
        if (!subType) return null
        return player.skills.survivalSkills[subType]?.level ?? 0

      // 技能经验（需要 subType 指定技能ID）
      case AttributeType.SKILL_EXP:
        if (!subType) return null
        return player.skills.survivalSkills[subType]?.exp ?? 0

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
    attribute: AttributeType,
    subType: string | undefined,
    newValue: number,
  ): void {
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
        player.survival.san = Math.max(0, Math.min(newValue, player.survival.maxSan))
        break

      // 基础属性
      case AttributeType.STRENGTH:
        player.attributes.strength = Math.max(0, Math.min(newValue, 100))
        break
      case AttributeType.AGILITY:
        player.attributes.agility = Math.max(0, Math.min(newValue, 100))
        break
      case AttributeType.INTELLIGENCE:
        player.attributes.intelligence = Math.max(0, Math.min(newValue, 100))
        break
      case AttributeType.CONSTITUTION:
        player.attributes.constitution = Math.max(0, Math.min(newValue, 100))
        // 体质变动会影响生命值上限
        this.recalculateMaxHp(player)
        break

      // 经验值
      case AttributeType.STRENGTH_EXP:
        player.attributes.strengthExp = Math.max(0, newValue)
        this.checkAttributeLevelUp(player, 'strength')
        break
      case AttributeType.AGILITY_EXP:
        player.attributes.agilityExp = Math.max(0, newValue)
        this.checkAttributeLevelUp(player, 'agility')
        break
      case AttributeType.INTELLIGENCE_EXP:
        player.attributes.intelligenceExp = Math.max(0, newValue)
        this.checkAttributeLevelUp(player, 'intelligence')
        break
      case AttributeType.CONSTITUTION_EXP:
        player.attributes.constitutionExp = Math.max(0, newValue)
        this.checkAttributeLevelUp(player, 'constitution')
        break

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

      // 防御属性
      case AttributeType.SLASH_DEFENSE:
        player.attributes.defenses.slashDefense = Math.max(0, newValue)
        break
      case AttributeType.BLUNT_DEFENSE:
        player.attributes.defenses.bluntDefense = Math.max(0, newValue)
        break
      case AttributeType.RANGED_DEFENSE:
        player.attributes.defenses.rangedDefense = Math.max(0, newValue)
        break
      case AttributeType.POISON_DEFENSE:
        player.attributes.defenses.poisonDefense = Math.max(0, newValue)
        break
      case AttributeType.FIRE_DEFENSE:
        player.attributes.defenses.fireDefense = Math.max(0, newValue)
        break

      // 技能等级
      case AttributeType.SKILL_LEVEL:
        if (subType) {
          if (!player.skills.survivalSkills[subType]) {
            player.skills.survivalSkills[subType] = { level: 0, exp: 0 }
          }
          player.skills.survivalSkills[subType].level = Math.max(0, Math.min(newValue, 10))
        }
        break

      // 技能经验
      case AttributeType.SKILL_EXP:
        if (subType) {
          if (!player.skills.survivalSkills[subType]) {
            player.skills.survivalSkills[subType] = { level: 0, exp: 0 }
          }
          player.skills.survivalSkills[subType].exp = Math.max(0, newValue)
          this.checkSurvivalSkillLevelUp(player, subType)
        }
        break

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
   */
  private recalculateMaxHp(player: PlayerState): void {
    const oldMaxHp = player.survival.maxHp
    const newMaxHp = player.attributes.constitution * 10
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
   */
  private recalculateMaxCarryWeight(player: PlayerState): void {
    player.survival.maxCarryWeight =
      player.attributes.strength * 5 + player.attributes.coefficients.carryWeightModifier
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

    if (currentLevel >= 100) return

    const requiredExp = currentLevel * 100
    if (currentExp >= requiredExp) {
      // 升级
      player.attributes[attribute] += 1
      player.attributes[expKey] -= requiredExp

      // 体质升级需要重新计算生命值上限
      if (attribute === 'constitution') {
        this.recalculateMaxHp(player)
      }

      // 递归检查是否连续升级
      this.checkAttributeLevelUp(player, attribute)
    }
  }

  /**
   * 检查生存技能是否升级
   * 升级所需经验 = 当前等级 × 100
   */
  private checkSurvivalSkillLevelUp(player: PlayerState, skillId: string): void {
    const skill = player.skills.survivalSkills[skillId]
    if (!skill) return
    if (skill.level >= 10) return

    const requiredExp = skill.level * 100
    if (skill.exp >= requiredExp) {
      skill.level += 1
      skill.exp -= requiredExp
      this.checkSurvivalSkillLevelUp(player, skillId)
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

      // 检查是否解锁新的战斗技能
      this.checkWeaponSkillUnlock(player, weaponTypeId, proficiency.level)

      this.checkWeaponProficiencyLevelUp(player, weaponTypeId)
    }
  }

  /**
   * 检查武器熟练度提升后是否解锁新技能
   */
  private checkWeaponSkillUnlock(
    player: PlayerState,
    weaponTypeId: string,
    newLevel: number,
  ): void {
    const weaponType = this.registry.getWeaponType(weaponTypeId)
    if (!weaponType) return

    const skillsToUnlock = weaponType.skillUnlocks[newLevel]
    if (skillsToUnlock) {
      for (const skillId of skillsToUnlock) {
        if (!player.skills.unlockedBattleSkillIds.includes(skillId)) {
          player.skills.unlockedBattleSkillIds.push(skillId)
        }
      }
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
        // 查找背包中是否已有此物品（可堆叠）
        const existingItem = player.inventory.find(
          (i) => i.itemId === itemId && !this.isEquipped(player, i.instanceId),
        )

        if (existingItem && itemConfig.maxStackSize > 1) {
          // 可堆叠，增加数量
          existingItem.quantity += count
        } else {
          // 新增物品实例
          player.inventory.push({
            instanceId: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            itemId,
            quantity: count,
            durability: -1,
            acquiredTime: player.progress.day * 1440 + player.progress.timeMinutes,
          })
        }

        // 更新负重
        player.survival.carryWeight += itemConfig.weight * count

        return `获得 ${itemName} ×${count}`
      }

      case ItemChangeType.REMOVE: {
        // 从背包中移除
        const index = player.inventory.findIndex((i) => i.itemId === itemId)
        if (index === -1) {
          return `背包中没有 ${itemName}`
        }

        const targetItem = player.inventory[index]
        if (targetItem!.quantity <= count) {
          // 全部移除
          player.survival.carryWeight -= itemConfig.weight * targetItem!.quantity
          player.inventory.splice(index, 1)
        } else {
          // 减少数量
          targetItem!.quantity -= count
          player.survival.carryWeight -= itemConfig.weight * count
        }

        return `失去 ${itemName} ×${count}`
      }

      case ItemChangeType.EQUIP: {
        // 装备物品（根据物品类别自动选择装备槽位）
        const slot = this.getEquipmentSlotForItem(itemConfig)
        if (!slot) {
          return `${itemName} 无法装备`
        }

        // 如果该槽位已有装备，先卸下
        if (player.equipment[slot]) {
          player.equipment[slot] = null
        }

        player.equipment[slot] = itemId
        return `装备了 ${itemName}`
      }

      case ItemChangeType.UNEQUIP: {
        // 卸下物品
        for (const slot of Object.keys(player.equipment) as Array<keyof typeof player.equipment>) {
          if (player.equipment[slot] === itemId) {
            player.equipment[slot] = null
            return `卸下了 ${itemName}`
          }
        }
        return `${itemName} 并未装备`
      }

      default:
        return `未知物品操作: ${changeType}`
    }
  }

  /**
   * 判断物品实例是否已装备
   */
  private isEquipped(player: PlayerState, instanceId: string): boolean {
    // 简单判断：检查装备栏中是否有对应物品ID
    // 完整实现需要匹配 instanceId，此处先简化处理
    return false
  }

  /**
   * 根据物品配置获取对应的装备槽位
   */
  private getEquipmentSlotForItem(
    itemConfig: ReturnType<typeof this.registry.getItem>,
  ): keyof PlayerState['equipment'] | null {
    if (!itemConfig) return null

    // 通过检查物品类别来判断槽位
    const category = itemConfig.category

    // 武器
    if (category === 'weapon') return 'weapon'

    // 工具
    if (category === 'tool') return 'tool'

    // 防具：通过 equipmentSlot 字段判断
    if (category === 'armor' && 'equipmentSlot' in itemConfig) {
      const slot = (itemConfig as { equipmentSlot: string }).equipmentSlot
      if (slot === 'body') return 'body'
      if (slot === 'head') return 'head'
      if (slot === 'hands') return 'hands'
      if (slot === 'feet') return 'feet'
      if (slot === 'back') return 'back'
      if (slot === 'neck') return 'neck'
      if (slot === 'finger') return 'finger'
    }

    return null
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
      case FlagOperation.SET:
        player.flags[flagId] = value ?? true
        break

      case FlagOperation.TOGGLE: {
        const currentVal = player.flags[flagId]
        if (typeof currentVal === 'boolean') {
          player.flags[flagId] = !currentVal
        } else {
          return `标志位 ${flagId} 不是布尔类型，无法反转`
        }
        break
      }

      case FlagOperation.ADD: {
        const currentNum = typeof player.flags[flagId] === 'number' ? player.flags[flagId] : 0
        player.flags[flagId] = currentNum + (typeof value === 'number' ? value : 1)
        break
      }

      case FlagOperation.SUBTRACT: {
        const currentNum = typeof player.flags[flagId] === 'number' ? player.flags[flagId] : 0
        player.flags[flagId] = Math.max(0, currentNum - (typeof value === 'number' ? value : 1))
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
      case 'survivalSkill': {
        if (!player.skills.survivalSkills[targetId]) {
          player.skills.survivalSkills[targetId] = { level: 0, exp: 0 }
        }
        player.skills.survivalSkills[targetId].exp += amount
        this.checkSurvivalSkillLevelUp(player, targetId)
        return `获得 ${targetId} 经验 +${amount}`
      }

      case 'weaponProficiency': {
        if (!player.skills.weaponProficiencies[targetId]) {
          player.skills.weaponProficiencies[targetId] = { level: 0, exp: 0 }
        }
        player.skills.weaponProficiencies[targetId].exp += amount
        this.checkWeaponProficiencyLevelUp(player, targetId)
        return `获得 ${targetId} 熟练度 +${amount}`
      }

      case 'battleSkill': {
        if (!player.skills.battleSkills[targetId]) {
          player.skills.battleSkills[targetId] = { level: 0, exp: 0 }
        }
        player.skills.battleSkills[targetId].exp += amount
        return `获得技能 ${targetId} 经验 +${amount}`
      }

      case 'attribute': {
        // 基础属性经验
        switch (targetId) {
          case 'strength':
            player.attributes.strengthExp += amount
            this.checkAttributeLevelUp(player, 'strength')
            break
          case 'agility':
            player.attributes.agilityExp += amount
            this.checkAttributeLevelUp(player, 'agility')
            break
          case 'intelligence':
            player.attributes.intelligenceExp += amount
            this.checkAttributeLevelUp(player, 'intelligence')
            break
          case 'constitution':
            player.attributes.constitutionExp += amount
            this.checkAttributeLevelUp(player, 'constitution')
            break
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
