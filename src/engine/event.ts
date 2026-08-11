// src/engine/event.ts
// 事件引擎：条件判定、选项过滤、帧选择

import type { PlayerState } from '@/types/player'
import type { GameEvent, EventFrame, EventOption, EventTextVariation } from '@/types/event'
import type { Condition, Conditions, ConditionTarget } from '@/types/effect'
import { ConditionTargetType, ComparisonOperator, LogicOperator } from '@/types/effect'
import { Season, SeasonPhase } from '@/types/seasonWeather'
import { getRegistry } from './registry'
import { calcCarryWeightRate } from './formula'
// ============================================================
// 条件评估器
// ============================================================

/**
 * 评估一个条件是否满足
 *
 * @param condition - 条件对象（可为嵌套逻辑条件）
 * @param player - 当前玩家状态
 * @returns 条件是否满足
 */
export function evaluateCondition(condition: Condition | undefined, player: PlayerState): boolean {
  // 无条件的条件视为满足
  if (!condition) return true

  // 如果有逻辑运算符，处理子条件
  if (condition.logic) {
    const subConditions = condition.subConditions ?? []

    switch (condition.logic) {
      case LogicOperator.AND:
        return subConditions.every((sub) => evaluateCondition(sub, player))

      case LogicOperator.OR:
        return subConditions.some((sub) => evaluateCondition(sub, player))

      case LogicOperator.NOT:
        // NOT 作用于第一个子条件
        if (subConditions.length === 0) return false
        return !evaluateCondition(subConditions[0], player)
    }
  }

  // 叶节点条件（没有 logic，但有 target + operator + value）
  return evaluateLeafCondition(condition, player)
}

/**
 * 评估叶节点条件
 */
function evaluateLeafCondition(condition: Condition, player: PlayerState): boolean {
  const target = condition.target
  if (!target) return false

  // 获取目标当前值
  const currentValue = resolveConditionTarget(target, player)
  // console.log('currentValue', currentValue)
  // console.log('attrType', target.attributeType)
  // console.log('player', player.attributes)
  const operator = condition.operator ?? ComparisonOperator.EQUAL
  const value = condition.value
  const value2 = condition.value2

  return compareValues(currentValue, operator, value, value2)
}

/**
 * 解析条件目标，获取玩家当前状态中对应的值
 *
 * @returns 解析后的值（可为 number、string、boolean、number[] 等，undefined 表示无法解析）
 */
function resolveConditionTarget(
  target: ConditionTarget,
  player: PlayerState,
): number | string | boolean | number[] | undefined {
  const registry = getRegistry()

  switch (target.type) {
    // -------- 属性 --------
    case ConditionTargetType.ATTRIBUTE: {
      const attrType = target.attributeType
      if (!attrType) return undefined

      // 生存属性
      if (attrType === 'hp') return player.survival.hp
      if (attrType === 'satiety') return player.survival.satiety
      if (attrType === 'stamina') return player.survival.stamina
      if (attrType === 'san') return player.survival.san
      if (attrType === 'carryWeight') return player.survival.carryWeight

      // 基础属性
      if (attrType === 'strength')
        return player.attributes.strength + player.attributes.strengthModifier
      if (attrType === 'agility')
        return player.attributes.agility + player.attributes.agilityModifier
      if (attrType === 'intelligence')
        return player.attributes.intelligence + player.attributes.intelligenceModifier
      if (attrType === 'constitution')
        return player.attributes.constitution + player.attributes.constitutionModifier
      if (attrType === 'luck') return player.attributes.luck + player.attributes.luckModifier

      // 武器熟练度（需要 subType）
      if (attrType === 'weaponProficiency' && target.subType) {
        return player.skills.weaponProficiencies[target.subType]?.level ?? 0
      }

      return undefined
    }

    // -------- 标志位 --------
    case ConditionTargetType.FLAG: {
      const flagId = target.id
      if (!flagId) return undefined
      const value = player.flags[flagId]
      if (value === undefined) return undefined
      if (typeof value === 'boolean') return value
      if (typeof value === 'number') return value
      return String(value)
    }
    // -------- 标志位数值 --------
    case ConditionTargetType.FLAG_NUM: {
      const flagId = target.id
      if (!flagId) return undefined
      const value = player.flagsNum[flagId]
      if (value === undefined) return undefined
      if (typeof value === 'boolean') return value
      if (typeof value === 'number') return value
      return String(value)
    }
    // -------- 参数 --------
    case ConditionTargetType.PARAM: {
      const paramId = target.id
      if (!paramId) return undefined
      const value = player.params[paramId]
      if (value === undefined) return undefined
      return value
    }

    // -------- 物品 --------
    case ConditionTargetType.ITEM: {
      const itemId = target.id
      if (!itemId) return undefined
      // 检查背包中是否有此物品
      const totalQuantity = player.inventory
        .filter((item) => item.itemId === itemId)
        .reduce((sum, item) => sum + item.quantity, 0)
      return totalQuantity
    }

    // -------- 状态 --------
    case ConditionTargetType.STATUS: {
      const statusId = target.id
      if (!statusId) return undefined
      // 是否处于某状态
      const hasStatus = player.activeStatuses.some((s) => s.statusId === statusId)
      return hasStatus
    }

    // -------- 场景 --------
    case ConditionTargetType.SCENE: {
      const sceneId = target.id
      if (!sceneId) return undefined
      return player.currentLocation.sceneId === sceneId
    }

    // -------- 时间 --------
    case ConditionTargetType.TIME: {
      // 返回当前游戏分钟数
      return player.progress.timeMinutes
    }
    // -------- 总时间 --------
    case ConditionTargetType.ALLTIME: {
      // 返回当前游戏分钟数
      return player.progress.day * 1440 + player.progress.timeMinutes
    }

    // -------- 天气 --------
    case ConditionTargetType.WEATHER: {
      const weatherId = target.id
      if (!weatherId) return undefined
      return player.progress.weatherId === weatherId
    }

    // -------- 季节 --------
    case ConditionTargetType.SEASON: {
      const seasonId = target.id
      if (!seasonId) return undefined

      // 支持 "spring"、"summer" 等字符串，或数字 Season 枚举
      const seasonMap: Record<string, Season> = {
        spring: Season.SPRING,
        summer: Season.SUMMER,
        autumn: Season.AUTUMN,
        winter: Season.WINTER,
      }
      const targetSeason = seasonMap[seasonId.toLowerCase()]
      if (targetSeason !== undefined) {
        return player.progress.season === targetSeason
      }
      return undefined
    }

    // -------- SAN等级 --------
    case ConditionTargetType.SAN_LEVEL: {
      // 返回当前 SAN 值所在的档位编号（1-5）
      // 1: 疯狂(1-20), 2: 崩溃(21-40), 3: 动摇(41-60), 4: 不安(61-80), 5: 理性(81+)
      return getSanLevel(player.survival.san)
    }

    // -------- 腐化度 --------
    case ConditionTargetType.CORRUPTION:
      return player.progress.corruption

    // -------- 技能 --------
    case ConditionTargetType.SKILL: {
      const skillId = target.id
      if (!skillId) return undefined
      return player.skills.unlockedBattleSkillIds.includes(skillId)
    }

    // -------- 武器熟练度 --------
    case ConditionTargetType.WEAPON_PROFICIENCY: {
      const wpId = target.id
      if (!wpId) return undefined
      return player.skills.weaponProficiencies[wpId]?.level ?? 0
    }

    // -------- 配方解锁 --------
    case ConditionTargetType.RECIPE_UNLOCKED: {
      const recipeId = target.id
      if (!recipeId) return undefined
      const allRecipes = [
        ...player.unlockedRecipes.craftRecipes,
        ...player.unlockedRecipes.cookRecipes,
        ...player.unlockedRecipes.buildRecipes,
      ]
      return allRecipes.includes(recipeId)
    }

    // -------- 金币 --------
    case ConditionTargetType.PLAYER_GOLD:
      return player.gold

    // -------- 负重率 --------
    case ConditionTargetType.CARRY_WEIGHT_RATE:
      return calcCarryWeightRate(player.survival.carryWeight, player.survival.maxCarryWeight)

    default:
      return undefined
  }
}

/**
 * 获取 SAN 值等级
 * 1: 疯狂(1-20), 2: 崩溃(21-40), 3: 动摇(41-60), 4: 不安(61-80), 5: 理性(81+)
 */
export function getSanLevel(san: number): number {
  if (san <= 0) return 0
  if (san <= 20) return 1
  if (san <= 40) return 2
  if (san <= 60) return 3
  if (san <= 80) return 4
  return 5
}

// ============================================================
// 比较函数
// ============================================================

/**
 * 比较两个值
 * 支持 number、string、boolean 类型的比较
 */
function compareValues(
  current: number | string | boolean | number[] | undefined,
  operator: ComparisonOperator,
  value: number | string | boolean | number[] | undefined,
  value2?: number,
): boolean {
  // 处理 undefined
  if (current === undefined) return false

  switch (operator) {
    case ComparisonOperator.EQUAL:
      return current === value

    case ComparisonOperator.NOT_EQUAL:
      return current !== value

    case ComparisonOperator.GREATER:
      if (typeof current !== 'number' || typeof value !== 'number') return false
      return current > value

    case ComparisonOperator.GREATER_EQUAL:
      if (typeof current !== 'number' || typeof value !== 'number') return false
      return current >= value

    case ComparisonOperator.LESS:
      if (typeof current !== 'number' || typeof value !== 'number') return false
      return current < value

    case ComparisonOperator.LESS_EQUAL:
      if (typeof current !== 'number' || typeof value !== 'number') return false
      return current <= value

    case ComparisonOperator.BETWEEN:
      if (typeof current !== 'number' || typeof value !== 'number' || value2 === undefined)
        return false
      return current >= value && current <= value2

    case ComparisonOperator.IN:
      // current 在 value 数组中
      if (!Array.isArray(value)) return false
      return value.includes(current as never)

    case ComparisonOperator.NOT_IN:
      if (!Array.isArray(value)) return false
      return !value.includes(current as never)

    case ComparisonOperator.EXISTS:
      // current 值不是 undefined/null/0/false/空数组
      if (current === undefined || current === null) return false
      if (typeof current === 'boolean') return current
      if (typeof current === 'number') return current > 0
      if (Array.isArray(current)) return current.length > 0
      if (typeof current === 'string') return current.length > 0
      return true

    case ComparisonOperator.NOT_EXISTS:
      if (current === undefined || current === null) return true
      if (typeof current === 'boolean') return !current
      if (typeof current === 'number') return current <= 0
      if (Array.isArray(current)) return current.length === 0
      if (typeof current === 'string') return current.length === 0
      return false

    default:
      return false
  }
}

// ============================================================
// 事件帧选择
// ============================================================

/**
 * 统一评估可见性/可用性条件（Conditions）
 * 依次判断：
 *  1. flag：所有标志位必须为 true（全部满足才显示）
 *  2. hideFlag：任一标志位为 true 即隐藏
 *  3. condition：复杂条件表达式
 *
 * @param conditions - 条件集合（可为空，空视为满足）
 * @param player - 当前玩家状态
 * @returns 条件是否满足
 */
export function evaluateConditions(
  conditions: Conditions | undefined,
  player: PlayerState,
): boolean {
  if (!conditions) return true

  if (conditions.flag && !conditions.flag.every((flag) => player.flags[flag] === true)) {
    return false
  }

  if (conditions.hideFlag && conditions.hideFlag.some((flag) => player.flags[flag] === true)) {
    return false
  }

  if (!evaluateCondition(conditions.condition, player)) {
    return false
  }

  return true
}

/**
 * 从事件帧列表中获取应显示的帧
 * @param frames - 事件帧列表（按数组顺序，即配置书写顺序）
 * @param player - 当前玩家状态
 * @returns 找到的帧，或 undefined（无满足条件的帧）
 */
export function findFirstVisibleFrame(
  frames: EventFrame[],
  player: PlayerState,
): EventFrame | undefined {
  return frames.find((frame) => evaluateConditions(frame.displayCondition, player))
}

/**
 * 获取帧中所有可见选项
 * 根据选项的 displayCondition 过滤
 *
 * @param frame - 当前事件帧
 * @param player - 当前玩家状态
 * @returns 可见选项列表（按 displayPriority 降序排列）
 */
export function getVisibleOptions(frame: EventFrame, player: PlayerState): EventOption[] {
  return frame.options.filter((option) => {
    // 检查 displayCondition
    if (!evaluateConditions(option.displayCondition, player)) {
      return false
    }
    // 检查 isOneTime：若已选过则隐藏
    if (option.isOneTime && option.usedFlag) {
      if (player.flags[option.usedFlag]) {
        return false
      }
    }
    return true
  })
}

/**
 * 获取帧中所有可见的文本变体
 * 根据变体的 displayCondition 过滤
 *
 * @param frame - 当前事件帧
 * @param player - 当前玩家状态
 * @returns 可见变体列表（按原顺序）
 */
export function getVisibleVariations(frame: EventFrame, player: PlayerState): EventTextVariation[] {
  if (!frame.textVariations || frame.textVariations.length === 0) return []

  return frame.textVariations.filter((v) => evaluateConditions(v.displayCondition, player))
}

/**
 * 判断选项是否可用
 * 根据选项的 availableCondition 判断
 *
 * @param option - 事件选项
 * @param player - 当前玩家状态
 * @returns 是否可用
 */
export function isOptionAvailable(option: EventOption, player: PlayerState): boolean {
  return evaluateConditions(option.availableCondition, player)
}

/**
 * 获取事件选项的结果类型图标（显示在按钮名称后）
 * 优先级：条件判断 > 掷骰判定 > 概率判断（理论上同一选项只会出现一种）
 *
 * @param option - 事件选项
 * @returns 图标字符；直接执行（results）时返回空字符串
 */
export function getOptionResultIcon(option: EventOption): string {
  if (option.conditionResult) return '⚖️'
  if (option.rollResult) return '🎲'
  if (option.probabilityResult) return '🎰'
  return ''
}

// ============================================================
// 事件入口校验
// ============================================================

/**
 * 判断事件是否可以触发
 * 检查事件的 triggerCondition 和 isRepeatable
 *
 * @param event - 事件配置
 * @param player - 当前玩家状态
 * @returns 是否可以触发
 */
export function canTriggerEvent(event: GameEvent, player: PlayerState): boolean {
  // 检查是否已经触发过（非重复事件）
  if (!event.isRepeatable && event.triggeredFlag) {
    if (player.flags[event.triggeredFlag]) {
      return false
    }
  }

  return true
}
