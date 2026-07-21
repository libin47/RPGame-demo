// flag.ts - 标志位数据结构

/**
 * 标志位类型
 */
export enum FlagType {
  /** 布尔标志（最常见的开关） */
  BOOLEAN = 'boolean',
  /** 数值标志（计数器） */
  NUMBER = 'number',
  /** 字符串标志（状态记录） */
  STRING = 'string',
  /** 数组标志（列表记录） */
  ARRAY = 'array',
  /** 枚举标志 */
  ENUM = 'enum',
  /** 时间戳标志 */
  TIMESTAMP = 'timestamp',
}

/**
 * 标志位作用域
 */
export enum FlagScope {
  /** 全局标志（整个游戏存档） */
  GLOBAL = 'global',
  /** 场景标志（仅在当前场景有效） */
  SCENE = 'scene',
  /** 角色标志（与特定角色相关） */
  CHARACTER = 'character',
  /** 临时标志（会话内有效，不保存） */
  TEMPORARY = 'temporary',
  /** 章节标志（在特定章节有效） */
  CHAPTER = 'chapter',
}

/**
 * 标志位分类
 */
export enum FlagCategory {
  /** 剧情进度 */
  STORY_PROGRESS = 'story_progress',
  /** 角色关系 */
  CHARACTER_RELATIONSHIP = 'character_relationship',
  /** 探索发现 */
  EXPLORATION = 'exploration',
  /** 任务状态 */
  QUEST = 'quest',
  /** 战斗记录 */
  COMBAT = 'combat',
  /** 收集要素 */
  COLLECTION = 'collection',
  /** 结局条件 */
  ENDING_CONDITION = 'ending_condition',
  /** 隐藏要素 */
  SECRET = 'secret',
  /** 系统设置 */
  SYSTEM = 'system',
  /** 环境状态 */
  ENVIRONMENT = 'environment',
  /** 技能解锁 */
  SKILL_UNLOCK = 'skill_unlock',
  /** 配方解锁 */
  RECIPE_UNLOCK = 'recipe_unlock',
  /** 建筑解锁 */
  BUILDING_UNLOCK = 'building_unlock',
  /** 成就 */
  ACHIEVEMENT = 'achievement',
  /** 自定义 */
  CUSTOM = 'custom',
}

/**
 * 标志位定义
 */
export interface FlagDefinition {
  /** 标志位唯一ID */
  id: string
  /** 标志位名称 */
  name: string
  /** 标志位描述 */
  description: string
  /** 标志位类型 */
  type: FlagType
  /** 标志位作用域 */
  scope: FlagScope
  /** 标志位分类 */
  category: FlagCategory
  /** 默认值 */
  defaultValue: FlagValue
  /** 是否持久化存储 */
  persistent: boolean
  /** 是否在UI中显示 */
  showInUI?: boolean
  /** 是否隐藏（不在任何列表显示） */
  hidden?: boolean
  /** 枚举值列表（ENUM类型时使用） */
  enumValues?: string[]
  /** 数值范围（NUMBER类型时使用） */
  numberRange?: {
    min?: number
    max?: number
  }
  /** 标志位触发的事件（值变动时触发） */
  onChangeEvents?: FlagEvent[]
  /** 标志位依赖（需要其他标志位达到特定值才会启用） */
  dependencies?: FlagDependency[]
  /** 重置规则 */
  resetRule?: FlagResetRule
  /** 标志位标签（用于分组） */
  tags?: string[]
  /** 排序权重 */
  sortOrder?: number
}

/**
 * 标志位值
 */
export type FlagValue = boolean | number | string | unknown[] | null

/**
 * 标志位实例（运行时）
 */
export interface FlagInstance {
  /** 标志位定义 */
  definition: FlagDefinition
  /** 当前值 */
  currentValue: FlagValue
  /** 历史值（用于回溯） */
  history: FlagHistory[]
  /** 最后更新时间（游戏时间） */
  lastUpdated: number
  /** 更新次数 */
  updateCount: number
}

/**
 * 标志位历史记录
 */
export interface FlagHistory {
  /** 变动前的值 */
  oldValue: FlagValue
  /** 变动后的值 */
  newValue: FlagValue
  /** 变动时间（游戏时间） */
  timestamp: number
  /** 变动来源 */
  source: FlagChangeSource
  /** 变动描述 */
  description?: string
}

/**
 * 标志位变动来源
 */
export interface FlagChangeSource {
  /** 来源类型 */
  type: 'event' | 'battle' | 'cg' | 'item' | 'dialogue' | 'system' | 'scene' | 'custom'
  /** 来源ID */
  id?: string
  /** 来源名称 */
  name?: string
}

/**
 * 标志位事件
 */
export interface FlagEvent {
  /** 触发条件 */
  condition: FlagCondition
  /** 触发的事件ID */
  eventId: string
  /** 事件触发次数限制 */
  limit?: number
  /** 冷却时间（游戏时间） */
  cooldown?: number
}

/**
 * 标志位条件
 */
export interface FlagCondition {
  /** 条件类型 */
  type: FlagConditionType
  /** 比较值 */
  value?: FlagValue
  /** 取值范围（between/in时使用） */
  range?: FlagValue[]
  /** 逻辑运算符（复合条件） */
  logic?: 'and' | 'or' | 'not'
  /** 子条件（复合条件时使用） */
  subConditions?: FlagCondition[]
}

/**
 * 标志位条件类型
 */
export enum FlagConditionType {
  EQUAL = 'equal',
  NOT_EQUAL = 'notEqual',
  GREATER = 'greater',
  LESS = 'less',
  GREATER_EQUAL = 'greaterEqual',
  LESS_EQUAL = 'lessEqual',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'notIn',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists',
  CHANGED = 'changed',
  UNCHANGED = 'unchanged',
}

/**
 * 标志位依赖
 */
export interface FlagDependency {
  /** 依赖的标志位ID */
  flagId: string
  /** 依赖条件 */
  condition: FlagCondition
  /** 依赖描述 */
  description?: string
}

/**
 * 标志位置置规则
 */
export interface FlagResetRule {
  /** 重置触发条件 */
  trigger:
    | 'onNewGame'
    | 'onSceneChange'
    | 'onChapterChange'
    | 'onDayChange'
    | 'onSeasonChange'
    | 'custom'
  /** 重置后的值 */
  resetValue?: FlagValue
  /** 自定义重置条件 */
  customCondition?: FlagCondition
}

/**
 * 标志位管理器配置
 */
export interface FlagManagerConfig {
  /** 最大历史记录数 */
  maxHistorySize: number
  /** 自动保存间隔（游戏时间分钟） */
  autoSaveInterval: number
  /** 是否启用标志位验证 */
  enableValidation: boolean
  /** 是否记录变动日志 */
  enableLogging: boolean
}

/**
 * 标志位集合（用于批量操作）
 */
export interface FlagCollection {
  /** 集合名称 */
  name: string
  /** 包含的标志位ID列表 */
  flagIds: string[]
  /** 集合描述 */
  description?: string
}

/**
 * 标志位预设（用于快速设置一组初始标志位）
 */
export interface FlagPreset {
  /** 预设名称 */
  name: string
  /** 预设描述 */
  description?: string
  /** 预设的标志位值 */
  flags: Record<string, FlagValue>
  /** 适用条件 */
  condition?: FlagCondition
}

/**
 * 标志位操作结果
 */
export interface FlagOperationResult {
  /** 操作是否成功 */
  success: boolean
  /** 错误信息 */
  error?: string
  /** 变动前的值 */
  oldValue?: FlagValue
  /** 变动后的值 */
  newValue?: FlagValue
  /** 触发的事件列表 */
  triggeredEvents?: string[]
}

/**
 * 常用标志位定义示例（实际标志位在配置文件中定义）
 */
export enum CommonFlags {
  // 剧情进度
  GAME_STARTED = 'game_started',
  FIRST_DEATH = 'first_death',
  DISCOVERED_ISLAND_SECRET = 'discovered_island_secret',
  MET_NPC_FISHERMAN = 'met_npc_fisherman',

  // 探索
  EXPLORED_BEACH = 'explored_beach',
  EXPLORED_FOREST = 'explored_forest',
  EXPLORED_MOUNTAIN = 'explored_mountain',
  FOUND_RESEARCH_BASE = 'found_research_base',
  FOUND_SIGNAL_TOWER = 'found_signal_tower',

  // 结局条件
  SIGNAL_TOWER_REPAIRED = 'signal_tower_repaired',
  BOAT_BUILT = 'boat_built',
  NPC_SAVED = 'npc_saved',
  TRUTH_DISCOVERED = 'truth_discovered',
  SPORE_DESTROYED = 'spore_destroyed',
  INFECTION_LEVEL = 'infection_level',

  // 收集
  DOCUMENTS_FOUND = 'documents_found',
  SECRETS_DISCOVERED = 'secrets_discovered',
  ARTIFACTS_COLLECTED = 'artifacts_collected',

  // 角色
  PLAYER_CLASS = 'player_class',
  PLAYER_SAN_LEVEL = 'player_san_level',

  // 环境
  CORRUPTION_LEVEL = 'corruption_level',
  WORLD_DAY = 'world_day',
  CURRENT_SEASON = 'current_season',

  // 系统
  TUTORIAL_COMPLETED = 'tutorial_completed',
  DIFFICULTY_LEVEL = 'difficulty_level',
  ENDING_UNLOCKED = 'ending_unlocked',
  ACHIEVEMENT_COMPLETED = 'achievement_completed',
}
