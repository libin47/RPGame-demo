<!-- OngoingPanel.vue - 进行中（需要时间）制作面板
     与 RecipePanel / BuildPanel 风格一致，适配昼夜主题
     显示容器空位；点空位选配方开始；进行中可停止（退回原料）；完成后可收集 -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PlayerState } from '@/types/player'
import type { OngoingRecipe } from '@/types/ongoing'
import { getRegistry, getItemCount } from '@/engine'

const props = withDefaults(
  defineProps<{
    containerKey: string
    maxSlots: number
    deviceLevel: number
    deviceId: string | null
    playerState: PlayerState
    /** 标题，区分营地建筑与采集点 */
    title?: string
  }>(),
  { deviceLevel: 0, deviceId: null, title: '进行中的制作' },
)

const emit = defineEmits<{
  close: []
  start: [recipeId: string]
  cancel: [slotIndex: number]
  collect: [slotIndex: number]
}>()

const registry = getRegistry()

const picking = ref(false)

/** 该容器当前任务列表 */
const jobs = computed(() => props.playerState.progress.ongoingJobs[props.containerKey] ?? [])
/** 槽位 -> 任务 映射（0..maxSlots-1） */
const slotJobs = computed<Array<{ slotIndex: number; job?: (typeof jobs.value)[number] }>>(() => {
  const arr: Array<{ slotIndex: number; job?: (typeof jobs.value)[number] }> = []
  for (let i = 0; i < props.maxSlots; i++) {
    arr.push({ slotIndex: i, job: jobs.value.find((j) => j.slotIndex === i) })
  }
  return arr
})

function getRecipe(recipeId: string): OngoingRecipe | undefined {
  return registry.getOngoingRecipe(recipeId)
}

/** 本容器可选配方：仅 ONGOING，按 requiredDeviceId 过滤 */
const availableOngoing = computed<OngoingRecipe[]>(() =>
  Object.values(registry.getAllOngoingRecipes()).filter((r) => {
    const devIds = r.requirements.requiredDeviceId
    if (devIds && devIds.length > 0 && !devIds.includes(props.deviceId ?? '')) return false
    return true
  }),
)

function fmtTime(min: number): string {
  const total = Math.max(0, Math.round(min))
  if (total >= 1440) {
    const d = Math.floor(total / 1440)
    const h = Math.round((total % 1440) / 60)
    return h > 0 ? `${d} 天 ${h} 小时` : `${d} 天`
  }
  if (total >= 60) return `${Math.round(total / 60)} 小时`
  return `${total} 分钟`
}

function materialStr(recipe: OngoingRecipe): string {
  return (recipe.materials ?? [])
    .map((m) => `${registry.getItemName(m.itemId)} ×${m.quantity}`)
    .join('、')
}

function materialEnough(recipe: OngoingRecipe): boolean {
  return (recipe.materials ?? []).every(
    (m) => getItemCount(props.playerState, m.itemId) >= m.quantity,
  )
}

function onStart(recipeId: string): void {
  picking.value = false
  emit('start', recipeId)
}
</script>

<template>
  <div class="recipe-panel">
    <!-- 头部 -->
    <div class="rp-header">
      <h2 class="rp-title">{{ title }}</h2>
    </div>

    <div class="rp-body">
      <!-- 空位任务列表 -->
      <div v-if="!picking" class="rp-list">
        <div
          v-for="slot in slotJobs"
          :key="slot.slotIndex"
          class="rp-card"
          :class="{ 'op-slot-busy': !!slot.job }"
        >
          <div v-if="slot.job" class="rp-card-main">
            <!-- 名称行 -->
            <div class="rp-name-row">
              <span class="rp-name">{{
                getRecipe(slot.job.recipeId)?.name ?? slot.job.recipeId
              }}</span>
              <span class="rp-cost-badge time-badge" title="所需时间">
                ⏱
                {{ fmtTime(getRecipe(slot.job.recipeId)?.requirements.timeMinutes ?? 0) }}
              </span>
            </div>

            <!-- 进行中：进度 -->
            <template v-if="slot.job.status === 'crafting'">
              <div class="op-progress-row">
                <span class="op-progress-text">
                  {{ fmtTime(slot.job.elapsedMinutes) }} /
                  {{ fmtTime(getRecipe(slot.job.recipeId)?.requirements.timeMinutes ?? 1) }}
                </span>
                <div v-if="getRecipe(slot.job.recipeId)?.displayProgress" class="op-progress-bar">
                  <div
                    class="op-progress-in"
                    :style="{
                      width:
                        Math.min(
                          100,
                          (slot.job.elapsedMinutes /
                            (getRecipe(slot.job.recipeId)?.requirements.timeMinutes ?? 1)) *
                            100,
                        ) + '%',
                    }"
                  ></div>
                </div>
              </div>
            </template>
            <div v-else class="op-done">已完成，可收集</div>
          </div>

          <!-- 空位 -->
          <div v-else class="rp-card-main op-slot-empty">
            <span class="rp-name op-empty-label">空位 {{ slot.slotIndex + 1 }}</span>
          </div>

          <!-- 操作区 -->
          <div class="rp-card-action">
            <button
              v-if="slot.job?.status === 'crafting'"
              class="rp-execute-btn"
              @click="emit('cancel', slot.slotIndex)"
            >
              停止
            </button>
            <button
              v-else-if="slot.job?.status === 'completed'"
              class="rp-execute-btn"
              @click="emit('collect', slot.slotIndex)"
            >
              收集
            </button>
            <button v-else class="rp-execute-btn" @click="picking = true">选择配方</button>
          </div>
        </div>
      </div>

      <!-- 配方选择 -->
      <div v-else class="rp-list">
        <div v-if="availableOngoing.length === 0" class="rp-empty">暂无可用的配方</div>
        <div
          v-for="r in availableOngoing"
          :key="r.id"
          class="rp-card"
          :class="{ 'rp-disabled': !materialEnough(r) }"
        >
          <div class="rp-card-main">
            <div class="rp-name-row">
              <span class="rp-name">{{ r.name }}</span>
              <span class="rp-cost-badge time-badge" title="所需时间">
                ⏱{{ fmtTime(r.requirements.timeMinutes) }}
              </span>
            </div>
            <div class="rp-chips">
              <span
                v-for="m in r.materials"
                :key="m.itemId"
                class="material-item"
                :class="
                  getItemCount(props.playerState, m.itemId) >= m.quantity ? 'mat-ok' : 'mat-miss'
                "
              >
                {{ registry.getItemName(m.itemId) }}
                {{ getItemCount(props.playerState, m.itemId) }}/{{ m.quantity }}
              </span>
            </div>
            <div class="op-material-note">{{ materialStr(r) }}</div>
          </div>
          <div class="rp-card-action">
            <button class="rp-execute-btn" :disabled="!materialEnough(r)" @click="onStart(r.id)">
              {{ materialEnough(r) ? '开始' : '原料不足' }}
            </button>
          </div>
        </div>
        <button class="btn-return" @click="picking = false">返回空位</button>
      </div>
    </div>

    <!-- 底部返回 -->
    <div class="op-footer">
      <button class="btn-return" @click="$emit('close')">返回</button>
    </div>
  </div>
</template>

<style scoped>
.recipe-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: var(--panel-bg);
  font-family: 'FangSong', 'STFangsong', 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
}

/* 头部（与 RecipePanel 一致） */
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

/* 槽位/配方卡片 */
.rp-card {
  display: flex;
  gap: 0.6rem;
  padding: 0.7rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  transition: all var(--transition-fast);
}

.rp-card.rp-disabled {
  opacity: 0.55;
  border-color: var(--border-weak);
}

.op-slot-busy {
  border-color: var(--accent);
}

.rp-card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.rp-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rp-name {
  font-weight: bold;
  color: var(--text-primary);
}

.op-slot-empty {
  justify-content: center;
  color: var(--text-muted);
}

.op-empty-label {
  font-weight: normal;
  color: var(--text-muted);
}

/* 进度 */
.op-progress-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.op-progress-text {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.op-progress-bar {
  height: 8px;
  border-radius: var(--radius-sm);
  background: var(--btn-bg);
  overflow: hidden;
}

.op-progress-in {
  height: 100%;
  background: var(--accent);
  transition: width var(--transition-fast);
}

.op-done {
  color: var(--accent);
  font-size: var(--font-sm);
}

/* 材料 chips（复用 RecipePanel 命名） */
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

.op-material-note {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

/* 时间标记 */
.rp-cost-badge {
  font-size: var(--font-xs);
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
  white-space: nowrap;
  line-height: 1.3;
}

.time-badge {
  color: var(--recovery);
  background: var(--accent-bg);
}

/* 操作区 */
.rp-card-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

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

.rp-empty {
  text-align: center;
  padding: 1rem;
  color: var(--text-muted);
  font-size: var(--font-sm);
  font-style: italic;
}

/* 底部返回按钮 */
.op-footer {
  padding: 0.7rem 1.2rem;
  border-top: 1px solid var(--border-weak);
  background: var(--bar-bg);
}

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
  color: var(--accent);
  border-color: var(--accent);
}
</style>
