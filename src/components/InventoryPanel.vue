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
          :class="{ 'item-equipped': isEquipped(item) }"
          @click="openDetail(item)"
        >
          <!-- 图标区 -->
          <div class="item-icon">
            <span class="icon-emoji">{{ getItemEmoji(item.itemId) }}</span>
            <span v-if="isEquipped(item)" class="icon-equipped">🔒</span>
            <span v-if="item.quantity > 1" class="icon-qty">×{{ item.quantity }}</span>
            <span class="icon-weight">{{ getItemStackWeight(item).toFixed(1) }}</span>
          </div>
          <div class="item-name">{{ getItemName(item.itemId) }}</div>
          <!-- 耐久度条（仅带耐久的物品显示） -->
          <div
            v-if="hasDurability(item)"
            class="dur-bar"
            :class="durBarClass(item)"
            :title="`耐久 ${Math.floor(item.durability)}/${getMaxDurability(item.itemId)}`"
          >
            <div class="dur-fill" :style="{ width: durabilityPercent(item) + '%' }"></div>
          </div>
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
            {{ def.label }} <span class="stat-value">{{ Math.round(def.value * 100) }}%</span>
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
          <div v-if="!discardSelectorOpen" class="modal-actions">
            <button
              v-if="isUsable(detailItem.itemId)"
              class="action-btn btn-use"
              @click="onUseFromDetail"
            >
              {{ useActionLabel(detailItem.itemId) }}
            </button>
            <button
              v-if="detailItem && isEquippable(detailItem.itemId) && !isEquipped(detailItem)"
              class="action-btn btn-equip"
              @click="onEquipFromDetail"
            >
              装备
            </button>
            <button
              v-if="detailItem && isEquipped(detailItem)"
              class="action-btn btn-unequip"
              @click="onUnequipFromDetail"
            >
              卸下
            </button>
            <button
              v-if="detailItem && canDiscard(detailItem)"
              class="action-btn btn-discard"
              @click="openDiscardSelector"
            >
              丢弃
            </button>
          </div>

          <!-- 丢弃数量选择 -->
          <div v-else class="discard-selector">
            <div class="discard-title">丢弃数量</div>
            <div class="discard-control">
              <input v-model.number="discardQty" type="range" min="1" :max="maxDiscardableQty" />
              <span class="discard-qty">×{{ discardQty }}</span>
            </div>
            <div class="discard-notes">
              将丢弃 {{ discardQty }} 个{{ getItemName(detailItem!.itemId) }}（共
              {{ detailItem!.quantity }} 个）
            </div>
            <div class="discard-actions">
              <button class="action-btn" @click="closeDiscardSelector">取消</button>
              <button class="action-btn btn-discard-confirm" @click="confirmDiscard">
                确定丢弃
              </button>
            </div>
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
import { minDiceExpression, maxDiceExpression } from '@/engine/dice'
import { getRegistry, calcPlayerTotalDefense } from '@/engine'

const props = defineProps<{
  playerState: PlayerState
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'useItem', instanceId: string): void
  (e: 'equipItem', instanceId: string): void
  (e: 'unequipItem', itemId: string): void
  (e: 'discardItem', itemId: string, quantity: number): void
}>()

const registry = getRegistry()

// ═══════════════════════════════════════════
// 筛选
// ═══════════════════════════════════════════

interface FilterTab {
  key: string
  label: string
  category?: ItemCategory
  /** 自定义匹配（用于"其他"等非单一类别分组） */
  match?: (config: Item) => boolean
}

const filterTabs: FilterTab[] = [
  { key: 'all', label: '全部' },
  { key: 'equipment', label: '装备', match: isEquipmentType },
  { key: 'consumable', label: '消耗品', category: ItemCategory.CONSUMABLE },
  { key: 'item', label: '物品', match: isItemGroupType },
  { key: 'document', label: '文档', category: ItemCategory.DOCUMENT },
  { key: 'misc', label: '杂项', category: ItemCategory.MISC },
]

/** 装备组：武器 + 防具 */
function isEquipmentType(config: Item): boolean {
  return config.category === ItemCategory.WEAPON || config.category === ItemCategory.ARMOR
}

/** 物品组：材料 + 纯 BaseItem */
function isItemGroupType(config: Item): boolean {
  return config.category === ItemCategory.MATERIAL || isBaseItemType(config)
}

/** 判断物品是否为纯 BaseItem（不属于武器/防具/消耗品/材料/文档/杂项的其他物品） */
function isBaseItemType(config: Item): boolean {
  // 武器有 weaponStats 字段
  if ('weaponStats' in config) return false
  return !(
    config.category === ItemCategory.ARMOR ||
    config.category === ItemCategory.CONSUMABLE ||
    config.category === ItemCategory.MATERIAL ||
    config.category === ItemCategory.DOCUMENT ||
    config.category === ItemCategory.MISC
  )
}

const currentFilter = ref<string>('all')

const filteredItems = computed<PlayerInventoryItem[]>(() => {
  const tab = filterTabs.find((t) => t.key === currentFilter.value)
  if (!tab) return props.playerState.inventory.filter((i) => i)
  const list = props.playerState.inventory.filter((i) => {
    if (!i) return false
    const config = registry.getItem(i.itemId)
    if (!config) return false
    if (tab.match) return tab.match(config)
    if (tab.category) return config.category === tab.category
    return true
  })
  // 合并分组内的展示顺序：装备组武器在前、物品组材料在前
  const primary =
    tab.key === 'equipment'
      ? ItemCategory.WEAPON
      : tab.key === 'item'
        ? ItemCategory.MATERIAL
        : null
  if (primary) {
    return [...list].sort((a, b) => {
      const aCfg = registry.getItem(a.itemId)
      const bCfg = registry.getItem(b.itemId)
      const aRank = aCfg?.category === primary ? 0 : 1
      const bRank = bCfg?.category === primary ? 0 : 1
      return aRank - bRank
    })
  }
  return list
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

/** 该物品实例是否已装备（按实例判定：多件同名物品只有装备的那件才算已装备） */
function isEquipped(item: PlayerInventoryItem): boolean {
  return !!item.equippedSlot
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

/** 耐久剩余百分比（0~100，已破损为 0） */
function durabilityPercent(item: PlayerInventoryItem): number {
  const max = getMaxDurability(item.itemId)
  if (max <= 0) return 0
  return Math.max(0, Math.min(100, (item.durability / max) * 100))
}

/** 耐久条状态样式（>60 良好 / >30 警告 / ≤30 危险） */
function durBarClass(item: PlayerInventoryItem): string {
  const pct = durabilityPercent(item)
  if (pct > 60) return 'dur-high'
  if (pct > 30) return 'dur-mid'
  return 'dur-low'
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
  return config.category === ItemCategory.WEAPON || config.category === ItemCategory.ARMOR
}

function useActionLabel(itemId: string): string {
  const config = getItemConfig(itemId)
  if (!config) return '使用'
  if (config.category === ItemCategory.DOCUMENT) return '阅读'
  return '使用'
}

/**
 * 该物品实例是否可丢弃：
 * - 杂项（MISC）属于"不可交易丢弃的重要物品"，不可丢弃
 * - 已装备的物品实例不可丢弃
 * - 该物品ID当前有实例处于装备状态时同样不可丢弃（避免丢弃时误卸除穿上中的装备）
 */
function canDiscard(item: PlayerInventoryItem): boolean {
  const config = getItemConfig(item.itemId)
  if (!config) return false
  if (config.category === ItemCategory.MISC) return false
  if (item.equippedSlot) return false
  const equipment = props.playerState.equipment as unknown as Record<string, string | null>
  return !Object.values(equipment).some((id) => id === item.itemId)
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
  const equipment = props.playerState.equipment as unknown as Record<string, string | null>
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
  const dice = stats.baseDamage
  return {
    min: minDiceExpression(dice),
    max: maxDiceExpression(dice),
  }
})

const defenseList = computed<DefenseEntry[]>(() => {
  return Object.values(registry.getAllDamageTypes())
    .filter((dt) => dt.id !== 'realDamage')
    .map((dt) => ({
      key: dt.id,
      label: dt.name,
      value: calcPlayerTotalDefense(props.playerState, dt.id),
    }))
    .filter((entry) => entry.value > 0)
})

// ═══════════════════════════════════════════
// 物品详情弹窗
// ═══════════════════════════════════════════

const detailItem = ref<PlayerInventoryItem | null>(null)

function openDetail(item: PlayerInventoryItem): void {
  detailItem.value = item
  discardSelectorOpen.value = false
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

// ═══════════════════════════════════════════
// 丢弃数量选择
// ═══════════════════════════════════════════

const discardSelectorOpen = ref(false)
const discardQty = ref(1)

/** 可丢弃的最大数量（当前选中堆叠的数量，从1开始） */
const maxDiscardableQty = computed<number>(() => {
  return detailItem.value ? Math.max(1, detailItem.value.quantity) : 1
})

function openDiscardSelector(): void {
  if (!detailItem.value || !canDiscard(detailItem.value)) return
  discardQty.value = 1
  discardSelectorOpen.value = true
}

function closeDiscardSelector(): void {
  discardSelectorOpen.value = false
}

function confirmDiscard(): void {
  if (!detailItem.value || !canDiscard(detailItem.value)) return
  const qty = Math.max(1, Math.min(discardQty.value, maxDiscardableQty.value))
  emit('discardItem', detailItem.value.itemId, qty)
  closeDiscardSelector()
  closeDetail()
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
  color: var(--text-primary);
  background: var(--panel-bg);
  font-family: 'FangSong', 'STFangsong', 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
}

/* ═══════════════════════════════════════════
   负重条
   ═══════════════════════════════════════════ */
.weight-bar {
  padding: 8px 20px;
  background: var(--bar-bg);
  border-bottom: 1px solid var(--border-weak);
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
  color: var(--text-muted);
}

.weight-value {
  color: var(--text-primary);
  font-weight: 500;
}
.weight-value.overloaded {
  color: var(--danger);
}

.overloaded-warn {
  color: var(--danger);
  font-weight: bold;
  font-size: 11px;
}

.weight-track {
  height: 4px;
  background: var(--sub-bg);
  border-radius: 2px;
  overflow: hidden;
}

.weight-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
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
  border-bottom: 1px solid var(--border-weak);
  background: var(--sub-bg);
  overflow-x: auto;
  flex-shrink: 0;
}

.filter-tab {
  padding: 4px 12px;
  border: 1px solid var(--border-weak);
  border-radius: 14px;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.filter-tab:hover {
  color: var(--text-secondary);
  border-color: var(--border-mid);
}
.filter-tab.active {
  color: var(--special);
  border-color: var(--special);
  background: var(--special-bg);
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
  background: var(--card-bg);
  border: 1px solid var(--border-weak);
  border-radius: 8px;
  padding: 10px 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.item-card:hover {
  background: var(--card-hover);
  border-color: var(--border-mid);
  box-shadow: 0 2px 8px var(--shadow);
  transform: translateY(-1px);
}
.item-card.item-equipped {
  border-color: var(--accent);
  background: var(--accent-bg);
}

/* 图标区 */
.item-icon {
  position: relative;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bar-bg);
  border-radius: 8px;
  margin-bottom: 6px;
  flex-shrink: 0;
}
.icon-emoji {
  font-size: 24px;
  line-height: 1;
}
.icon-equipped {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 10px;
  line-height: 1;
  color: var(--accent);
  text-shadow: 0 0 4px var(--accent);
}
.icon-qty {
  position: absolute;
  right: 2px;
  bottom: 2px;
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 500;
  line-height: 1;
}
.icon-weight {
  position: absolute;
  left: 3px;
  bottom: 2px;
  font-size: 9px;
  color: var(--text-muted);
  line-height: 1;
}

.item-name {
  font-size: 12px;
  color: var(--text-primary);
  text-align: center;
  line-height: 1.3;
  word-break: break-all;
}

/* 耐久度条（卡片底部） */
.dur-bar {
  width: 100%;
  height: 4px;
  margin-top: 6px;
  border-radius: 2px;
  background: var(--sub-bg);
  overflow: hidden;
}

.dur-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #81c784, #66bb6a);
  transition: width 0.3s ease;
}

.dur-bar.dur-mid .dur-fill {
  background: linear-gradient(90deg, #ffb74d, #ffa726);
}

.dur-bar.dur-low .dur-fill {
  background: linear-gradient(90deg, #ff7043, #e53935);
}

.empty-hint {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
  font-size: 13px;
}

/* ═══════════════════════════════════════════
   底部固定区：装备 + 属性
   ═══════════════════════════════════════════ */
.bottom-section {
  flex-shrink: 0;
  background: var(--sub-bg);
  border-top: 1px solid var(--border-weak);
}

.b-section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* 装备三列网格 */
.equip-section {
  padding: 8px 16px 4px;
  border-bottom: 1px solid var(--border-weak);
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
  color: var(--text-muted);
  flex-shrink: 0;
}
.cell-item {
  flex: 1;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.cell-item.empty {
  color: var(--text-muted);
  font-style: italic;
}

.cell-unequip {
  padding: 1px 5px;
  font-size: 9px;
  border-radius: 2px;
  border: 1px solid var(--special);
  background: transparent;
  color: var(--special);
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.2;
}
.cell-unequip:hover {
  background: var(--special-bg);
  border-color: var(--special);
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
  color: var(--text-secondary);
}
.stat-value {
  color: var(--text-primary);
  font-weight: 500;
}
.stat-sep {
  color: var(--text-muted);
  font-size: 11px;
}

/* 关闭按钮（整行大按钮） */
.bottom-close {
  display: flex;
  padding: 10px 16px 12px;
  border-top: 1px solid var(--border-weak);
}

.close-btn {
  flex: 1;
  padding: 12px 0;
  border: 1px solid var(--border-mid);
  border-radius: 8px;
  background: var(--btn-bg);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 3px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}
.close-btn:hover {
  background: var(--card-hover);
  color: var(--text-primary);
  border-color: var(--border-mid);
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
  background: var(--panel-bg);
  border: 1px solid var(--border-mid);
  border-radius: 12px;
  box-shadow: 0 8px 32px var(--shadow-strong);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-weak);
}

.modal-icon {
  font-size: 22px;
}
.modal-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  padding: 4px 10px;
  border: 1px solid var(--border-weak);
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.modal-close:hover {
  color: var(--text-primary);
  background: var(--card-hover);
}

.modal-body {
  padding: 16px 18px;
}

.modal-desc {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.7;
  margin: 0 0 16px;
  white-space: pre-wrap;
}

.modal-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--sub-bg);
  border-radius: 6px;
  margin-bottom: 14px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.meta-label {
  color: var(--text-muted);
}
.meta-value {
  color: var(--text-primary);
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
  border: 1px solid var(--border-mid);
  background: var(--btn-bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn:hover {
  background: var(--card-hover);
}

.btn-use {
  color: var(--rc-suf);
  border-color: var(--rc-suf);
}
.btn-use:hover {
  background: var(--accent-bg);
  border-color: var(--rc-suf);
}

.btn-equip {
  color: var(--special);
  border-color: var(--special);
}
.btn-equip:hover {
  background: var(--special-bg-hover);
  border-color: var(--special);
}

.btn-unequip {
  color: var(--special);
  border-color: var(--special);
}
.btn-unequip:hover {
  background: var(--special-bg);
  border-color: var(--special);
}

.btn-discard {
  color: var(--danger);
  border-color: var(--danger);
}
.btn-discard:hover {
  background: var(--accent-bg);
  border-color: var(--danger);
}

/* 丢弃数量选择器 */
.discard-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.discard-title {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}
.discard-control {
  display: flex;
  align-items: center;
  gap: 10px;
}
.discard-control input[type='range'] {
  flex: 1;
  accent-color: var(--danger);
}
.discard-qty {
  font-size: 14px;
  font-weight: 600;
  color: var(--danger);
  min-width: 32px;
  text-align: right;
}
.discard-notes {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}
.discard-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.btn-discard-confirm {
  color: #fff;
  border-color: var(--danger);
  background: var(--danger);
}
.btn-discard-confirm:hover {
  background: #e53935;
  border-color: var(--danger);
}
</style>
