// src/engine/storage.ts
// 仓库（储物箱）存储系统：背包↔仓库物品转移

import type { PlayerState, PlayerInventoryItem } from '@/types/player'
import type { SubBuild } from '@/types/build'
import { getRegistry } from './registry'
import { addItem, removeItem, getItemCount } from './inventory'

/**
 * 获取指定储物箱的物品列表（纯读取，可安全接收只读 player）
 */
export function getStorageItems(
  player: PlayerState,
  subSceneId: string,
  buildId: string,
): PlayerInventoryItem[] {
  return player.progress.campStorage?.[subSceneId]?.[buildId] ?? []
}

/**
 * 获取储物箱已用格数（每堆/每实例算1格）
 */
export function getStorageUsedSlots(
  player: PlayerState,
  subSceneId: string,
  buildId: string,
): number {
  return getStorageItems(player, subSceneId, buildId).length
}

/**
 * 获取指定子场景中所有仓库（储物箱）内某物品的总数量（纯读取）
 * 用于营地建造/制作/烹饪时合并统计背包 + 仓库的材料
 */
export function getSubSceneStorageItemCount(
  player: PlayerState,
  subSceneId: string,
  itemId: string,
): number {
  const storageByBuild = player.progress.campStorage?.[subSceneId]
  if (!storageByBuild) return 0
  let total = 0
  for (const buildId of Object.keys(storageByBuild)) {
    const items = storageByBuild[buildId]
    if (!items) continue
    for (const s of items) {
      if (s.itemId === itemId) total += s.quantity
    }
  }
  return total
}

/**
 * 从指定子场景的所有仓库中按序扣除物品（背包不足时的补充来源）
 *
 * @param player - 玩家状态（会被直接修改）
 * @param subSceneId - 子场景ID
 * @param itemId - 物品配置ID
 * @param quantity - 扣除数量
 * @returns 实际扣除的数量
 */
export function removeFromSubSceneStorage(
  player: PlayerState,
  subSceneId: string,
  itemId: string,
  quantity: number,
): number {
  const storageByBuild = player.progress.campStorage?.[subSceneId]
  if (!storageByBuild || quantity <= 0) return 0

  let remaining = quantity
  for (const buildId of Object.keys(storageByBuild)) {
    const items = storageByBuild[buildId]
    if (!items || items.length === 0) continue
    for (let i = items.length - 1; i >= 0; i--) {
      const s = items[i]
      if (!s || s.itemId !== itemId) continue
      if (s.quantity <= remaining) {
        remaining -= s.quantity
        items.splice(i, 1)
      } else {
        s.quantity -= remaining
        remaining = 0
      }
      if (remaining <= 0) break
    }
    if (remaining <= 0) break
  }

  return quantity - remaining
}

/**
 * 获取储物箱最大格数
 */
export function getStorageMaxSlots(subBuild: SubBuild): number {
  return subBuild.maxStorageSlots ?? 20
}

/**
 * 从背包转移物品到仓库
 *
 * @param player - 玩家状态（会被直接修改）
 * @param subSceneId - 子场景ID
 * @param buildId - 建筑ID
 * @param itemId - 物品配置ID
 * @param quantity - 转移数量
 * @returns 实际转移的数量
 */
export function addToStorage(
  player: PlayerState,
  subSceneId: string,
  buildId: string,
  itemId: string,
  quantity: number,
): number {
  if (quantity <= 0) return 0

  // 变更类函数：确保结构存在（仅由 useGame 传入可变 player 调用）
  const storage = ensureStorage(player, subSceneId, buildId)
  const registry = getRegistry()
  const itemConfig = registry.getItem(itemId)
  if (!itemConfig) return 0

  // 检查容量
  const existingSlot = storage.find((s) => s.itemId === itemId)
  if (!existingSlot && storage.length >= getStorageMaxSlots(getSubBuild(player, buildId))) {
    return 0
  }

  // 检查背包中是否有足够数量
  const currentCount = getItemCount(player, itemId)
  const actualQty = Math.min(quantity, currentCount)
  if (actualQty <= 0) return 0

  // 从背包移除
  const removed = removeItem(player, itemId, actualQty)
  if (removed <= 0) return 0

  // 放入仓库（仓库不限制堆叠数量，同一物品自动合并）
  if (existingSlot) {
    existingSlot.quantity += removed
  } else {
    storage.push({
      instanceId: `stor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      itemId,
      quantity: removed,
      durability: -1,
      acquiredTime: player.progress.day * 1440 + player.progress.timeMinutes,
    })
  }

  return removed
}

/**
 * 从仓库转移物品到背包
 *
 * @param player - 玩家状态（会被直接修改）
 * @param subSceneId - 子场景ID
 * @param buildId - 建筑ID
 * @param instanceId - 仓库物品实例ID
 * @param quantity - 转移数量
 * @returns 实际转移的数量
 */
export function removeFromStorage(
  player: PlayerState,
  subSceneId: string,
  buildId: string,
  instanceId: string,
  quantity: number,
): number {
  if (quantity <= 0) return 0

  // 变更类函数：确保结构存在（仅由 useGame 传入可变 player 调用）
  const storage = ensureStorage(player, subSceneId, buildId)
  const index = storage.findIndex((s) => s.instanceId === instanceId)
  if (index === -1) return 0

  const item = storage[index]
  if (!item) return 0

  const actualQty = Math.min(quantity, item.quantity)
  if (actualQty <= 0) return 0

  // 先放入背包
  const added = addItem(player, item.itemId, actualQty, false)
  if (added <= 0) return 0

  // 再减少仓库数量
  if (item.quantity <= added) {
    storage.splice(index, 1)
  } else {
    item.quantity -= added
  }

  return added
}

/**
 * 清空指定储物箱（拆除建筑时调用）
 */
export function clearStorage(player: PlayerState, subSceneId: string, buildId: string): void {
  // 旧存档可能没有 campStorage 字段，需判空
  if (!player.progress.campStorage) return
  if (player.progress.campStorage[subSceneId]) {
    delete player.progress.campStorage[subSceneId][buildId]
  }
}

/**
 * 获取建筑当前子建筑配置（用于计算容量等）
 */
function getSubBuild(player: PlayerState, buildId: string): SubBuild {
  const registry = getRegistry()
  const build = registry.getBuilding(buildId)
  if (!build) return { maxStorageSlots: 20 } as SubBuild
  // 返回默认子建筑（使用默认容量）
  const defaultSub =
    build.subBuild.find((s) => s.buildId === build.defaultBuild) ?? build.subBuild[0]
  return defaultSub ?? ({ maxStorageSlots: 20 } as SubBuild)
}

/**
 * 确保存储数据结构初始化，并返回该建筑的物品数组
 * 仅在变更类函数中调用（player 必须是可变的）
 */
function ensureStorage(
  player: PlayerState,
  subSceneId: string,
  buildId: string,
): PlayerInventoryItem[] {
  // 旧存档可能没有 campStorage 字段，需判空初始化
  if (!player.progress.campStorage) {
    player.progress.campStorage = {}
  }
  if (!player.progress.campStorage[subSceneId]) {
    player.progress.campStorage[subSceneId] = {}
  }
  if (!player.progress.campStorage[subSceneId][buildId]) {
    player.progress.campStorage[subSceneId][buildId] = []
  }
  return player.progress.campStorage[subSceneId][buildId]
}
