// src/engine/world.ts
// 世界模拟器：时间推进、天气变化、环境温度计算、被动效果（饥饿/恢复/温度影响）

import type { PlayerState } from '@/types/player'
import type { Scene, SubScene } from '@/types/scene'
import { Season, SeasonPhase } from '@/types/seasonWeather'
import { getRegistry } from './registry'

// ============================================================
// 游戏时间常量
// ============================================================

/** 每天的游戏分钟数 */
const MINUTES_PER_DAY = 1440

/** 每个季节阶段持续天数 */
const DAYS_PER_PHASE = 10

/** 每个季节的阶段数（初、盛、末） */
const PHASES_PER_SEASON = 3

// ============================================================
// 被动效果速率常量（以小时为基准，按分钟换算）
// ============================================================

/** 饱食度自然损失速率（每小时） */
const SATIETY_LOSS_RATE_HOURLY = 5
/** 体质自然恢复速率系数（每小时每点体质） */
const HP_RECOVERY_PER_CON_HOURLY = 0.1
/** 体力自然恢复速率（每小时） */
const STAMINA_RECOVERY_HOURLY = 10
/** 适宜温度范围低值（无修正） */
const BASE_COMFORT_LOW = 10
/** 适宜温度范围高值（无修正） */
const BASE_COMFORT_HIGH = 25

/** 寒冷/炎热时生命值损失比例（每小时） */
const TEMP_DAMAGE_HOURLY = 0.05 // 5% maxHp
/** 严寒/酷热时生命值损失比例（每小时） */
const EXTREME_TEMP_DAMAGE_HOURLY = 0.1 // 10% maxHp
/** 温度异常时SAN损失（每小时） */
const TEMP_SAN_LOSS_HOURLY = 1
/** 饥饿时生命值损失比例（每小时） */
const STARVATION_HP_HOURLY = 0.05 // 5% maxHp
/** 饥饿时SAN损失速率（每小时） */
const STARVATION_SAN_HOURLY = 1

// ============================================================
// 辅助函数：根据索引获取枚举值
// ============================================================

/**
 * 根据索引获取季节阶段
 * @param index - 0=EARLY, 1=MID, 2=LATE
 */
function resolveSeasonPhase(index: number): SeasonPhase {
  if (index === 0) return SeasonPhase.EARLY
  if (index === 1) return SeasonPhase.MID
  return SeasonPhase.LATE
}

/**
 * 根据索引获取季节
 * @param index - 0=SPRING, 1=SUMMER, 2=AUTUMN, 3=WINTER（支持取模）
 */
function resolveSeason(index: number): Season {
  const i = index % 4
  if (i === 0) return Season.SPRING
  if (i === 1) return Season.SUMMER
  if (i === 2) return Season.AUTUMN
  return Season.WINTER
}

// ============================================================
// 类型定义
// ============================================================

/** 世界更新结果 */
export interface WorldUpdateResult {
  /** 经过的游戏分钟数 */
  elapsedMinutes: number
  /** 是否跨天 */
  dayChanged: boolean
  /** 新的天数（仅跨天时有值） */
  newDay?: number
  /** 天气是否改变 */
  weatherChanged: boolean
  /** 新天气ID（仅天气改变时有值） */
  newWeatherId?: string
  /** 季节阶段是否改变 */
  seasonPhaseChanged: boolean
  /** 季节是否改变 */
  seasonChanged: boolean
  /** 新季节（仅季节改变时有值） */
  newSeason?: Season
  /** 新季节阶段（仅季节阶段改变时有值） */
  newSeasonPhase?: SeasonPhase
  /** 当前环境温度 */
  currentTemperature: number
  /** 被动效果日志列表 */
  logs: string[]
}

// ============================================================
// 天气类型分类与转移矩阵
// ============================================================

/** 天气转移分类 */
const WEATHER_CATEGORIES = [
  'sunny',
  'cloudy',
  'overcast',
  'rain_snow',
  'storm_blizzard',
  'fog_dust',
  'thunderstorm',
] as const
type WeatherCategory = (typeof WEATHER_CATEGORIES)[number]

/**
 * 天气转移概率矩阵
 * 行：当前天气分类 → 列：新天气分类
 * 概率累计值为1，即每行之和为1
 */
const WEATHER_TRANSITION_MATRIX: Record<WeatherCategory, Record<WeatherCategory, number>> = {
  sunny: {
    sunny: 0.5,
    cloudy: 0.3,
    overcast: 0.15,
    rain_snow: 0.03,
    storm_blizzard: 0.01,
    fog_dust: 0.01,
    thunderstorm: 0.0,
  },
  cloudy: {
    sunny: 0.3,
    cloudy: 0.3,
    overcast: 0.3,
    rain_snow: 0.05,
    storm_blizzard: 0.04,
    fog_dust: 0.01,
    thunderstorm: 0.0,
  },
  overcast: {
    sunny: 0.2,
    cloudy: 0.3,
    overcast: 0.2,
    rain_snow: 0.2,
    storm_blizzard: 0.05,
    fog_dust: 0.05,
    thunderstorm: 0.0,
  },
  rain_snow: {
    sunny: 0.4,
    cloudy: 0.2,
    overcast: 0.1,
    rain_snow: 0.1,
    storm_blizzard: 0.1,
    fog_dust: 0.0,
    thunderstorm: 0.1,
  },
  storm_blizzard: {
    sunny: 0.2,
    cloudy: 0.2,
    overcast: 0.1,
    rain_snow: 0.2,
    storm_blizzard: 0.1,
    fog_dust: 0.0,
    thunderstorm: 0.2,
  },
  fog_dust: {
    sunny: 0.25,
    cloudy: 0.2,
    overcast: 0.1,
    rain_snow: 0.1,
    storm_blizzard: 0.05,
    fog_dust: 0.3,
    thunderstorm: 0.0,
  },
  thunderstorm: {
    sunny: 0.4,
    cloudy: 0.1,
    overcast: 0.1,
    rain_snow: 0.1,
    storm_blizzard: 0.1,
    fog_dust: 0.0,
    thunderstorm: 0.2,
  },
}

/**
 * 根据当前天气ID确定所属分类
 */
function getWeatherCategory(weatherId: string): WeatherCategory {
  switch (weatherId) {
    case 'sunny':
      return 'sunny'
    case 'cloudy':
      return 'cloudy'
    case 'overcast':
      return 'overcast'
    case 'rain':
    case 'snow':
      return 'rain_snow'
    case 'storm':
    case 'blizzard':
      return 'storm_blizzard'
    case 'fog':
    case 'dust':
      return 'fog_dust'
    case 'thunderstorm':
      return 'thunderstorm'
    case 'acid_rain':
    case 'blood_rain':
      return 'rain_snow' // 酸雨/血雨归入雨雪类
    default:
      return 'cloudy' // 兜底
  }
}

/**
 * 根据分类和当前状态确定具体天气ID
 *
 * @param category - 天气分类
 * @param temperature - 当前环境温度
 * @param corruption - 当前腐化度
 * @returns 天气ID
 */
function resolveWeatherId(
  category: WeatherCategory,
  temperature: number,
  corruption: number,
): string {
  switch (category) {
    case 'sunny':
      return 'sunny'
    case 'cloudy':
      return 'cloudy'
    case 'overcast':
      return 'overcast'
    case 'thunderstorm':
      return 'thunderstorm'

    case 'rain_snow': {
      // 腐化度≥50时概率转为酸雨/血雨
      if (corruption >= 50) {
        const roll = Math.random()
        if (roll < 0.3) {
          return corruption >= 70 ? 'blood_rain' : 'acid_rain'
        }
      }
      // 环境温度>0为雨，≤0为雪
      return temperature > 0 ? 'rain' : 'snow'
    }

    case 'storm_blizzard': {
      if (corruption >= 50 && Math.random() < 0.2) {
        return corruption >= 70 ? 'blood_rain' : 'acid_rain'
      }
      return temperature > 0 ? 'storm' : 'blizzard'
    }

    case 'fog_dust': {
      // 春季、秋季为雾，夏季、冬季为沙尘
      const season = getRegistry().getInitialSeason()
      if (season === Season.SPRING || season === Season.AUTUMN) {
        return 'fog'
      }
      return 'dust'
    }
  }
}

// ============================================================
// 核心函数
// ============================================================

/**
 * 推进游戏时间
 *
 * 处理：
 * 1. 增加游戏分钟数，处理跨天
 * 2. 处理季节阶段/季节更迭
 * 3. 在午夜0点刷新天气
 * 4. 计算当前环境温度
 * 5. 更新温暖度等级
 * 6. 执行被动效果（饱食度损失、体力恢复、生命值恢复、温度伤害、饥饿伤害）
 *
 * 此函数直接修改 player 对象内的进度和生存属性。
 *
 * @param player - 玩家状态（会被直接修改）
 * @param sceneTempModifier - 当前场景的温度影响值（subScene优先取其母场景）
 * @param elapsedMinutes - 经过的游戏分钟数
 * @returns 世界更新结果
 */
export function advanceTime(
  player: PlayerState,
  sceneTempModifier: number,
  elapsedMinutes: number,
): WorldUpdateResult {
  const registry = getRegistry()

  // 初始结果对象
  const result: WorldUpdateResult = {
    elapsedMinutes,
    dayChanged: false,
    weatherChanged: false,
    seasonPhaseChanged: false,
    seasonChanged: false,
    currentTemperature: 0,
    logs: [],
  }

  if (elapsedMinutes <= 0) {
    result.currentTemperature = calculateTemperature(player, sceneTempModifier)
    return result
  }

  // 记录原天数，用于检测跨天
  const oldDay = player.progress.day

  // 1. 推进时间
  const newTimeMinutes = player.progress.timeMinutes + elapsedMinutes
  const dayIncrease = Math.floor(newTimeMinutes / MINUTES_PER_DAY)
  const remainingMinutes = newTimeMinutes % MINUTES_PER_DAY

  player.progress.timeMinutes = remainingMinutes
  player.progress.day += dayIncrease

  // 检测跨天
  if (dayIncrease > 0) {
    result.dayChanged = true
    result.newDay = player.progress.day

    // 更新总生存天数
    player.progress.totalDaysSurvived += dayIncrease

    // 2. 处理季节阶段/季节更迭
    const seasonUpdateResult = updateSeason(player, oldDay)
    if (seasonUpdateResult.seasonPhaseChanged) {
      result.seasonPhaseChanged = true
      result.newSeasonPhase = seasonUpdateResult.newSeasonPhase
    }
    if (seasonUpdateResult.seasonChanged) {
      result.seasonChanged = true
      result.newSeason = seasonUpdateResult.newSeason
    }

    // 3. 每次跨天（午夜0点）刷新天气
    const weatherUpdateResult = updateWeather(player)
    if (weatherUpdateResult.weatherChanged) {
      result.weatherChanged = true
      result.newWeatherId = weatherUpdateResult.newWeatherId
    }
  }

  // 4. 计算当前环境温度
  result.currentTemperature = calculateTemperature(player, sceneTempModifier)

  // 5. 更新温暖度等级
  updateWarmthLevel(player, result.currentTemperature)

  // 6. 执行被动效果
  const passiveLogs = applyPassiveEffects(player, elapsedMinutes)
  result.logs = passiveLogs

  return result
}

// ============================================================
// 季节管理
// ============================================================

/**
 * 处理季节阶段与季节更迭
 * 每 phaseDurationDays 天推进一个季节阶段，每3个阶段换一个季节。
 * 直接修改 player.progress 中的 season 和 seasonPhase。
 *
 * @returns 季节更新结果
 */
function updateSeason(
  player: PlayerState,
  oldDay: number,
): {
  seasonPhaseChanged: boolean
  newSeasonPhase?: SeasonPhase
  seasonChanged: boolean
  newSeason?: Season
} {
  const registry = getRegistry()
  const currentSeasonConfig = registry.getSeason(player.progress.season)
  const phaseDuration = currentSeasonConfig.phaseDurationDays

  // 计算旧天数所属的阶段索引和季节阶段
  const oldPhaseIndex = Math.floor((oldDay - 1) / phaseDuration)
  const newPhaseIndex = Math.floor((player.progress.day - 1) / phaseDuration)

  const result = {
    seasonPhaseChanged: false,
    newSeasonPhase: undefined as SeasonPhase | undefined,
    seasonChanged: false,
    newSeason: undefined as Season | undefined,
  }

  // 如果阶段索引不变，说明没有季节变化
  if (oldPhaseIndex === newPhaseIndex) {
    return result
  }

  // 判断是否跨越了整个季节（3个阶段）
  const totalOldPhase = oldPhaseIndex
  const totalNewPhase = newPhaseIndex

  // 确定当前季节在季节轮换顺序中的索引
  const seasonOrder: Season[] = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]

  const currentSeasonIndex = seasonOrder.indexOf(player.progress.season)
  if (currentSeasonIndex === -1) return result

  // 计算经过了多少个阶段
  const phasesElapsed = totalNewPhase - totalOldPhase

  // 计算新的阶段索引（在当前季节内）
  const newLocalPhaseIndex = totalNewPhase % PHASES_PER_SEASON
  result.seasonPhaseChanged = true
  const newPhase = resolveSeasonPhase(newLocalPhaseIndex)
  result.newSeasonPhase = newPhase
  player.progress.seasonPhase = newPhase

  // 判断是否跨季节
  const seasonsElapsed = Math.floor(phasesElapsed / PHASES_PER_SEASON)
  if (seasonsElapsed > 0) {
    const newSeasonIndex = (currentSeasonIndex + seasonsElapsed) % 4
    result.seasonChanged = true
    const newSeason = resolveSeason(newSeasonIndex)
    result.newSeason = newSeason
    player.progress.season = newSeason
  }

  return result
}

// ============================================================
// 天气管理
// ============================================================

/**
 * 更新天气
 * 根据当前天气分类和概率矩阵随机选择新的天气类型。
 * 直接修改 player.progress.weatherId。
 *
 * @returns 天气更新结果
 */
function updateWeather(player: PlayerState): { weatherChanged: boolean; newWeatherId: string } {
  const currentCategory = getWeatherCategory(player.progress.weatherId)
  const transitionProbs = WEATHER_TRANSITION_MATRIX[currentCategory]

  // 根据概率选择新分类
  const roll = Math.random()
  let cumulative = 0
  let newCategory: WeatherCategory = currentCategory

  for (const cat of WEATHER_CATEGORIES) {
    cumulative += transitionProbs[cat]
    if (roll < cumulative) {
      newCategory = cat
      break
    }
  }

  // 根据当前温度确定具体天气ID
  const temperature = player.progress.season === Season.WINTER ? -10 : 20 // 估算
  const newWeatherId = resolveWeatherId(newCategory, temperature, player.progress.corruption)

  if (newWeatherId === player.progress.weatherId) {
    return { weatherChanged: false, newWeatherId: player.progress.weatherId }
  }

  player.progress.weatherId = newWeatherId
  return { weatherChanged: true, newWeatherId }
}

// ============================================================
// 温度计算
// ============================================================

/**
 * 计算当前环境温度
 *
 * 公式：环境温度 = 季节基准温度 + 天气修正 + 场景修正
 * 其中季节基准温度取当前季节阶段的值。
 *
 * @param player - 玩家状态
 * @param sceneTempModifier - 场景温度影响值
 * @returns 环境温度（摄氏度）
 */
export function calculateTemperature(player: PlayerState, sceneTempModifier: number): number {
  const registry = getRegistry()
  const seasonConfig = registry.getSeason(player.progress.season)
  const weatherConfig = registry.getWeather(player.progress.weatherId)

  // 季节基准温度
  const baseTemp = seasonConfig.baseTemperatures[player.progress.seasonPhase]

  // 天气修正
  const weatherMod = weatherConfig ? weatherConfig.temperatureModifier : 0

  // 合成
  return baseTemp + weatherMod + sceneTempModifier
}

// ============================================================
// 温暖度更新
// ============================================================

/**
 * 更新温暖度等级
 *
 * 规则：
 * - 环境温度 ∈ [舒适低值, 舒适高值] → 适宜
 * - 环境温度 < 舒适低值，差值 ≤ 10 → 寒冷
 * - 环境温度 > 舒适高值，差值 ≤ 10 → 炎热
 * - 环境温度 < 舒适低值，差值 > 10 → 严寒
 * - 环境温度 > 舒适高值，差值 > 10 → 酷热
 *
 * 直接修改 player.survival.warmthLevel。
 */
export function updateWarmthLevel(player: PlayerState, temperature: number): void {
  const comfortLow = player.survival.comfortTempLow
  const comfortHigh = player.survival.comfortTempHigh

  if (temperature >= comfortLow && temperature <= comfortHigh) {
    player.survival.warmthLevel = 'comfortable'
  } else if (temperature < comfortLow) {
    const diff = comfortLow - temperature
    player.survival.warmthLevel = diff > 10 ? 'freezing' : 'cold'
  } else {
    const diff = temperature - comfortHigh
    player.survival.warmthLevel = diff > 10 ? 'scorching' : 'hot'
  }
}

// ============================================================
// 被动效果
// ============================================================

/**
 * 执行被动效果（按经过分钟数累计）
 *
 * 效果包括：
 * 1. 生命值自然恢复
 * 2. 饱食度自然损失
 * 3. 体力自然恢复
 * 4. 温度相关生命值/SAN损失
 * 5. 饥饿相关生命值/SAN损失
 *
 * 所有效果先累计到 pending 值，当 pending ≥ 1 时刷新到实际属性。
 * 直接修改 player.survival 中的属性和 pending 累计值。
 *
 * @returns 执行日志列表
 */
function applyPassiveEffects(player: PlayerState, elapsedMinutes: number): string[] {
  const logs: string[] = []

  // 将分钟转换为小时（用于计算每小时速率的效果）
  const hours = elapsedMinutes / 60

  // ================================================================
  // 1. 生命值自然恢复
  // 公式：恢复量 = 体质 × 0.1 × 恢复速率系数 × 小时数
  // ================================================================
  const hpRecovery =
    player.attributes.constitution *
    HP_RECOVERY_PER_CON_HOURLY *
    player.attributes.coefficients.recoveryRateCoefficient *
    hours
  if (hpRecovery > 0) {
    player.survival.pendingHpChange += hpRecovery
  }

  // ================================================================
  // 2. 饱食度自然损失
  // 公式：损失量 = 5 × 饱食度损失系数 × 小时数
  // ================================================================
  const satietyLoss =
    SATIETY_LOSS_RATE_HOURLY * player.attributes.coefficients.satietyLossCoefficient * hours
  if (satietyLoss > 0) {
    player.survival.pendingSatietyChange -= satietyLoss
  }

  // ================================================================
  // 3. 体力自然恢复
  // 公式：恢复量 = (10 × 体力恢复系数 + 体力恢复修正) × 小时数
  // ================================================================
  const staminaRecovery =
    (STAMINA_RECOVERY_HOURLY * player.attributes.coefficients.staminaRecoveryCoefficient +
      player.attributes.coefficients.staminaRecoveryFix) *
    hours
  if (staminaRecovery > 0) {
    player.survival.pendingStaminaChange += staminaRecovery
  }

  // ================================================================
  // 4. 温度相关效果
  // ================================================================
  const warmthLevel = player.survival.warmthLevel

  // 寒冷/炎热：HP损失 = 5% maxHp/小时
  if (warmthLevel === 'cold' || warmthLevel === 'hot') {
    const hpLoss = EXTREME_TEMP_DAMAGE_HOURLY * 0.5 * player.survival.maxHp * hours
    // 使用 0.5 (half of extreme) 即 5% 每小时
    player.survival.pendingHpChange -= hpLoss
    player.survival.pendingSanChange -= TEMP_SAN_LOSS_HOURLY * hours
  }

  // 严寒/酷热：HP损失 = 10% maxHp/小时
  if (warmthLevel === 'freezing' || warmthLevel === 'scorching') {
    const hpLoss = EXTREME_TEMP_DAMAGE_HOURLY * player.survival.maxHp * hours
    player.survival.pendingHpChange -= hpLoss
    player.survival.pendingSanChange -= TEMP_SAN_LOSS_HOURLY * hours
  }

  // ================================================================
  // 5. 饥饿效果（饱食度为0时）
  // ================================================================
  if (Math.floor(player.survival.satiety) <= 0) {
    const starvationHpLoss = STARVATION_HP_HOURLY * player.survival.maxHp * hours
    player.survival.pendingHpChange -= starvationHpLoss
    player.survival.pendingSanChange -= STARVATION_SAN_HOURLY * hours
  }

  // ================================================================
  // 刷新 pending 值到实际属性
  // ================================================================
  flushPendingChanges(player)

  return logs
}

/**
 * 刷新各属性的 pending 累计值
 *
 * 每次刷新时，将 pending 值中 ≥1 的整数部分应用到实际属性，
 * 保留小数部分继续累计。
 */
function flushPendingChanges(player: PlayerState): void {
  const survival = player.survival

  // 生命值
  if (survival.pendingHpChange >= 1 || survival.pendingHpChange <= -1) {
    const delta = Math.trunc(survival.pendingHpChange) // 取整数部分（保留正负号）
    survival.hp = Math.max(0, Math.min(survival.maxHp, survival.hp + delta))
    survival.pendingHpChange -= delta
  }

  // 饱食度
  if (survival.pendingSatietyChange >= 1 || survival.pendingSatietyChange <= -1) {
    const delta = Math.trunc(survival.pendingSatietyChange)
    survival.satiety = Math.max(0, Math.min(survival.maxSatiety, survival.satiety + delta))
    survival.pendingSatietyChange -= delta
  }

  // 体力
  if (survival.pendingStaminaChange >= 1 || survival.pendingStaminaChange <= -1) {
    const delta = Math.trunc(survival.pendingStaminaChange)
    survival.stamina = Math.max(0, Math.min(survival.maxStamina, survival.stamina + delta))
    survival.pendingStaminaChange -= delta
  }

  // SAN
  if (survival.pendingSanChange >= 1 || survival.pendingSanChange <= -1) {
    const delta = Math.trunc(survival.pendingSanChange)
    survival.san = Math.max(0, Math.min(survival.maxSan, survival.san + delta))
    survival.pendingSanChange -= delta
  }
}

/**
 * 强制应用所有 pending 变化（用于查看状态面板时刷新显示）
 * 将所有 pending 累计值的整数部分刷新到实际属性
 */
export function flushAllPending(player: PlayerState): void {
  flushPendingChanges(player)
}
