// src/engine/trade.ts
// 交易引擎：玩家与商人之间的买卖逻辑

import type { PlayerState } from '@/types/player'
import type { TraderConfig, TraderGoods } from '@/types/trade'
import { getRegistry } from './registry'
import { evaluateCondition } from './event'
import { addItem, removeItem } from './inventory'

/** 交易操作结果 */
export interface TradeResult {
  success: boolean
  message: string
  goldChanged?: number
  itemsChanged?: Array<{ itemId: string; quantity: number }>
}

/**
 * 获取商人可见的商品列表（过滤条件不满足的商品）
 */
export function getVisibleGoods(trader: TraderConfig, player: PlayerState): TraderGoods[] {
  return trader.goods.filter((goods) => {
    if (goods.appearCondition) {
      return evaluateCondition(goods.appearCondition, player)
    }
    return true
  })
}

/**
 * 计算商品的买入价格（玩家从商人处购买）
 * 价格 = 物品 basePrice × 商人 sellPriceMultiplier × 商品自定义倍率
 */
export function calculateBuyPrice(
  trader: TraderConfig,
  goods: TraderGoods,
  player: PlayerState,
): number {
  const registry = getRegistry()
  const item = registry.getItem(goods.itemId)
  if (!item) return 0

  let multiplier = trader.sellPriceMultiplier
  if (goods.customPriceMultiplier !== undefined) {
    multiplier = goods.customPriceMultiplier
  }

  // 应用价格浮动修正
  if (trader.priceModifiers) {
    for (const modifier of trader.priceModifiers) {
      if (evaluateCondition(modifier.condition, player)) {
        multiplier += modifier.sellPriceMultiplierModifier ?? 0
      }
    }
  }

  return Math.round(item.basePrice * multiplier)
}

/**
 * 计算商品的卖出价格（玩家卖给商人）
 * 价格 = 物品 basePrice × 商人 buyPriceMultiplier
 */
export function calculateSellPrice(
  trader: TraderConfig,
  itemId: string,
  player: PlayerState,
): number {
  const registry = getRegistry()
  const item = registry.getItem(itemId)
  if (!item) return 0

  let multiplier = trader.buyPriceMultiplier

  // 应用价格浮动修正
  if (trader.priceModifiers) {
    for (const modifier of trader.priceModifiers) {
      if (evaluateCondition(modifier.condition, player)) {
        multiplier += modifier.buyPriceMultiplierModifier ?? 0
      }
    }
  }

  return Math.round(item.basePrice * multiplier)
}

/**
 * 玩家从商人处购买物品
 *
 * @param player - 玩家状态（会被直接修改）
 * @param trader - 商人配置
 * @param goodsItemId - 要购买的商品ID
 * @param quantity - 购买数量
 * @returns 交易结果
 */
export function buyFromTrader(
  player: PlayerState,
  trader: TraderConfig,
  goodsItemId: string,
  quantity: number = 1,
): TradeResult {
  if (quantity <= 0) {
    return { success: false, message: '数量必须大于0' }
  }

  const goods = trader.goods.find((g) => g.itemId === goodsItemId)
  if (!goods) {
    return { success: false, message: '商品不存在' }
  }

  // 检查库存
  if (goods.stock !== -1 && goods.stock < quantity) {
    return { success: false, message: `库存不足（剩余 ${goods.stock}）` }
  }

  // 计算价格
  const unitPrice = calculateBuyPrice(trader, goods, player)
  const totalPrice = unitPrice * quantity

  // 检查金币
  if (player.gold < totalPrice) {
    return { success: false, message: `金币不足：需要 ${totalPrice}，当前 ${player.gold}` }
  }

  // 执行交易
  player.gold -= totalPrice
  addItem(player, goodsItemId, quantity)

  // 更新库存
  if (goods.stock !== -1) {
    goods.stock -= quantity
  }

  return {
    success: true,
    message: `购买了 ×${quantity}`,
    goldChanged: -totalPrice,
    itemsChanged: [{ itemId: goodsItemId, quantity }],
  }
}

/**
 * 玩家向商人出售物品
 *
 * @param player - 玩家状态（会被直接修改）
 * @param trader - 商人配置
 * @param itemId - 要出售的物品ID
 * @param quantity - 出售数量
 * @returns 交易结果
 */
export function sellToTrader(
  player: PlayerState,
  trader: TraderConfig,
  itemId: string,
  quantity: number = 1,
): TradeResult {
  if (quantity <= 0) {
    return { success: false, message: '数量必须大于0' }
  }

  // 检查玩家是否有足够物品
  const count = player.inventory.reduce((sum, inv) => {
    if (inv.itemId === itemId) {
      const isEquipped = Object.values(player.equipment).includes(itemId)
      return sum + (isEquipped ? 0 : inv.quantity)
    }
    return sum
  }, 0)

  if (count < quantity) {
    return { success: false, message: `物品不足（当前 ${count}）` }
  }

  // 计算价格
  const unitPrice = calculateSellPrice(trader, itemId, player)
  const totalPrice = unitPrice * quantity

  // 执行交易
  removeItem(player, itemId, quantity)
  player.gold += totalPrice

  return {
    success: true,
    message: `出售了 ×${quantity}，获得 ${totalPrice} 金币`,
    goldChanged: totalPrice,
    itemsChanged: [{ itemId, quantity: -quantity }],
  }
}
