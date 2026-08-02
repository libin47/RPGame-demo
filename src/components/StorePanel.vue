<!-- StorePanel.vue - 储物箱仓库界面
     左右分栏：左侧背包 → 右侧仓库，点击物品转移 -->
<template>
  <div class="store-panel">
    <!-- 头部 -->
    <div class="sp-header">
      <h2 class="sp-title">{{ subBuild.buildName }}</h2>
      <span class="sp-capacity">容量 {{ usedSlots }}/{{ maxSlots }}</span>
      <label class="sp-batch-toggle">
        <input type="checkbox" v-model="batchMode" />
        <span class="toggle-label">批量转移</span>
      </label>
    </div>

    <div class="sp-body">
      <!-- 左侧：背包 -->
      <div class="sp-column">
        <div class="sp-col-header">背包（{{ playerInventory.length }}）</div>
        <div class="sp-col-list">
          <div
            v-for="item in playerInventory"
            :key="item.instanceId"
            class="sp-item-card"
            @click="onTransferToStorage(item)"
          >
            <span class="sp-item-icon">{{ getItemEmoji(item.itemId) }}</span>
            <div class="sp-item-info">
              <span class="sp-item-name">{{ getItemName(item.itemId) }}</span>
              <span class="sp-item-meta">
                ×{{ item.quantity }}
                <span v-if="getItemWeight(item.itemId) > 0" class="sp-item-weight">
                  {{ (getItemWeight(item.itemId) * item.quantity).toFixed(1) }}kg
                </span>
              </span>
            </div>
          </div>
          <div v-if="playerInventory.length === 0" class="sp-empty">背包为空</div>
        </div>
      </div>

      <!-- 右侧：仓库 -->
      <div class="sp-column">
        <div class="sp-col-header">仓库（{{ usedSlots }}/{{ maxSlots }}）</div>
        <div class="sp-col-list">
          <div
            v-for="item in storageItems"
            :key="item.instanceId"
            class="sp-item-card"
            :class="{ 'sp-slot-full': usedSlots >= maxSlots }"
            @click="onTransferToInventory(item)"
          >
            <span class="sp-item-icon">{{ getItemEmoji(item.itemId) }}</span>
            <div class="sp-item-info">
              <span class="sp-item-name">{{ getItemName(item.itemId) }}</span>
              <span class="sp-item-meta">×{{ item.quantity }}</span>
            </div>
          </div>
          <div v-if="storageItems.length === 0" class="sp-empty">仓库为空</div>
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <div class="sp-footer">
      <button class="action-btn btn-back" @click="$emit('close')">← 返回</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlayerState, PlayerInventoryItem } from '@/types/player'
import type { SubBuild } from '@/types/build'
import { getRegistry } from '@/engine'
import {
  getStorageItems,
  getStorageUsedSlots,
  getStorageMaxSlots,
  addToStorage,
  removeFromStorage,
} from '@/engine'

const props = defineProps<{
  playerState: PlayerState
  subBuild: SubBuild
  subSceneId: string | null
  buildId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'log', message: string): void
}>()

const registry = getRegistry()

/** 批量转移模式 */
const batchMode = ref(false)

/** 当前储物箱物品列表 */
const storageItems = computed<PlayerInventoryItem[]>(() => {
  if (!props.subSceneId) return []
  return getStorageItems(props.playerState, props.subSceneId, props.buildId)
})

/** 玩家背包物品（排除已装备的） */
const playerInventory = computed<PlayerInventoryItem[]>(() => {
  return props.playerState.inventory.filter((i) => !i.equippedSlot)
})

/** 已用格数 */
const usedSlots = computed(() => {
  if (!props.subSceneId) return 0
  return getStorageUsedSlots(props.playerState, props.subSceneId, props.buildId)
})

/** 最大格数 */
const maxSlots = computed(() => {
  return getStorageMaxSlots(props.subBuild)
})

/** 从背包转移到仓库 */
function onTransferToStorage(item: PlayerInventoryItem): void {
  if (!props.subSceneId) return
  if (usedSlots.value >= maxSlots.value) {
    emit('log', '仓库已满')
    return
  }

  const qty = batchMode.value ? item.quantity : 1
  const added = addToStorage(props.playerState, props.subSceneId, props.buildId, item.itemId, qty)
  if (added > 0) {
    emit('log', `已将 ${registry.getItemName(item.itemId)} ×${added} 存入仓库`)
  }
}

/** 从仓库转移到背包 */
function onTransferToInventory(item: PlayerInventoryItem): void {
  if (!props.subSceneId) return

  const qty = batchMode.value ? item.quantity : 1
  const removed = removeFromStorage(
    props.playerState,
    props.subSceneId,
    props.buildId,
    item.instanceId,
    qty,
  )
  if (removed > 0) {
    emit('log', `已将 ${registry.getItemName(item.itemId)} ×${removed} 取出仓库`)
  }
}

function getItemName(itemId: string): string {
  return registry.getItemName(itemId)
}

function getItemEmoji(itemId: string): string {
  const config = registry.getItem(itemId)
  if (!config) return '📦'
  const categoryEmoji: Record<string, string> = {
    weapon: '⚔️',
    armor: '🛡️',
    tool: '🔧',
    consumable: '📦',
    material: '🧱',
    valuable: '💎',
    document: '📖',
    recipe: '📜',
    misc: '📦',
  }
  return categoryEmoji[config.category] || '📦'
}

function getItemWeight(itemId: string): number {
  const config = registry.getItem(itemId)
  return config?.weight ?? 0
}
</script>

<style scoped>
.store-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.3);
}

/* 头部 */
.sp-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.sp-title {
  margin: 0;
  font-size: var(--font-lg);
  color: var(--text-primary);
}

.sp-capacity {
  font-size: var(--font-sm);
  color: var(--text-muted);
  margin-left: auto;
}

/* 批量转移开关 */
.sp-batch-toggle {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--font-xs);
  color: var(--text-muted);
  cursor: pointer;
  user-select: none;
}

.sp-batch-toggle input[type="checkbox"] {
  accent-color: var(--accent);
}

.toggle-label {
  white-space: nowrap;
}

/* 主体：左右分栏 */
.sp-body {
  flex: 1;
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 1.2rem;
  overflow: hidden;
  min-height: 0;
}

.sp-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sp-col-header {
  font-size: var(--font-sm);
  color: var(--text-muted);
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--border-weak);
  margin-bottom: 0.3rem;
  flex-shrink: 0;
}

.sp-col-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* 物品卡片 */
.sp-item-card {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--border-weak);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sp-item-card:hover {
  background: rgba(78, 205, 196, 0.06);
  border-color: rgba(78, 205, 196, 0.3);
}

.sp-item-card:active {
  transform: scale(0.98);
}

.sp-item-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  width: 1.6rem;
  text-align: center;
}

.sp-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.sp-item-name {
  font-size: var(--font-sm);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-item-meta {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.sp-item-weight {
  margin-left: 0.3rem;
}

/* 空状态 */
.sp-empty {
  text-align: center;
  padding: 1rem;
  color: var(--text-muted);
  font-size: var(--font-xs);
  font-style: italic;
}

/* 底部 */
.sp-footer {
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