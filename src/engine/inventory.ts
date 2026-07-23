// src/engine/inventory.ts
// 背包系统：物品增删查改、堆叠、负重计算、装备管理

import type { PlayerState, PlayerInventoryItem } from '@/types/player'
import type { Item, EquippableItem } from '@/types/item'
import { ItemCategory } from '@/types/item'
import { getRegistry } from './registry'
import { calcMaxCarryWeight, calcCarryWeightRate } from './formula'
import { getEffectResolver } from './effect'
import { EffectType, ItemChangeType } from '@/types/effect'
import type { Effect } from '@/types/effect'

// ============================================================
// 物品操作
// ============================================================

/**
 * 向背包添加物品
 * 自动处理堆叠和新实例创建
 *
 * @param player - 玩家状态（会被直接修改）
 * @param itemId - 物品配置ID
 * @param quantity - 添加数量（默认1）
 * @returns 实际添加的数量
 */
export function addItem(player: PlayerState, itemId: string, quantity: number = 1): number {
  if (quantity <= 0) return 0

  const registry = getRegistry()
  const itemConfig = registry.getItem(itemId)
  if (!itemConfig) return 0

  let remaining = quantity
  const maxStack = itemConfig.maxStackSize

  if (maxStack > 1) {
    // 可堆叠物品：先尝试叠加到已有物品
    for (const invItem of player.inventory) {
      if (invItem.itemId === itemId && invItem.quantity < maxStack) {
        const space = maxStack - invItem.quantity
        const toAdd = Math.min(remaining, space)
        invItem.quantity += toAdd
        remaining -= toAdd
        if (remaining <= 0) break
      }
    }
  }

  // 剩余的创建新实例
  while (remaining > 0) {
    const stackSize = maxStack > 1 ? Math.min(remaining, maxStack) : 1
    player.inventory.push({
      instanceId: generateInstanceId(),
      itemId,
      quantity: stackSize,
      durability: getInitialDurability(itemConfig),
      acquiredTime: player.progress.day * 1440 + player.progress.timeMinutes,
    })
    remaining -= stackSize
  }

  // 更新负重
  recalculateCarryWeight(player)

  return quantity - remaining
}

/**
 * 从背包移除物品
 *
 * @param player - 玩家状态（会被直接修改）
 * @param itemId - 物品配置ID
 * @param quantity - 移除数量（默认1）
 * @returns 实际移除的数量
 */
export function removeItem(player: PlayerState, itemId: string, quantity: number = 1): number {
  if (quantity <= 0) return 0

  let remaining = quantity

  // 从后往前遍历，避免索引问题
  for (let i = player.inventory.length - 1; i >= 0; i--) {
    const invItem = player.inventory[i]
    if (!invItem) continue
    if (invItem.itemId !== itemId) continue

    if (invItem.quantity <= remaining) {
      remaining -= invItem.quantity
      player.inventory.splice(i, 1)
    } else {
      invItem.quantity -= remaining
      remaining = 0
    }

    if (remaining <= 0) break
  }

  // 更新负重
  recalculateCarryWeight(player)

  return quantity - remaining
}

/**
 * 获取背包中某物品的总数量
 */
export function getItemCount(player: PlayerState, itemId: string): number {
  return player.inventory
    .filter((inv) => inv.itemId === itemId)
    .reduce((sum, inv) => sum + inv.quantity, 0)
}

/**
 * 检查背包中是否有足够数量的某物品
 */
export function hasItem(player: PlayerState, itemId: string, quantity: number = 1): boolean {
  return getItemCount(player, itemId) >= quantity
}

/**
 * 按类别获取背包中的物品列表
 */
export function getItemsByCategory(
  player: PlayerState,
  category: ItemCategory,
): PlayerInventoryItem[] {
  const registry = getRegistry()
  return player.inventory.filter((inv) => {
    const config = registry.getItem(inv.itemId)
    return config && config.category === category
  })
}

// ============================================================
// 装备管理
// ============================================================

/**
 * 装备物品
 *
 * @param player - 玩家状态（会被直接修改）
 * @param instanceId - 物品实例ID
 * @returns 是否装备成功
 */
export function equipItem(player: PlayerState, instanceId: string): boolean {
  const invIndex = player.inventory.findIndex((i) => i.instanceId === instanceId)
  if (invIndex === -1) return false

  const invItem = player.inventory[invIndex]
  if (!invItem) return false

  const registry = getRegistry()
  const itemConfig = registry.getItem(invItem.itemId)
  if (!itemConfig) return false

  // 获取装备槽位
  const slot = getSlotForItem(itemConfig)
  if (!slot) return false

  // 卸下当前装备
  const oldEquipped = player.equipment[slot]
  if (oldEquipped) {
    unequipSlot(player, slot)
  }

  // 设置新装备
  player.equipment[slot] = invItem.itemId

  // 从背包中移除已装备的物品
  if (invItem.quantity <= 1) {
    player.inventory.splice(invIndex, 1)
  } else {
    invItem.quantity -= 1
  }

  recalculateCarryWeight(player)
  return true
}

/**
 * 卸下指定槽位的装备
 *
 * @param player - 玩家状态（会被直接修改）
 * @param slot - 装备槽位
 * @returns 是否卸下成功
 */
export function unequipSlot(player: PlayerState, slot: keyof PlayerState['equipment']): boolean {
  const itemId = player.equipment[slot]
  if (!itemId) return false

  // 将装备放回背包
  player.equipment[slot] = null
  addItem(player, itemId, 1)

  return true
}

/**
 * 卸下所有装备
 */
export function unequipAll(player: PlayerState): void {
  for (const slot of Object.keys(player.equipment) as Array<keyof PlayerState['equipment']>) {
    unequipSlot(player, slot)
  }
}

// ============================================================
// 物品使用
// ============================================================

/**
 * 使用消耗品（食物、药品等）
 *
 * @param player - 玩家状态（会被直接修改）
 * @param instanceId - 物品实例ID
 * @returns 使用结果日志
 */
export function useConsumable(player: PlayerState, instanceId: string): string {
  const invIndex = player.inventory.findIndex((i) => i.instanceId === instanceId)
  if (invIndex === -1) return '物品未找到'

  const invItem = player.inventory[invIndex]
  if (!invItem) return '物品未找到'

  const registry = getRegistry()
  const itemConfig = registry.getItem(invItem.itemId)
  if (!itemConfig) return '物品配置未找到'

  if (itemConfig.category !== ItemCategory.CONSUMABLE) {
    return `${itemConfig.name} 不可直接使用`
  }

  // 执行效果
  const resolver = getEffectResolver()
  const consumableConfig = itemConfig as import('@/types/item').ConsumableItem
  const logs = resolver.executeEffectResults(player, consumableConfig.effects)

  // 减少使用次数
  if (invItem.quantity <= 1) {
    player.inventory.splice(invIndex, 1)
  } else {
    invItem.quantity -= 1
  }

  recalculateCarryWeight(player)

  return logs.filter(Boolean).join('；') || `使用了 ${itemConfig.name}`
}

// ============================================================
// 负重计算
// ============================================================

/**
 * 重新计算玩家负重
 * 遍历背包中所有物品，累加重量
 */
export function recalculateCarryWeight(player: PlayerState): void {
  const registry = getRegistry()
  let totalWeight = 0

  for (const invItem of player.inventory) {
    const config = registry.getItem(invItem.itemId)
    if (config) {
      totalWeight += config.weight * invItem.quantity
    }
  }

  player.survival.carryWeight = Math.round(totalWeight * 10) / 10 // 保留一位小数
  player.survival.maxCarryWeight = calcMaxCarryWeight(
    player.attributes.strength,
    player.attributes.coefficients.carryWeightModifier,
  )
}

/**
 * 计算负重率
 */
export function getCarryWeightRate(player: PlayerState): number {
  return calcCarryWeightRate(player.survival.carryWeight, player.survival.maxCarryWeight)
}

/**
 * 判断玩家是否超载（无法移动）
 * 负重率 >= 1.0 时超载
 */
export function isOverloaded(player: PlayerState): boolean {
  return player.survival.carryWeight >= player.survival.maxCarryWeight
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 生成物品实例ID
 */
function generateInstanceId(): string {
  return `inst_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 根据物品配置获取耐久度初始值
 */
function getInitialDurability(itemConfig: Item): number {
  if ('durability' in itemConfig) {
    const durConfig = (itemConfig as { durability?: { initialDurability?: number } }).durability
    return durConfig?.initialDurability ?? -1
  }
  return -1
}

/**
 * 根据物品配置获取对应的装备槽位
 */
function getSlotForItem(itemConfig: Item): keyof PlayerState['equipment'] | null {
  const category = itemConfig.category

  if (category === ItemCategory.WEAPON) return 'weapon'
  if (category === ItemCategory.TOOL) return 'tool'

  if (category === ItemCategory.ARMOR && 'equipmentSlot' in itemConfig) {
    const slot = (itemConfig as { equipmentSlot: string }).equipmentSlot
    if (slot === 'body') return 'body'
    if (slot === 'head') return 'head'
    if (slot === 'hands') return 'hands'
    if (slot === 'feet') return 'feet'
    if (slot === 'back') return 'back'
    if (slot === 'neck') return 'neck'
    if (slot === 'finger') return 'finger'
  }

  return null
}
