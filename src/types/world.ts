import type { Condition } from './effect'

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter',
}

export enum SeasonPhase {
  EARLY = 'early',
  MID = 'mid',
  LATE = 'late',
}

export enum Weather {
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  OVERCAST = 'overcast',
  RAINY = 'rainy',
  SNOWY = 'snowy',
  STORM = 'storm',
  HEAVY_RAIN = 'heavyRain',
  HEAVY_SNOW = 'heavySnow',
  FOG = 'fog',
  DUST = 'dust',
  THUNDERSTORM = 'thunderstorm',
  ACID_RAIN = 'acidRain',
  BLOOD_RAIN = 'bloodRain',
}

export enum TimeOfDay {
  MIDNIGHT = 'midnight',
  EARLY_MORNING = 'earlyMorning',
  DAWN = 'dawn',
  MORNING = 'morning',
  NOON = 'noon',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
}

export interface WorldState {
  time: GameTime
  season: Season
  seasonPhase: SeasonPhase
  weather: Weather
  corruptionLevel: number
  visibility: number
  temperature: number
  dayCount: number
}

export interface GameTime {
  day: number
  hour: number
  minute: number
}

export interface WeatherTransition {
  from: Weather
  to: Weather
  probability: number
}

export interface SeasonConfig {
  season: Season
  phase: SeasonPhase
  baseTemperature: number
  weatherProbabilities: Record<Weather, number>
}

export interface WeatherConfig {
  weather: Weather
  temperatureModifier: number
  visibility: number
  description: string
  isCorrupted?: boolean
  corruptionChance?: number
}

export interface WorldEvent {
  id: string
  name: string
  description: string
  triggerCondition: Condition
  probability: number
  effects?: WorldEventEffect[]
  isRecurring?: boolean
  cooldownDays?: number
}

export interface WorldEventEffect {
  type: 'weather' | 'temperature' | 'corruption' | 'spawnEnemy' | 'modifyScene'
  value?: number
  targetId?: string
}

export interface CorruptionEffect {
  threshold: number
  effects: CorruptionEffectDetail[]
}

export interface CorruptionEffectDetail {
  type: 'enemySpawnRate' | 'eventProbability' | 'cropYield' | 'fishQuality' | 'sanDrain'
  value: number
  description: string
}

export interface TemperatureConfig {
  comfortableRange: { min: number; max: number }
  coldThreshold: number
  hotThreshold: number
  freezingThreshold: number
  scorchingThreshold: number
}

export interface DayCycle {
  timeOfDay: TimeOfDay
  hours: { start: number; end: number }
  effects?: DayCycleEffect[]
}

export interface DayCycleEffect {
  type: 'staminaRecovery' | 'staminaCost' | 'sleepEfficiency'
  modifier: number
}

export interface WorldSaveData {
  worldState: WorldState
  timestamp: number
  gameVersion: string
}