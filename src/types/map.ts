// map.ts - 大地图数据结构

import type { Condition } from './effect'
import type { EffectResult } from './effect'
import type { ItemId } from './item'
import type { FlagValue } from './flag'

// ============================================================
// 大地图配置
// ============================================================

/**
 * 大地图配置
 * 一张完整的地图，包含多个场景节点和它们之间的移动路径。
 * 支持多地图扩展（如主岛地图、地下洞窟地图、异空间地图等）。
 */
export interface GameMap {
  /** 地图唯一ID */
  id: string
  /** 地图名称（显示用） */
  name: string
  /** 地图备注（开发者可见） */
  notes?: string

  /** 地图背景图片资源ID（完整的大地图图片） */
  backgroundImageId: string

  /** 地图上的场景节点列表 */
  nodes: MapNode[]

  /** 地图解锁条件（不满足时地图不可见/不可进入） */
  unlockCondition?: Condition
  /** 解锁条件提示文本 */
  unlockHint?: string

  /** 此地图是否为初始地图（游戏开始时所在的地图） */
  isInitialMap: boolean

  /** 地图初始可见范围（0-1，0=全迷雾，1=全图可见。探索过的节点始终可见） */
  initialVisibility: number

  /** 进入此地图时触发的效果（首次进入时） */
  onFirstEnterEffects?: EffectResult[]
}

// ============================================================
// 地图节点
// ============================================================

/**
 * 地图节点
 * 地图上的一个场景点位，关联到场景配置中的 Scene 或 SubScene。
 */
export interface MapNode {
  /** 节点唯一ID（在地图内唯一） */
  id: string

  /** 关联的场景ID（对应 Scene.id） */
  sceneId: string
  /** 关联的子场景ID（可选，如直接进入子场景） */
  subSceneId?: string

  /** 节点在地图图片上的像素坐标（用于在大地图上标记位置） */
  position: MapPosition

  /** 节点名称（显示用，可覆写场景名称。为空则使用场景配置中的名称） */
  displayName?: string
  /** 节点名称变体（根据条件显示不同名称） */
  displayNameVariations?: MapNodeNameVariation[]

  // ============================================================
  // 节点视觉
  // ============================================================

  /** 节点图标资源ID（未探索时显示） */
  unexploredIconId: string
  /** 节点图标资源ID（已探索但不可进入时显示） */
  exploredIconId?: string
  /** 节点图标资源ID（已探索且可进入时显示，为空则使用exploredIconId） */
  activeIconId?: string
  /** 节点图标资源ID（特殊状态，如腐化区域闪烁） */
  specialIconId?: string

  /** 节点在地图上的显示大小 */
  iconSize?: {
    width: number
    height: number
  }

  // ============================================================
  // 探索机制
  // ============================================================

  /** 探索条件（不满足时无法点击/前往此节点） */
  exploreCondition?: Condition
  /** 探索条件不满足时的提示文本 */
  exploreConditionHint?: string

  /** 此节点是否初始可见（即使在迷雾中也显示为"???"标记） */
  isInitiallyVisible: boolean
  /** 此节点是否初始已探索（游戏开始时即可前往） */
  isInitiallyExplored: boolean

  /** 首次探索此节点时触发的效果 */
  onFirstExploreEffects?: EffectResult[]

  /** 探索此节点所需的视野范围条件（某些节点需要靠近才能看见） */
  visibilityRange?: number

  // ============================================================
  // 节点标签
  // ============================================================

  /** 节点类型标签 */
  nodeType: MapNodeType

  /** 节点难度等级（用于UI显示和排序，1-10） */
  dangerLevel: number

  /** 自定义标签（用于筛选和事件判定） */
  tags?: string[]
}

/**
 * 地图坐标
 */
export interface MapPosition {
  /** X坐标（像素，相对于地图图片左上角） */
  x: number
  /** Y坐标（像素，相对于地图图片左上角） */
  y: number
}

/**
 * 节点名称变体
 */
export interface MapNodeNameVariation {
  /** 变体名称 */
  name: string
  /** 显示条件 */
  condition: Condition
}

/**
 * 地图节点类型
 */
export enum MapNodeType {
  /** 主要地点（基地、大型建筑等） */
  MAJOR = 'major',
  /** 次要地点（小型营地、资源点等） */
  MINOR = 'minor',
  /** 资源点（采集、狩猎、钓鱼等） */
  RESOURCE = 'resource',
  /** 地牢入口 */
  DUNGEON_ENTRANCE = 'dungeonEntrance',
  /** 危险区域 */
  DANGER_ZONE = 'dangerZone',
  /** 安全屋/避难所 */
  SAFE_HOUSE = 'safeHouse',
  /** 传送点 */
  TELEPORT = 'teleport',
  /** 剧情关键地点 */
  STORY = 'story',
  /** 隐藏地点（需特定条件才可见） */
  HIDDEN = 'hidden',
  /** 自定义 */
  CUSTOM = 'custom',
}

// ============================================================
// 移动路径
// ============================================================

/**
 * 移动路径
 * 连接两个地图节点的路径，定义移动消耗和途中事件。
 * 路径是单向的，如需双向移动，需在两个节点各自配置一条路径指向对方。
 */
export interface TravelPath {
  /** 路径唯一ID（在地图内唯一） */
  id: string

  /** 起始节点ID */
  fromNodeId: string
  /** 目标节点ID */
  toNodeId: string

  /** 路径名称（如"海岸小径"、"密林深处"） */
  name: string
  /** 路径描述（显示给玩家） */
  description: string

  // ============================================================
  // 消耗
  // ============================================================

  /** 移动所需时间（游戏内分钟数） */
  travelTimeMinutes: number
  /** 移动基础消耗体力 */
  staminaCost: number
  /** 移动是否消耗饱食度（单位/小时，按travelTime计算） */
  satietyCostPerHour?: number

  // ============================================================
  // 条件与限制
  // ============================================================

  /** 路径可用条件（不满足时此路径不可选择） */
  availableCondition?: Condition
  /** 路径不可用时的提示文本 */
  unavailableHint?: string

  /** 移动条件（如需要特定物品、技能等级、负重限制等） */
  requirements?: TravelRequirement[]

  // ============================================================
  // 天气影响
  // ============================================================

  /** 天气影响系数（影响实际移动时间，如暴雨时移动时间×1.5） */
  weatherImpactCoefficient?: number
  /** 特定天气下路径是否关闭 */
  weatherRestrictions?: {
    /** 关闭此路径的天气ID列表 */
    closedWeatherIds: string[]
    /** 关闭时的提示文本 */
    closedHint: string
  }

  // ============================================================
  // 途中事件
  // ============================================================

  /** 移动途中是否可能触发遭遇 */
  canEncounter: boolean
  /** 遭遇触发概率（0-1） */
  encounterProbability: number
  /** 遭遇事件池（随机选取一个事件触发） */
  encounterEventPool?: EncounterEventPoolEntry[]

  /** 移动途中的固定事件（必定触发，如"首次经过此路"的剧情） */
  fixedEvents?: TravelFixedEvent[]

  /** 移动结束到达时触发的效果 */
  onArrivalEffects?: EffectResult[]

  // ============================================================
  // 发现机制
  // ============================================================

  /** 此路径是否初始可见（即使目标节点未探索也显示在地图上） */
  isInitiallyVisible: boolean
  /** 路径可见条件（用于隐藏路径，如需要侦查技能发现） */
  visibilityCondition?: Condition
  /** 路径样式（影响地图上的连线显示） */
  pathStyle?: 'normal' | 'dashed' | 'dotted' | 'hidden' | 'danger'
}

/**
 * 移动条件需求
 */
export interface TravelRequirement {
  /** 需求类型 */
  type: 'item' | 'skill' | 'flag' | 'attribute' | 'carryWeight'
  /** 需求具体ID */
  id: string
  /** 需求值 */
  value?: number
  /** 比较运算符 */
  operator?: 'equal' | 'greaterEqual' | 'greater' | 'lessEqual' | 'less'
  /** 需求不满足时的提示文本 */
  hint: string
  /** 是否消耗（物品类需求，移动后是否消耗该物品） */
  isConsumed?: boolean
}

/**
 * 遭遇事件池条目
 */
export interface EncounterEventPoolEntry {
  /** 事件ID */
  eventId: string
  /** 权重（数字越大被选中概率越高） */
  weight: number
  /** 触发条件 */
  condition?: Condition
}

/**
 * 途中固定事件
 */
export interface TravelFixedEvent {
  /** 事件ID */
  eventId: string
  /** 触发条件（满足条件时必定触发） */
  condition: Condition
  /** 是否仅触发一次 */
  isOneTime: boolean
  /** 触发后设置的标志位 */
  triggeredFlag?: string
  /** 事件触发时机 */
  triggerTiming: 'onDepart' | 'midTravel' | 'onArrival'
}

// ============================================================
// 地图迷雾系统
// ============================================================

/**
 * 迷雾配置
 * 控制地图的探索可见范围
 */
export interface MapFogConfig {
  /** 迷雾类型 */
  fogType: MapFogType
  /** 玩家视野范围（以节点为单位，可见此范围内的节点和路径） */
  visionRange: number
  /** 是否显示未探索节点为"???"标记 */
  showUnexploredMarkers: boolean
  /** 迷雾图片资源ID（覆盖在地图上方） */
  fogImageId?: string
  /** 迷雾颜色（用于动态渲染） */
  fogColor?: string
}

/**
 * 迷雾类型
 */
export enum MapFogType {
  /** 全黑（未探索区域完全不可见） */
  BLACK = 'black',
  /** 半透明（未探索区域可见地形但不可见节点细节） */
  TRANSLUCENT = 'translucent',
  /** 战争迷雾（已探索但不在视野内的区域显示为灰色） */
  WAR_FOG = 'warFog',
  /** 无迷雾（全图可见） */
  NONE = 'none',
}

// ============================================================
// 多地图配置
// ============================================================

/**
 * 地图之间的连接
 * 定义如何从一张地图切换到另一张地图
 */
export interface MapTransition {
  /** 连接唯一ID */
  id: string
  /** 源地图ID */
  fromMapId: string
  /** 源节点ID（哪个节点触发地图切换） */
  fromNodeId: string
  /** 目标地图ID */
  toMapId: string
  /** 目标节点ID（进入新地图后出现在哪个节点） */
  toNodeId: string

  /** 切换条件 */
  transitionCondition?: Condition
  /** 条件不满足时的提示 */
  transitionHint?: string

  /** 切换时触发的效果 */
  transitionEffects?: EffectResult[]
  /** 切换描述文本 */
  transitionText?: string
  /** 是否需要加载画面 */
  showLoadingScreen: boolean
}

// ============================================================
// 地图注册表
// ============================================================

/**
 * 地图注册表（全局地图配置汇总）
 */
export interface MapRegistry {
  /** 所有地图配置，按ID索引 */
  maps: Record<string, GameMap>

  /** 所有移动路径，按ID索引（跨地图统一管理） */
  travelPaths: Record<string, TravelPath>

  /** 地图之间的切换连接 */
  mapTransitions: Record<string, MapTransition>

  /** 初始地图ID */
  initialMapId: string
  /** 初始节点ID（玩家初始所在节点） */
  initialNodeId: string

  /** 迷雾配置 */
  fogConfig: MapFogConfig

  /** 快速旅行配置（可选，是否支持已探索节点间快速移动） */
  fastTravel?: FastTravelConfig
}

/**
 * 快速旅行配置
 */
export interface FastTravelConfig {
  /** 是否启用快速旅行 */
  enabled: boolean
  /** 快速旅行条件（如需要消耗特殊物品、只能在白天等） */
  condition?: Condition
  /** 快速旅行消耗（通常是普通移动的N倍时间，但不触发遭遇） */
  timeMultiplier: number
  /** 快速旅行体力消耗倍率 */
  staminaMultiplier: number
  /** 快速旅行是否可能触发遭遇 */
  canEncounter: boolean
}