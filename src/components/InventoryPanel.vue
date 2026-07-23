<!-- InventoryPanel.vue - 背包面板
     显示玩家背包物品列表，支持按类别筛选，精简装备概况 -->
<template>
  <div class="inventory-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h2 class="panel-title">背包</h2>
      <span class="weight-info">
        负重 {{ playerState.survival.carryWeight.toFixed(1) }}/{{
          playerState.survival.maxCarryWeight.toFixed(1)
        }}
        kg
        <span v-if="isOverloaded" class="overloaded-warn">（超载！）</span>
      </span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <!-- ═══════ 当前装备概况 ═══════ -->
    <div class="equip-summary" v-if="equippedSlots.length > 0">
      <span class="summary-label">当前装备</span>
      <div class="summary-slots">
        <span
          v-for="slot in equippedSlots"
          :key="slot.key"
          class="summary-chip"
        >
          {{ slotLabel(slot.key) }}: {{ getItemName(slot.itemId!) }}
        </span>
      </div>
    </div>
    <div v-else class="equip-summary equip-empty">
      <span class="summary-label">当前装备</span>
      <span class="summary-none">（无）</span>
    </div>

    <!-- 筛选标签 -->
    <div class="filter-tabs">
      <button
        v-for="tab in filterTabs"
        :key="tab.key"
        class="filter-tab"
        :class="{ active: currentFilter === tab.key }"
        @click="currentFilter = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 物品列表 -->
    <div class="item-list">
      <div
        v-for="item in filteredItems"
        :key="item.instanceId"
        class="item-card"
        :class="{ 'item-equipped': isEquipped(item.itemId) }"
      >
        <div class="item-body" @click="onItemClick(item)">
          <div class="item-info">
            <span class="item-name">{{ getItemName(item.itemId) }}</span>
            <span v-if="isEquipped(item.itemId)" class="equipped-tag">已装备</span>
          </div>
          <div class="item-meta">
            <span class="item-qty">×{{ item.quantity }}</span>
            <span v-if="hasDurability(item)" class="item-durability">
              耐久 {{ item.durability }}/{{ getMaxDurability(item.itemId) }}
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="item-actions">
          <!-- 使用/阅读按钮 -->
          <button
            v-if="isUsable(item.itemId)"
            class="action-btn btn-use"
            @click.stop="$emit('useItem', item.instanceId)"
          >{{ useActionLabel(item.itemId) }}</button>
          <!-- 装备/卸下按钮 -->
          <button
            v-if="isEquippable(item.itemId) && !isEquipped(item.itemId)"
            class="action-btn btn-equip"
            @click.stop="$emit('equipItem', item.instanceId)"
          >装备</button>
          <button
            v-else-if="isEquipped(item.itemId)"
            class="action-btn btn-unequip"
            @click.stop="$emit('unequipItem', item.itemId)"
          >卸下</button>
        </div>
      </div>

      <div v-if="filteredItems.length === 0" class="empty-hint">（没有物品）</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlayerState, PlayerInventoryItem } from '@/types/player'
import { ItemCategory, EquipmentSlot } from '@/types/item'
import type { Item } from '@/types/item'
import { getRegistry } from '@/engine'
import type { ConsumableItem, DocumentItem, WeaponItem, ArmorItem, ToolItem } from '@/types/item'

const props = defineProps<{
  playerState: PlayerState
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'useItem', instanceId: string): void
  (e: 'equipItem', instanceId: string): void
  (e: 'unequipItem', itemId: string): void
}>()

const registry = getRegistry()

/** 筛选标签定义 */
interface FilterTab {
  key: string
  label: string
  category?: ItemCategory
}

const filterTabs: FilterTab[] = [
  { key: 'all', label: '全部' },
  { key: 'weapon', label: '武器', category: ItemCategory.WEAPON },
  { key: 'armor', label: '防具', category: ItemCategory.ARMOR },
  { key: 'consumable', label: '消耗品', category: ItemCategory.CONSUMABLE },
  { key: 'material', label: '材料', category: ItemCategory.MATERIAL },
  { key: 'tool', label: '工具', category: ItemCategory.TOOL },
  { key: 'valuable', label: '贵重品', category: ItemCategory.VALUABLE },
  { key: 'document', label: '文档', category: ItemCategory.DOCUMENT },
]

/** 当前选中的筛选标签 */
const currentFilter = ref<string>('all')

/** 根据筛选标签过滤物品 */
const filteredItems = computed<PlayerInventoryItem[]>(() => {
  const tab = filterTabs.find((t) => t.key === currentFilter.value)
  if (!tab || !tab.category) {
    return props.playerState.inventory.filter((i) => i)
  }
  return props.playerState.inventory.filter((i) => {
    if (!i) return false
    const config = registry.getItem(i.itemId)
    return config && config.category === tab.category
  })
})

// ═══════════════════════════════════════════
// 装备概况
// ═══════════════════════════════════════════

/** 有装备的槽位列表 */
const equippedSlots = computed<{ key: string; itemId: string | null }[]>(() => {
  const eq = props.playerState.equipment
  return Object.entries(eq)
    .filter(([, id]) => id !== null)
    .map(([key, itemId]) => ({ key, itemId }))
})

/** 装备槽位中文标签 */
const slotLabels: Record<string, string> = {
  weapon: '武器',
  offHand: '副手',
  head: '头部',
  body: '身体',
  hands: '手部',
  feet: '脚部',
  back: '背部',
  neck: '颈部',
  finger: '戒指',
  tool: '工具',
  light: '光源',
}

function slotLabel(key: string): string {
  return slotLabels[key] || key
}

// ═══════════════════════════════════════════
// 物品工具方法
// ═══════════════════════════════════════════

/** 获取物品配置 */
function getItemConfig(itemId: string): Item | undefined {
  return registry.getItem(itemId)
}

/** 获取物品名称 */
function getItemName(itemId: string): string {
  return registry.getItemName(itemId)
}

/** 判断物品是否已装备 */
function isEquipped(itemId: string): boolean {
  return Object.values(props.playerState.equipment).includes(itemId)
}

/** 是否超载 */
const isOverloaded = computed<boolean>(() => {
  return props.playerState.survival.carryWeight >= props.playerState.survival.maxCarryWeight
})

/** 是否有耐久度系统 */
function hasDurability(item: PlayerInventoryItem): boolean {
  return item.durability >= 0
}

/** 获取物品最大耐久度 */
function getMaxDurability(itemId: string): number {
  const config = getItemConfig(itemId)
  if (!config || !('durability' in config)) return -1
  const durConfig = (config as { durability?: { maxDurability?: number } }).durability
  return durConfig?.maxDurability ?? -1
}

// ═══════════════════════════════════════════
// 使用/装备判定
// ═══════════════════════════════════════════

/** 物品是否可使用（消耗品/文档） */
function isUsable(itemId: string): boolean {
  const config = getItemConfig(itemId)
  if (!config) return false
  return isConsumable(config) || isDocument(config)
}

function isConsumable(config: Item): config is ConsumableItem {
  return config.category === ItemCategory.CONSUMABLE
}

function isDocument(config: Item): config is DocumentItem {
  return config.category === ItemCategory.DOCUMENT
}

/** 物品是否可装备（武器/防具/工具） */
function isEquippable(itemId: string): boolean {
  const config = getItemConfig(itemId)
  if (!config) return false
  return (
    config.category === ItemCategory.WEAPON ||
    config.category === ItemCategory.ARMOR ||
    config.category === ItemCategory.TOOL
  )
}

/** 使用操作的文字标签 */
function useActionLabel(itemId: string): string {
  const config = getItemConfig(itemId)
  if (!config) return '使用'
  if (config.category === ItemCategory.DOCUMENT) return '阅读'
  return '使用'
}

/** 点击物品（预留：物品详情） */
function onItemClick(_item: PlayerInventoryItem): void {
  // 后续实现：打开物品详情弹窗
}
</script>

<style scoped>
.inventory-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #e0e0e0;
  background: #12122a;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #fff;
}

.weight-info {
  font-size: 12px;
  color: #aaa;
  margin-right: auto;
}

.overloaded-warn {
  color: #ff6b6b;
  font-weight: bold;
}

.close-btn {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  color: #aaa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

/* ═══════════════════════════════════════════
   装备概况
   ═══════════════════════════════════════════ */
.equip-summary {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
}

.equip-empty {
  align-items: center;
}

.summary-label {
  color: #888;
  white-space: nowrap;
  font-weight: 500;
  flex-shrink: 0;
}

.summary-none {
  color: #555;
  font-style: italic;
}

.summary-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.summary-chip {
  color: #b0b0b0;
  line-height: 1.4;
}

/* ═══════════════════════════════════════════
   筛选标签
   ═══════════════════════════════════════════ */
.filter-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.15);
  overflow-x: auto;
}

.filter-tab {
  padding: 4px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: transparent;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.filter-tab:hover {
  color: #ccc;
  border-color: rgba(255, 255, 255, 0.18);
}

.filter-tab.active {
  color: #64b5f6;
  border-color: #64b5f6;
  background: rgba(100, 181, 246, 0.1);
}

/* ═══════════════════════════════════════════
   物品列表
   ═══════════════════════════════════════════ */
.item-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}

.item-card {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: all 0.2s;
  gap: 8px;
}

.item-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.item-equipped {
  border-color: rgba(78, 205, 196, 0.4);
  border-left: 3px solid #4ecdc4;
}

.item-body {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  min-width: 0;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #d0d0d0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equipped-tag {
  font-size: 11px;
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.1);
  padding: 1px 8px;
  border-radius: 3px;
  flex-shrink: 0;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.item-qty {
  font-size: 13px;
  color: #999;
  font-weight: 500;
}

.item-durability {
  font-size: 11px;
  color: #777;
}

/* ═══════════════════════════════════════════
   操作按钮
   ═══════════════════════════════════════════ */
.item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #aaa;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.btn-use {
  color: #81c784;
  border-color: rgba(129, 199, 132, 0.3);
}
.btn-use:hover {
  background: rgba(129, 199, 132, 0.1);
  border-color: #81c784;
}

.btn-equip {
  color: #64b5f6;
  border-color: rgba(100, 181, 246, 0.3);
}
.btn-equip:hover {
  background: rgba(100, 181, 246, 0.1);
  border-color: #64b5f6;
}

.btn-unequip {
  color: #ffa726;
  border-color: rgba(255, 167, 38, 0.3);
}
.btn-unequip:hover {
  background: rgba(255, 167, 38, 0.1);
  border-color: #ffa726;
}

.empty-hint {
  text-align: center;
  padding: 50px 0;
  color: #555;
  font-size: 14px;
}
</style>
