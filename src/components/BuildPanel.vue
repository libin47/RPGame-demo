<!-- BuildPanel.vue - 建造面板
     显示当前营地的已有建筑（含升级）和可建造的建筑列表 -->
<template>
  <div class="build-panel">
    <!-- 头部（只保留标题） -->
    <div class="panel-header">
      <h2 class="panel-title">建造 - {{ subScene?.name || '营地' }}</h2>
    </div>

    <div class="panel-body">
      <!-- ==================== 已有建筑 ==================== -->
      <div class="section" v-if="existingItems.length > 0">
        <h3 class="section-title">已有建筑</h3>
        <div class="building-grid">
          <div v-for="item in existingItems" :key="item.buildId" class="building-card existing">
            <div class="building-header">
              <span class="building-name">{{ item.subBuild.buildName }}</span>
              <span v-if="item.subBuild.isDecorativeOnly" class="tag-deco">装饰</span>
            </div>
            <p class="building-desc">{{ item.subBuild.descriptionConfig.description }}</p>
            <!-- 建筑提供的交互 -->
            <div
              v-if="item.subBuild.interactions && item.subBuild.interactions.length > 0"
              class="provided-actions"
            >
              <span v-for="act in item.subBuild.interactions" :key="act.id" class="action-tag">{{
                act.name
              }}</span>
            </div>
            <!-- 升级按钮 -->
            <div v-if="item.availableUpgrades.length > 0" class="upgrade-section">
              <div
                v-for="upg in item.availableUpgrades"
                :key="upg.targetBuildId"
                class="upgrade-item"
              >
                <span class="upgrade-label">升级至 {{ upg.targetName }}</span>
                <div class="upgrade-materials">
                  <span
                    v-for="mat in upg.materialDetails"
                    :key="mat.itemId"
                    class="material-item"
                    :class="mat.hasEnough ? 'mat-ok' : 'mat-miss'"
                  >
                    {{ mat.itemName }} {{ mat.current }}/{{ mat.required }}
                  </span>
                </div>
                <div v-if="upg.costDetails.length > 0" class="upgrade-costs">
                  <span
                    v-for="cost in upg.costDetails"
                    :key="cost.type"
                    class="cost-item"
                    :class="cost.hasEnough ? 'cost-ok' : 'cost-miss'"
                  >
                    {{ cost.label }}: {{ cost.current }}/{{ cost.required }}
                  </span>
                </div>
                <p v-if="upg.failReason" class="fail-reason">{{ upg.failReason }}</p>
                <button
                  class="btn-upgrade"
                  :disabled="!upg.canUpgrade"
                  @click="onUpgrade(item.buildId, upg.targetBuildId)"
                >
                  升级
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 可建造 ==================== -->
      <div class="section">
        <h3 class="section-title">可建造</h3>
        <div v-if="availableBuilds.length === 0" class="empty-hint">当前营地没有可建造的项目</div>
        <div class="build-list" v-else>
          <div
            v-for="bld in availableBuilds"
            :key="bld.buildId"
            class="build-card"
            :class="{ 'build-disabled': !bld.canBuild }"
          >
            <div class="build-main">
              <div class="build-header">
                <span class="build-name">{{ bld.subBuildName }}</span>
                <span class="build-time">⏱ {{ bld.buildTime }}分钟</span>
              </div>
              <p class="build-desc">{{ bld.subBuildDesc }}</p>
              <!-- 材料 -->
              <div class="build-materials">
                <span
                  v-for="mat in bld.materialDetails"
                  :key="mat.itemId"
                  class="material-item"
                  :class="mat.hasEnough ? 'mat-ok' : 'mat-miss'"
                >
                  {{ mat.itemName }} {{ mat.current }}/{{ mat.required }}
                </span>
              </div>
              <!-- 消耗 -->
              <div class="build-costs" v-if="bld.costDetails.length > 0">
                <span
                  v-for="cost in bld.costDetails"
                  :key="cost.type"
                  class="cost-item"
                  :class="cost.hasEnough ? 'cost-ok' : 'cost-miss'"
                >
                  {{ cost.label }}: {{ cost.current }}/{{ cost.required }}
                </span>
              </div>
              <!-- 前置依赖 -->
              <p v-if="bld.prereqFail" class="fail-reason">{{ bld.prereqFail }}</p>
              <p v-if="bld.failReason" class="fail-reason">{{ bld.failReason }}</p>
            </div>
            <div class="build-action">
              <button class="btn-build" :disabled="!bld.canBuild" @click="onBuild(bld.buildId)">
                建造
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 返回场景按钮（加大） -->
      <button class="btn-return" @click="$emit('close')">返回场景</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SubScene } from '@/types/scene'
import type { PlayerState } from '@/types/player'
import type { Build, SubBuild, buildUpgrade } from '@/types/build'
import { getRegistry } from '@/engine'

const props = defineProps<{
  subScene: SubScene | null
  playerState: PlayerState
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'build', buildId: string): void
  (e: 'upgrade', buildId: string, targetSubBuildId: string): void
}>()

const registry = getRegistry()

// ============================================================
// 辅助：计算当前子场景中已有建筑的 Build ID 列表
// ============================================================
function getSubScene(): string | null {
  return props.subScene?.id ?? null
}

function getExistingBuildIds(): string[] {
  const ssId = getSubScene()
  if (!ssId) return []
  const initIds = props.subScene?.buildingInit ?? []
  const builtIds = props.playerState.progress.campBuildings[ssId] ?? []
  return [...new Set([...initIds, ...builtIds])]
}

function getCurrentSubBuildId(buildId: string): string {
  const ssId = getSubScene()
  if (!ssId) return ''
  return props.playerState.progress.campBuildingLevels[ssId]?.[buildId] ?? ''
}

// ============================================================
// 已有建筑详情
// ============================================================
interface ExistingBuildingItem {
  buildId: string
  subBuild: SubBuild
  availableUpgrades: UpgradeDisplayItem[]
}

interface UpgradeDisplayItem {
  targetBuildId: string
  targetName: string
  canUpgrade: boolean
  failReason: string | null
  materialDetails: Array<{
    itemId: string
    itemName: string
    required: number
    current: number
    hasEnough: boolean
  }>
  costDetails: Array<{
    type: string
    label: string
    required: number
    current: number
    hasEnough: boolean
  }>
}

const existingItems = computed<ExistingBuildingItem[]>(() => {
  const ids = getExistingBuildIds()
  const result: ExistingBuildingItem[] = []

  for (const bldId of ids) {
    const build = registry.getBuilding(bldId)
    if (!build) continue

    const currentSubId = getCurrentSubBuildId(bldId) || build.defaultBuild
    const currentSub = build.subBuild.find((s) => s.buildId === currentSubId)
    if (!currentSub) continue

    // 计算可用升级
    const upgrades: UpgradeDisplayItem[] = (currentSub.upgrade ?? []).map((u) => {
      const targetSub = build.subBuild.find((s) => s.buildId === u.targetBuildId)
      const targetName = targetSub?.buildName ?? u.targetBuildId

      // 材料详情
      const materialDetails = u.upgradeItems.map((m) => {
        const count = countItem(m.itemId)
        return {
          itemId: m.itemId,
          itemName: registry.getItemName(m.itemId),
          required: m.quantity,
          current: count,
          hasEnough: count >= m.quantity,
        }
      })

      // 消耗详情
      const costDetails = u.upgradeCost.map((c) => {
        const labelMap: Record<string, string> = {
          stamina: '体力',
          satiety: '饱食度',
          san: '理智',
          hp: '生命值',
        }
        const current = getSurvivalValue(c.costType)
        const required = c.affectedByCoefficient ? Math.round(c.value * getStaminaCoeff()) : c.value
        return {
          type: c.costType,
          label: labelMap[c.costType] ?? c.costType,
          required,
          current,
          hasEnough: current >= required,
        }
      })

      // 检查前置建筑
      let prereqFail: string | null = null
      if (u.prerequisiteBuildings && u.prerequisiteBuildings.length > 0) {
        for (const prereq of u.prerequisiteBuildings) {
          if (!ids.includes(prereq.buildId)) {
            const prereqBuild = registry.getBuilding(prereq.buildId)
            prereqFail = `需要先建造 ${prereqBuild?.defaultBuild ?? prereq.buildId}`
            break
          }
        }
      }

      const canUpgrade =
        materialDetails.every((m) => m.hasEnough) &&
        costDetails.every((c) => c.hasEnough) &&
        prereqFail === null

      return {
        targetBuildId: u.targetBuildId,
        targetName,
        canUpgrade,
        failReason: prereqFail,
        materialDetails,
        costDetails,
      }
    })

    result.push({ buildId: bldId, subBuild: currentSub, availableUpgrades: upgrades })
  }

  return result
})

// ============================================================
// 可建造列表
// ============================================================
interface BuildDisplayItem {
  buildId: string
  subBuildName: string
  subBuildDesc: string
  buildTime: number
  canBuild: boolean
  failReason: string | null
  prereqFail: string | null
  materialDetails: Array<{
    itemId: string
    itemName: string
    required: number
    current: number
    hasEnough: boolean
  }>
  costDetails: Array<{
    type: string
    label: string
    required: number
    current: number
    hasEnough: boolean
  }>
}

const availableBuilds = computed<BuildDisplayItem[]>(() => {
  const ss = props.subScene
  if (!ss) return []

  const allowedIds = ss.buildingList ?? []
  const allBuilds = registry.getAllBuildings()
  const existIds = new Set(getExistingBuildIds())
  const ssId = getSubScene()

  const result: BuildDisplayItem[] = []

  for (const build of allBuilds) {
    // 过滤 buildingList
    if (allowedIds.length > 0 && !allowedIds.includes(build.buildId)) continue

    // 过滤未解锁
    if (!props.playerState.unlockedRecipes.buildRecipes.includes(build.buildId)) continue

    // 过滤已建造
    if (existIds.has(build.buildId)) continue

    // 获取默认子建筑
    const defaultSub = build.subBuild.find((s) => s.buildId === build.defaultBuild)
    if (!defaultSub) continue

    // 材料详情
    const materialDetails = build.defaultItems.map((m) => ({
      itemId: m.itemId,
      itemName: registry.getItemName(m.itemId),
      required: m.quantity,
      current: countItem(m.itemId),
      hasEnough: countItem(m.itemId) >= m.quantity,
    }))

    // 消耗详情
    const costDetails = build.defaultCost.map((c) => {
      const labelMap: Record<string, string> = {
        stamina: '体力',
        satiety: '饱食度',
        san: '理智',
        hp: '生命值',
      }
      const current = getSurvivalValue(c.costType)
      const required = c.affectedByCoefficient ? Math.round(c.value * getStaminaCoeff()) : c.value
      return {
        type: c.costType,
        label: labelMap[c.costType] ?? c.costType,
        required,
        current,
        hasEnough: current >= required,
      }
    })

    // 前置建筑检查
    let prereqFail: string | null = null
    if (build.prerequisiteBuildings && build.prerequisiteBuildings.length > 0) {
      for (const prereq of build.prerequisiteBuildings) {
        if (!existIds.has(prereq.buildId)) {
          const prereqBuild = registry.getBuilding(prereq.buildId)
          prereqFail = `需要先建造 ${prereqBuild?.defaultBuild ?? prereq.buildId}`
          break
        }
      }
    }

    // 材料/消耗检查（用 canCraftRecipe 的风格，但这里我们手动做了）
    const matOk = materialDetails.every((m) => m.hasEnough)
    const costOk = costDetails.every((c) => c.hasEnough)

    let failReason: string | null = null
    if (!matOk) {
      const missing = materialDetails.find((m) => !m.hasEnough)
      failReason = missing ? `材料不足：${missing.itemName}` : null
    } else if (!costOk) {
      const missing = costDetails.find((c) => !c.hasEnough)
      failReason = missing ? `${missing.label}不足` : null
    }

    result.push({
      buildId: build.buildId,
      subBuildName: defaultSub.buildName,
      subBuildDesc: defaultSub.descriptionConfig.description,
      buildTime: build.defaultTime,
      canBuild: matOk && costOk && prereqFail === null,
      failReason,
      prereqFail,
      materialDetails,
      costDetails,
    })
  }

  return result
})

// ============================================================
// 辅助工具
// ============================================================

function countItem(itemId: string): number {
  return props.playerState.inventory.reduce((sum, inv) => {
    if (inv.itemId === itemId) {
      const isEquipped = Object.values(props.playerState.equipment).includes(itemId)
      return sum + (isEquipped ? 0 : inv.quantity)
    }
    return sum
  }, 0)
}

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
  return props.playerState.attributes.coefficients.staminaConsumptionCoefficient
}

// ============================================================
// 事件
// ============================================================

function onBuild(buildId: string): void {
  emit('build', buildId)
}

function onUpgrade(buildId: string, targetSubBuildId: string): void {
  emit('upgrade', buildId, targetSubBuildId)
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

/* ---- 已有建筑 ---- */
.building-grid {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.building-card {
  padding: 0.7rem;
  border: 1px solid var(--border-weak);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
}

.building-card.existing {
  border-color: rgba(78, 205, 196, 0.3);
}

.building-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
}

.building-name {
  font-weight: bold;
  font-size: var(--font-base);
  color: var(--accent);
}

.tag-deco {
  padding: 0.05rem 0.35rem;
  border-radius: 3px;
  background: rgba(255, 213, 79, 0.12);
  color: #ffd54f;
  font-size: var(--font-xs);
}

.building-desc {
  margin: 0 0 0.3rem 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
  line-height: 1.4;
}

.provided-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
}

.action-tag {
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  background: rgba(78, 205, 196, 0.12);
  color: var(--accent);
  font-size: var(--font-xs);
}

/* ---- 升级 ---- */
.upgrade-section {
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px dashed var(--border-weak);
}

.upgrade-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
}

.upgrade-label {
  font-size: var(--font-xs);
  color: #ffd54f;
  min-width: 5rem;
}

.upgrade-materials,
.upgrade-costs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
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

.fail-reason {
  margin: 0;
  font-size: var(--font-xs);
  color: #ff6b6b;
}

.btn-upgrade {
  padding: 0.2rem 0.7rem;
  border: 1px solid rgba(255, 213, 79, 0.4);
  border-radius: var(--radius-md);
  background: rgba(255, 213, 79, 0.08);
  color: #ffd54f;
  font-size: var(--font-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-upgrade:hover:not(:disabled) {
  background: rgba(255, 213, 79, 0.15);
}
.btn-upgrade:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ---- 可建造 ---- */
.build-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.build-card {
  display: flex;
  gap: 0.6rem;
  padding: 0.7rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  transition: all var(--transition-fast);
}

.build-card:not(.build-disabled):hover {
  border-color: rgba(78, 205, 196, 0.4);
  background: rgba(255, 255, 255, 0.06);
}

.build-disabled {
  opacity: 0.55;
  border-color: var(--border-weak);
}

.build-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.build-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.build-name {
  font-weight: bold;
  color: var(--text-primary);
}

.build-time {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.build-desc {
  margin: 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
  line-height: 1.4;
}

.build-materials,
.build-costs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.build-action {
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

/* ---- 底部返回按钮 ---- */
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
