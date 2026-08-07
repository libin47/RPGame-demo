// src/engine/map.ts
// 地图寻路：沿 MapPath 计算可行路线（供移动结算与地图动画共用）

import type { GameMap, MapNode, MapPath } from '@/types/map'
import type { PlayerState } from '@/types/player'
import { evaluateConditions } from './event'

/** 地图路径段（BFS 结果中的一段） */
export interface MapRouteLeg {
  /** 起始节点ID */
  from: string
  /** 目标节点ID */
  to: string
  /** 该段耗时（游戏内分钟） */
  travelMinutes: number
  /** 该段消耗体力 */
  staminaCost: number
}

/**
 * 沿地图路径查找 from → to 的可行路线（BFS，最少边数）
 * - 会过滤掉 condition 不满足（当前不可通行）的边
 * - oneWay 边只允许 from→to 方向通行
 *
 * @param map - 地图配置
 * @param fromNodeId - 起始节点ID
 * @param toNodeId - 目标节点ID
 * @param player - 玩家状态（用于评估 condition）
 * @returns 路径段列表（按行进顺序，from → ... → to），不可达或未配置路径时返回 null
 */
export function findMapRoute(
  map: GameMap,
  fromNodeId: string,
  toNodeId: string,
  player: PlayerState,
): MapRouteLeg[] | null {
  const paths = map.paths ?? []
  if (paths.length === 0 || fromNodeId === toNodeId) return null

  // 构建邻接表（oneWay 只允许 from→to；condition 不满足的边不可通行）
  const adj = new Map<string, MapRouteLeg[]>()
  const addEdge = (from: string, to: string, p: MapPath): void => {
    const list = adj.get(from) ?? []
    list.push({ from, to, travelMinutes: p.travelMinutes, staminaCost: p.staminaCost ?? 0 })
    adj.set(from, list)
  }
  for (const p of paths) {
    if (p.condition && !evaluateConditions(p.condition, player)) continue
    addEdge(p.from, p.to, p)
    if (!p.oneWay) addEdge(p.to, p.from, p)
  }

  // BFS 找最短路径
  const visited = new Set<string>([fromNodeId])
  const queue: Array<{ nodeId: string; legs: MapRouteLeg[] }> = [{ nodeId: fromNodeId, legs: [] }]
  while (queue.length > 0) {
    const cur = queue.shift()
    if (!cur) continue
    for (const edge of adj.get(cur.nodeId) ?? []) {
      if (edge.to === toNodeId) return [...cur.legs, edge]
      if (visited.has(edge.to)) continue
      visited.add(edge.to)
      queue.push({ nodeId: edge.to, legs: [...cur.legs, edge] })
    }
  }
  return null
}

/**
 * 地图节点是否已解锁（可见且可前往）
 * - 配置了 condition 时实时评估（与 MapPath.condition 同一套判定，如 flag 判断）
 * - 未配置 condition 视为已解锁
 */
export function isMapNodeUnlocked(node: MapNode, player: PlayerState): boolean {
  if (!node.condition) return true
  return evaluateConditions(node.condition, player)
}
