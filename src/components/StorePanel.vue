<!-- StorePanel.vue - 储物箱仓库界面
     上下分栏：上方仓库 → 下方背包，点击物品转移（每行4个） -->
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
      <!-- 上方：仓库 -->
      <section class="sp-section">
        <div class="sp-col-header">仓库（{{ usedSlots }}/{{ maxSlots }}）</div>
        <div class="sp-grid">
          <div
            v-for="item in storageItems"
            :key="item.instanceId"
            class="sp-item-card"
            :class="{ 'sp-slot-full': usedSlots >= maxSlots }"
            @click="onTransferToInventory(item)"
          >
            <span class="sp-item-icon">{{ getItemEmoji(item.itemId) }}</span>
            <span class="sp-item-name">{{ getItemName(item.itemId) }}</span>
            <span class="sp-item-meta">×{{ item.quantity }}</span>
          </div>
          <div v-if="storageItems.length === 0" class="sp-empty">仓库为空</div>
        </div>
      </section>

      <!-- 下方：背包（不显示杂项类别） -->
      <section class="sp-section">
        <div class="sp-col-header">
          背包（{{ playerState.survival.carryWeight.toFixed(1) }}/{{
            playerState.survival.maxCarryWeight.toFixed(1)
          }}
          kg）
        </div>
        <div class="sp-grid">
          <div
            v-for="item in playerInventory"
            :key="item.instanceId"
            class="sp-item-card"
            @click="onTransferToStorage(item)"
          >
            <span class="sp-item-icon">{{ getItemEmoji(item.itemId) }}</span>
            <span class="sp-item-name">{{ getItemName(item.itemId) }}</span>
            <span class="sp-item-meta">
              ×{{ item.quantity }}
              <span v-if="getItemWeight(item.itemId) > 0" class="sp-item-weight">
                {{ (getItemWeight(item.itemId) * item.quantity).toFixed(1) }}kg
              </span>
            </span>
          </div>
          <div v-if="playerInventory.length === 0" class="sp-empty">背包为空</div>
        </div>
      </section>
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
import { getStorageItems, getStorageUsedSlots, getStorageMaxSlots } from '@/engine'

const props = defineProps<{
  playerState: PlayerState
  subBuild: SubBuild
  subSceneId: string | null
  buildId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  /** 存入仓库（由 useGame 执行并提示） */
  (e: 'store', itemId: string, quantity: number): void
  /** 取出仓库（由 useGame 执行并提示） */
  (e: 'retrieve', instanceId: string, quantity: number): void
}>()

const registry = getRegistry()

/** 批量转移模式 */
const batchMode = ref(false)

/** 当前储物箱物品列表 */
const storageItems = computed<PlayerInventoryItem[]>(() => {
  if (!props.subSceneId) return []
  return getStorageItems(props.playerState, props.subSceneId, props.buildId)
})

/** 玩家背包物品（排除已装备的与杂项类别） */
const playerInventory = computed<PlayerInventoryItem[]>(() => {
  return props.playerState.inventory.filter((i) => {
    if (i.equippedSlot) return false
    const config = registry.getItem(i.itemId)
    return !config || config.category !== 'misc'
  })
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
  const qty = batchMode.value ? item.quantity : 1
  emit('store', item.itemId, qty)
}

/** 从仓库转移到背包 */
function onTransferToInventory(item: PlayerInventoryItem): void {
  if (!props.subSceneId) return
  const qty = batchMode.value ? item.quantity : 1
  emit('retrieve', item.instanceId, qty)
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
  background: var(--panel-bg);
  font-family: 'FangSong', 'STFangsong', 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
}

/* 头部 */
.sp-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid var(--border-weak);
  background: var(--bar-bg);
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

.sp-batch-toggle input[type='checkbox'] {
  accent-color: var(--accent);
}

.toggle-label {
  white-space: nowrap;
}

/* 主体：上下分栏（上方仓库、下方背包） */
.sp-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 1.2rem;
  overflow: hidden;
  min-height: 0;
}

.sp-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.sp-col-header {
  font-size: var(--font-sm);
  color: var(--text-muted);
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--border-weak);
  margin-bottom: 0.3rem;
  flex-shrink: 0;
}

/* 物品网格：每行4个（minmax(0,1fr) 防止内容撑宽列） */
.sp-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.3rem;
  align-content: start;
}

/* 物品卡片（纵向紧凑布局） */
.sp-item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.1rem;
  padding: 0.35rem 0.3rem;
  border: 1px solid var(--border-weak);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 0;
}

.sp-item-card:hover {
  background: var(--accent-bg);
  border-color: var(--accent);
}

.sp-item-card:active {
  transform: scale(0.98);
}

.sp-item-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.sp-item-name {
  font-size: var(--font-xs);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.sp-item-meta {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.sp-item-weight {
  margin-left: 0.25rem;
}

/* 空状态（占满整行） */
.sp-empty {
  grid-column: 1 / -1;
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
  background: var(--btn-bg);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--card-hover);
  color: var(--text-primary);
}

.btn-back {
  border-color: var(--border-mid);
}
</style>
