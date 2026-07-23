// src/runtime/usePlayer.ts
// 玩家状态代理：封装玩家操作的便捷接口，组合 engine 层函数和 registry 查询

import type { PlayerState, PlayerInventoryItem } from '@/types/player'
import type { Item } from '@/types/item'
import { ItemCategory } from '@/types/item'
import { getRegistry } from '@/engine'
import {
  addItem,
  removeItem,
  getItemCount,
  hasItem,
  equipItem as engineEquipItem,
  unequipSlot as engineUnequipSlot,
  unequipAll as engineUnequipAll,
  useConsumable,
  isOverloaded as engineIsOverloaded,
  getCarryWeightRate as engineGetCarryWeightRate,
  getItemsByCategory as engineGetItemsByCategory,
} from '@/engine'

/**
 * 使用玩家状态代理
 * 封装玩家状态操作，统一通过此接口访问 engine 层函数
 *
 * @param playerRef - 响应式玩家状态引用
 * @returns 玩家操作接口
 */
export function usePlayer(playerRef: { value: PlayerState }) {
  const registry = getRegistry()

  // ============================================================
  // 物品查询
  // ============================================================

  /** 获取物品配置 */
  function getItemConfig(itemId: string): Item | undefined {
    return registry.getItem(itemId)
  }

  /** 获取物品名称 */
  function getItemName(itemId: string): string {
    return registry.getItemName(itemId)
  }

  /** 获取背包中某物品总数量 */
  function getCount(itemId: string): number {
    return getItemCount(playerRef.value, itemId)
  }

  /** 检查是否有足够数量的某物品 */
  function hasEnough(itemId: string, quantity: number = 1): boolean {
    return hasItem(playerRef.value, itemId, quantity)
  }

  /** 按类别获取物品列表 */
  function getByCategory(category: ItemCategory): PlayerInventoryItem[] {
    return engineGetItemsByCategory(playerRef.value, category)
  }

  // ============================================================
  // 物品操作
  // ============================================================

  /** 添加物品到背包 */
  function add(itemId: string, quantity: number = 1): number {
    return addItem(playerRef.value, itemId, quantity)
  }

  /** 从背包移除物品 */
  function remove(itemId: string, quantity: number = 1): number {
    return removeItem(playerRef.value, itemId, quantity)
  }

  // ============================================================
  // 装备管理
  // ============================================================

  /** 装备物品 */
  function equip(instanceId: string): boolean {
    return engineEquipItem(playerRef.value, instanceId)
  }

  /** 卸下指定槽位的装备 */
  function unequip(slot: keyof PlayerState['equipment']): boolean {
    return engineUnequipSlot(playerRef.value, slot)
  }

  /** 卸下所有装备 */
  function unequipAll(): void {
    engineUnequipAll(playerRef.value)
  }

  /** 检查物品是否已装备 */
  function isEquipped(itemId: string): boolean {
    return Object.values(playerRef.value.equipment).includes(itemId)
  }

  // ============================================================
  // 使用物品
  // ============================================================

  /** 使用消耗品 */
  function useItem(instanceId: string): string {
    return useConsumable(playerRef.value, instanceId)
  }

  // ============================================================
  // 负重
  // ============================================================

  /** 是否超载 */
  function isOverloaded(): boolean {
    return engineIsOverloaded(playerRef.value)
  }

  /** 获取负重率 */
  function getCarryWeightRate(): number {
    return engineGetCarryWeightRate(playerRef.value)
  }

  // ============================================================
  // 耐久度
  // ============================================================

  /** 物品是否有耐久度 */
  function hasDurability(item: PlayerInventoryItem): boolean {
    return item.durability >= 0
  }

  /** 获取物品最大耐久度 */
  function getMaxDurability(itemId: string): number {
    const config = registry.getItem(itemId)
    if (!config || !('durability' in config)) return -1
    const durConfig = (config as { durability?: { maxDurability?: number } }).durability
    return durConfig?.maxDurability ?? -1
  }

  // ============================================================
  // 属性/状态查询
  // ============================================================

  /** 获取初始物品耐久度 */
  function getInitialDurability(itemId: string): number {
    const config = registry.getItem(itemId)
    if (!config || !('durability' in config)) return -1
    const durConfig = (config as { durability?: { initialDurability?: number } }).durability
    return durConfig?.initialDurability ?? -1
  }

  return {
    // 查询
    getItemConfig,
    getItemName,
    getCount,
    hasEnough,
    getByCategory,
    // 物品操作
    add,
    remove,
    // 装备
    equip,
    unequip,
    unequipAll,
    isEquipped,
    // 使用
    useItem,
    // 负重
    isOverloaded,
    getCarryWeightRate,
    // 耐久
    hasDurability,
    getMaxDurability,
    getInitialDurability,
  }
}
