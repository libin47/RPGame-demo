// src/engine/event.ts
// 事件引擎：条件判定、选项过滤、帧选择

import type { PlayerState } from '@/types/player'
import type { GameEvent, EventFrame, EventOption } from '@/types/event'
import type { Condition, ConditionTarget } from '@/types/effect'
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

      // 技能等级（需要 subType）
      if (attrType === 'skillLevel' && target.subType) {
        return player.skills.survivalSkills[target.subType]?.level ?? 0
      }

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
function getSanLevel(san: number): number {
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
 * 从事件帧列表中获取应显示的帧
 * 根据 displayCondition 过滤，返回第一个满足条件的帧
 *
 * @param frames - 事件帧列表（按 order 排序）
 * @param player - 当前玩家状态
 * @returns 找到的帧，或 undefined（无满足条件的帧）
 */
export function findFirstVisibleFrame(
  frames: EventFrame[],
  player: PlayerState,
): EventFrame | undefined {
  const sorted = [...frames].sort((a, b) => a.order - b.order)
  return sorted.find((frame) => evaluateCondition(frame.displayCondition, player))
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
  return frame.options
    .filter((option) => {
      // 检查 displayCondition
      if (!evaluateCondition(option.displayCondition, player)) {
        return false
      }
      // 检查 isOneTime：若已选过则隐藏
      if (option.isOneTime && option.selectedFlag) {
        if (player.flags[option.selectedFlag]) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0))
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
  return evaluateCondition(option.availableCondition, player)
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

/**
 * 获取场景描述文本变体
 * 搜索符合条件的第一条变体，如果都不满足则返回原始文本
 *
 * @param variations - 文本变体列表
 * @param defaultText - 默认文本
 * @param player - 当前玩家状态
 * @returns 应显示的文本
 */
export function resolveTextVariation(
  variations: { content: string; condition: Condition }[] | undefined,
  defaultText: string,
  player: PlayerState,
): string {
  if (!variations || variations.length === 0) return defaultText

  const matched = variations.find((v) => evaluateCondition(v.condition, player))
  return matched ? matched.content : defaultText
}
