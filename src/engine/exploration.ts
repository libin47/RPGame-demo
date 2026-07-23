// src/engine/exploration.ts
// 探索逻辑：根据条件从场景描述列表中选取合适的描述

import type { PlayerState } from '@/types/player'
import type { Scene, SubScene, SceneDescription, SceneEventEntry } from '@/types/scene'
import { TimeOfDay, WeatherType } from '@/types/seasonWeather'
import { evaluateCondition, resolveTextVariation } from './event'
import { weightedSelect } from './dice'

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
    return isDescriptionEligible(desc, player)
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

  // 加权随机（等权重）
  const weights = topGroup.map(() => 1)
  return weightedSelect(topGroup, weights)
}

/**
 * 判断描述条目是否满足显示条件
 * 包括：displayCondition、seenFlag、viewLimit、环境限制
 */
function isDescriptionEligible(desc: SceneDescription, player: PlayerState): boolean {
  // 已看过且是一次性描述 → 不再显示
  if (desc.isOneTime && desc.seenFlag) {
    if (player.flags[desc.seenFlag]) {
      return false
    }
  }

  // 看过次数达到上限
  if (desc.viewLimit !== undefined && desc.viewLimit > 0 && desc.seenFlag) {
    const viewCount = (player.flags[desc.seenFlag] as number) ?? 0
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

  // displayCondition
  if (!evaluateCondition(desc.displayCondition, player)) {
    return false
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
  return entries.filter((entry) => evaluateCondition(entry.displayCondition, player))
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
    const currentVal = player.flags[desc.seenFlag]
    if (typeof currentVal === 'number') {
      player.flags[desc.seenFlag] = currentVal + 1
    } else if (currentVal === undefined) {
      player.flags[desc.seenFlag] = 1
    } else {
      player.flags[desc.seenFlag] = true
    }
  }
}

/**
 * 判断场景描述是否需要自动触发事件
 *
 * @param desc - 场景描述
 * @param player - 当前玩家状态
 * @returns 是否需要自动触发及目标事件入口 key
 */
export function checkAutoTrigger(
  desc: SceneDescription,
  player: PlayerState,
): { shouldTrigger: boolean; eventKey?: string } {
  if (!desc.isAutoTrigger) {
    return { shouldTrigger: false }
  }

  // 概率判定
  const probability = desc.autoTriggerProbability ?? 1
  if (Math.random() >= probability) {
    return { shouldTrigger: false }
  }

  const eventKey = desc.autoTriggerEventKey || desc.eventEntries?.[0]?.key
  return { shouldTrigger: true, eventKey }
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
