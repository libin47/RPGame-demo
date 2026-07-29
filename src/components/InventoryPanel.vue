<!-- InventoryPanel.vue - 背包面板（上-下布局，装备/属性底部固定） -->
<template>
  <div class="inventory-panel">
    <!-- ═══════ 负重行（固定） ═══════ -->
    <div class="weight-bar">
      <div class="weight-info">
        <span class="weight-label">负重</span>
        <span class="weight-value" :class="{ overloaded: isOverloaded }">
          {{ playerState.survival.carryWeight.toFixed(1) }} /
          {{ playerState.survival.maxCarryWeight.toFixed(1) }} kg
        </span>
        <span v-if="isOverloaded" class="overloaded-warn">超载！</span>
      </div>
      <div class="weight-track">
        <div
          class="weight-fill"
          :class="{ overloaded: isOverloaded }"
          :style="{ width: weightPercent + '%' }"
        ></div>
      </div>
    </div>

    <!-- ═══════ 物品区域（可滚动） ═══════ -->
    <div class="item-area">
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

      <!-- 物品网格（4列） -->
      <div class="item-grid">
        <div
          v-for="item in filteredItems"
          :key="item.instanceId"
          class="item-card"
          :class="{ 'item-equipped': isEquipped(item.itemId) }"
          @click="openDetail(item)"
        >
          <!-- 图标区 -->
          <div class="item-icon">
            <span class="icon-emoji">{{ getItemEmoji(item.itemId) }}</span>
            <span v-if="item.quantity > 1" class="icon-qty">×{{ item.quantity }}</span>
            <span class="icon-weight">{{ getItemStackWeight(item).toFixed(1) }}</span>
          </div>
          <div class="item-name">{{ getItemName(item.itemId) }}</div>
        </div>

        <div v-if="filteredItems.length === 0" class="empty-hint">（没有物品）</div>
      </div>
    </div>

    <!-- ═══════ 底部固定区：装备 + 属性 ═══════ -->
    <div class="bottom-section">
      <!-- 装备槽位（三列紧凑布局） -->
      <div class="equip-section">
        <div class="b-section-title">装备</div>
        <div class="equip-grid">
          <div v-for="slot in slotDefs" :key="slot.key" class="equip-cell">
            <span class="cell-icon">{{ slot.icon }}</span>
            <!-- <span class="cell-label">{{ slot.label }}:</span> -->
            <span class="cell-item" :class="{ empty: !getEquippedId(slot.key) }">
              {{ getEquippedId(slot.key) ? getItemName(getEquippedId(slot.key)!) : '空' }}
            </span>
            <button
              v-if="getEquippedId(slot.key)"
              class="cell-unequip"
              @click.stop="$emit('unequipItem', getEquippedId(slot.key)!)"
            >
              卸
            </button>
          </div>
        </div>
      </div>

      <!-- 属性汇总 -->
      <div class="stat-section">
        <div class="b-section-title">属性</div>
        <div class="stat-row">
          <span class="stat-label">近战伤害</span>
          <span class="stat-value">{{
            meleeDamage ? meleeDamage.min + ' - ' + meleeDamage.max : '无'
          }}</span>
          <span class="stat-sep">|</span>
          <span class="stat-label" v-for="(def, index) in defenseList" :key="def.key">
            {{ def.label }} <span class="stat-value">{{ def.value }}</span>
            <span v-if="index < defenseList.length - 1" class="stat-sep">|</span>
          </span>
        </div>
      </div>

      <!-- 关闭按钮 -->
      <div class="bottom-close">
        <button class="close-btn" @click="$emit('close')">关闭背包</button>
      </div>
    </div>

    <!-- ═══════ 物品详情弹窗 ═══════ -->
    <div v-if="detailItem" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-icon">{{ getItemEmoji(detailItem.itemId) }}</span>
          <span class="modal-title">{{ getItemName(detailItem.itemId) }}</span>
          <button class="modal-close" @click="closeDetail">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">{{ getItemDescription(detailItem.itemId) }}</p>
          <div class="modal-meta">
            <div class="meta-row">
              <span class="meta-label">类别</span>
              <span class="meta-value">{{ getCategoryLabel(detailItem.itemId) }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">重量</span>
              <span class="meta-value">{{ getItemWeight(detailItem.itemId) }} kg</span>
            </div>
            <div v-if="detailItem.quantity > 1" class="meta-row">
              <span class="meta-label">数量</span>
              <span class="meta-value">×{{ detailItem.quantity }}</span>
            </div>
            <div v-if="hasDurability(detailItem)" class="meta-row">
              <span class="meta-label">耐久</span>
              <span class="meta-value"
                >{{ detailItem.durability }}/{{ getMaxDurability(detailItem.itemId) }}</span
              >
            </div>
          </div>
          <div class="modal-actions">
            <button
              v-if="isUsable(detailItem.itemId)"
              class="action-btn btn-use"
              @click="onUseFromDetail"
            >
              {{ useActionLabel(detailItem.itemId) }}
            </button>
            <button
              v-if="isEquippable(detailItem.itemId) && !isEquipped(detailItem.itemId)"
              class="action-btn btn-equip"
              @click="onEquipFromDetail"
            >
              装备
            </button>
            <button
              v-if="isEquipped(detailItem.itemId)"
              class="action-btn btn-unequip"
              @click="onUnequipFromDetail"
            >
              卸下
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlayerState, PlayerInventoryItem } from '@/types/player'
import { ItemCategory } from '@/types/item'
import type { Item, WeaponItem } from '@/types/item'
import { getRegistry } from '@/engine'

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

// ═══════════════════════════════════════════
// 筛选
// ═══════════════════════════════════════════

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

const currentFilter = ref<string>('all')

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
// 负重
// ═══════════════════════════════════════════

const isOverloaded = computed<boolean>(() => {
  return props.playerState.survival.carryWeight >= props.playerState.survival.maxCarryWeight
})

const weightPercent = computed<number>(() => {
  return Math.min(
    100,
    (props.playerState.survival.carryWeight / props.playerState.survival.maxCarryWeight) * 100,
  )
})

// ═══════════════════════════════════════════
// 物品图标（emoji映射）
// ═══════════════════════════════════════════

const emojiMap: Record<string, string> = {
  多功能战术刀: '🔪',
  薄外套: '👕',
  防水布: '🏕️',
  尼龙绳: '🪢',
  压缩饼干: '🍪',
  矿泉水: '💧',
  止痛药: '💊',
  消毒酒精: '🧴',
  绷带: '🩹',
  信号弹: '🚀',
  笔记本: '📓',
  镜子: '🪞',
}

const categoryEmoji: Record<ItemCategory, string> = {
  [ItemCategory.WEAPON]: '⚔️',
  [ItemCategory.ARMOR]: '🛡️',
  [ItemCategory.TOOL]: '🔧',
  [ItemCategory.CONSUMABLE]: '📦',
  [ItemCategory.MATERIAL]: '🧱',
  [ItemCategory.VALUABLE]: '💎',
  [ItemCategory.DOCUMENT]: '📖',
  [ItemCategory.RECIPE]: '📜',
  [ItemCategory.MISC]: '📦',
}

function getItemEmoji(itemId: string): string {
  if (emojiMap[itemId]) return emojiMap[itemId]
  const config = registry.getItem(itemId)
  if (config) return categoryEmoji[config.category] || '📦'
  return '📦'
}

// ═══════════════════════════════════════════
// 物品工具方法
// ═══════════════════════════════════════════

function getItemConfig(itemId: string): Item | undefined {
  return registry.getItem(itemId)
}

function getItemName(itemId: string): string {
  return registry.getItemName(itemId)
}

function getItemDescription(itemId: string): string {
  const config = getItemConfig(itemId)
  return config?.description || '（无描述）'
}

function getItemWeight(itemId: string): number {
  const config = getItemConfig(itemId)
  return config?.weight ?? 0
}

function getItemStackWeight(item: PlayerInventoryItem): number {
  return getItemWeight(item.itemId) * item.quantity
}

function getCategoryLabel(itemId: string): string {
  const config = getItemConfig(itemId)
  if (!config) return '未知'
  const labels: Record<ItemCategory, string> = {
    [ItemCategory.WEAPON]: '武器',
    [ItemCategory.ARMOR]: '防具',
    [ItemCategory.TOOL]: '工具',
    [ItemCategory.CONSUMABLE]: '消耗品',
    [ItemCategory.MATERIAL]: '材料',
    [ItemCategory.VALUABLE]: '贵重品',
    [ItemCategory.DOCUMENT]: '文档',
    [ItemCategory.RECIPE]: '蓝图',
    [ItemCategory.MISC]: '杂项',
  }
  return labels[config.category] || '未知'
}

function isEquipped(itemId: string): boolean {
  return Object.values(props.playerState.equipment).includes(itemId)
}

function hasDurability(item: PlayerInventoryItem): boolean {
  return item.durability >= 0
}

function getMaxDurability(itemId: string): number {
  const config = getItemConfig(itemId)
  if (!config || !('durability' in config)) return -1
  const durConfig = (config as { durability?: { maxDurability?: number } }).durability
  return durConfig?.maxDurability ?? -1
}

// ═══════════════════════════════════════════
// 装备判定
// ═══════════════════════════════════════════

function isUsable(itemId: string): boolean {
  const config = getItemConfig(itemId)
  if (!config) return false
  return config.category === ItemCategory.CONSUMABLE || config.category === ItemCategory.DOCUMENT
}

function isEquippable(itemId: string): boolean {
  const config = getItemConfig(itemId)
  if (!config) return false
  return (
    config.category === ItemCategory.WEAPON ||
    config.category === ItemCategory.ARMOR ||
    config.category === ItemCategory.TOOL
  )
}

function useActionLabel(itemId: string): string {
  const config = getItemConfig(itemId)
  if (!config) return '使用'
  if (config.category === ItemCategory.DOCUMENT) return '阅读'
  return '使用'
}

// ═══════════════════════════════════════════
// 底部装备区
// ═══════════════════════════════════════════

interface SlotDef {
  key: string
  label: string
  icon: string
}

const slotDefs: SlotDef[] = [
  { key: 'weapon', label: '武器', icon: '⚔️' },
  { key: 'head', label: '头部', icon: '🪖' },
  { key: 'body', label: '身体', icon: '👕' },
  { key: 'hands', label: '手部', icon: '🧤' },
  { key: 'feet', label: '脚部', icon: '👢' },
  { key: 'back', label: '背部', icon: '🎒' },
  { key: 'neck', label: '颈部', icon: '📿' },
  { key: 'finger', label: '戒指', icon: '💍' },
  { key: 'light', label: '光源', icon: '🔦' },
]

function getEquippedId(slotKey: string): string | null {
  const equipment = props.playerState.equipment as Record<string, string | null>
  return equipment[slotKey] ?? null
}

// ═══════════════════════════════════════════
// 属性汇总
// ═══════════════════════════════════════════

interface DefenseEntry {
  key: string
  label: string
  value: number
}

const meleeDamage = computed<{ min: number; max: number } | null>(() => {
  const weaponId = props.playerState.equipment.weapon
  if (!weaponId) return null
  const config = getItemConfig(weaponId)
  if (!config || !('weaponStats' in config)) return null
  const stats = (config as WeaponItem).weaponStats
  const base = stats.baseDamage
  const variance = stats.damageVariance ?? 0
  return {
    min: Math.round(base * (1 - variance)),
    max: Math.round(base * (1 + variance)),
  }
})

const defenseList = computed<DefenseEntry[]>(() => {
  const defs = props.playerState.attributes.defenses
  const labels: Record<string, string> = {
    slashDefense: '斩击',
    bluntDefense: '钝击',
    rangedDefense: '远程',
    poisonDefense: '毒素',
    fireDefense: '火焰',
  }
  return Object.entries(defs)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      key,
      label: labels[key] || key,
      value,
    }))
})

// ═══════════════════════════════════════════
// 物品详情弹窗
// ═══════════════════════════════════════════

const detailItem = ref<PlayerInventoryItem | null>(null)

function openDetail(item: PlayerInventoryItem): void {
  detailItem.value = item
}

function closeDetail(): void {
  detailItem.value = null
}

function onUseFromDetail(): void {
  if (detailItem.value) {
    emit('useItem', detailItem.value.instanceId)
    closeDetail()
  }
}

function onEquipFromDetail(): void {
  if (detailItem.value) {
    emit('equipItem', detailItem.value.instanceId)
    closeDetail()
  }
}

function onUnequipFromDetail(): void {
  if (detailItem.value) {
    emit('unequipItem', detailItem.value.itemId)
    closeDetail()
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════
   容器
   ═══════════════════════════════════════════ */
.inventory-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #e0e0e0;
  background: #12122a;
}

/* ═══════════════════════════════════════════
   负重条
   ═══════════════════════════════════════════ */
.weight-bar {
  padding: 8px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.weight-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 12px;
}

.weight-label {
  color: #888;
}

.weight-value {
  color: #d0d0d0;
  font-weight: 500;
}
.weight-value.overloaded {
  color: #ff6b6b;
}

.overloaded-warn {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 11px;
}

.weight-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.weight-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4, #44b09e);
  border-radius: 2px;
  transition: width 0.3s ease;
}
.weight-fill.overloaded {
  background: linear-gradient(90deg, #ff6b6b, #e53935);
}

/* ═══════════════════════════════════════════
   物品区域（可滚动）
   ═══════════════════════════════════════════ */
.item-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.15);
  overflow-x: auto;
  flex-shrink: 0;
}

.filter-tab {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
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

/* 物品网格（4列） */
.item-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  align-content: start;
}

.item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.item-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  transform: translateY(-1px);
}
.item-card.item-equipped {
  border-color: rgba(78, 205, 196, 0.5);
  background: rgba(78, 205, 196, 0.04);
}

/* 图标区 */
.item-icon {
  position: relative;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 6px;
  flex-shrink: 0;
}
.icon-emoji {
  font-size: 24px;
  line-height: 1;
}
.icon-qty {
  position: absolute;
  right: 2px;
  bottom: 2px;
  font-size: 10px;
  color: #aaa;
  font-weight: 500;
  line-height: 1;
}
.icon-weight {
  position: absolute;
  left: 3px;
  bottom: 2px;
  font-size: 9px;
  color: #777;
  line-height: 1;
}

.item-name {
  font-size: 12px;
  color: #d0d0d0;
  text-align: center;
  line-height: 1.3;
  word-break: break-all;
}

.empty-hint {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 0;
  color: #555;
  font-size: 13px;
}

/* ═══════════════════════════════════════════
   底部固定区：装备 + 属性
   ═══════════════════════════════════════════ */
.bottom-section {
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.b-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #888;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* 装备三列网格 */
.equip-section {
  padding: 8px 16px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.equip-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px 12px;
  margin-top: 4px;
}

.equip-cell {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  padding: 2px 0;
}

.cell-icon {
  font-size: 12px;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}
.cell-label {
  color: #888;
  flex-shrink: 0;
}
.cell-item {
  flex: 1;
  color: #ccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.cell-item.empty {
  color: #555;
  font-style: italic;
}

.cell-unequip {
  padding: 1px 5px;
  font-size: 9px;
  border-radius: 2px;
  border: 1px solid rgba(255, 167, 38, 0.3);
  background: transparent;
  color: #ffa726;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
}
.cell-unequip:hover {
  background: rgba(255, 167, 38, 0.1);
  border-color: #ffa726;
}

/* 属性行 */
.stat-section {
  padding: 6px 16px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  margin-top: 4px;
}

.stat-label {
  color: #999;
}
.stat-value {
  color: #d0d0d0;
  font-weight: 500;
}
.stat-sep {
  color: #444;
  font-size: 11px;
}

/* 关闭按钮 */
.bottom-close {
  display: flex;
  justify-content: center;
  padding: 8px 16px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.close-btn {
  padding: 6px 28px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: #aaa;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.2);
}

/* ═══════════════════════════════════════════
   物品详情弹窗
   ═══════════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 360px;
  max-width: 90vw;
  background: #1a1a3a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.modal-icon {
  font-size: 22px;
}
.modal-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #f0f0f0;
}

.modal-close {
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  background: transparent;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.modal-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.modal-body {
  padding: 16px 18px;
}

.modal-desc {
  font-size: 14px;
  color: #d0d0d0;
  line-height: 1.7;
  margin: 0 0 16px;
  white-space: pre-wrap;
}

.modal-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  margin-bottom: 14px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.meta-label {
  color: #888;
}
.meta-value {
  color: #d0d0d0;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  padding: 8px 20px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #ccc;
  cursor: pointer;
  transition: all 0.15s;
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
</style>
