// scene.ts - 场景数据结构

import type { Condition } from './effect'
import type { EffectResult } from './effect'
import type { TimeOfDay, WeatherType, SeasonPhase } from './seasonWeather'
// ============================================================
// 基础场景类型（Scene 和 SubScene 的公共字段）
// ============================================================

/**
 * 场景基础配置
 * Scene 和 SubScene 共享的公共属性
 */
export interface BaseScene {
  // 唯一ID
  id: string
  // 名称（显示用）
  name: string
  // 备注（开发者可见）
  notes?: string

  // 场景描述/事件入口列表
  descriptions: SceneDescription[]

  // 背景图资源ID
  backgroundImage?: string
  // 图片变体（根据条件显示不同图片，如SAN值影响视觉效果）
  backgroundImageVariations?: SceneImageVariation[]

  // 温度影响（-50到50，叠加到环境温度计算中）
  temperatureModifier: number

  // 固定交互按钮
  interactions: SceneInteraction[]

  // 是否为地牢场景
  isDungeon: boolean
  // 是否为安全区（安全区内不会自动触发战斗类事件）
  isSafeZone: boolean
  // 是否可以扎营（临时营地）
  canCamp: boolean

  // BGM资源ID
  bgmId?: string
}

// ============================================================
// 场景配置
// ============================================================

/**
 * 场景配置
 * 场景是游戏世界的核心容器，负责：
 * 1. 展示环境描述（文字+图片）
 * 2. 提供事件入口（可点击的蓝色链接或自动触发的事件）
 * 3. 提供固定的交互按钮（探索、进入子场景、建造、休息等功能）
 * 场景本身不直接触发效果、战斗、采集资源等，
 * 这些逻辑统一通过"进入事件"来实现，由事件系统处理。
 */
export interface Scene extends BaseScene {
  // 该场景是否可以作为基地建造地点
  canBuildBase: boolean

  // 该场景包含的子场景ID列表（与 SubScene.parentSceneId 形成双向关联）
  subSceneIds?: string[]
}

// ============================================================
// 子场景配置
// ============================================================

/**
 * 子场景配置
 * 子场景是场景的子集，例如森林中的小溪、沙滩上的洞穴等。
 * 子场景不会触发母场景的descriptions，不显示母场景的interactions，
 * 但温度影响与母场景叠加。
 * 图片、描述等为空时使用母场景的对应内容。
 */
export interface SubScene extends BaseScene {
  // 母场景ID
  parentSceneId: string

  // ========== 地牢场景特有 ==========
  // 相邻子场景映射（方向 -> 相邻子场景ID）
  // 非地牢场景忽略此字段
  adjacentSubScenes?: {
    north?: string
    south?: string
    east?: string
    west?: string
    up?: string
    down?: string
  }
}

// ============================================================
// 场景描述
// ============================================================

/**
 * 场景描述条目
 * 场景中显示的文字内容，可以包含多个事件入口。
 * 多个描述条目根据优先级和显示条件竞争展示。
 */
export interface SceneDescription {
  // 描述ID
  id: string
  // 优先级（数字越大优先级越高，同优先级时随机选取一条展示）
  priority: number
  // 显示条件（满足条件时此描述才可能被选中展示）
  displayCondition?: Condition

  // 文本内容（展示给玩家的主文本）
  // 使用 {eventKey} 占位符标记事件入口位置，例如：
  // "你看到{strange_altar}矗立在林间空地中央，旁边{footprints}通向密林深处。"
  // {strange_altar} 和 {footprints} 会被替换为蓝色下划线文本，对应 eventEntries 中的 key
  text: string
  // 文本变体（根据条件显示不同文本，例如根据SAN值改变描述风格）
  textVariations?: SceneTextVariation[]

  // 文本样式（特殊效果，受SAN值等影响）
  style?: SceneTextStyle

  // ========== 事件入口配置 ==========
  // 文本中可点击的事件入口列表
  // key 对应 text 中的 {key} 占位符
  eventEntries?: SceneEventEntry[]

  // ========== 自动触发配置 ==========
  // 是否可自动触发（满足条件时自动进入某个事件）
  isAutoTrigger: boolean
  // 自动触发对应的事件入口 key（若不填则取 eventEntries 中的第一个）
  autoTriggerEventKey?: string
  // 自动触发的概率（0-1，1为必定触发，仅在isAutoTrigger为true时有效）
  autoTriggerProbability?: number
  // 自动触发是否需要先展示描述（若为true，则先展示描述再自动进入事件；false则跳过描述直接进入事件）
  showDescriptionBeforeAutoTrigger?: boolean
  // 自动触发延迟（毫秒，showDescriptionBeforeAutoTrigger为true时，展示描述后延迟多久自动进入事件）
  autoTriggerDelayMs?: number

  // 是否在任意事件入口触发后清除此描述（通过设置seenFlag实现）
  removeAfterInteraction?: boolean

  // ========== 展示频率控制 ==========
  // 此描述是否只能被看到一次
  isOneTime: boolean
  // 看过此描述后设置的标志位（用于后续判定是否已看过）
  seenFlag?: string
  // 此描述可被看到的次数上限（-1表示无限次，配合seenFlag使用）
  viewLimit?: number

  // ========== 环境限制 ==========
  // 是否在特定时间段显示
  timeOfDayRestriction?: TimeOfDay[]
  // 是否在特定天气显示
  weatherRestriction?: WeatherType[]
  // 是否在特定季节阶段显示
  seasonRestriction?: SeasonPhase[]
  // 显示所需的腐化度范围
  corruptionRange?: {
    min: number
    max: number
  }
}

/**
 * 场景事件入口
 * 描述文本中的可点击蓝色链接，点击后进入对应事件
 */
export interface SceneEventEntry {
  // 入口唯一标识（对应 text 中的占位符 {key}）
  key: string
  // 显示文本（即蓝色下划线文字的内容）
  displayText: string
  // 事件ID（点击后进入此事件）
  eventId: string
  // 显示条件（满足条件时此入口才显示并可点击）
  displayCondition?: Condition
  // 可用条件（满足条件时此入口才可点击，不满足时仅显示文本但不可点击）
  availableCondition?: Condition
  // 不可用时的提示文本
  unavailableTooltip?: string
  // 是否在不满足条件时完全隐藏（不渲染此入口文本）
  hideWhenUnavailable?: boolean
  // 点击后是否移除此入口（下次展示此描述时不再出现）
  removeAfterClick?: boolean
  // 点击后设置的标志位
  clickFlag?: string
  // 点击后的文本变体（如点击前"奇怪的祭坛"，点击后变为"已被调查的祭坛"）
  textAfterClick?: string
}

/**
 * 场景文本变体
 * 根据条件（如SAN值）替换描述文本及事件入口
 */
export interface SceneTextVariation {
  // 变体文本内容（同样支持 {eventKey} 占位符）
  content: string
  // 显示条件
  condition: Condition
  // 变体样式（覆盖默认样式）
  style?: SceneTextStyle
  // 变体对应的事件入口列表（覆盖 SceneDescription 的 eventEntries）
  eventEntries?: SceneEventEntry[]
}

/**
 * 场景文本样式
 * 用于实现不同SAN值下的文字效果变化
 */
export interface SceneTextStyle {
  // 字体大小
  fontSize?: number
  // 字体颜色
  color?: string
  // 字体粗细
  fontWeight?: 'normal' | 'bold'
  // 字体样式
  fontStyle?: 'normal' | 'italic'
  // 特殊效果（对应SAN值不同档位的视觉表现）
  specialEffect?: 'none' | 'glitch' | 'distortion' | 'shiver' | 'bloodDrip' | 'blur' | 'scramble'
}

/**
 * 场景图片变体
 * 根据条件（如SAN值、腐化度）替换背景图
 */
export interface SceneImageVariation {
  // 图片资源ID
  imageId: string
  // 显示条件
  condition: Condition
  // 过渡效果
  transitionEffect?: 'fade' | 'glitch' | 'instant'
  // 过渡持续时间（毫秒）
  transitionDuration?: number
}

// ============================================================
// 场景交互
// ============================================================

/**
 * 场景固定交互按钮
 * 显示在界面下方右侧的按钮，提供场景固有的功能入口
 */
export interface SceneInteraction {
  // 交互ID
  id: string
  // 交互名称（显示在按钮上）
  name: string
  // 交互描述（可选，长按或tooltip显示）
  description?: string
  // 交互名称变体（根据条件显示不同名称）
  nameVariations?: SceneTextVariation[]

  // 交互类型（决定 behaviorParams 的结构）
  interactionType: InteractionType

  // ========== 显示控制 ==========
  // 显示条件（满足条件时此交互按钮才显示）
  displayCondition?: Condition
  // 可用条件（满足条件时此按钮才可点击，不满足时灰显）
  availableCondition?: Condition
  // 不可用时的提示文本
  unavailableTooltip?: string
  // 是否在不满足可用条件时完全隐藏按钮
  hideWhenUnavailable: boolean

  // ========== 消耗 ==========
  // 执行此交互消耗的资源
  costs: InteractionCost[]

  // ========== 交互行为参数 ==========
  behaviorParams: InteractionBehaviorParams

  // 交互是否需要确认弹窗
  requiresConfirmation: boolean
  // 确认弹窗文本
  confirmationText?: string

  // ========== 限制 ==========
  // 交互优先级（数字越大显示越靠前）
  displayPriority: number

  // 此交互是否只能使用一次
  isOneTime: boolean
  // 使用后设置的标志位
  usedFlag?: string

  // 交互冷却时间（游戏内分钟数，-1表示无冷却）
  cooldownMinutes: number
  // 冷却标志位前缀（实际冷却标志位为 前缀+交互ID）
  cooldownFlagPrefix?: string

  // ========== 视觉效果 ==========
  // 交互动画效果
  animationEffect?: 'none' | 'fade' | 'slide' | 'shake'
  // 按钮图标资源ID
  iconId?: string
  // 按钮样式
  buttonStyle?: 'default' | 'primary' | 'danger' | 'special'
}

/**
 * 交互类型
 */
export enum InteractionType {
  // 探索：刷新当前场景的描述展示
  EXPLORE = 'explore',
  // 进入事件
  EVENT = 'event',
  // 打开功能面板：建造/制作/烹饪/修理/种植/钓鱼等
  FUNCTION = 'function',
  // 进入子场景
  ENTER_SUB_SCENE = 'enterSubScene',
  // 离开子场景返回母场景
  EXIT_SUB_SCENE = 'exitSubScene',
  // 移动（地牢场景中向指定方向移动）
  MOVE = 'move',
  // 休息/睡觉
  REST = 'rest',
  // 与NPC对话（本质是进入事件，语义区分）
  TALK = 'talk',
  // 交易（进入交易界面）
  TRADE = 'trade',
  // 移动到场景（跨地图移动）
  MOVE_TO_SCENE = 'moveToScene',
}

/**
 * 交互行为参数（根据交互类型联合）
 */
export type InteractionBehaviorParams =
  | ExploreBehaviorParams
  | EventBehaviorParams
  | FunctionBehaviorParams
  | EnterSubSceneBehaviorParams
  | ExitSubSceneBehaviorParams
  | MoveBehaviorParams
  | MoveToSceneBehaviorParams
  | RestBehaviorParams
  | TalkBehaviorParams
  | TradeBehaviorParams

/** 探索行为（无额外参数） */
export interface ExploreBehaviorParams {
  interactionType: InteractionType.EXPLORE
}

/** 事件行为 */
export interface EventBehaviorParams {
  interactionType: InteractionType.EVENT
  /** 事件ID */
  eventId: string
}

/** 功能面板行为 */
export interface FunctionBehaviorParams {
  interactionType: InteractionType.FUNCTION
  /** 功能类型 */
  functionType: FunctionType
}

/** 进入子场景行为 */
export interface EnterSubSceneBehaviorParams {
  interactionType: InteractionType.ENTER_SUB_SCENE
  /** 目标子场景ID */
  subSceneId: string
}

/** 离开子场景行为 */
export interface ExitSubSceneBehaviorParams {
  interactionType: InteractionType.EXIT_SUB_SCENE
}

/** 方向移动行为（地牢） */
export interface MoveBehaviorParams {
  interactionType: InteractionType.MOVE
  /** 移动方向 */
  direction: Direction
}
// 移动到场景行为
export interface MoveToSceneBehaviorParams {
  interactionType: InteractionType.MOVE_TO_SCENE
  /** 目标场景ID */
  targetSceneId: string
  /** 目标子场景ID（可选） */
  targetSubSceneId?: string
  /** 目标地图ID（跨地图移动时使用，为空则在当前地图内移动） */
  targetMapId?: string
  /** 目标地图节点ID（用于地图上定位） */
  targetNodeId: string
  /** 移动所需时间（游戏内分钟数） */
  travelTimeMinutes: number
  /** 移动消耗体力 */
  staminaCost: number
  /** 路径描述（如"沿着海岸线步行"） */
  pathDescription: string
  /** 移动途中遭遇事件池（随机触发） */
  encounterEventPool?: EncounterEventPoolEntry[]
  /** 移动条件（如需要特定物品、技能等级等） */
  requirements?: MoveRequirement[]
  /** 天气对移动时间的影响系数 */
  weatherImpactCoefficient?: number
}

/** 休息行为 */
export interface RestBehaviorParams {
  interactionType: InteractionType.REST
}

/** 对话行为（本质是进入事件） */
export interface TalkBehaviorParams {
  interactionType: InteractionType.TALK
  /** NPC ID 或事件ID */
  eventId: string
}

/** 交易行为 */
export interface TradeBehaviorParams {
  interactionType: InteractionType.TRADE
  /** 交易对象ID */
  traderId: string
}

/**
 * 功能面板类型
 */
export enum FunctionType {
  BUILD = 'build',
  CRAFT = 'craft',
  COOK = 'cook',
  REPAIR = 'repair',
  PLANT = 'plant',
  FISH = 'fish',
}

/**
 * 方向枚举（地牢移动用）
 */
export enum Direction {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west',
  UP = 'up',
  DOWN = 'down',
}
// ============================================================
// 移动相关
// ============================================================

export interface EncounterEventPoolEntry {
  eventId: string
  weight: number
  condition?: Condition
}

export interface MoveRequirement {
  type: 'item' | 'skill' | 'flag' | 'attribute' | 'carryWeight'
  id: string
  value?: number
  operator?: 'equal' | 'greaterEqual' | 'greater' | 'lessEqual' | 'less'
  hint: string
  isConsumed?: boolean
}

/**
 * 交互消耗
 */
export interface InteractionCost {
  // 消耗类型
  costType: InteractionCostType
  // 消耗值（基础值，可能受系数影响）
  value: number
  // 消耗值是否受玩家体力消耗系数影响
  affectedByCoefficient: boolean

  // ========== 物品消耗专用 ==========
  // 消耗的物品ID（仅当 costType 为 ITEM 时使用）
  itemId?: string
  // 消耗的物品数量（仅当 costType 为 ITEM 时使用，默认1）
  itemQuantity?: number
}

/**
 * 交互消耗类型
 */
export enum InteractionCostType {
  // 体力
  STAMINA = 'stamina',
  // 饱食度
  SATIETY = 'satiety',
  // SAN值
  SAN = 'san',
  // 生命值
  HP = 'hp',
  // 物品（需配合 itemId 和 itemQuantity）
  ITEM = 'item',
}

// ============================================================
// 场景注册表
// ============================================================

/**
 * 场景注册表（全局场景配置汇总）
 */
export interface SceneRegistry {
  // 所有场景
  scenes: Record<string, Scene>
  // 所有子场景
  subScenes: Record<string, SubScene>
  // 玩家初始场景ID（游戏开始时所在场景）
  initialSceneId: string
  // 玩家初始子场景ID（可选，如游戏开始在沙滩上的飞机残骸旁）
  initialSubSceneId?: string
}
