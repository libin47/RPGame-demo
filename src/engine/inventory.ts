// src/engine/inventory.ts
// 背包系统：物品增删查改、堆叠、负重计算、装备管理

import type { PlayerState, PlayerInventoryItem } from '@/types/player'
import type { Item, EquippableItem, AttributeModifier } from '@/types/item'
import { ItemCategory } from '@/types/item'
import { getRegistry } from './registry'
import { calcMaxCarryWeight, calcCarryWeightRate } from './formula'
import { getEffectResolver } from './effect'
import { EffectType, ItemChangeType, AttributeType } from '@/types/effect'
import type { Effect } from '@/types/effect'

// ============================================================
// 物品操作
// ============================================================

// ============================================================
// 物品获得监听（供 runtime 层订阅：获得物品时追加场景文本等）
// ============================================================

/** 物品获得监听器回调（参数：物品ID、实际添加数量） */
export type ItemAddedListener = (itemId: string, quantity: number) => void

const itemAddedListeners = new Set<ItemAddedListener>()

/**
 * 注册物品获得监听器
 * addItem 成功添加物品（实际添加数量 > 0）后触发
 *
 * @param listener - 回调，参数为物品ID与实际添加数量
 * @returns 注销函数
 */
export function onItemAdded(listener: ItemAddedListener): () => void {
  itemAddedListeners.add(listener)
  return () => {
    itemAddedListeners.delete(listener)
  }
}

/** 触发物品获得监听器 */
function notifyItemAdded(itemId: string, quantity: number): void {
  if (quantity <= 0) return
  for (const listener of itemAddedListeners) {
    listener(itemId, quantity)
  }
}

/**
 * 向背包添加物品
 * 自动处理堆叠和新实例创建
 * 堆叠规则（按物品配置 maxStackSize）：
 * - >1：限量堆叠，堆满后创建新实例
 * - =1 或 0：不可堆叠，每个实例仅 1 件
 * - <0：无限堆叠，单实例可容纳任意数量
 *
 * @param player - 玩家状态（会被直接修改）
 * @param itemId - 物品配置ID
 * @param quantity - 添加数量（默认1）
 * @returns 实际添加的数量
 */
export function addItem(
  player: PlayerState,
  itemId: string,
  quantity: number = 1,
  setText: boolean = true,
): number {
  if (quantity <= 0) return 0

  const registry = getRegistry()
  const itemConfig = registry.getItem(itemId)
  if (!itemConfig) return 0

  let remaining = quantity
  const maxStack = itemConfig.maxStackSize
  // maxStack < 0 表示无限堆叠（单实例可容纳任意数量）
  const infiniteStack = maxStack < 0
  const stackable = maxStack > 1 || infiniteStack

  if (stackable) {
    // 可堆叠物品：先尝试叠加到已有物品（跳过已装备的实例，新获得的物品保持未装备状态）
    for (const invItem of player.inventory) {
      if (invItem.itemId === itemId && !invItem.equippedSlot) {
        // 无限堆叠的实例可直接吸收全部剩余；否则需未满堆
        if (infiniteStack || invItem.quantity < maxStack) {
          const space = infiniteStack ? remaining : maxStack - invItem.quantity
          const toAdd = Math.min(remaining, space)
          invItem.quantity += toAdd
          remaining -= toAdd
          if (remaining <= 0) break
        }
      }
    }
  }

  // 剩余的创建新实例
  while (remaining > 0) {
    const stackSize = infiniteStack ? remaining : stackable ? Math.min(remaining, maxStack) : 1
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

  // 通知物品获得监听器（供 runtime 层追加场景文本等）
  const added = quantity - remaining
  if (added > 0 && setText) {
    notifyItemAdded(itemId, added)
  }

  return added
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

    // 若该实例已装备，先卸下对应槽位（避免"穿着中的装备被直接移除"）
    if (invItem.equippedSlot) {
      unequipSlot(player, invItem.equippedSlot as keyof PlayerState['equipment'])
    }

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
 * 应用/撤销一件装备提供的属性修正（写入对应的 *Modifier 字段）
 * 仅支持加法型修正；乘法型（multiply）暂不处理
 *
 * @param player - 玩家状态（会被直接修改）
 * @param itemConfig - 装备配置（武器/防具）
 * @param sign - 1 表示装备时应用，-1 表示卸下时撤销
 */
function applyEquipmentAttributeModifiers(
  player: PlayerState,
  itemConfig: Item,
  sign: 1 | -1,
): void {
  if (itemConfig.category !== ItemCategory.WEAPON && itemConfig.category !== ItemCategory.ARMOR) {
    return
  }
  // 收窄到武器/防具类型（两者才有 attributeModifiers 字段）
  if (!('attributeModifiers' in itemConfig)) return
  for (const m of itemConfig.attributeModifiers ?? []) {
    if (m.modifierType !== 'add') continue
    const value = m.value * sign
    switch (m.attribute) {
      case AttributeType.STRENGTH:
        player.attributes.strengthModifier += value
        break
      case AttributeType.AGILITY:
        player.attributes.agilityModifier += value
        break
      case AttributeType.INTELLIGENCE:
        player.attributes.intelligenceModifier += value
        break
      case AttributeType.CONSTITUTION:
        player.attributes.constitutionModifier += value
        break
      case AttributeType.LUCK:
        player.attributes.luckModifier += value
        break
    }
  }
}

/**
 * 装备物品
 *
 * @param player - 玩家状态（会被直接修改）
 * @param instanceId - 物品实例ID
 * @returns 是否装备成功
 */
export function equipItem(player: PlayerState, instanceId: string): boolean {
  const invItem = player.inventory.find((i) => i.instanceId === instanceId)
  if (!invItem) return false

  const registry = getRegistry()
  const itemConfig = registry.getItem(invItem.itemId)
  if (!itemConfig) return false

  // 获取装备槽位
  const slot = getSlotForItem(itemConfig)
  if (!slot) return false

  // 若该实例已装备到其他槽位，先卸下（避免同一实例重复装备）
  if (invItem.equippedSlot && invItem.equippedSlot !== slot) {
    unequipSlot(player, invItem.equippedSlot as keyof PlayerState['equipment'])
  }

  // 若当前槽位已装备的是另一个实例，先卸下旧装备（物品留在背包，仅清除标记）
  if (player.equipment[slot] && !isEquippedInstance(player, instanceId)) {
    unequipSlot(player, slot)
  }

  // 装备：装备栏存物品ID，背包实例标记槽位（物品仍留在背包，不互斥）
  player.equipment[slot] = invItem.itemId
  invItem.equippedSlot = slot

  // 应用装备提供的属性修正
  applyEquipmentAttributeModifiers(player, itemConfig, 1)

  return true
}

/**
 * 按物品ID装备（供效果层使用，如事件效果指定装备某件物品）
 * 优先装备背包中已有的未装备实例；背包中没有时先加入背包再装备（保持"效果凭空给予装备"的语义）
 *
 * @param player - 玩家状态（会被直接修改）
 * @param itemId - 物品配置ID
 * @returns 是否装备成功
 */
export function equipItemById(player: PlayerState, itemId: string): boolean {
  const registry = getRegistry()
  const itemConfig = registry.getItem(itemId)
  if (!itemConfig) return false

  const slot = getSlotForItem(itemConfig)
  if (!slot) return false

  // 优先装备背包中已有的未装备实例
  const target = player.inventory.find((i) => i.itemId === itemId && !i.equippedSlot)
  if (target) {
    return equipItem(player, target.instanceId)
  }

  // 背包中没有该物品：先加入背包再装备
  const added = addItem(player, itemId, 1)
  if (added <= 0) return false
  const newInst = player.inventory.find((i) => i.itemId === itemId && !i.equippedSlot)
  if (!newInst) return false
  return equipItem(player, newInst.instanceId)
}

/**
 * 判断物品实例是否已装备
 */
export function isEquippedInstance(player: PlayerState, instanceId: string): boolean {
  const invItem = player.inventory.find((i) => i.instanceId === instanceId)
  return !!invItem?.equippedSlot
}

/**
 * 卸下指定槽位的装备
 * 物品仍留在背包，仅清除背包实例的装备标记
 *
 * @param player - 玩家状态（会被直接修改）
 * @param slot - 装备槽位
 * @returns 是否卸下成功
 */
export function unequipSlot(player: PlayerState, slot: keyof PlayerState['equipment']): boolean {
  const itemId = player.equipment[slot]
  if (!itemId) return false

  // 撤销装备提供的属性修正
  const registry = getRegistry()
  const itemConfig = registry.getItem(itemId)
  if (itemConfig) {
    applyEquipmentAttributeModifiers(player, itemConfig, -1)
  }

  // 清除背包中对应实例的装备标记（装备栏存 itemId，通过 itemId+槽位反查实例）
  const equippedInst = player.inventory.find((i) => i.itemId === itemId && i.equippedSlot === slot)
  if (equippedInst) {
    equippedInst.equippedSlot = null
  }

  player.equipment[slot] = null

  return true
}

/**
 * 按物品ID卸下所有匹配槽位的装备（供效果层使用）
 *
 * @param player - 玩家状态（会被直接修改）
 * @param itemId - 物品配置ID
 * @returns 是否卸下了至少一件
 */
export function unequipByItemId(player: PlayerState, itemId: string): boolean {
  let removed = false
  for (const slot of Object.keys(player.equipment) as Array<keyof PlayerState['equipment']>) {
    if (player.equipment[slot] === itemId) {
      unequipSlot(player, slot)
      removed = true
    }
  }
  return removed
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
