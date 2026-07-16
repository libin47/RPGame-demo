<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useGameDispatch } from '@/composables/useGameDispatch'
import type { ItemDef } from '@/types/content'

const session = useSessionStore()
const { dispatch } = useGameDispatch()

const selectedItem = ref<{ item: ItemDef; count: number } | null>(null)

const totalWeight = computed(() =>
  session.inventory.state.slots
    .reduce(
      (sum: number, slot) =>
        sum + (session.content.items[slot.itemId]?.weight ?? 0) * slot.count,
      0,
    )
    .toFixed(1),
)

const weightPercent = computed(() =>
  (Number(totalWeight.value) / session.inventory.state.capacity) * 100,
)

type ItemCategory = 'food' | 'drink' | 'weapon' | 'armor' | 'equipment' | 'material'

const categoryOrder: Record<ItemCategory, number> = {
  food: 0,
  drink: 1,
  weapon: 2,
  armor: 3,
  equipment: 4,
  material: 5,
}

const categoryLabels: Record<ItemCategory, string> = {
  food: '食物',
  drink: '饮品',
  weapon: '武器',
  armor: '防具',
  equipment: '装备',
  material: '材料',
}

function getItemCategory(item: ItemDef): ItemCategory {
  const tags = item.tags ?? []
  if (tags.includes('food')) return 'food'
  if (tags.includes('drink')) return 'drink'
  if (item.weaponType || item.damage) return 'weapon'
  if (item.armor || item.warmth) return 'armor'
  if (item.equipSlot) return 'equipment'
  return 'material'
}

const sortedItems = computed(() => {
  return [...session.inventory.state.slots].sort((a, b) => {
    const itemA = session.content.items[a.itemId]
    const itemB = session.content.items[b.itemId]
    if (!itemA || !itemB) return 0
    const catA = getItemCategory(itemA)
    const catB = getItemCategory(itemB)
    if (categoryOrder[catA] !== categoryOrder[catB]) {
      return categoryOrder[catA] - categoryOrder[catB]
    }
    return itemA.name.localeCompare(itemB.name, 'zh-CN')
  })
})

const groupedItems = computed(() => {
  const groups: Record<ItemCategory, Array<{ slot: typeof session.inventory.state.slots[0]; item: ItemDef }>> = {
    food: [],
    drink: [],
    weapon: [],
    armor: [],
    equipment: [],
    material: [],
  }
  for (const slot of sortedItems.value) {
    const item = session.content.items[slot.itemId]
    if (item) {
      const category = getItemCategory(item)
      groups[category].push({ slot, item })
    }
  }
  return groups
})

function getUseButtonLabel(item: ItemDef): string {
  const tags = item.tags ?? []
  if (tags.includes('food')) return '食用'
  if (tags.includes('drink')) return '饮用'
  return '使用'
}

function openItemDetail(item: ItemDef, count: number) {
  selectedItem.value = { item, count }
}

function closeItemDetail() {
  selectedItem.value = null
}

const equipmentSlots: Array<{ key: string; label: string }> = [
  { key: 'head', label: '头部' },
  { key: 'body', label: '身体' },
  { key: 'legs', label: '腿部' },
  { key: 'hands', label: '手部' },
  { key: 'accessory', label: '饰品' },
]
</script>

<template>
  <div class="menu-screen">
    <div class="header">
      <button class="back-btn" @click="dispatch({ type: 'closeMenu' })">
        <span class="back-icon">←</span>
        返回
      </button>
      <h1 class="title">背包</h1>
      <div class="placeholder"></div>
    </div>
    
    <div class="content">
      <div class="weight-bar-container">
        <div class="weight-label">
          <span>负重</span>
          <span class="weight-value">{{ totalWeight }} / {{ session.inventory.state.capacity }}</span>
        </div>
        <div class="weight-bar-track">
          <span
            class="weight-bar-fill"
            :class="{ warning: weightPercent > 80, danger: weightPercent >= 100 }"
            :style="{ width: Math.min(weightPercent, 100) + '%' }"
          ></span>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">物品</h2>
        
        <template v-if="session.inventory.state.slots.length > 0">
          <div
            v-for="(items, category) in groupedItems"
            :key="category"
            v-show="items.length > 0"
            class="category-group"
          >
            <h3 class="category-title">{{ categoryLabels[category as ItemCategory] }}</h3>
            <div class="item-grid">
              <div
                v-for="{ slot, item } in items"
                :key="slot.itemId"
                class="item-card"
              >
                <button
                  class="item-icon-btn"
                  @click="openItemDetail(item, slot.count)"
                >
                  <span class="item-emoji">{{ item.emoji ?? '📦' }}</span>
                </button>
                <button
                  class="item-name-btn"
                  @click="openItemDetail(item, slot.count)"
                >
                  <span class="item-name">{{ item.name }}</span>
                </button>
                <span class="item-count">x{{ slot.count }}</span>
                <div class="item-actions">
                  <button
                    v-if="item.usable"
                    class="action-btn use"
                    @click="dispatch({ type: 'useItem', itemId: item.id })"
                  >
                    {{ getUseButtonLabel(item) }}
                  </button>
                  <button
                    v-if="item.equipSlot"
                    class="action-btn equip"
                    @click="dispatch({ type: 'equipItem', itemId: item.id })"
                  >
                    装备
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <div v-else class="empty-state">
          <span class="empty-icon">🎒</span>
          <span class="empty-text">背包空空如也</span>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">装备</h2>
        <div class="equipment-grid">
          <div
            v-for="eqSlot in equipmentSlots"
            :key="eqSlot.key"
            class="equipment-slot"
          >
            <span class="slot-label">{{ eqSlot.label }}</span>
            <div class="slot-content">
              <template v-if="session.player.state.equipment[eqSlot.key as keyof typeof session.player.state.equipment]">
                <span class="equip-emoji">
                  {{
                    session.content.items[
                      session.player.state.equipment[eqSlot.key as keyof typeof session.player.state.equipment]!
                    ]?.emoji ?? '🛡️'
                  }}
                </span>
                <span class="equip-name">
                  {{
                    session.content.items[
                      session.player.state.equipment[eqSlot.key as keyof typeof session.player.state.equipment]!
                    ]?.name ?? '未知'
                  }}
                </span>
                <button
                  class="unequip-btn"
                  @click="dispatch({ type: 'unequip', slot: eqSlot.key })"
                >
                  卸下
                </button>
              </template>
              <span v-else class="slot-empty">空</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="selectedItem" class="item-modal-overlay" @click="closeItemDetail">
      <div class="item-modal" @click.stop>
        <button class="modal-close" @click="closeItemDetail">✕</button>
        <div class="modal-icon">
          <span>{{ selectedItem.item.emoji ?? '📦' }}</span>
        </div>
        <h2 class="modal-name">{{ selectedItem.item.name }}</h2>
        <p class="modal-description">{{ selectedItem.item.description }}</p>
        <div class="modal-stats">
          <div class="stat-row">
            <span class="stat-label">数量</span>
            <span class="stat-value">x{{ selectedItem.count }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">重量</span>
            <span class="stat-value">{{ selectedItem.item.weight }}kg</span>
          </div>
          <div v-if="selectedItem.item.damage" class="stat-row">
            <span class="stat-label">伤害</span>
            <span class="stat-value danger">{{ selectedItem.item.damage }}</span>
          </div>
          <div v-if="selectedItem.item.armor" class="stat-row">
            <span class="stat-label">护甲</span>
            <span class="stat-value info">{{ selectedItem.item.armor }}</span>
          </div>
          <div v-if="selectedItem.item.warmth" class="stat-row">
            <span class="stat-label">保暖</span>
            <span class="stat-value accent">{{ selectedItem.item.warmth }}</span>
          </div>
          <div v-if="selectedItem.item.weaponType" class="stat-row">
            <span class="stat-label">类型</span>
            <span class="stat-value">{{ selectedItem.item.weaponType === 'melee' ? '近战武器' : selectedItem.item.weaponType === 'ranged' ? '远程武器' : '徒手' }}</span>
          </div>
          <div v-if="selectedItem.item.equipSlot" class="stat-row">
            <span class="stat-label">装备槽</span>
            <span class="stat-value">{{ selectedItem.item.equipSlot === 'head' ? '头部' : selectedItem.item.equipSlot === 'body' ? '身体' : selectedItem.item.equipSlot === 'legs' ? '腿部' : selectedItem.item.equipSlot === 'hands' ? '手部' : '饰品' }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button
            v-if="selectedItem.item.usable"
            class="modal-btn use"
            @click="dispatch({ type: 'useItem', itemId: selectedItem.item.id }); closeItemDetail()"
          >
            {{ getUseButtonLabel(selectedItem.item) }}
          </button>
          <button
            v-if="selectedItem.item.equipSlot"
            class="modal-btn equip"
            @click="dispatch({ type: 'equipItem', itemId: selectedItem.item.id }); closeItemDetail()"
          >
            装备
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.menu-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--ei-bg);
  color: var(--ei-text);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-top));
  background: var(--ei-gradient-panel);
  border-bottom: 1px solid var(--ei-border);
  box-shadow: var(--ei-shadow-sm);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  appearance: none;
  border: none;
  background: none;
  color: var(--ei-text-muted);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: var(--ei-radius-sm);
  transition: all var(--ei-transition-fast);
}

.back-btn:hover {
  color: var(--ei-text);
  background: rgba(255, 255, 255, 0.05);
}

.back-icon {
  font-size: 1rem;
}

.title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--ei-accent);
  letter-spacing: 0.05em;
}

.placeholder {
  width: 60px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: var(--ei-gradient-bg);
}

.weight-bar-container {
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-md);
  padding: 0.7rem 0.85rem;
  margin-bottom: 1rem;
}

.weight-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
  color: var(--ei-text-muted);
}

.weight-value {
  font-weight: 600;
  color: var(--ei-text);
}

.weight-bar-track {
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.weight-bar-fill {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--ei-accent);
  transition: width var(--ei-transition-normal);
}

.weight-bar-fill.warning {
  background: var(--ei-warning);
}

.weight-bar-fill.danger {
  background: var(--ei-danger);
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ei-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.8rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--ei-border);
}

.category-group {
  margin-bottom: 1rem;
}

.category-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ei-accent);
  margin-bottom: 0.5rem;
  padding-left: 0.3rem;
  border-left: 3px solid var(--ei-accent);
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.item-card {
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-md);
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  transition: all var(--ei-transition-fast);
}

.item-card:hover {
  border-color: var(--ei-border-light);
  box-shadow: var(--ei-shadow-sm);
}

.item-icon-btn {
  appearance: none;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}

.item-emoji {
  font-size: 1.8rem;
}

.item-name-btn {
  appearance: none;
  border: none;
  background: none;
  color: var(--ei-text);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: transparent;
  transition: all var(--ei-transition-fast);
}

.item-name-btn:hover {
  color: var(--ei-link);
  text-decoration-color: var(--ei-link);
}

.item-count {
  font-size: 0.72rem;
  color: var(--ei-text-muted);
}

.item-actions {
  display: flex;
  gap: 0.3rem;
  width: 100%;
  margin-top: 0.2rem;
}

.action-btn {
  flex: 1;
  appearance: none;
  border: 1px solid var(--ei-border);
  background: var(--ei-gradient-btn);
  color: var(--ei-text);
  padding: 0.25rem 0.35rem;
  font: inherit;
  font-size: 0.68rem;
  border-radius: var(--ei-radius-sm);
  cursor: pointer;
  transition: all var(--ei-transition-fast);
}

.action-btn:hover {
  background: var(--ei-gradient-btn-hover);
  border-color: var(--ei-border-light);
}

.action-btn.use {
  border-color: var(--ei-accent);
  background: rgba(90, 154, 106, 0.15);
  color: var(--ei-accent);
}

.action-btn.use:hover {
  background: rgba(90, 154, 106, 0.25);
}

.action-btn.equip {
  border-color: var(--ei-info);
  background: rgba(74, 154, 212, 0.15);
  color: var(--ei-info);
}

.action-btn.equip:hover {
  background: rgba(74, 154, 212, 0.25);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-md);
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.empty-text {
  font-size: 0.85rem;
  color: var(--ei-text-muted);
}

.equipment-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.equipment-slot {
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-sm);
  padding: 0.6rem;
}

.slot-label {
  display: block;
  font-size: 0.75rem;
  color: var(--ei-text-muted);
  margin-bottom: 0.25rem;
}

.slot-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.equip-emoji {
  font-size: 1.1rem;
}

.equip-name {
  flex: 1;
  font-size: 0.88rem;
  color: var(--ei-text);
}

.unequip-btn {
  appearance: none;
  border: 1px solid rgba(196, 74, 74, 0.4);
  background: rgba(196, 74, 74, 0.1);
  color: var(--ei-danger);
  padding: 0.25rem 0.5rem;
  font: inherit;
  font-size: 0.75rem;
  border-radius: var(--ei-radius-sm);
  cursor: pointer;
  transition: all var(--ei-transition-fast);
}

.unequip-btn:hover {
  background: rgba(196, 74, 74, 0.18);
  border-color: var(--ei-danger);
}

.slot-empty {
  font-size: 0.85rem;
  color: var(--ei-text-muted);
  font-style: italic;
}

.item-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.item-modal {
  background: var(--ei-gradient-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-lg);
  padding: 1.5rem;
  width: 85%;
  max-width: 360px;
  position: relative;
  box-shadow: var(--ei-shadow-lg);
}

.modal-close {
  appearance: none;
  border: none;
  background: none;
  color: var(--ei-text-muted);
  font-size: 1.2rem;
  position: absolute;
  top: 0.7rem;
  right: 0.7rem;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: var(--ei-radius-sm);
  transition: all var(--ei-transition-fast);
}

.modal-close:hover {
  color: var(--ei-text);
  background: rgba(255, 255, 255, 0.05);
}

.modal-icon {
  text-align: center;
  margin-bottom: 0.8rem;
}

.modal-icon span {
  font-size: 3rem;
}

.modal-name {
  text-align: center;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--ei-accent);
  margin-bottom: 0.8rem;
}

.modal-description {
  font-size: 0.9rem;
  color: var(--ei-text);
  line-height: 1.6;
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--ei-radius-sm);
}

.modal-stats {
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--ei-radius-sm);
  padding: 0.6rem;
  margin-bottom: 1rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--ei-border);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 0.82rem;
  color: var(--ei-text-muted);
}

.stat-value {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ei-text);
}

.stat-value.danger {
  color: var(--ei-danger);
}

.stat-value.info {
  color: var(--ei-info);
}

.stat-value.accent {
  color: var(--ei-accent);
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-btn {
  flex: 1;
  appearance: none;
  border: none;
  padding: 0.65rem;
  font: inherit;
  font-size: 0.9rem;
  border-radius: var(--ei-radius-md);
  cursor: pointer;
  transition: all var(--ei-transition-fast);
}

.modal-btn.use {
  background: var(--ei-gradient-accent);
  color: #f4f0e6;
}

.modal-btn.use:hover {
  background: var(--ei-gradient-accent-hover);
}

.modal-btn.equip {
  background: linear-gradient(180deg, #4a9ad4 0%, #3a8ac4 100%);
  color: #f4f0e6;
}

.modal-btn.equip:hover {
  background: linear-gradient(180deg, #5aabf4 0%, #4a9ad4 100%);
}
</style>
