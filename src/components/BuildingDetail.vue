<!-- BuildingDetail.vue - 建筑交互详情页
     展示建筑描述、耐久、固定操作和自定义交互 -->
<template>
  <div class="building-detail">
    <!-- 概览视窗 -->
    <template v-if="subView === 'overview'">
      <div class="detail-text">
        <div class="vignette-overlay"></div>
        <div class="content">
          <!-- 耐久度 -->
          <div v-if="durabilityConfig !== null" class="durability-bar">
            <span class="durability-label">耐久度</span>
            <div class="durability-track">
              <div
                class="durability-fill"
                :style="{ width: durabilityPercent + '%' }"
                :class="durabilityClass"
              ></div>
            </div>
            <span class="durability-num"
              >{{ durabilityConfig.current }}/{{ durabilityConfig.max }}</span
            >
          </div>
          <!-- 建筑名称 -->
          <h3 class="building-title">{{ subBuild.buildName }}</h3>
          <!-- 建筑描述 -->
          <p class="building-desc">{{ subBuild.descriptionConfig.description }}</p>
        </div>
      </div>

      <!-- 自定义交互按钮 -->
      <div v-if="customActions.length > 0" class="interactions">
        <button
          v-for="act in customActions"
          :key="act.id"
          class="interaction-btn"
          :class="interactionClass(act.interactionType)"
          @click="onCustomAction(act)"
        >
          <span class="btn-icon">{{ interactionIcon(act.interactionType) }}</span>
          <span class="btn-label">{{ act.name }}</span>
        </button>
      </div>

      <!-- 固定操作按钮 -->
      <div class="action-bar">
        <button class="action-btn btn-back" @click="onExit">
          ← 返回场景
        </button>
        <div class="action-bar-right">
          <button
            v-if="subBuild.isDeconstructable"
            class="action-btn btn-danger"
            @click="onDismantle"
          >
            拆除
          </button>
          <button v-if="hasUpgrades" class="action-btn btn-upgrade" @click="subView = 'upgrade'">
            升级
          </button>
          <button v-if="needsRepair" class="action-btn btn-repair" @click="onRepair">维修</button>
        </div>
      </div>
    </template>

    <!-- 升级视窗 -->
    <template v-if="subView === 'upgrade'">
      <div class="subview-header">
        <h3>升级 - {{ subBuild.buildName }}</h3>
        <button class="action-btn btn-back" @click="subView = 'overview'">返回</button>
      </div>
      <div class="upgrade-list">
        <div
          v-for="upg in upgradeOptions"
          :key="upg.targetBuildId"
          class="upgrade-card"
          :class="{ 'upg-disabled': !upg.canUpgrade }"
        >
          <div class="upg-info">
            <span class="upg-name">{{ upg.targetName }}</span>
            <div class="upg-costs">
              <span
                v-for="mat in upg.materialDetails"
                :key="mat.itemId"
                class="cost-chip"
                :class="mat.hasEnough ? 'ok' : 'miss'"
                >{{ mat.itemName }} {{ mat.current }}/{{ mat.required }}</span
              >
              <span
                v-for="c in upg.costDetails"
                :key="c.type"
                class="cost-chip"
                :class="c.hasEnough ? 'ok' : 'miss'"
                >{{ c.label }} {{ c.current }}/{{ c.required }}</span
              >
            </div>
            <p v-if="upg.prereqFail" class="fail-reason">{{ upg.prereqFail }}</p>
          </div>
          <button
            class="btn-upgrade"
            :disabled="!upg.canUpgrade"
            @click="onDoUpgrade(upg.targetBuildId)"
          >
            升级
          </button>
        </div>
      </div>
    </template>
  </div>

  <!-- 拆除确认弹窗（在 building-detail 外部，避免 v-if 冲突） -->
  <div v-if="showDismantleConfirm" class="dismantle-overlay" @click.self="onCancelDismantle">
    <div class="dismantle-dialog">
      <h3 class="dialog-title">确认拆除</h3>
      <p class="dialog-subtitle">
        确定要拆除 <strong>{{ subBuild.buildName }}</strong> 吗？此操作不可撤销。
      </p>

      <!-- 返回物品 -->
      <div v-if="dismantleReturnItems.length > 0" class="dialog-section">
        <h4 class="section-label">返还物品</h4>
        <div class="item-list">
          <span v-for="item in dismantleReturnItems" :key="item.itemId" class="item-chip">
            {{ item.itemName }} ×{{ item.quantity }}
          </span>
        </div>
      </div>

      <!-- 花费 -->
      <div v-if="dismantleCosts.length > 0" class="dialog-section">
        <h4 class="section-label">消耗</h4>
        <div class="cost-list">
          <span
            v-for="c in dismantleCosts"
            :key="c.type"
            class="cost-chip"
            :class="c.hasEnough ? 'ok' : 'miss'"
            >{{ c.label }}: {{ c.current }}/{{ c.required }}</span
          >
        </div>
      </div>

      <!-- 耗时 -->
      <p v-if="dismantleTime > 0" class="time-info">耗时：{{ dismantleTime }} 分钟</p>

      <div class="dialog-actions">
        <button class="action-btn btn-back" @click="onCancelDismantle">取消</button>
        <button class="action-btn btn-danger" @click="onConfirmDismantle">确认拆除</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Build, SubBuild, buildOption } from '@/types/build'
import type { PlayerState } from '@/types/player'
import { getRegistry } from '@/engine'
import { removeItem } from '@/engine'

const props = defineProps<{
  build: Build
  subBuild: SubBuild
  playerState: PlayerState
  subSceneId: string | null
}>()

const emit = defineEmits<{
  (e: 'exit'): void
  (e: 'enterEvent', eventId: string): void
  (e: 'dismantle', buildId: string): void
  (e: 'upgrade', buildId: string, targetSubBuildId: string): void
  (e: 'repair', buildId: string): void
  (e: 'log', message: string): void
  (e: 'enterRecipe', payload: { mode: 'craft' | 'cook'; deviceLevel: number }): void
  (e: 'enterRest', act: buildOption): void
  (e: 'enterStore'): void
}>()

const registry = getRegistry()

/** 当前子视窗 */
const subView = ref<'overview' | 'upgrade'>('overview')

/** 拆除确认弹窗是否显示 */
const showDismantleConfirm = ref(false)

// ============================================================
// 耐久度
// ============================================================

const durabilityConfig = computed<{ current: number; max: number } | null>(() => {
  if (!props.subBuild.durability) return null
  return { current: props.subBuild.durability, max: props.subBuild.durability }
})

const needsRepair = computed(() => {
  if (!props.subBuild.durability || !props.subBuild.repairMaterials) return false
  const dc = durabilityConfig.value
  if (!dc) return false
  return dc.current < dc.max
})

const durabilityPercent = computed(() => {
  const dc = durabilityConfig.value
  if (!dc || dc.max === 0) return 100
  return Math.round((dc.current / dc.max) * 100)
})

const durabilityClass = computed(() => {
  const pct = durabilityPercent.value
  if (pct > 60) return 'durable'
  if (pct > 30) return 'worn'
  return 'broken'
})

// ============================================================
// 升级
// ============================================================

const hasUpgrades = computed(() => {
  return (props.subBuild.upgrade && props.subBuild.upgrade.length > 0) ?? false
})

interface UpgradeDisplay {
  targetBuildId: string
  targetName: string
  canUpgrade: boolean
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

const upgradeOptions = computed<UpgradeDisplay[]>(() => {
  const upgrades = props.subBuild.upgrade ?? []
  const existingIds = new Set([
    ...(props.playerState.progress.campBuildings[props.subSceneId ?? ''] ?? []),
    ...([] as string[]),
  ])

  return upgrades.map((u) => {
    const targetSub = props.build.subBuild.find((s) => s.buildId === u.targetBuildId)
    const targetName = targetSub?.buildName ?? u.targetBuildId

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

    let prereqFail: string | null = null
    if (u.prerequisiteBuildings && u.prerequisiteBuildings.length > 0) {
      for (const prereq of u.prerequisiteBuildings) {
        if (!existingIds.has(prereq.buildId)) {
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
      prereqFail,
      materialDetails,
      costDetails,
    }
  })
})

// ============================================================
// 拆除确认
// ============================================================

const dismantleReturnItems = computed(() => {
  return (props.subBuild.deconstructionReturnItems ?? []).map((item) => ({
    itemId: item.itemId,
    itemName: registry.getItemName(item.itemId),
    quantity: item.quantity,
  }))
})

const dismantleCosts = computed(() => {
  const labelMap: Record<string, string> = {
    stamina: '体力',
    satiety: '饱食度',
    san: '理智',
    hp: '生命值',
  }
  return (props.subBuild.deconstructionCost ?? []).map((c) => {
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
})

const dismantleTime = computed(() => props.subBuild.deconstructionTime ?? 0)

// ============================================================
// 自定义交互
// ============================================================

/** 过滤出非常规的自定义交互（不包括固定按钮对应的类型） */
const customActions = computed<
  (buildOption & { interactionType: buildOption['interactionType'] })[]
>(() => {
  return (props.subBuild.interactions ?? []) as (buildOption & {
    interactionType: buildOption['interactionType']
  })[]
})

function interactionIcon(type: string): string {
  if (type === 'craft') return '🔨'
  if (type === 'cook') return '🍳'
  if (type === 'store') return '📦'
  if (type === 'collect') return '🌿'
  if (type === 'repair') return '🔧'
  if (type === 'rest') return '🛏'
  if (type === 'event') return '📜'
  return '⚡'
}

function interactionClass(type: string): string {
  if (type === 'craft' || type === 'cook') return 'btn-craft'
  if (type === 'store') return 'btn-store'
  if (type === 'collect') return 'btn-collect'
  if (type === 'repair') return 'btn-repair'
  if (type === 'rest') return 'btn-rest'
  if (type === 'event') return 'btn-event'
  return 'btn-default'
}

function onCustomAction(act: buildOption): void {
  switch (act.interactionType) {
    case 'craft':
      executeCraft(act)
      break
    case 'cook':
      executeCook(act)
      break
    case 'store':
      emit('enterStore')
      break
    case 'collect':
      emit('log', '采集功能开发中')
      break
    case 'repair':
      onRepair()
      break
    case 'rest':
      // 打开休息子界面（由 GameView 渲染 RestPanel）
      emit('enterRest', act)
      break
    case 'event':
      if (act.eventId) {
        emit('enterEvent', act.eventId)
      }
      break
    default:
      emit('log', `未知交互: ${act.name}`)
  }
}

// ============================================================
// 动作执行
// ============================================================

function onExit(): void {
  emit('exit')
}

function onDismantle(): void {
  showDismantleConfirm.value = true
}

function onCancelDismantle(): void {
  showDismantleConfirm.value = false
}

function onConfirmDismantle(): void {
  showDismantleConfirm.value = false
  emit('dismantle', props.build.buildId)
}

function onDoUpgrade(targetSubBuildId: string): void {
  emit('upgrade', props.build.buildId, targetSubBuildId)
  subView.value = 'overview'
}

function onRepair(): void {
  if (!props.subBuild.repairMaterials || props.subBuild.repairMaterials.length === 0) return

  // 检查材料
  for (const mat of props.subBuild.repairMaterials) {
    const count = countItem(mat.itemId)
    if (count < mat.quantity) {
      emit('log', `维修材料不足：${registry.getItemName(mat.itemId)}`)
      return
    }
  }

  // 消耗材料
  for (const mat of props.subBuild.repairMaterials) {
    removeItem(props.playerState, mat.itemId, mat.quantity)
  }

  emit('log', `${props.subBuild.buildName} 已修复`)
}

function executeCraft(act: buildOption): void {
  emit('enterRecipe', { mode: 'craft', deviceLevel: act.buildLevel ?? 0 })
}

function executeCook(act: buildOption): void {
  emit('enterRecipe', { mode: 'cook', deviceLevel: act.buildLevel ?? 0 })
}

// ============================================================
// 辅助
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
</script>

<style scoped>
.building-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  position: relative;
}

/* ============================================================
   文本区
   ============================================================ */
.detail-text {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem 1.4rem 1rem;
  line-height: 1.75;
  font-size: var(--font-lg);
  position: relative;
}

.vignette-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse at center top,
      rgba(0, 0, 0, 0) 20%,
      rgba(0, 0, 0, 0.15) 60%,
      rgba(0, 0, 0, 0.3) 100%
    ),
    radial-gradient(ellipse at center bottom, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0.1) 50%);
  pointer-events: none;
  z-index: 1;
}

.content {
  position: relative;
  z-index: 2;
}

/* ---- 耐久度条 ---- */
.durability-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  font-size: var(--font-xs);
}
.durability-label {
  color: var(--text-muted);
  min-width: 3em;
  letter-spacing: 0.05em;
}
.durability-track {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
}
.durability-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
  position: relative;
}
.durability-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%);
}
.durability-fill.durable {
  background: linear-gradient(90deg, #2ecc71, #4ecdc4);
}
.durability-fill.worn {
  background: linear-gradient(90deg, #f39c12, #ffd54f);
}
.durability-fill.broken {
  background: linear-gradient(90deg, #e74c3c, #ff6b6b);
}
.durability-num {
  color: var(--text-muted);
  min-width: 4.2em;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.building-title {
  margin: 0 0 0.5rem 0;
  color: var(--accent);
  font-size: var(--font-lg);
  letter-spacing: 0.03em;
  text-shadow: 0 0 20px rgba(78, 205, 196, 0.15);
}
.building-desc {
  margin: 0;
  color: var(--text-secondary);
  white-space: pre-wrap;
  line-height: 1.8;
}

/* ============================================================
   自定义交互按钮
   ============================================================ */
.interactions {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  border-top: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.12);
}

.interaction-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 110px;
  min-width: 110px;
  height: 42px;
  padding: 0 0.6rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  user-select: none;
  overflow: hidden;
  position: relative;
}
.interaction-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.interaction-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3), 0 0 15px rgba(255, 255, 255, 0.03);
}
.interaction-btn:hover::before {
  opacity: 1;
}
.interaction-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.btn-icon {
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
}
.btn-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 各类型交互按钮配色 */
.btn-craft {
  border-color: rgba(78, 205, 196, 0.35);
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.06), rgba(78, 205, 196, 0.02));
  color: var(--accent);
}
.btn-craft:hover {
  border-color: rgba(78, 205, 196, 0.6);
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.15), rgba(78, 205, 196, 0.05));
  box-shadow: 0 3px 12px rgba(78, 205, 196, 0.15);
}

.btn-store {
  border-color: rgba(100, 181, 246, 0.35);
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.06), rgba(100, 181, 246, 0.02));
  color: #64b5f6;
}
.btn-store:hover {
  border-color: rgba(100, 181, 246, 0.6);
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.15), rgba(100, 181, 246, 0.05));
  box-shadow: 0 3px 12px rgba(100, 181, 246, 0.15);
}

.btn-collect {
  border-color: rgba(255, 213, 79, 0.35);
  background: linear-gradient(135deg, rgba(255, 213, 79, 0.06), rgba(255, 213, 79, 0.02));
  color: #ffd54f;
}
.btn-collect:hover {
  border-color: rgba(255, 213, 79, 0.6);
  background: linear-gradient(135deg, rgba(255, 213, 79, 0.15), rgba(255, 213, 79, 0.05));
  box-shadow: 0 3px 12px rgba(255, 213, 79, 0.15);
}

.btn-rest {
  border-color: rgba(165, 214, 167, 0.35);
  background: linear-gradient(135deg, rgba(165, 214, 167, 0.06), rgba(165, 214, 167, 0.02));
  color: #a5d6a7;
}
.btn-rest:hover {
  border-color: rgba(165, 214, 167, 0.6);
  background: linear-gradient(135deg, rgba(165, 214, 167, 0.15), rgba(165, 214, 167, 0.05));
  box-shadow: 0 3px 12px rgba(165, 214, 167, 0.15);
}

.btn-event {
  border-color: rgba(206, 147, 216, 0.35);
  background: linear-gradient(135deg, rgba(206, 147, 216, 0.06), rgba(206, 147, 216, 0.02));
  color: #ce93d8;
}
.btn-event:hover {
  border-color: rgba(206, 147, 216, 0.6);
  background: linear-gradient(135deg, rgba(206, 147, 216, 0.15), rgba(206, 147, 216, 0.05));
  box-shadow: 0 3px 12px rgba(206, 147, 216, 0.15);
}

.btn-default {
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--text-secondary);
}
.btn-default:hover {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.06);
}

/* ============================================================
   固定操作栏
   ============================================================ */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.35) 100%);
  backdrop-filter: blur(8px);
  position: relative;
  flex-shrink: 0;
}
.action-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 1.2rem;
  right: 1.2rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
}

.action-bar-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 1rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  user-select: none;
}
.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.2);
}
.action-btn:active {
  transform: scale(0.97);
}

.btn-back {
  color: var(--text-muted);
  border-color: transparent;
  background: transparent;
  letter-spacing: 0.02em;
}
.btn-back:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--border-mid);
}

.btn-danger {
  border-color: rgba(255, 107, 107, 0.35);
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.04);
}
.btn-danger:hover {
  background: rgba(255, 107, 107, 0.12);
  border-color: rgba(255, 107, 107, 0.55);
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.1);
}

.btn-upgrade {
  border-color: rgba(255, 213, 79, 0.35);
  color: #ffd54f;
  background: rgba(255, 213, 79, 0.04);
}
.btn-upgrade:hover {
  background: rgba(255, 213, 79, 0.12);
  border-color: rgba(255, 213, 79, 0.55);
  box-shadow: 0 0 10px rgba(255, 213, 79, 0.1);
}

.btn-repair {
  border-color: rgba(78, 205, 196, 0.35);
  color: var(--accent);
  background: rgba(78, 205, 196, 0.04);
}
.btn-repair:hover {
  background: rgba(78, 205, 196, 0.12);
  border-color: rgba(78, 205, 196, 0.55);
  box-shadow: 0 0 10px rgba(78, 205, 196, 0.1);
}

/* ============================================================
   升级视窗
   ============================================================ */
.subview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.2);
}
.subview-header h3 {
  margin: 0;
  font-size: var(--font-md);
  color: var(--text-primary);
}

.upgrade-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.upgrade-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color 0.2s;
}
.upgrade-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}
.upgrade-card.upg-disabled {
  opacity: 0.55;
}

.upg-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.upg-name {
  color: #ffd54f;
  font-weight: bold;
  font-size: var(--font-md);
}
.upg-costs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.cost-chip {
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: var(--font-xs);
}
.cost-chip.ok {
  color: var(--text-muted);
}
.cost-chip.miss {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
}

.upgrade-card .btn-upgrade {
  padding: 0.35rem 0.9rem;
  border: 1px solid rgba(255, 213, 79, 0.4);
  border-radius: var(--radius-md);
  background: rgba(255, 213, 79, 0.08);
  color: #ffd54f;
  font-size: var(--font-xs);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.upgrade-card .btn-upgrade:hover:not(:disabled) {
  background: rgba(255, 213, 79, 0.18);
  box-shadow: 0 0 8px rgba(255, 213, 79, 0.1);
}
.upgrade-card .btn-upgrade:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.fail-reason {
  margin: 0;
  font-size: var(--font-xs);
  color: #ff6b6b;
}

/* ============================================================
   拆除确认弹窗
   ============================================================ */
.dismantle-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.dismantle-dialog {
  width: 90%;
  max-width: 380px;
  max-height: 80%;
  overflow-y: auto;
  padding: 1.4rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, rgba(25, 25, 30, 0.98), rgba(20, 20, 25, 0.98));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dialog-title {
  margin: 0 0 0.3rem 0;
  color: #ff6b6b;
  font-size: var(--font-lg);
}

.dialog-subtitle {
  margin: 0 0 0.8rem 0;
  font-size: var(--font-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.dialog-section {
  margin-bottom: 0.6rem;
}

.section-label {
  margin: 0 0 0.3rem 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-weak);
  padding-bottom: 0.15rem;
}

.item-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.item-chip {
  padding: 0.1rem 0.45rem;
  border-radius: 3px;
  background: rgba(78, 205, 196, 0.1);
  color: var(--accent);
  font-size: var(--font-xs);
}

.no-items {
  margin: 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
  font-style: italic;
}

.cost-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.time-info {
  margin: 0 0 0.8rem 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.6rem;
  border-top: 1px solid var(--border-weak);
}
</style>
