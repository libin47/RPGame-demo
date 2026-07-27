<!-- BuildPanel.vue - 建造面板
     显示当前营地的已有建筑和可建造的配方列表 -->
<template>
  <div class="build-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <h2 class="panel-title">建造 - {{ subScene?.name || '营地' }}</h2>
      <button class="btn-back" @click="$emit('close')">返回场景</button>
    </div>

    <div class="panel-body">
      <!-- ==================== 已有建筑 ==================== -->
      <div class="section" v-if="existingBuildings.length > 0">
        <h3 class="section-title">已有建筑</h3>
        <div class="building-grid">
          <div
            v-for="bld in existingBuildings"
            :key="bld.buildingId"
            class="building-card existing"
          >
            <div class="building-icon">{{ getCategoryIcon(bld.buildingType) }}</div>
            <div class="building-info">
              <span class="building-name">{{ bld.buildingName }}</span>
              <p class="building-desc">{{ bld.descriptionConfig.description }}</p>
            </div>
            <!-- 建筑提供的交互 -->
            <div v-if="bld.providedInteractions?.length" class="provided-actions">
              <span
                v-for="act in bld.providedInteractions"
                :key="act.interactionId"
                class="action-tag"
              >{{ act.interactionName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 可建造配方 ==================== -->
      <div class="section">
        <h3 class="section-title">可建造</h3>
        <div v-if="availableRecipes.length === 0" class="empty-hint">
          当前营地没有可建造的项目
        </div>
        <div class="recipe-list" v-else>
          <div
            v-for="recipe in availableRecipes"
            :key="recipe.id"
            class="recipe-card"
            :class="{ 'recipe-disabled': !recipe.canBuild }"
          >
            <div class="recipe-icon">{{ getCategoryIcon(recipe.buildCategory) }}</div>
            <div class="recipe-main">
              <div class="recipe-header">
                <span class="recipe-name">{{ recipe.name }}</span>
                <span class="recipe-time">⏱ {{ recipe.requirements.timeMinutes }}分钟</span>
              </div>
              <p class="recipe-desc">{{ recipe.buildResult.descriptionConfig.description }}</p>
              <!-- 材料 -->
              <div class="recipe-materials">
                <span
                  v-for="mat in recipe.materialDetails"
                  :key="mat.itemId"
                  class="material-item"
                  :class="{ 'material-sufficient': mat.hasEnough, 'material-insufficient': !mat.hasEnough }"
                >
                  {{ mat.itemName }} {{ mat.current }}/{{ mat.required }}
                </span>
              </div>
              <!-- 消耗 -->
              <div class="recipe-costs" v-if="recipe.costDetails.length">
                <span
                  v-for="cost in recipe.costDetails"
                  :key="cost.type"
                  class="cost-item"
                  :class="{ 'cost-sufficient': cost.hasEnough, 'cost-insufficient': !cost.hasEnough }"
                >
                  {{ cost.label }}: {{ cost.current }}/{{ cost.required }}
                </span>
              </div>
              <!-- 不满足原因 -->
              <p v-if="recipe.failReason" class="fail-reason">{{ recipe.failReason }}</p>
            </div>
            <div class="recipe-action">
              <button
                class="btn-build"
                :disabled="!recipe.canBuild"
                @click="onBuild(recipe.id)"
              >建造</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部消息 -->
      <p v-if="logMessage" class="log-message">{{ logMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SubScene } from '@/types/scene'
import type { PlayerState } from '@/types/player'
import type { BuildRecipe } from '@/types/build'
import type { BuildResult, BuildCategory } from '@/types/building'
import { getRegistry } from '@/engine'
import { canCraftRecipe } from '@/engine'

const props = defineProps<{
  subScene: SubScene | null
  playerState: PlayerState
  logMessage: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'build', recipeId: string): void
}>()

const registry = getRegistry()

// ============================================================
// 计算：当前营地已有建筑（buildingInit + 已建造）
// ============================================================
const existingBuildings = computed<BuildResult[]>(() => {
  const ss = props.subScene
  if (!ss) return []

  // 初始建筑
  const initIds: string[] = ss.buildingInit ?? []
  // 运行时已建造的建筑
  const subSceneId = ss.id
  const builtIds: string[] = props.playerState.progress.campBuildings[subSceneId] ?? []

  // 合并去重
  const allIds = new Set([...initIds, ...builtIds])
  const results: BuildResult[] = []
  for (const id of allIds) {
    const building = registry.getBuilding(id)
    if (building) results.push(building)
  }
  return results
})

// ============================================================
// 计算：可建造的配方列表
// ============================================================
interface RecipeDisplayItem {
  id: string
  name: string
  buildCategory: BuildCategory
  requirements: BuildRecipe['requirements']
  buildResult: BuildResult
  /** 是否可以建造（满足所有条件） */
  canBuild: boolean
  /** 失败原因（不能建造时的原因） */
  failReason: string | null
  /** 材料详情（含当前数量） */
  materialDetails: Array<{
    itemId: string
    itemName: string
    required: number
    current: number
    hasEnough: boolean
  }>
  /** 消耗详情（含当前值） */
  costDetails: Array<{
    type: string
    label: string
    required: number
    current: number
    hasEnough: boolean
  }>
}

const availableRecipes = computed<RecipeDisplayItem[]>(() => {
  const ss = props.subScene
  if (!ss) return []

  const allowedIds = ss.buildingList ?? []
  // 如果没有指定 buildingList，显示所有已解锁的配方
  const allBuildRecipes = registry.getAllBuildRecipes()

  // 当前已存在的建筑ID
  const existIds = new Set(existingBuildings.value.map((b) => b.buildingId))

  const result: RecipeDisplayItem[] = []

  for (const recipe of allBuildRecipes) {
    // 过滤：如果指定了 buildingList，只显示允许的
    if (allowedIds.length > 0 && !allowedIds.includes(recipe.id)) continue

    // 过滤：未解锁的
    if (!props.playerState.unlockedRecipes.buildRecipes.includes(recipe.id)) continue

    // 过滤：Unique建筑已存在
    if (recipe.buildResult.isUnique && existIds.has(recipe.buildResult.buildingId)) continue

    // 材料详情
    const materialDetails = recipe.materials.map((mat) => {
      const count = props.playerState.inventory.reduce((sum, inv) => {
        if (inv.itemId === mat.itemId) {
          const isEquipped = Object.values(props.playerState.equipment).includes(mat.itemId)
          return sum + (isEquipped ? 0 : inv.quantity)
        }
        return sum
      }, 0)
      return {
        itemId: mat.itemId,
        itemName: registry.getItemName(mat.itemId),
        required: mat.quantity,
        current: count,
        hasEnough: mat.isConsumed ? count >= mat.quantity : true,
      }
    })

    // 消耗详情
    const costDetails = recipe.costs.map((cost) => {
      const labelMap: Record<string, string> = {
        stamina: '体力',
        satiety: '饱食度',
        san: '理智',
        hp: '生命值',
      }
      let current = 0
      switch (cost.costType) {
        case 'stamina':
          current = props.playerState.survival.stamina
          break
        case 'satiety':
          current = props.playerState.survival.satiety
          break
        case 'san':
          current = props.playerState.survival.san
          break
        case 'hp':
          current = props.playerState.survival.hp
          break
      }
      const required = cost.affectedByCoefficient
        ? Math.round(cost.value * props.playerState.attributes.coefficients.staminaConsumptionCoefficient)
        : cost.value
      return {
        type: cost.costType,
        label: labelMap[cost.costType] ?? cost.costType,
        required,
        current,
        hasEnough: current >= required,
      }
    })

    // 检查能否建造
    const canCraft = canCraftRecipe(props.playerState, recipe)
    // 额外检查前置建筑
    let prereqFail: string | null = null
    if (recipe.prerequisiteBuildings && recipe.prerequisiteBuildings.length > 0) {
      for (const prereq of recipe.prerequisiteBuildings) {
        if (!existIds.has(prereq)) {
          const prereqName = registry.getBuilding(prereq)?.buildingName ?? prereq
          prereqFail = `需要先建造 ${prereqName}`
          break
        }
      }
    }

    result.push({
      id: recipe.id,
      name: recipe.name,
      buildCategory: recipe.buildCategory,
      requirements: recipe.requirements,
      buildResult: recipe.buildResult,
      canBuild: canCraft === null && prereqFail === null,
      failReason: prereqFail ?? canCraft,
      materialDetails,
      costDetails,
    })
  }

  return result
})

// ============================================================
// 辅助
// ============================================================

const categoryIcons: Record<string, string> = {
  defense: '🛡️',
  production: '⚙️',
  storage: '📦',
  living: '🛏️',
  craftingStation: '🔧',
  lighting: '🔥',
  decoration: '🎨',
  infrastructure: '🏗️',
  ritual: '🔮',
}

function getCategoryIcon(category: BuildCategory | string): string {
  return categoryIcons[category] || '🏗️'
}

function onBuild(recipeId: string): void {
  emit('build', recipeId)
}
</script>

<style scoped>
.build-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.3);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.2);
}

.panel-title {
  margin: 0;
  font-size: var(--font-lg);
  color: var(--text-primary);
}

.btn-back {
  padding: 0.3rem 0.8rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.2rem;
}

/* ---- 分区 ---- */
.section {
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 0.6rem 0;
  font-size: var(--font-md);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-weak);
  padding-bottom: 0.3rem;
}

.empty-hint {
  color: var(--text-muted);
  font-style: italic;
  padding: 1rem 0;
}

/* ---- 已有建筑卡片 ---- */
.building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}

.building-card {
  padding: 0.6rem;
  border: 1px solid var(--border-weak);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.building-card.existing {
  border-color: rgba(78, 205, 196, 0.3);
}

.building-icon {
  font-size: 1.5rem;
}

.building-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.building-name {
  font-weight: bold;
  color: var(--accent);
}

.building-desc {
  margin: 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.provided-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.action-tag {
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  background: rgba(78, 205, 196, 0.12);
  color: var(--accent);
  font-size: var(--font-xs);
}

/* ---- 配方列表 ---- */
.recipe-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.recipe-card {
  display: flex;
  gap: 0.6rem;
  padding: 0.7rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  transition: all var(--transition-fast);
}

.recipe-card:not(.recipe-disabled):hover {
  border-color: rgba(78, 205, 196, 0.4);
  background: rgba(255, 255, 255, 0.06);
}

.recipe-disabled {
  opacity: 0.55;
  border-color: var(--border-weak);
}

.recipe-icon {
  font-size: 1.8rem;
  width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recipe-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.recipe-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.recipe-name {
  font-weight: bold;
  color: var(--text-primary);
}

.recipe-time {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.recipe-desc {
  margin: 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
  line-height: 1.4;
}

/* 材料 */
.recipe-materials {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.material-item {
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: var(--font-xs);
}

.material-sufficient {
  background: rgba(78, 205, 196, 0.1);
  color: #4ecd8a;
}

.material-insufficient {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

/* 消耗 */
.recipe-costs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.cost-item {
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: var(--font-xs);
}

.cost-sufficient {
  color: var(--text-muted);
}

.cost-insufficient {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

.fail-reason {
  margin: 0;
  font-size: var(--font-xs);
  color: #ff6b6b;
}

/* 建造按钮 */
.recipe-action {
  display: flex;
  align-items: center;
}

.btn-build {
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

.btn-build:hover:not(:disabled) {
  background: rgba(78, 205, 196, 0.25);
}

.btn-build:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* 日志 */
.log-message {
  padding: 0.5rem 0.8rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
</style>
