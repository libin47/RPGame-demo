// player.ts - 玩家运行时状态数据结构

import type { FlagValue } from './flag'
import type { Season, SeasonPhase } from './seasonWeather'

// ============================================================
// 玩家运行时状态
// ============================================================

/**
 * 玩家运行时状态
 * 存档的核心数据，记录玩家的一切动态信息。
 * 与配置数据分离——配置定义"游戏中有哪些东西"，运行时记录"玩家当前是什么状态"。
 */
export interface PlayerState {
  /** 玩家唯一标识 */
  id: string
  /** 玩家名称 */
  name: string
  /** 所选职业ID */
  classId: string
  /** 所选背景故事ID（可选） */
  backgroundId?: string

  // ============================================================
  // 生存属性
  // ============================================================

  survival: PlayerSurvival

  // ============================================================
  // 基础属性
  // ============================================================

  attributes: PlayerAttributes

  // ============================================================
  // 技能
  // ============================================================

  skills: PlayerSkills

  // ============================================================
  // 装备与背包
  // ============================================================

  /** 当前装备 */
  equipment: PlayerEquipment

  /** 背包物品列表 */
  inventory: PlayerInventoryItem[]

  // ============================================================
  // 状态
  // ============================================================

  /** 当前激活的异常状态 */
  activeStatuses: ActiveStatus[]

  // ============================================================
  // 配方解锁
  // ============================================================

  unlockedRecipes: PlayerUnlockedRecipes

  // ============================================================
  // 位置
  // ============================================================

  currentLocation: PlayerLocation

  // ============================================================
  // 游戏进度
  // ============================================================

  progress: PlayerProgress

  // ============================================================
  // 标志位
  // ============================================================

  /** 运行时标志位（当前值） */
  flags: Record<string, FlagValue>

  // ============================================================
  // 经济
  // ============================================================

  /** 金币数量 */
  gold: number

  // ============================================================
  // 统计
  // ============================================================

  statistics: PlayerStatistics
}

// ============================================================
// 生存属性
// ============================================================

/**
 * 玩家生存属性
 */
export interface PlayerSurvival {
  /** 当前生命值 */
  hp: number
  /** 生命值上限 */
  maxHp: number

  /** 当前饱食度 */
  satiety: number
  /** 饱食度上限 */
  maxSatiety: number

  /** 当前体力值 */
  stamina: number
  /** 体力值上限 */
  maxStamina: number

  /** 当前SAN值 */
  san: number
  /** SAN值上限 */
  maxSan: number

  /** 当前负重（kg） */
  carryWeight: number
  /** 最大负重（kg） */
  maxCarryWeight: number

  /** 当前温暖度等级 */
  warmthLevel: 'comfortable' | 'cold' | 'hot' | 'freezing' | 'scorching'
  /** 适宜温度低值（低于此温度进入寒冷） */
  comfortTempLow: number
  /** 适宜温度高值（高于此温度进入炎热） */
  comfortTempHigh: number
  // ============================================================
  // 小数累计值（策划书要求：变动值<1时累计，>=1时更新）
  // ============================================================

  /** HP变动累计值 */
  pendingHpChange: number
  /** 饱食度变动累计值 */
  pendingSatietyChange: number
  /** 体力变动累计值 */
  pendingStaminaChange: number
  /** SAN变动累计值 */
  pendingSanChange: number
}

// ============================================================
// 基础属性
// ============================================================

/**
 * 玩家基础属性
 */
export interface PlayerAttributes {
  // 基础值（永久，通过经验升级）
  strength: number
  agility: number
  intelligence: number
  constitution: number

  // 经验值
  strengthExp: number
  agilityExp: number
  intelligenceExp: number
  constitutionExp: number

  // 临时修正（来自装备、状态、效果等，可为负数）
  strengthModifier: number
  agilityModifier: number
  intelligenceModifier: number
  constitutionModifier: number

  // 防御属性（基础值 + 装备加成 + 状态修正）
  defenses: PlayerDefenses

  // 系数属性（来自装备、状态、被动技能等）
  coefficients: PlayerCoefficients
}

/**
 * 玩家防御属性
 */
export interface PlayerDefenses {
  slashDefense: number
  bluntDefense: number
  rangedDefense: number
  poisonDefense: number
  fireDefense: number
}

/**
 * 玩家系数属性
 * 策划书中定义的各类系数，影响生存属性的计算
 */
export interface PlayerCoefficients {
  /** 生命值恢复速率系数（默认1） */
  recoveryRateCoefficient: number
  /** 饱食度上限系数（默认1） */
  satietyUpperLimitCoefficient: number
  /** 饱食度损失系数（默认1） */
  satietyLossCoefficient: number
  /** 体力消耗系数（默认1） */
  staminaConsumptionCoefficient: number
  /** 体力恢复系数（默认1） */
  staminaRecoveryCoefficient: number
  /** 体力恢复修正值（默认0） */
  staminaRecoveryFix: number
  /** SAN修正指数（默认0） */
  sanModifier: number
  /** 适宜温度低值修正 */
  temperatureLowModifier: number
  /** 适宜温度高值修正 */
  temperatureHighModifier: number
  /** 负重修正值（kg） */
  carryWeightModifier: number
  /** SAN值保护系数（0-1，减少SAN损失比例） */
  sanProtection: number
}

// ============================================================
// 技能
// ============================================================

/**
 * 玩家技能状态
 */
export interface PlayerSkills {
  /** 生存技能等级 */
  survivalSkills: Record<string, PlayerSkillLevel>

  /** 武器熟练度 */
  weaponProficiencies: Record<string, PlayerSkillLevel>

  /** 战斗技能等级 */
  battleSkills: Record<string, PlayerSkillLevel>

  /** 已解锁的战斗技能ID列表 */
  unlockedBattleSkillIds: string[]

  /** 已习得的被动技能ID列表 */
  passiveSkillIds: string[]
}

/**
 * 技能等级（含经验）
 */
export interface PlayerSkillLevel {
  /** 当前等级 */
  level: number
  /** 当前经验值 */
  exp: number
}

// ============================================================
// 装备与背包
// ============================================================

/**
 * 玩家装备
 * 键为装备槽位，值为装备的物品ID（null表示空）
 */
export interface PlayerEquipment {
  weapon: string | null
  offHand: string | null
  head: string | null
  body: string | null
  hands: string | null
  feet: string | null
  back: string | null
  neck: string | null
  finger: string | null
  tool: string | null
  light: string | null
}

/**
 * 背包物品实例
 * 物品在背包中的运行时状态（配置中的物品属性 + 运行时特有字段）
 */
export interface PlayerInventoryItem {
  /** 物品唯一实例ID（用于追踪同一物品的不同实例，如两把耐久不同的铁剑） */
  instanceId: string
  /** 物品配置ID */
  itemId: string
  /** 数量（可堆叠物品） */
  quantity: number
  /** 当前耐久度（有耐久度的物品，-1表示无耐久度系统） */
  durability: number
  /** 获得时间（游戏内分钟数，用于新鲜度等计算） */
  acquiredTime: number
}

// ============================================================
// 异常状态
// ============================================================

/**
 * 激活的异常状态实例
 * 配置模板（StatusConfig）+ 运行时数据
 */
export interface ActiveStatus {
  /** 状态模板ID */
  statusId: string
  /** 剩余持续时间值 */
  remainingDuration: number
  /** 持续时间单位 */
  durationUnit: 'turn' | 'minute' | 'hour' | 'permanent'
  /** 当前层数 */
  stackCount: number
  /** 施加来源描述 */
  sourceId?: string
  /** 施加时的游戏时间（用于计算经过时间） */
  appliedTime: number
  /** 状态参数覆盖 */
  params?: Record<string, number>
}

// ============================================================
// 配方
// ============================================================

/**
 * 已解锁的配方
 */
export interface PlayerUnlockedRecipes {
  /** 已解锁的制作配方ID列表 */
  craftRecipes: string[]
  /** 已解锁的烹饪配方ID列表 */
  cookRecipes: string[]
  /** 已解锁的建造配方ID列表 */
  buildRecipes: string[]
  /** 已解锁的修复配方ID列表 */
  repairRecipes: string[]
}

// ============================================================
// 位置
// ============================================================

/**
 * 玩家当前位置
 */
export interface PlayerLocation {
  /** 当前地图ID */
  mapId: string
  /** 当前场景ID */
  sceneId: string
  /** 当前子场景ID（可选，不在子场景中则为null） */
  subSceneId: string | null
}

// ============================================================
// 游戏进度
// ============================================================

/**
 * 玩家游戏进度
 */
export interface PlayerProgress {
  /** 当前天数（从游戏开始算起） */
  day: number
  /** 当前时间（游戏内分钟数，0-1439） */
  timeMinutes: number
  /** 当前季节 */
  season: Season
  /** 当前季节阶段 */
  seasonPhase: SeasonPhase
  /** 当前天气ID */
  weatherId: string
  /** 当前腐化度 */
  corruption: number

  /** 玩家总生存天数 */
  totalDaysSurvived: number
  /** 是否已完成游戏 */
  isGameCompleted: boolean
  /** 已解锁的结局ID列表 */
  unlockedEndingIds: string[]

  /** 基地位置（无基地则为null） */
  baseLocation: PlayerLocation | null
}

// ============================================================
// 统计
// ============================================================

/**
 * 玩家统计数据
 */
export interface PlayerStatistics {
  /** 击杀敌人数 */
  enemiesKilled: number
  /** 总战斗次数 */
  totalBattles: number
  /** 逃跑次数 */
  escapesAttempted: number
  /** 制作物品数 */
  itemsCrafted: number
  /** 烹饪次数 */
  mealsCooked: number
  /** 建造建筑数 */
  buildingsConstructed: number
  /** 探索场景数 */
  scenesExplored: number
  /** 触发事件数 */
  eventsTriggered: number
  /** 总移动距离（km，估算） */
  totalDistanceTraveled: number
  /** 死亡次数（如果有重生机制） */
  deaths: number
}

// ============================================================
// 存档
// ============================================================

/**
 * 存档数据结构
 */
export interface SaveData {
  /** 存档版本号（用于存档兼容性检查） */
  version: string
  /** 存档时间戳 */
  timestamp: number
  /** 存档槽位（0=自动存档，1+ =手动存档） */
  slot: number
  /** 存档名称（手动存档可自定义） */
  name: string
  /** 游戏总时长（现实时间，秒） */
  playTimeSeconds: number
  /** 玩家状态 */
  playerState: PlayerState
}

/**
 * 新游戏初始状态
 * 用于开始新游戏时根据职业配置初始化玩家状态
 */
export interface NewGameConfig {
  /** 职业ID */
  classId: string
  /** 玩家名称 */
  playerName: string
  /** 初始地图ID */
  initialMapId: string
  /** 初始场景ID */
  initialSceneId: string
  /** 初始子场景ID（可选） */
  initialSubSceneId?: string
  /** 初始天数 */
  initialDay: number
  /** 初始时间（分钟） */
  initialTimeMinutes: number
  /** 初始季节 */
  initialSeason: Season
  /** 初始季节阶段 */
  initialSeasonPhase: SeasonPhase
  /** 初始天气ID */
  initialWeatherId: string
  /** 初始腐化度 */
  initialCorruption: number
}
