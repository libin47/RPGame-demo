<!-- TradePanel.vue - 交易界面（购买商人商品 / 出售玩家物品） -->
<template>
  <div v-if="trader" class="trade-panel">
    <!-- 头部：商人信息 + 金币 -->
    <div class="tp-header">
      <div class="tp-header-info">
        <h2 class="tp-title">{{ trader.name }}</h2>
        <span class="tp-desc">{{ trader.description }}</span>
      </div>
      <span class="tp-gold">🪙 {{ playerState.gold }}</span>
    </div>

    <div class="tp-body">
      <!-- 购买区：商人商品 -->
      <section class="tp-section">
        <div class="tp-col-header">购买（商人出售）</div>
        <div class="tp-list">
          <div v-for="goods in visibleGoods" :key="goods.itemId" class="tp-row">
            <span class="tp-icon">{{ getItemEmoji(goods.itemId) }}</span>
            <span class="tp-name">{{ getItemName(goods.itemId) }}</span>
            <span class="tp-stock">库存 {{ goods.stock === -1 ? '∞' : goods.stock }}</span>
            <span class="tp-price">{{ getBuyPrice(goods) }} 🪙</span>
            <button
              class="tp-btn btn-buy"
              :disabled="!canBuy(goods)"
              @click="$emit('buy', goods.itemId, 1)"
            >
              购买
            </button>
          </div>
          <div v-if="visibleGoods.length === 0" class="tp-empty">商人没有可出售的商品</div>
        </div>
      </section>

      <!-- 出售区：玩家背包 -->
      <section class="tp-section">
        <div class="tp-col-header">出售（你的背包）</div>
        <div class="tp-list">
          <div v-for="inv in sellableItems" :key="inv.instanceId" class="tp-row">
            <span class="tp-icon">{{ getItemEmoji(inv.itemId) }}</span>
            <span class="tp-name">{{ getItemName(inv.itemId) }}</span>
            <span class="tp-stock">×{{ inv.quantity }}</span>
            <span class="tp-price">{{ getSellPrice(inv.itemId) }} 🪙</span>
            <button class="tp-btn btn-sell" @click="$emit('sell', inv.itemId, 1)">出售</button>
          </div>
          <div v-if="sellableItems.length === 0" class="tp-empty">没有可出售的物品</div>
        </div>
      </section>
    </div>

    <!-- 底部 -->
    <div class="tp-footer">
      <button class="action-btn btn-back" @click="$emit('close')">← 返回</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerState, PlayerInventoryItem } from '@/types/player'
import type { TraderConfig, TraderGoods } from '@/types/trade'
import { getRegistry, getVisibleGoods, calculateBuyPrice, calculateSellPrice } from '@/engine'

const props = defineProps<{
  traderId: string | null
  playerState: PlayerState
}>()

const emit = defineEmits<{
  /** 购买商品 */
  (e: 'buy', goodsItemId: string, quantity: number): void
  /** 出售物品 */
  (e: 'sell', itemId: string, quantity: number): void
  /** 关闭交易界面 */
  (e: 'close'): void
}>()

const registry = getRegistry()

/** 当前交易商人 */
const trader = computed<TraderConfig | undefined>(() =>
  props.traderId ? registry.getTrader(props.traderId) : undefined,
)

/** 商人可见商品（过滤 appearCondition 不满足的商品） */
const visibleGoods = computed<TraderGoods[]>(() =>
  trader.value ? getVisibleGoods(trader.value, props.playerState) : [],
)

/** 可出售的背包物品（排除已装备、不可出售、无基础价） */
const sellableItems = computed<PlayerInventoryItem[]>(() =>
  props.playerState.inventory.filter((i) => {
    if (i.equippedSlot) return false
    const config = registry.getItem(i.itemId)
    return !!config && config.isSellable && (config.basePrice ?? 0) > 0
  }),
)

/** 商品购买价 */
function getBuyPrice(goods: TraderGoods): number {
  return trader.value ? calculateBuyPrice(trader.value, goods, props.playerState) : 0
}

/** 物品出售价 */
function getSellPrice(itemId: string): number {
  return trader.value ? calculateSellPrice(trader.value, itemId, props.playerState) : 0
}

/** 是否可购买（金币充足且有库存） */
function canBuy(goods: TraderGoods): boolean {
  if (goods.stock !== -1 && goods.stock < 1) return false
  return props.playerState.gold >= getBuyPrice(goods)
}

/** 物品名称 */
function getItemName(itemId: string): string {
  return registry.getItem(itemId)?.name ?? itemId
}

/** 物品图标 */
function getItemEmoji(itemId: string): string {
  return registry.getItem(itemId)?.iconId ?? '❓'
}
</script>

<style scoped>
.trade-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: var(--panel-bg);
  font-family: 'FangSong', 'STFangsong', 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
}

/* 头部 */
.tp-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid var(--border-weak);
  background: var(--bar-bg);
  flex-shrink: 0;
}

.tp-header-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.tp-title {
  margin: 0;
  font-size: var(--font-lg);
  color: var(--text-primary);
}

.tp-desc {
  font-size: var(--font-xs);
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tp-gold {
  margin-left: auto;
  font-size: var(--font-md);
  color: #ffc107;
  white-space: nowrap;
}

/* 主体：购买/出售上下分栏 */
.tp-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 1.2rem;
  overflow: hidden;
  min-height: 0;
}

.tp-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.tp-col-header {
  font-size: var(--font-sm);
  color: var(--text-muted);
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--border-weak);
  margin-bottom: 0.3rem;
  flex-shrink: 0;
}

.tp-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* 交易行 */
.tp-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border: 1px solid var(--border-weak);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  min-width: 0;
}

.tp-row:hover {
  background: var(--accent-bg);
}

.tp-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.tp-name {
  font-size: var(--font-sm);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.tp-stock {
  font-size: var(--font-xs);
  color: var(--text-muted);
  flex-shrink: 0;
}

.tp-price {
  font-size: var(--font-sm);
  color: #ffc107;
  flex-shrink: 0;
}

.tp-btn {
  flex-shrink: 0;
  padding: 0.2rem 0.7rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tp-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.tp-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tp-btn.btn-buy {
  border-color: rgba(78, 205, 196, 0.5);
  background: rgba(78, 205, 196, 0.08);
  color: var(--accent);
}

.tp-btn.btn-buy:hover:not(:disabled) {
  background: rgba(78, 205, 196, 0.18);
}

.tp-btn.btn-sell {
  border-color: rgba(255, 193, 7, 0.5);
  background: rgba(255, 193, 7, 0.08);
  color: #ffc107;
}

.tp-btn.btn-sell:hover:not(:disabled) {
  background: rgba(255, 193, 7, 0.18);
}

.tp-empty {
  text-align: center;
  padding: 1rem;
  color: var(--text-muted);
  font-size: var(--font-xs);
  font-style: italic;
}

/* 底部 */
.tp-footer {
  padding: 0.5rem 1.2rem;
  border-top: 1px solid var(--border-weak);
  flex-shrink: 0;
}

.action-btn {
  padding: 0.4rem 1rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.btn-back {
  border-color: var(--border-mid);
}
</style>
