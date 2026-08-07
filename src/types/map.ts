// map.ts - 大地图数据结构

import type { Conditions } from './effect'

// ============================================================
// 大地图配置
// ============================================================

/**
 * 地图路径（两个场景节点之间的移动边）
 * 玩家在地图上的移动沿路径逐段进行；未配置路径的节点对退回坐标距离计算。
 */
export interface MapPath {
  /** 起始节点ID */
  from: string
  /** 目标节点ID */
  to: string
  /** 基础耗时（游戏内分钟） */
  travelMinutes: number
  /** 移动消耗体力（可选，默认 0） */
  staminaCost?: number
  /** 可通行条件（可选，复用 Conditions 系统，如渡海需要船） */
  condition?: Conditions
  /** 是否单向路径（默认 false 表示双向通行） */
  oneWay?: boolean
}

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

  /** 地图背景图片资源ID（完整的大地图图片） */
  backgroundImageId: string

  /** 地图上的场景节点列表 */
  nodes: MapNode[]

  /** 节点之间的移动路径（可选；未配置时使用坐标距离计算移动耗时） */
  paths?: MapPath[]
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
  // 解锁机制
  // ============================================================

  /** 解锁条件（与 MapPath.condition 同一类型，复用 Conditions 体系；满足后节点才可见且可前往，未配置视为已解锁） */
  condition?: Conditions
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
  condition: Conditions
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

  /** 初始地图ID */
  initialMapId: string
  /** 初始节点ID（玩家初始所在节点） */
  initialNodeId: string
}
