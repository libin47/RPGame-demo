// src/engine/exploration.ts
// 探索逻辑：根据条件从场景描述列表中选取合适的描述

import type { PlayerState } from '@/types/player'
import type { Scene, SubScene, SceneDescription, SceneEventEntry, SceneEvent } from '@/types/scene'
import { TimeOfDay, WeatherType } from '@/types/seasonWeather'
import { evaluateConditions } from './event'
import { weightedSelect, chance } from './dice'
import type { SceneTextVariation } from '@/types/scene'

/**
 * 从场景或子场景的描述列表中选取符合条件的描述
 *
 * 选择逻辑：
 * 1. 根据 displayCondition、环境限制、seenFlag 过滤出所有可能的描述
 * 2. 按优先级分组，取最高优先级的描述组
 * 3. 同优先级的多条之间随机权重选择（默认等权重）
 *
 * @param target - 当前场景或子场景
 * @param player - 当前玩家状态
 * @returns 选中的描述（若无满足条件的描述则返回 undefined）
 */
export function selectSceneDescription(
  target: Scene | SubScene,
  player: PlayerState,
): SceneDescription | undefined {
  const eligibleDescs = target.descriptions.filter((desc) => {
    return isSceneDescriptionEligible(desc, player)
  })

  if (eligibleDescs.length === 0) return undefined

  // 按优先级分组
  const priorityGroups = new Map<number, SceneDescription[]>()
  let maxPriority = -Infinity

  for (const desc of eligibleDescs) {
    const group = priorityGroups.get(desc.priority)
    if (group) {
      group.push(desc)
    } else {
      priorityGroups.set(desc.priority, [desc])
    }
    if (desc.priority > maxPriority) {
      maxPriority = desc.priority
    }
  }

  // 取最高优先级组
  const topGroup = priorityGroups.get(maxPriority)
  if (!topGroup) return undefined

  // 同优先级随机选取
  if (topGroup.length === 1) return topGroup[0]

  // 加权随机（按weight字段，未填则按1算）
  const weights = topGroup.map((desc) => desc.weight ?? 1)
  return weightedSelect(topGroup, weights)
}

/**
 * 判断描述条目是否满足显示条件
 * 包括：displayCondition、seenFlag、viewLimit、环境限制
 */
export function isSceneDescriptionEligible(desc: SceneDescription, player: PlayerState): boolean {
  // 已看过且是一次性描述 → 不再显示
  if (desc.isOneTime && desc.seenFlag) {
    if (player.flags[desc.seenFlag]) {
      return false
    }
  }
  // 显示条件（displayCondition 统一包含 flag/hideFlag/condition）
  if (!evaluateConditions(desc.displayCondition, player)) {
    return false
  }

  // 看过次数达到上限
  if (desc.viewLimit !== undefined && desc.viewLimit > 0 && desc.seenFlag) {
    const viewCount = (player.flagsNum[desc.seenFlag] as number) ?? 0
    if (viewCount >= desc.viewLimit) {
      return false
    }
  }

  // 时间段限制
  if (desc.timeOfDayRestriction && desc.timeOfDayRestriction.length > 0) {
    const currentTimeOfDay = getTimeOfDay(player.progress.timeMinutes)
    if (!desc.timeOfDayRestriction.includes(currentTimeOfDay)) {
      return false
    }
  }

  // 天气限制
  if (desc.weatherRestriction && desc.weatherRestriction.length > 0) {
    const weatherConfig = getWeatherTypeFromId(player.progress.weatherId)
    if (weatherConfig === null || !desc.weatherRestriction.includes(weatherConfig)) {
      return false
    }
  }

  // 季节阶段限制
  if (desc.seasonRestriction && desc.seasonRestriction.length > 0) {
    if (!desc.seasonRestriction.includes(player.progress.seasonPhase)) {
      return false
    }
  }

  // 腐化度范围
  if (desc.corruptionRange) {
    if (
      player.progress.corruption < desc.corruptionRange.min ||
      player.progress.corruption > desc.corruptionRange.max
    ) {
      return false
    }
  }

  return true
}

/**
 * 从场景描述中获取满足条件的事件入口列表
 * 对每个 eventEntry 检查 displayCondition
 *
 * @param desc - 场景描述
 * @param player - 当前玩家状态
 * @returns 可见的事件入口列表
 */
export function getVisibleEventEntries(
  desc: SceneDescription,
  player: PlayerState,
): SceneEventEntry[] {
  const entries = desc.eventEntries ?? []
  return entries.filter((entry) => evaluateConditions(entry.displayCondition, player))
}

/**
 * 获取描述文本（含文本变体支持）
 *
 * @param desc - 选中的场景描述
 * @param player - 当前玩家状态
 * @returns 最终显示的文本
 */
export function getResolvedDescriptionText(desc: SceneDescription, player: PlayerState): string {
  return resolveTextVariation(desc.textVariations, desc.text, player)
}

/**
 * 标记描述为"已看过"
 * 更新 seenFlag、viewLimit 等追踪信息
 *
 * @param desc - 场景描述
 * @param player - 当前玩家状态（会被直接修改）
 */
export function markDescriptionSeen(desc: SceneDescription, player: PlayerState): void {
  if (desc.seenFlag) {
    player.flags[desc.seenFlag] = true
  }
  if (desc.seenCountFlag) {
    const currentVal = player.flagsNum[desc.seenCountFlag]
    if (typeof currentVal === 'number') {
      player.flagsNum[desc.seenCountFlag] = (currentVal + 1) % 1000000000
    } else if (currentVal === undefined) {
      player.flagsNum[desc.seenCountFlag] = 1
    }
  }
}

/**
 * 标记描述为"已触发事件"
 * 更新 eventFlag 等追踪信息
 *
 * @param desc - 场景描述
 * @param player - 当前玩家状态（会被直接修改）
 */
export function markDescriptionEventSeen(desc: SceneDescription, player: PlayerState): void {
  if (desc.eventFlag) {
    player.flags[desc.eventFlag] = true
  }
}

/**
 * 获取场景被动事件中第一个应触发的事件
 * 依次检查每个被动事件：一次性已触发跳过 → 显示条件 → 概率命中
 * 概率为 isLucky 时叠加玩家幸运值（实际概率 = 概率 + 幸运值/100）
 *
 * @param target - 当前场景或子场景
 * @param player - 当前玩家状态
 * @returns 应触发的被动事件（无则返回 undefined）
 */
export function getScenePassiveEvent(
  target: Scene | SubScene,
  player: PlayerState,
): SceneEvent | undefined {
  const events = target.passiveEvents ?? []
  const playerLuck = player.attributes.luck + player.attributes.luckModifier
  for (const pe of events) {
    // 一次性事件已触发过 → 跳过
    if (pe.isOneTime && pe.seenFlag && player.flags[pe.seenFlag]) continue
    // 显示条件
    if (!evaluateConditions(pe.displayCondition, player)) continue
    // 概率判定（isLucky 时叠加玩家幸运值）
    const probability = pe.probability ?? 1
    const p = pe.isLucky ? probability + playerLuck / 100 : probability
    if (chance(p)) return pe
  }
  return undefined
}

/**
 * 根据分钟数返回当前时间段
 */
export function getTimeOfDay(minutes: number): TimeOfDay {
  const hour = Math.floor(minutes / 60)
  if (hour >= 23 || hour < 2) return TimeOfDay.LATE_NIGHT
  if (hour >= 2 && hour < 5) return TimeOfDay.EARLY_MORNING
  if (hour >= 5 && hour < 8) return TimeOfDay.DAWN
  if (hour >= 8 && hour < 13) return TimeOfDay.MORNING
  if (hour >= 13 && hour < 18) return TimeOfDay.AFTERNOON
  if (hour >= 18 && hour < 21) return TimeOfDay.DUSK
  return TimeOfDay.NIGHT
}

/**
 * 根据天气ID获取天气类型枚举值
 * 返回 null 表示无法识别
 */
function getWeatherTypeFromId(weatherId: string): WeatherType | null {
  if (weatherId === 'sunny') return WeatherType.SUNNY
  if (weatherId === 'cloudy') return WeatherType.CLOUDY
  if (weatherId === 'overcast') return WeatherType.OVERCAST
  if (weatherId === 'rain') return WeatherType.RAIN
  if (weatherId === 'snow') return WeatherType.SNOW
  if (weatherId === 'storm') return WeatherType.STORM
  if (weatherId === 'blizzard') return WeatherType.BLIZZARD
  if (weatherId === 'fog') return WeatherType.FOG
  if (weatherId === 'dust') return WeatherType.DUST
  if (weatherId === 'thunderstorm') return WeatherType.THUNDERSTORM
  if (weatherId === 'acid_rain') return WeatherType.ACID_RAIN
  if (weatherId === 'blood_rain') return WeatherType.BLOOD_RAIN
  return null
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
  variations: SceneTextVariation[] | undefined,
  defaultText: string,
  player: PlayerState,
): string {
  if (!variations || variations.length === 0) return defaultText

  const matched = variations.filter((v) => evaluateConditions(v.displayCondition, player))
  if (matched.length === 0) return defaultText

  // 如果matched不为空，则将matched中每一项的content拼接起来，否则返回defaultText

  return matched.map((v) => v.content).join('\n\n')
}
