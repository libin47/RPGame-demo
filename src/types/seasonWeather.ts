// seasonWeather.ts - 季节与天气数据结构

import type { Condition } from './effect'

// ============================================================
// 季节
// ============================================================

/**
 * 季节枚举
 */
export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter',
}

/**
 * 季节阶段
 */
export enum SeasonPhase {
  /** 初（前10天） */
  EARLY = 'early',
  /** 盛（中10天） */
  MID = 'mid',
  /** 末（后10天） */
  LATE = 'late',
}

/**
 * 季节配置
 */
export interface SeasonConfig {
  /** 季节 */
  season: Season
  /** 季节名称（显示用） */
  name: string
  /** 季节图标资源ID */
  iconId: string

  /** 各阶段的基准温度（摄氏度） */
  baseTemperatures: Record<SeasonPhase, number>

  /** 季节天数（每个阶段的天数） */
  phaseDurationDays: number

  /** 该季节可出现的天气及概率 */
  weatherPool: Record<string, number>

  /** 季节描述 */
  description: string
}

// ============================================================
// 天气
// ============================================================

/**
 * 天气配置
 */
export interface WeatherConfig {
  /** 天气唯一ID */
  id: string
  /** 天气名称（显示用） */
  name: string
  /** 天气图标资源ID */
  iconId: string

  /** 天气类型 */
  weatherType: WeatherType

  /** 环境温度修正值（叠加到季节基准温度） */
  temperatureModifier: number

  /** 能见度（0-10，0=完全不可见） */
  visibility: number

  /** 天气描述 */
  description: string

  /** 天气描述变体（根据SAN值等条件显示不同描述） */
  descriptionVariations?: WeatherDescriptionVariation[]

  /** 天气是否影响移动速度 */
  movementSpeedModifier: number

  /** 天气画面效果 */
  screenEffect?: WeatherScreenEffect
}

/**
 * 天气类型枚举
 */
export enum WeatherType {
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  OVERCAST = 'overcast',
  RAIN = 'rain',
  SNOW = 'snow',
  STORM = 'storm',
  BLIZZARD = 'blizzard',
  DUST = 'dust',
  FOG = 'fog',
  THUNDERSTORM = 'thunderstorm',
  ACID_RAIN = 'acidRain',
  BLOOD_RAIN = 'bloodRain',
}

/**
 * 天气描述变体
 */
export interface WeatherDescriptionVariation {
  /** 变体文本 */
  content: string
  /** 显示条件（如SAN值） */
  condition: Condition
}

/**
 * 天气画面效果
 */
export interface WeatherScreenEffect {
  /** 效果类型 */
  type: 'rain' | 'snow' | 'fog' | 'dust' | 'lightning' | 'none'
  /** 效果强度（0-1） */
  intensity: number
  /** 粒子效果资源ID */
  particleEffectId?: string
  /** 画面滤镜 */
  colorFilter?: string
}

// ============================================================
// 昼夜
// ============================================================

/**
 * 时间段枚举
 */
export enum TimeOfDay {
  /** 深夜 23:00-01:00 */
  LATE_NIGHT = 'lateNight',
  /** 凌晨 02:00-04:00 */
  EARLY_MORNING = 'earlyMorning',
  /** 清晨 05:00-07:00 */
  DAWN = 'dawn',
  /** 上午 08:00-12:00 */
  MORNING = 'morning',
  /** 下午 13:00-17:00 */
  AFTERNOON = 'afternoon',
  /** 傍晚 18:00-20:00 */
  DUSK = 'dusk',
  /** 夜晚 21:00-22:00 */
  NIGHT = 'night',
}

/**
 * 时间段配置
 */
export interface TimeOfDayConfig {
  /** 时间段 */
  timeOfDay: TimeOfDay
  /** 时间段名称（显示用） */
  name: string
  /** 时间段图标资源ID */
  iconId: string
  /** 开始小时（含） */
  startHour: number
  /** 结束小时（不含，如startHour=23 endHour=2表示23:00-02:00） */
  endHour: number

  /** 环境亮度（0-1，0=完全黑暗） */
  ambientLight: number
  /** 温度修正值 */
  temperatureModifier: number

  /** 睡眠恢复倍率（深夜和凌晨默认为2.0） */
  sleepRecoveryMultiplier?: number
  /** 体力消耗系数修正（深夜和凌晨默认为+0.5） */
  staminaConsumptionModifier?: number

  /** 时间段对应的UI背景色 */
  backgroundColor: string
}

// ============================================================
// 腐化度
// ============================================================

/**
 * 腐化度配置
 * 腐化度影响：敌人出现概率、事件内容、场景描述、种植钓鱼结果等
 */
export interface CorruptionConfig {
  /** 初始腐化度 */
  initialValue: number
  /** 最小值 */
  minValue: number
  /** 最大值 */
  maxValue: number

  /** 腐化度等级阈值 */
  thresholds: CorruptionThreshold[]
}

/**
 * 腐化度等级阈值
 */
export interface CorruptionThreshold {
  /** 腐化度达到此值时触发 */
  value: number
  /** 等级名称（显示用，如"轻微腐化"、"深度腐化"） */
  name: string
  /** 等级描述 */
  description: string
  /** 到达此等级时触发的效果 */
  onReachEffects?: string[]
  /** 该等级下的特殊规则 */
  rules?: CorruptionLevelRule[]
}

/**
 * 腐化度等级规则
 */
export interface CorruptionLevelRule {
  /** 规则描述 */
  description: string
  /** 影响范围 */
  affectedSystem:
    | 'enemySpawn'
    | 'eventPool'
    | 'sceneDescription'
    | 'farming'
    | 'fishing'
    | 'crafting'
    | 'sanLoss'
  /** 规则参数 */
  params: Record<string, number>
}

// ============================================================
// 全局配置注册表
// ============================================================

/**
 * 季节天气注册表
 */
export interface SeasonWeatherRegistry {
  /** 季节配置 */
  seasons: Record<Season, SeasonConfig>
  /** 天气配置 */
  weathers: Record<string, WeatherConfig>
  /** 时间段配置 */
  timeOfDayConfigs: Record<TimeOfDay, TimeOfDayConfig>
  /** 腐化度配置 */
  corruption: CorruptionConfig
  /** 当前游戏开始的初始季节 */
  initialSeason: Season
  /** 当前游戏开始的初始季节阶段 */
  initialSeasonPhase: SeasonPhase
  /** 初始天气ID */
  initialWeatherId: string
  /** 初始天数（游戏开始时的天数，通常为1） */
  initialDay: number
  /** 初始时间（游戏开始时的分钟数，如480=上午8:00） */
  initialTimeMinutes: number
}
