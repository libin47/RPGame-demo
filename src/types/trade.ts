// trade.ts - 交易数据结构

import type { Condition } from './effect'

// ============================================================
// 商人配置
// ============================================================

/**
 * 商人配置
 * 定义交易NPC的基本信息、价格体系和商品清单。
 * 玩家可向商人出售任何非关键物品，商人只出售清单中的商品。
 */
export interface TraderConfig {
  /** 商人唯一ID */
  id: string
  /** 商人名称（显示用） */
  name: string
  /** 商人备注（开发者可见） */
  notes?: string

  /** 商人描述（交易界面展示） */
  description: string
  /** 商人立绘/头像资源ID */
  portraitImageId?: string

  // ============================================================
  // 价格体系
  // ============================================================

  /** 商人出售物品的价格倍率（最终售价 = 物品basePrice × 此倍率） */
  sellPriceMultiplier: number
  /** 商人收购物品的价格倍率（最终收购价 = 物品basePrice × 此倍率） */
  buyPriceMultiplier: number

  // ============================================================
  // 商品清单
  // ============================================================

  /** 商人出售的商品列表 */
  goods: TraderGoods[]

  // ============================================================
  // 交易条件
  // ============================================================

  /** 价格浮动条件（满足条件时价格变动） */
  priceModifiers?: TraderPriceModifier[]
}

// ============================================================
// 商品
// ============================================================

/**
 * 商人商品
 */
export interface TraderGoods {
  /** 物品ID */
  itemId: string
  /** 物品数量（-1=无限供应） */
  stock: number
  /** 补货周期（游戏内分钟数，-1=不自动补货，0=每次打开交易都刷新） */
  restockIntervalMinutes: number
  /** 补货数量（补货时恢复到多少库存） */
  restockAmount: number

  /** 此商品是否打折（覆盖商人全局价格倍率） */
  customPriceMultiplier?: number

  /** 商品出现条件（满足条件才出现在商品列表中） */
  appearCondition?: Condition
  /** 条件不满足时是否显示为"???"占位 */
  showPlaceholderWhenLocked: boolean
  /** 占位文本 */
  placeholderText?: string
}

// ============================================================
// 资金与价格
// ============================================================

/**
 * 价格浮动条件
 */
export interface TraderPriceModifier {
  /** 浮动条件 */
  condition: Condition
  /** 出售倍率修正（叠加到 sellPriceMultiplier） */
  sellPriceMultiplierModifier?: number
  /** 收购倍率修正（叠加到 buyPriceMultiplier） */
  buyPriceMultiplierModifier?: number
  /** 浮动描述（如"好感度高，价格优惠"） */
  description?: string
}

// ============================================================
// 交易注册表
// ============================================================

/**
 * 交易注册表
 */
export interface TradeRegistry {
  /** 所有商人配置，按ID索引 */
  traders: Record<string, TraderConfig>
}
