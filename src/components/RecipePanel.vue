<!-- RecipePanel.vue - 制作/烹饪配方面板
     根据 mode 区分（craft / cook），显示对应配方列表
     不满足设备等级的配方直接隐藏
     视觉风格与 BuildPanel 保持一致 -->
<template>
  <div class="recipe-panel">
    <!-- 头部（只保留标题） -->
    <div class="rp-header">
      <h2 class="rp-title">{{ mode === 'craft' ? '制作' : '烹饪' }}</h2>
    </div>

    <div class="rp-body">
      <!-- 配方列表 -->
      <div class="rp-list">
        <div
          v-for="item in availableRecipes"
          :key="item.recipe.id"
          class="rp-card"
          :class="{ 'rp-disabled': !item.canExecute }"
        >
          <!-- 左侧内容区 -->
          <div class="rp-card-main">
            <!-- 名称 + 分类 -->
            <div class="rp-name-row">
              <span class="rp-name">{{ item.recipe.name }}</span>
              <span class="rp-category">{{ item.categoryLabel }}</span>
            </div>

            <!-- 材料需求（直接显示，无 section 标题 → 与 BuildPanel 一致） -->
            <div class="rp-chips">
              <span
                v-for="mat in item.materials"
                :key="mat.itemId"
                class="material-item"
                :class="mat.hasEnough ? 'mat-ok' : 'mat-miss'"
                >{{ mat.itemName }} {{ mat.current }}/{{ mat.required }}</span
              >
            </div>

            <!-- 消耗（体力等） -->
            <div v-if="item.costs.length > 0" class="rp-chips">
              <span
                v-for="c in item.costs"
                :key="c.type"
                class="cost-item"
                :class="c.hasEnough ? 'cost-ok' : 'cost-miss'"
                >{{ c.label }}: {{ c.current }}/{{ c.required }}</span
              >
            </div>

            <!-- 耗时 -->
            <div class="rp-time">{{ item.timeStr }}</div>
          </div>

          <!-- 操作区（右侧，与 BuildPanel 的 .build-action 一致） -->
          <div class="rp-card-action">
            <!-- 制作模式：批量数量调节 -->
            <div v-if="mode === 'craft'" class="rp-qty-row">
              <button
                class="qty-btn"
                @click="
                  item.qty = Math.max(
                    (item.recipe as import('@/types/craft').CraftRecipe).minCraftQuantity,
                    item.qty - 1,
                  )
                "
                :disabled="
                  item.qty <= (item.recipe as import('@/types/craft').CraftRecipe).minCraftQuantity
                "
              >
                −
              </button>
              <span class="qty-num">{{ item.qty }}</span>
              <button
                class="qty-btn"
                @click="item.qty = Math.min(maxQty(item), item.qty + 1)"
                :disabled="item.qty >= maxQty(item)"
              >
                +
              </button>
            </div>
            <!-- 烹饪模式：品质预览 -->
            <div v-else class="rp-quality">
              <span class="quality-label">{{ item.qualityName }}</span>
            </div>
            <button class="rp-execute-btn" :disabled="!item.canExecute" @click="onExecute(item)">
              {{ mode === 'craft' ? '制作' : '烹饪' }}
            </button>
          </div>
        </div>

        <!-- 无可用配方 -->
        <div v-if="availableRecipes.length === 0" class="rp-empty">
          当前没有可用的{{ mode === 'craft' ? '制作' : '烹饪' }}配方
        </div>
      </div>

      <!-- 返回按钮（加大，与 BuildPanel 一致） -->
      <button class="btn-return" @click="$emit('close')">返回</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PlayerState } from '@/types/player'
import type { CraftRecipe } from '@/types/craft'
import { CraftCategory } from '@/types/craft'
import type { CookRecipe } from '@/types/cook'
import {
  getRegistry,
  getItemCount,
  executeCraft,
  executeCook,
  calculateCookQuality,
} from '@/engine'
import type { CraftResult } from '@/engine'

const props = defineProps<{
  mode: 'craft' | 'cook'
  /** 当前建筑的等级 */
  deviceLevel: number
  /** 当前玩家状态（用于计算材料/属性检查） */
  playerState: PlayerState
}>()

const emit = defineEmits<{
  close: []
  execute: [result: CraftResult]
}>()

const registry = getRegistry()

// ============================================================
// 辅助函数
// ============================================================

function getSurvivalValue(costType: string): number {
  switch (costType) {
    case 'stamina':
      return props.playerState.survival.stamina
    case 'satiety':
      return props.playerState.survival.satiety
    case 'san':
      return props.playerState.survival.san
    case 'hp':
      return props.playerState.survival.hp
    default:
      return 0
  }
}

function getStaminaCoeff(): number {
  // 体力消耗系数 = 1 - maxSat 修正
  return Math.max(0.3, 1 - props.playerState.survival.satiety / 100)
}

// ============================================================
// 数据组装
// ============================================================

interface RecipeDisplayItem {
  recipe: CraftRecipe | CookRecipe
  categoryLabel: string
  materials: Array<{
    itemId: string
    itemName: string
    required: number
    current: number
    hasEnough: boolean
  }>
  costs: Array<{
    type: string
    label: string
    required: number
    current: number
    hasEnough: boolean
  }>
  timeStr: string
  canExecute: boolean
  qualityName: string
  /** 制作模式下批量数量（可变） */
  qty: number
}

const availableRecipes = computed<RecipeDisplayItem[]>(() => {
  if (props.mode === 'craft') {
    return buildCraftList()
  } else {
    return buildCookList()
  }
})

const categoryLabels: Partial<Record<CraftCategory, string>> = {
  [CraftCategory.WEAPON]: '武器',
  [CraftCategory.ARMOR]: '防具',
  [CraftCategory.TOOL]: '工具',
  [CraftCategory.AMMUNITION]: '弹药',
  [CraftCategory.CONSUMABLE]: '消耗品',
  [CraftCategory.BUILDING_COMPONENT]: '组件',
  [CraftCategory.CONTAINER]: '容器',
  [CraftCategory.TRAP]: '陷阱',
  [CraftCategory.LIGHT]: '照明',
  [CraftCategory.OTHER]: '其他',
}

function buildCraftList(): RecipeDisplayItem[] {
  const list: RecipeDisplayItem[] = []
  for (const [id, recipe] of Object.entries(registry.getAllCraftRecipes())) {
    // 设备等级过滤（不满足则隐藏）
    if (recipe.requiredDeviceLevel > props.deviceLevel) continue
    // 检查解锁
    if (!props.playerState.unlockedRecipes.craftRecipes.includes(id)) continue

    const materials = recipe.materials.map((m) => {
      const current = getItemCount(props.playerState, m.itemId)
      return {
        itemId: m.itemId,
        itemName: registry.getItemName(m.itemId),
        required: m.quantity,
        current,
        hasEnough: current >= m.quantity,
      }
    })

    const costs = recipe.costs.map((c) => {
      const current = getSurvivalValue(c.costType)
      const required = c.affectedByCoefficient ? Math.round(c.value * getStaminaCoeff()) : c.value
      return {
        type: c.costType,
        label: costLabelMap[c.costType] ?? c.costType,
        required,
        current,
        hasEnough: current >= required,
      }
    })

    const timeStr = formatTime(recipe.requirements.timeMinutes)
    const canExecute = materials.every((m) => m.hasEnough) && costs.every((c) => c.hasEnough)

    list.push({
      recipe,
      categoryLabel: categoryLabels[recipe.craftCategory] ?? '',
      materials,
      costs,
      timeStr,
      canExecute,
      qualityName: '',
      qty: recipe.minCraftQuantity,
    })
  }
  return list
}

function buildCookList(): RecipeDisplayItem[] {
  const list: RecipeDisplayItem[] = []
  for (const [id, recipe] of Object.entries(registry.getAllCookRecipes())) {
    if (recipe.requiredDeviceLevel > props.deviceLevel) continue
    if (!props.playerState.unlockedRecipes.cookRecipes.includes(id)) continue

    const materials = recipe.materials.map((m) => {
      const current = getItemCount(props.playerState, m.itemId)
      return {
        itemId: m.itemId,
        itemName: registry.getItemName(m.itemId),
        required: m.quantity,
        current,
        hasEnough: current >= m.quantity,
      }
    })

    const costs = recipe.costs.map((c) => {
      const current = getSurvivalValue(c.costType)
      const required = c.affectedByCoefficient ? Math.round(c.value * getStaminaCoeff()) : c.value
      return {
        type: c.costType,
        label: costLabelMap[c.costType] ?? c.costType,
        required,
        current,
        hasEnough: current >= required,
      }
    })

    const timeStr = formatTime(recipe.cookTimeMinutes)
    const canExecute = materials.every((m) => m.hasEnough) && costs.every((c) => c.hasEnough)

    const qualityLevel = calculateCookQuality(props.playerState, recipe)
    const qualityName = qualityLevel.name

    list.push({
      recipe,
      categoryLabel: '烹饪',
      materials,
      costs,
      timeStr,
      canExecute,
      qualityName,
      qty: 1,
    })
  }
  return list
}

/** 制作模式下最大批量数（受材料数量限制） */
function maxQty(item: RecipeDisplayItem): number {
  const r = item.recipe as CraftRecipe
  if (r.maxCraftQuantity === -1) {
    let maxByMat = 99
    for (const m of r.materials) {
      const count = getItemCount(props.playerState, m.itemId)
      const possible = Math.floor(count / m.quantity)
      maxByMat = Math.min(maxByMat, possible)
    }
    return Math.max(r.minCraftQuantity, Math.min(maxByMat, 99))
  }
  return r.maxCraftQuantity
}

const costLabelMap: Record<string, string> = {
  stamina: '体力',
  satiety: '饱食度',
  san: '理智',
  hp: '生命值',
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`
}

// ============================================================
// 执行
// ============================================================

function onExecute(item: RecipeDisplayItem): void {
  let result: CraftResult
  if (props.mode === 'craft') {
    result = executeCraft(props.playerState, item.recipe.id, item.qty)
  } else {
    result = executeCook(props.playerState, item.recipe.id)
  }
  emit('execute', result)
}
</script>

<style scoped>
.recipe-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.3);
}

/* ---- 头部（与 BuildPanel 一致） ---- */
.rp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.2);
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

/* ---- 配方列表 ---- */
.rp-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* 卡片：水平布局，与 BuildPanel 的 .build-card 一致 */
.rp-card {
  display: flex;
  gap: 0.6rem;
  padding: 0.7rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  transition: all var(--transition-fast);
}

.rp-card:not(.rp-disabled):hover {
  border-color: rgba(78, 205, 196, 0.4);
  background: rgba(255, 255, 255, 0.06);
}

.rp-disabled {
  opacity: 0.55;
  border-color: var(--border-weak);
}

/* 左侧内容区：与 BuildPanel 的 .build-main 一致 */
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

.rp-category {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

/* 材料/消耗 chips（复用 BuildPanel 的命名） */
.rp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.material-item,
.cost-item {
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  font-size: var(--font-xs);
}

.mat-ok,
.cost-ok {
  color: var(--text-muted);
}

.mat-miss {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

.cost-miss {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

/* 耗时 */
.rp-time {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

/* ---- 操作区（右侧，无上边框，与 BuildPanel 的 .build-action 一致） ---- */
.rp-card-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

/* 批量调节 */
.rp-qty-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.qty-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-mid);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.qty-num {
  min-width: 22px;
  text-align: center;
  font-size: var(--font-sm);
  color: var(--text-primary);
}

/* 品质预览 */
.rp-quality .quality-label {
  font-size: var(--font-xs);
  color: #ffd700;
}

/* 执行按钮（与 BuildPanel 的 .btn-build 一致） */
.rp-execute-btn {
  padding: 0.4rem 1rem;
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  background: rgba(78, 205, 196, 0.12);
  color: var(--accent);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.rp-execute-btn:hover:not(:disabled) {
  background: rgba(78, 205, 196, 0.25);
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

/* ---- 底部返回按钮（与 BuildPanel 一致） ---- */
.btn-return {
  display: block;
  width: 100%;
  padding: 0.6rem 1rem;
  margin-top: 0.8rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.btn-return:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}
</style>
