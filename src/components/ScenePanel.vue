<!-- ScenePanel.vue - 场景面板
     显示当前场景描述文本（含可点击事件入口）
     底部：探索、资源、人物、移动（场景交互固定显示） -->
<template>
  <div class="scene-panel">
    <!-- 场景描述区域（带暗角氛围） -->
    <div
      ref="narrativeRef"
      class="scene-narrative"
      :style="
        backgroundColor
          ? { background: `linear-gradient(180deg, ${backgroundColor} 0%, rgba(0,0,0,0.3) 100%)` }
          : undefined
      "
    >
      <div class="vignette-overlay"></div>
      <div class="content">
        <!-- 场景文本前缀 -->
        <p v-if="props.sceneTextPrefix" class="scene-prefix">{{ props.sceneTextPrefix }}</p>
        <p class="scene-line">
          <template v-for="segment in parsedSegments" :key="segment.segmentKey">
            <span v-if="segment.type === 'text'">{{ segment.content }}</span>
            <button
              v-else-if="segment.type === 'entry'"
              type="button"
              class="event-link"
              @click="onEntryClick(segment.eventId)"
            >
              <span class="link-decoration"></span>
              {{ segment.displayText }}
            </button>
          </template>
        </p>
        <!-- 场景文本后缀 -->
        <p v-if="props.sceneTextAfter" class="scene-suffix">{{ props.sceneTextAfter }}</p>
      </div>
    </div>

    <!-- ═══════ 场景交互条 — 始终固定显示 ═══════ -->
    <div v-if="hasInteractions" class="scene-interactions-bar">
      <div v-for="inter in visibleInteractions" :key="inter.id ?? inter.name" class="inter-row">
        <div class="inter-info">
          <span class="inter-title">{{ inter.name }}</span>
          <span v-if="inter.description" class="inter-desc">{{ inter.description }}</span>
        </div>
        <button
          class="inter-btn"
          :class="interactionBtnClass(inter)"
          @click="onSceneInteraction(inter)"
        >
          {{ inter.name }}
        </button>
      </div>
    </div>

    <!--═══════ 营地建筑入口 ═══════-->
    <div
      v-if="props.isCampsite && (props.campsiteBuildings?.length ?? 0) > 0"
      class="building-interactions"
    >
      <div class="building-section-label">🏕 营地设施</div>
      <div class="building-grid">
        <div
          v-for="bld in props.campsiteBuildings"
          :key="bld.buildId"
          class="building-entry-card"
          @click="onEnterBuilding(bld.buildId)"
        >
          <span class="entry-icon">{{ bld.emoji }}</span>
          <span class="entry-name">{{ bld.buildName }}</span>
          <span class="entry-desc">{{ bld.description }}</span>
        </div>
      </div>
    </div>

    <!-- ═══════ 次级选项面板（资源／人物／移动） ═══════ -->
    <div v-if="expandedCategory && expandedCategory !== 'interactions'" class="sub-panel">
      <!-- ── 资源：每个 collect 一行 ── -->
      <template v-if="expandedCategory === 'collects'">
        <div v-for="collect in visibleCollects" :key="collect.id ?? collect.name" class="sub-row">
          <div class="sub-info">
            <span class="sub-title">
              <span class="sub-title-text"
                >{{ collect.descriptionTitle ?? collect.name }}
                <span
                  v-if="
                    collect.paramId &&
                    getRecoveryRate(collect.paramId, props.playerState.params) != null
                  "
                  class="recovery-rate"
                >
                  +{{ getRecoveryRate(collect.paramId, props.playerState.params) }}/天
                </span></span
              >
              <span class="sub-cost-inline">
                <span class="cost-icon">⏱</span>{{ collect.costTime ?? 0 }}m
                <span class="cost-icon">⚡</span>{{ collect.costEnergy ?? 0 }}
              </span>
            </span>
            <span class="sub-desc">{{ collect.description }}</span>
          </div>
          <div class="sub-action-area">
            <button class="sub-btn btn-primary" @click="onCollect(collect)">
              {{ typeof collect.name === 'string' ? collect.name : '行动' }}
            </button>
            <span
              v-if="collect.paramId && props.playerState.params[collect.paramId] != null"
              class="resource-count"
              :class="getResourceCountClass(collect.paramId)"
            >
              ×{{ props.playerState.params[collect.paramId] ?? 0 }}
            </span>
          </div>
        </div>
        <div v-if="visibleCollects.length === 0" class="sub-empty">当前没有可用的资源点</div>
      </template>

      <!-- ── 人物：占位 ── -->
      <template v-if="expandedCategory === 'characters'">
        <div v-for="ch in visibleCharacters" :key="ch.id ?? ch.name" class="sub-row">
          <div class="sub-info">
            <span class="sub-title">{{ ch.descriptionTitle ?? ch.name }}</span>
            <span class="sub-desc">{{ ch.description }}</span>
          </div>
          <button class="sub-btn btn-primary" @click="onCharacter(ch)">
            {{ typeof ch.name === 'string' ? ch.name : '交互' }}
          </button>
        </div>
        <div v-if="visibleCharacters.length === 0" class="sub-empty">当前场景没有可交互的人物</div>
      </template>

      <!-- ── 移动 ── -->
      <template v-if="expandedCategory === 'moves'">
        <div v-for="mv in visibleMoves" :key="mv.id ?? mv.name" class="sub-row">
          <div class="sub-info">
            <span class="sub-title">
              <span class="sub-title-text">{{ mv.descriptionTitle ?? mv.name }}</span>
              <span v-if="mv.costTime != null || mv.costEnergy != null" class="sub-cost-inline">
                <span class="cost-icon">⏱</span>{{ mv.costTime ?? 0 }}m
                <span class="cost-icon">⚡</span>{{ mv.costEnergy ?? 0 }}
              </span>
            </span>
            <span class="sub-desc">{{ mv.description ?? '' }}</span>
          </div>
          <button class="sub-btn btn-primary" @click="onMove(mv)">
            {{ typeof mv.name === 'string' ? mv.name : '前往' }}
          </button>
        </div>
        <div v-if="visibleMoves.length === 0" class="sub-empty">当前没有可前往的区域</div>
      </template>
    </div>

    <!-- ═══════ 四个分类按钮（固定位置） ═══════ -->
    <div class="category-bar">
      <div class="cat-cell">
        <button v-if="sceneExplore" class="cat-btn" @click="onExplore(sceneExplore)">
          <span class="cat-icon">🔍</span>
          <span class="cat-label">探索</span>
        </button>
        <button v-if="sceneBuild" class="cat-btn" @click="onBuild">
          <span class="cat-icon">🛠️</span>
          <span class="cat-label">建造</span>
        </button>
      </div>
      <div class="cat-cell">
        <button
          v-if="hasCollects"
          class="cat-btn"
          :class="{ active: expandedCategory === 'collects' }"
          @click="onToggleCategory('collects')"
        >
          <span class="cat-icon">🪓</span>
          <span class="cat-label">资源</span>
        </button>
      </div>
      <div class="cat-cell">
        <button
          v-if="hasCharacters"
          class="cat-btn"
          :class="{ active: expandedCategory === 'characters' }"
          @click="onToggleCategory('characters')"
        >
          <span class="cat-icon">👤</span>
          <span class="cat-label">人物</span>
        </button>
      </div>
      <div class="cat-cell">
        <button
          v-if="hasMoves"
          class="cat-btn"
          :class="{ active: expandedCategory === 'moves' }"
          @click="onToggleCategory('moves')"
        >
          <span class="cat-icon">🚶</span>
          <span class="cat-label">移动</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type {
  SceneDescription,
  SceneInteraction,
  BaseScene,
  ResourceInteraction,
  MoveInteraction,
  CharacterInteraction,
  SubScene,
} from '@/types/scene'
import type { ButtonOption } from '@/types/option'
import { getResolvedDescriptionText } from '@/engine'
import type { PlayerState } from '@/types/player'
import { paramRegistry } from '@/config/params'

/**
 * 营地建筑基本信息
 */
interface CampsiteBuildingInfo {
  buildId: string
  buildName: string
  description: string
  emoji: string
}

// ============================================================
// 解析后的文本段类型
// ============================================================

interface TextSegment {
  type: 'text' | 'entry'
  content: string
  segmentKey: string
  eventId?: string
  displayText?: string
}

// ============================================================
// 组件属性
// ============================================================

const props = defineProps<{
  descriptionConfig: SceneDescription | null
  /** 当前场景/子场景数据（用于获取 explores/collects/characters/interactions/moves） */
  scene: BaseScene
  campsiteBuildings?: CampsiteBuildingInfo[]
  isCampsite?: boolean
  sceneTextPrefix: string
  sceneTextAfter: string
  backgroundColor?: string
  playerState: PlayerState
  /** 当前展开的分类（由 GameView 管理，场景切换时自动重置） */
  expandedCategory: string | null
  // 描述中事件是否点击
  isEventClicked: boolean
}>()

const narrativeRef = ref<HTMLElement | null>(null)

// 主文本内容变化时自动滚动到底部
watch(
  [() => props.sceneTextPrefix, () => props.sceneTextAfter, () => props.descriptionConfig],
  () => {
    nextTick(() => {
      const el = narrativeRef.value
      if (el && el.scrollHeight > el.clientHeight) {
        el.scrollTop = el.scrollHeight
      }
    })
  },
  { deep: false },
)

// ============================================================
// 分类按钮状态（由 GameView 通过 prop 传入）
// ============================================================

function onToggleCategory(cat: string): void {
  const next = props.expandedCategory === cat ? null : cat
  emit('update:expandedCategory', next)
}

// ============================================================
// 可见性判断
// ============================================================

function isInteractionVisible(
  inter: ButtonOption & {
    isOneTime?: boolean
    usedFlag?: string
    hideFlag?: string[]
    displayFlag?: string[]
  },
): boolean {
  if (inter.isOneTime && inter.usedFlag && props.playerState.flags[inter.usedFlag]) return false
  if (inter.hideFlag && inter.hideFlag.some((f) => props.playerState.flags[f] === true))
    return false
  if (inter.displayFlag && !inter.displayFlag.every((f) => props.playerState.flags[f] === true))
    return false
  return true
}

/**
 * 计算资源的每日恢复速度
 * 仅当 timeVarying.mode === 'accumulate' 且存在 deltaPerDay / recoveryPerDay 时有值
 * - deltaPerDay: 直接返回该值
 * - recoveryPerDay: 乘以 recoveryBaseId（没有则是自身）的当前值
 */
function getRecoveryRate(paramId: string, currentParams: Record<string, number>): number | null {
  const paramCfg = paramRegistry.params[paramId]
  if (!paramCfg?.timeVarying || paramCfg.timeVarying.mode !== 'accumulate') return null
  const tv = paramCfg.timeVarying
  if (tv.deltaPerDay != null) return tv.deltaPerDay
  if (tv.recoveryPerDay != null) {
    const baseId = tv.recoveryBaseId ?? paramId
    return tv.recoveryPerDay * (currentParams[baseId] ?? 0)
  }
  return null
}

/**
 * 资源存量颜色类名：大于半数为 green，为 0 为 red，其余为 yellow
 */
function getResourceCountClass(paramId: string): string {
  const current = props.playerState.params[paramId]
  if (current == null) return ''
  if (current <= 0) return 'rc-critical'
  const paramCfg = paramRegistry.params[paramId]
  const maxValue = paramCfg?.timeVarying?.max
  if (maxValue != null && current >= maxValue / 2) return 'rc-sufficient'
  return 'rc-low'
}

/** 场景探索按钮配置 */
const sceneExplore = computed<ButtonOption | null>(() => {
  const target = props.scene as BaseScene & { explore?: ButtonOption }
  if (target.explore && isInteractionVisible(target.explore)) return target.explore
  return null
})

/** 场景建造按钮配置 */
const sceneBuild = computed<ButtonOption | null>(() => {
  const target = props.scene as SubScene & { build?: ButtonOption }
  if (target.isCampsite && target.build && isInteractionVisible(target.build)) return target.build
  return null
})

/** 可见的资源列表 */
const visibleCollects = computed<ResourceInteraction[]>(() => {
  const target = props.scene as BaseScene & { collects?: ResourceInteraction[] }
  const all = target.collects ?? []
  return all.filter((c) => isInteractionVisible(c))
})

const hasCollects = computed(() => visibleCollects.value.length > 0)

/** 可见的人物列表 */
const visibleCharacters = computed<CharacterInteraction[]>(() => {
  const target = props.scene as BaseScene & { characters?: CharacterInteraction[] }
  const all = target.characters ?? []
  return all.filter((c) => isInteractionVisible(c))
})

const hasCharacters = computed(() => visibleCharacters.value.length > 0)

/** 可见的交互按钮列表（场景 tab） */
const visibleInteractions = computed<SceneInteraction[]>(() => {
  const target = props.scene as BaseScene & { interactions?: SceneInteraction[] }
  return (target.interactions ?? []).filter((i) => isInteractionVisible(i))
})

const hasInteractions = computed(() => visibleInteractions.value.length > 0)

/** 可见的移动列表 */
const visibleMoves = computed<MoveInteraction[]>(() => {
  const target = props.scene as BaseScene & { moves?: MoveInteraction[] }
  const all = target.moves ?? []
  return all.filter((m) => isInteractionVisible(m))
})

const hasMoves = computed(() => visibleMoves.value.length > 0)

// ============================================================
// 事件
// ============================================================

const emit = defineEmits<{
  (e: 'enterEvent', eventId: string): void
  /** 点击探索按钮 */
  (e: 'explore', explore: ButtonOption): void
  /** 点击建造按钮 */
  (e: 'build'): void
  /** 执行资源采集/战斗 */
  (e: 'collect', collect: ResourceInteraction): void
  /** 点击场景交互按钮 */
  (e: 'sceneInteraction', interactionId: string): void
  /** 执行移动 */
  (e: 'move', moveAction: MoveInteraction): void
  /** 人物交互（暂未实现） */
  (e: 'character', char: CharacterInteraction): void
  /** 点击营地建筑名进入建筑交互模式 */
  (e: 'enterBuilding', buildId: string): void
  /** 更新展开的分类（v-model 支持） */
  (e: 'update:expandedCategory', value: string | null): void
}>()

// ============================================================
// 文本解析isEventClicked
// ============================================================

const parsedSegments = computed<TextSegment[]>(() => {
  const currentDescriptionConfig = props.descriptionConfig
  if (!currentDescriptionConfig) return []
  const text = getResolvedDescriptionText(currentDescriptionConfig, props.playerState)
  const entries = props.descriptionConfig?.eventEntries || []

  if (entries.length === 0) {
    return [{ type: 'text', content: text, segmentKey: 'text-0' }]
  }

  const segments: TextSegment[] = []
  let remaining = text
  let segmentIndex = 0
  let match: RegExpExecArray | null

  const placeholderRegex = /\{(\w+)\}/g

  while ((match = placeholderRegex.exec(remaining)) !== null) {
    const placeholderStart = match.index
    const fullMatch = match[0]
    const key = match[1]

    if (placeholderStart > 0) {
      const beforeText = remaining.slice(0, placeholderStart)
      if (beforeText) {
        segments.push({ type: 'text', content: beforeText, segmentKey: `text-${segmentIndex++}` })
      }
    }

    const entry = entries.find((e) => e.key === key)
    if (entry) {
      if (props.isEventClicked) {
        segments.push({
          type: 'text',
          content: entry.displayText,
          segmentKey: `entry-${entry.key}`,
          eventId: entry.eventId,
          displayText: entry.displayText,
        })
      } else {
        segments.push({
          type: 'entry',
          content: entry.displayText,
          segmentKey: `entry-${entry.key}`,
          eventId: entry.eventId,
          displayText: entry.displayText,
        })
      }
    } else {
      segments.push({
        type: 'text',
        content: fullMatch,
        segmentKey: `text-unresolved-${segmentIndex++}`,
      })
    }

    remaining = remaining.slice(placeholderStart + fullMatch.length)
    placeholderRegex.lastIndex = 0
  }

  if (remaining) {
    segments.push({ type: 'text', content: remaining, segmentKey: `text-${segmentIndex++}` })
  }

  return segments
})

// ============================================================
// 事件处理
// ============================================================

function onEntryClick(eventId: string | undefined): void {
  if (!eventId) return
  emit('enterEvent', eventId)
}

function onExplore(explore: ButtonOption): void {
  emit('update:expandedCategory', null)
  emit('explore', explore)
}

function onBuild(): void {
  emit('build')
}

function onCollect(collect: ResourceInteraction): void {
  // emit('update:expandedCategory', null)
  emit('collect', collect)
}

function onSceneInteraction(inter: SceneInteraction): void {
  if (inter.id) {
    emit('sceneInteraction', inter.id)
  }
}

function onMove(moveAction: MoveInteraction): void {
  emit('move', moveAction)
}

function onCharacter(char: CharacterInteraction): void {
  emit('character', char)
}

function onEnterBuilding(buildId: string): void {
  emit('enterBuilding', buildId)
}

/** 交互按钮样式类 */
function interactionBtnClass(inter: SceneInteraction): string {
  const style = inter.buttonStyle
  if (style === 'danger') return 'btn-danger'
  if (style === 'primary') return 'btn-primary'
  if (style === 'special') return 'btn-special'
  return 'btn-default'
}
</script>

<style scoped>
/* ═══════════════════════════════════════════
   容器
   ═══════════════════════════════════════════ */
.scene-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
}

/* ═══════════════════════════════════════════
   场景叙述区
   ═══════════════════════════════════════════ */
.scene-narrative {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.2rem 1.5rem;
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

.scene-line {
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: pre-wrap;
  color: var(--text-primary);
}

.scene-prefix {
  margin: 0 0 0.8em 0;
  font-style: italic;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 0.4em 0.6em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: pre-wrap;
  color: var(--text-primary);
  line-height: 1.75;
  font-size: var(--font-lg);
}

.scene-suffix {
  margin: 0 0 0.8em 0;
  font-style: italic;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  margin-top: 1em;
  padding: 0.4em 0.6em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: pre-wrap;
  color: var(--text-primary);
  line-height: 1.75;
  font-size: var(--font-lg);
}

/* 事件入口链接 */
.event-link {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: #64b5f6;
  font: inherit;
  cursor: pointer;
  position: relative;
  display: inline-flex;
  align-items: center;
  transition: color 0.15s ease;
}

.event-link:hover {
  color: #90caf9;
}

.link-decoration {
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #64b5f6;
  border-radius: 1px;
  transition: all 0.15s ease;
}

.event-link:hover .link-decoration {
  background: #90caf9;
  height: 3px;
  box-shadow: 0 0 8px rgba(100, 181, 246, 0.4);
}
/* ═══════════════════════════════════════════
   固定建筑按钮栏（固定网格）
   ═══════════════════════════════════════════ */
.building-category-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
  padding: 0.5rem 1.2rem;
  border-top: 1px solid var(--border-weak);
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════
   四个分类按钮栏（固定网格）
   ═══════════════════════════════════════════ */
.category-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
  padding: 0.5rem 1.2rem;
  border-top: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.cat-cell {
  display: flex;
  min-height: 72px;
}

.cat-btn {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.5rem 0.2rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  line-height: 1.15;
}

.cat-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.cat-btn.active {
  border-color: var(--accent);
  background: rgba(78, 205, 196, 0.12);
  color: var(--accent);
}

.cat-icon {
  font-size: 1.5rem;
  line-height: 1;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));
}

.cat-label {
  font-weight: 700;
  font-size: var(--font-md);
  letter-spacing: 0.03em;
}

.cat-cost {
  font-size: var(--font-xs);
  color: var(--text-muted);
  line-height: 1;
}

/* ═══════════════════════════════════════════
   场景交互条 — 始终固定显示
   ═══════════════════════════════════════════ */
.scene-interactions-bar {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.4rem 1.2rem;
  border-top: 1px solid rgba(100, 181, 246, 0.15);
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.08) 0%, rgba(78, 205, 196, 0.04) 100%);
  flex-shrink: 0;
}

.inter-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(100, 181, 246, 0.15);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
}

.inter-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.inter-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.inter-title {
  font-weight: 600;
  font-size: var(--font-sm);
  color: var(--text-primary);
}

.inter-desc {
  font-size: var(--font-xs);
  color: var(--text-muted);
  line-height: 1.3;
}

.inter-btn {
  flex-shrink: 0;
  padding: 0.35rem 0.9rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.inter-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.inter-btn.btn-primary {
  border-color: rgba(78, 205, 196, 0.5);
  background: rgba(78, 205, 196, 0.08);
  color: var(--accent);
}

.inter-btn.btn-primary:hover {
  background: rgba(78, 205, 196, 0.18);
}

.inter-btn.btn-danger {
  border-color: rgba(255, 107, 107, 0.5);
  background: rgba(255, 107, 107, 0.08);
  color: #ff6b6b;
}

.inter-btn.btn-danger:hover {
  background: rgba(255, 107, 107, 0.18);
}

.inter-btn.btn-special {
  border-color: rgba(255, 213, 79, 0.5);
  background: rgba(255, 213, 79, 0.08);
  color: #ffd54f;
}

.inter-btn.btn-special:hover {
  background: rgba(255, 213, 79, 0.18);
}

/* ═══════════════════════════════════════════
   次级选项面板
   ═══════════════════════════════════════════ */
.sub-panel {
  overflow-y: auto;
  padding: 0.5rem 1.2rem;
  border-top: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* 次级选项行 */
.sub-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--border-weak);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
}

.sub-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.sub-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.sub-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
  width: 100%;
  font-weight: 600;
  font-size: var(--font-sm);
  color: var(--text-primary);
}

.sub-title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.sub-cost-inline {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.1rem;
  font-size: var(--font-xs);
  color: var(--text-muted);
  white-space: nowrap;
}

.cost-icon {
  font-size: 0.75rem;
  line-height: 1;
}

.sub-desc {
  font-size: var(--font-xs);
  color: var(--text-muted);
  line-height: 1.3;
}

.recovery-rate {
  font-size: var(--font-xs);
  color: #64b5f6;
  line-height: 1.3;
  opacity: 0.85;
}

/* ── 右侧操作区（按钮 + 资源数量） ── */
.sub-action-area {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.resource-count {
  font-size: var(--font-xs);
  font-weight: 700;
  line-height: 1;
  opacity: 0.85;
  transition: color 0.2s;
}

.rc-sufficient {
  color: #4caf50;
}

.rc-low {
  color: #ffc107;
}

.rc-critical {
  color: #f44336;
}

.sub-btn {
  flex-shrink: 0;
  padding: 0.35rem 0.9rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.sub-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.sub-btn.btn-primary {
  border-color: rgba(78, 205, 196, 0.5);
  background: rgba(78, 205, 196, 0.08);
  color: var(--accent);
}

.sub-btn.btn-primary:hover {
  background: rgba(78, 205, 196, 0.18);
}

.sub-btn.btn-danger {
  border-color: rgba(255, 107, 107, 0.5);
  background: rgba(255, 107, 107, 0.08);
  color: #ff6b6b;
}

.sub-btn.btn-danger:hover {
  background: rgba(255, 107, 107, 0.18);
}

.sub-btn.btn-special {
  border-color: rgba(255, 213, 79, 0.5);
  background: rgba(255, 213, 79, 0.08);
  color: #ffd54f;
}

.sub-btn.btn-special:hover {
  background: rgba(255, 213, 79, 0.18);
}

.sub-empty {
  text-align: center;
  padding: 0.6rem 0;
  color: var(--text-muted);
  font-size: var(--font-xs);
  font-style: italic;
}

/* ---- 营地建筑交互 ---- */
.building-interactions {
  padding: 0.5rem 1.2rem 0.7rem;
  border-top: 1px solid var(--border-weak);
  background: rgba(78, 205, 196, 0.04);
  flex-shrink: 0;
}

.building-section-label {
  font-size: var(--font-xs);
  color: var(--accent);
  opacity: 0.7;
  margin-bottom: 0.5rem;
}

/* 建筑卡片网格 */
.building-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}

.building-entry-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.6rem 0.4rem;
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: var(--radius-md);
  background: rgba(78, 205, 196, 0.06);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.building-entry-card:hover {
  background: rgba(78, 205, 196, 0.14);
  border-color: var(--accent);
  box-shadow: 0 3px 8px rgba(78, 205, 196, 0.2);
  transform: translateY(-1px);
}

.entry-icon {
  font-size: 1.6rem;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.entry-name {
  font-weight: bold;
  font-size: var(--font-sm);
  color: var(--text-primary);
  text-align: center;
  line-height: 1.2;
}

.entry-desc {
  font-size: var(--font-xs);
  color: var(--text-muted);
  text-align: center;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
