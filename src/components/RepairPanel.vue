<!-- RepairPanel.vue - 物品维修面板
     由建筑交互（repair 类型）进入
     显示背包中所有耐久度不满且可维修的物品实例，风格与制作/烹饪面板一致 -->
<template>
  <div class="repair-panel">
    <!-- 头部 -->
    <div class="rp-header">
      <h2 class="rp-title">维修</h2>
    </div>

    <div class="rp-body">
      <div class="rp-list">
        <div
          v-for="item in repairableItems"
          :key="item.instanceId"
          class="rp-card"
          :class="{ 'rp-disabled': !item.canRepair }"
        >
          <!-- 左侧内容区 -->
          <div class="rp-card-main">
            <!-- 名称行：名称 + 已装备 + 耐久度 -->
            <div class="rp-name-row">
              <span class="rp-name">{{ item.name }}</span>
              <span v-if="item.equipped" class="equipped-tag">已装备</span>
              <span class="rp-category"
                >耐久 {{ item.durability.current }}/{{ item.durability.max }}</span
              >
            </div>

            <!-- 耐久度条 -->
            <div class="dur-row">
              <div class="dur-track">
                <div
                  class="dur-fill"
                  :class="item.durability.className"
                  :style="{ width: item.durability.percent + '%' }"
                ></div>
              </div>
            </div>

            <!-- 修复材料 -->
            <div class="rp-chips">
              <span
                v-for="mat in item.repairMaterials"
                :key="mat.itemId"
                class="material-item"
                :class="mat.hasEnough ? 'mat-ok' : 'mat-miss'"
                >{{ mat.itemName }} {{ mat.current }}/{{ mat.required }}</span
              >
            </div>
          </div>

          <!-- 操作区（右侧） -->
          <div class="rp-card-action">
            <span class="repair-time">⏱10 分钟</span>
            <button
              class="rp-execute-btn"
              :disabled="!item.canRepair"
              @click="onRepair(item.instanceId)"
            >
              维修
            </button>
          </div>
        </div>

        <!-- 无可用物品 -->
        <div v-if="repairableItems.length === 0" class="rp-empty">背包中没有需要维修的物品</div>
      </div>

      <!-- 返回按钮 -->
      <button class="btn-return" @click="$emit('close')">返回</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerState } from '@/types/player'
import { getRegistry, getItemCount, getSubSceneStorageItemCount, getItemRepairInfo } from '@/engine'

const props = defineProps<{
  playerState: PlayerState
  /** 当前子场景ID（用于合并统计仓库材料，null 表示不在营地） */
  subSceneId: string | null
}>()

const emit = defineEmits<{
  close: []
  repair: [instanceId: string]
}>()

const registry = getRegistry()

// ============================================================
// 数据组装
// ============================================================

interface RepairDisplayItem {
  instanceId: string
  name: string
  equipped: boolean
  durability: {
    current: number
    max: number
    percent: number
    className: string
  }
  repairMaterials: Array<{
    itemId: string
    itemName: string
    required: number
    current: number
    hasEnough: boolean
  }>
  canRepair: boolean
}

/** 背包中耐久不满且可维修的物品实例 */
const repairableItems = computed<RepairDisplayItem[]>(() => {
  const result: RepairDisplayItem[] = []

  for (const invItem of props.playerState.inventory) {
    const info = getItemRepairInfo(invItem.itemId)
    if (!info) continue
    // 仅显示耐久不满的实例
    if (invItem.durability >= info.maxDurability) continue

    const materials = info.repairMaterials.map((m) => {
      const current =
        getItemCount(props.playerState, m.itemId) +
        (props.subSceneId
          ? getSubSceneStorageItemCount(props.playerState, props.subSceneId, m.itemId)
          : 0)
      return {
        itemId: m.itemId,
        itemName: registry.getItemName(m.itemId),
        required: m.quantity,
        current,
        hasEnough: current >= m.quantity,
      }
    })

    const current = invItem.durability
    const max = info.maxDurability
    const percent = Math.max(0, Math.round((current / max) * 100))

    result.push({
      instanceId: invItem.instanceId,
      name: registry.getItemName(invItem.itemId),
      equipped: !!invItem.equippedSlot,
      durability: {
        current,
        max,
        percent,
        className: percent > 60 ? 'dur-good' : percent > 30 ? 'dur-worn' : 'dur-bad',
      },
      repairMaterials: materials,
      canRepair: materials.every((m) => m.hasEnough),
    })
  }

  return result
})

// ============================================================
// 事件
// ============================================================

function onRepair(instanceId: string): void {
  emit('repair', instanceId)
}
</script>

<style scoped>
.repair-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: var(--panel-bg);
  font-family: 'FangSong', 'STFangsong', 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
}

/* ---- 头部（与制作/烹饪面板一致） ---- */
.rp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid var(--border-weak);
  background: var(--bar-bg);
}

.rp-title {
  margin: 0;
  font-size: var(--font-lg);
  color: var(--text-primary);
}

/* ---- 内容区 ---- */
.rp-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.2rem;
}

.rp-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* 卡片：水平布局，与 RecipePanel 的 .rp-card 一致 */
.rp-card {
  display: flex;
  gap: 0.6rem;
  padding: 0.7rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  transition: all var(--transition-fast);
}

.rp-card:not(.rp-disabled):hover {
  border-color: var(--accent);
  background: var(--card-hover);
}

.rp-disabled {
  opacity: 0.55;
  border-color: var(--border-weak);
}

.rp-card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

/* 名称行 */
.rp-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rp-name {
  font-weight: bold;
  color: var(--text-primary);
}

.equipped-tag {
  font-size: var(--font-xs);
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
  color: var(--rc-suf);
  background: var(--accent-bg);
  border: 1px solid var(--rc-suf);
  white-space: nowrap;
}

.rp-category {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

/* ---- 耐久度条 ---- */
.dur-row {
  width: 100%;
}

.dur-track {
  height: 8px;
  background: var(--sub-bg);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px var(--shadow);
}

.dur-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.dur-good {
  background: linear-gradient(90deg, #2ecc71, #4ecdc4);
}

.dur-worn {
  background: linear-gradient(90deg, #f39c12, #ffd54f);
}

.dur-bad {
  background: linear-gradient(90deg, #e74c3c, #ff6b6b);
}

/* 材料 chips（与 RecipePanel 一致） */
.rp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.material-item {
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-size: var(--font-xs);
}

.mat-ok {
  color: var(--text-muted);
}

.mat-miss {
  background: var(--danger-bg);
  color: var(--danger);
}

/* ---- 操作区（右侧） ---- */
.rp-card-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.repair-time {
  font-size: var(--font-xs);
  color: var(--link);
  white-space: nowrap;
}

/* 维修按钮（与 RecipePanel 的执行按钮一致） */
.rp-execute-btn {
  padding: 0.4rem 1rem;
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: var(--accent-bg);
  color: var(--accent);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.rp-execute-btn:hover:not(:disabled) {
  background: var(--accent-bg-hover);
}

.rp-execute-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* 空状态 */
.rp-empty {
  text-align: center;
  padding: 1rem;
  color: var(--text-muted);
  font-size: var(--font-sm);
  font-style: italic;
}

/* ---- 底部返回按钮 ---- */
.btn-return {
  display: block;
  width: 100%;
  padding: 0.6rem 1rem;
  margin-top: 0.8rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: var(--btn-bg);
  color: var(--text-secondary);
  font-size: var(--font-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.btn-return:hover {
  background: var(--card-hover);
  color: var(--text-primary);
}
</style>
