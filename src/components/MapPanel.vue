<!-- MapPanel.vue - 大地图界面
     显示大地图图片，根据配置在图片上按坐标标注场景节点，点击节点可移动过去 -->
<template>
  <div class="map-panel">
    <!-- 头部 -->
    <div class="mp-header">
      <h2 class="mp-title">🗺️ {{ map.name }}</h2>
      <span class="mp-hint">点击场景名称即可前往</span>
    </div>

    <!-- 地图画布：图片 + 路径线 + 节点标记 -->
    <div class="mp-canvas-wrap">
      <div class="mp-canvas">
        <img ref="mapImgEl" :src="mapImage" alt="大地图" class="mp-image" @load="onImageLoad" />
        <!-- 路径线（与节点同一坐标系；viewBox 0-100 拉伸到画布，等价于百分比坐标） -->
        <svg
          v-if="visiblePaths.length > 0"
          class="mp-paths"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            v-for="(path, i) in visiblePaths"
            :key="i"
            :x1="nodePercent(path.from).x"
            :y1="nodePercent(path.from).y"
            :x2="nodePercent(path.to).x"
            :y2="nodePercent(path.to).y"
            class="mp-path-line"
          />
        </svg>
        <button
          v-for="node in visibleNodes"
          :key="node.id"
          class="mp-node"
          :class="{
            'mp-node-current': node.sceneId === currentSceneId,
            'mp-node-unreachable': isUnreachable(node),
          }"
          :style="nodeStyle(node)"
          :disabled="isMoving"
          @click="onNodeClick(node)"
        >
          <span class="mp-node-name">{{ nodeDisplayName(node) }}</span>
        </button>
        <!-- 玩家位置标记（沿路径动画移动） -->
        <div
          v-if="playerReady && currentNodeId()"
          class="mp-player"
          :style="playerStyle"
          aria-hidden="true"
        ></div>
      </div>
    </div>

    <!-- 底部返回 -->
    <div class="mp-footer">
      <button class="btn-back" @click="$emit('close')">← 返回场景</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GameMap, MapNode } from '@/types/map'
import type { PlayerState } from '@/types/player'
import { getRegistry, findMapRoute, isMapNodeUnlocked } from '@/engine'

const props = defineProps<{
  /** 当前大地图配置 */
  map: GameMap
  /** 当前所在场景ID（用于高亮当前节点） */
  currentSceneId: string
  /** 玩家状态（用于评估路径通行条件/可达性） */
  playerState: PlayerState
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'moveTo', sceneId: string): void
}>()

const registry = getRegistry()

/** 地图图片路径（public/map/ 下） */
const mapImage = `/map/${props.map.backgroundImageId}`

/** 地图图片的原始尺寸（用于把像素坐标换算为百分比，保证图片缩放后位置正确） */
const imgSize = ref({ width: 0, height: 0 })

/** 玩家标记是否就位（图片加载完成后再显示，避免初始位置错位） */
const playerReady = ref(false)

/** 玩家标记当前位置（百分比坐标，相对图片） */
const playerPos = ref({ x: 0, y: 0 })

/** 是否正在播放移动动画（期间锁定节点点击） */
const isMoving = ref(false)

/** 每段路径动画时长（毫秒） */
const LEG_MS = 600

function onImageLoad(e: Event): void {
  const img = e.target as HTMLImageElement
  imgSize.value = { width: img.naturalWidth, height: img.naturalHeight }
  initPlayerPos()
}

/** 节点样式：像素坐标 → 百分比坐标（相对图片左上角） */
function nodeStyle(node: MapNode): Record<string, string> {
  const { width, height } = imgSize.value
  if (!width || !height) {
    return { left: `${node.position.x}px`, top: `${node.position.y}px` }
  }
  return {
    left: `${(node.position.x / width) * 100}%`,
    top: `${(node.position.y / height) * 100}%`,
  }
}

/** 按节点ID取百分比坐标（用于路径线端点，坐标系与 nodeStyle 一致） */
function nodePercent(nodeId: string): { x: number; y: number } {
  const node = props.map.nodes.find((n) => n.id === nodeId)
  const { width, height } = imgSize.value
  if (!node) return { x: 0, y: 0 }
  if (!width || !height) {
    return { x: node.position.x, y: node.position.y }
  }
  return {
    x: (node.position.x / width) * 100,
    y: (node.position.y / height) * 100,
  }
}

/** 当前所在节点ID（玩家标记所在地） */
function currentNodeId(): string | null {
  return props.map.nodes.find((n) => n.sceneId === props.currentSceneId)?.id ?? null
}

/** 已解锁（可见且可前往）的节点：未解锁节点不渲染 */
const visibleNodes = computed<MapNode[]>(() =>
  props.map.nodes.filter((n) => isMapNodeUnlocked(n, props.playerState)),
)

/** 可见节点ID集合（路径线过滤用：任一端节点未解锁的路径不渲染） */
const visibleNodeIds = computed<Set<string>>(() => new Set(visibleNodes.value.map((n) => n.id)))

/** 可见路径：两端节点都已解锁的路径才渲染 */
const visiblePaths = computed(() =>
  (props.map.paths ?? []).filter(
    (p) => visibleNodeIds.value.has(p.from) && visibleNodeIds.value.has(p.to),
  ),
)

/** 初始化玩家标记位置到当前节点 */
function initPlayerPos(): void {
  const nodeId = currentNodeId()
  if (!nodeId) return
  playerPos.value = nodePercent(nodeId)
  playerReady.value = true
}

/** 玩家标记样式（含动画时长） */
const playerStyle = computed(() => ({
  left: `${playerPos.value.x}%`,
  top: `${playerPos.value.y}%`,
  transitionDuration: `${LEG_MS}ms`,
}))

/** 可达节点集合；未配置路径的地图返回 null（全部可移动，距离兜底） */
const reachableIds = computed<Set<string> | null>(() => {
  const paths = props.map.paths ?? []
  if (paths.length === 0) return null
  const from = currentNodeId()
  if (!from) return null
  const set = new Set<string>([from])
  for (const node of props.map.nodes) {
    if (node.id === from) continue
    if (findMapRoute(props.map, from, node.id, props.playerState)) set.add(node.id)
  }
  return set
})

/** 节点是否不可达（有路径配置但无可行路线） */
function isUnreachable(node: MapNode): boolean {
  const set = reachableIds.value
  return set !== null && !set.has(node.id)
}

/** 当前节点 → 目标节点的动画途经点序列（含起终点）；不可达返回 null */
function routeToTarget(targetNodeId: string): string[] | null {
  const from = currentNodeId()
  if (!from || from === targetNodeId) return null
  const route = findMapRoute(props.map, from, targetNodeId, props.playerState)
  if (!route) return null
  return [from, ...route.map((leg) => leg.to)]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function onNodeClick(node: MapNode): Promise<void> {
  if (isMoving.value) return

  // 有可行路径：先播放沿路径移动动画，到达后再真正移动
  const waypoints = routeToTarget(node.id)
  if (waypoints && waypoints.length > 1) {
    isMoving.value = true
    try {
      for (const nodeId of waypoints) {
        playerPos.value = nodePercent(nodeId)
        await sleep(LEG_MS)
      }
    } finally {
      isMoving.value = false
    }
  }

  emit('moveTo', node.sceneId)
}

// 当前场景变化时重新定位玩家标记（防御性：正常流程中移动后地图即关闭）
watch(
  () => props.currentSceneId,
  () => {
    if (playerReady.value) initPlayerPos()
  },
)

/** 节点显示名称：displayName 优先，否则用场景配置名称 */
function nodeDisplayName(node: MapNode): string {
  if (node.displayName) return node.displayName
  const scene = registry.getScene(node.sceneId)
  return scene?.name ?? node.sceneId
}
</script>

<style scoped>
.map-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: rgba(0, 0, 0, 0.3);
}

/* 头部 */
.mp-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.mp-title {
  margin: 0;
  font-size: var(--font-lg);
  color: var(--text-primary);
}

.mp-hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

/* 地图画布区域（可滚动） */
.mp-canvas-wrap {
  flex: 1;
  overflow: auto;
  padding: 1rem;
  display: flex;
  min-height: 0;
}

/* 画布：严格包裹图片的实际渲染尺寸，节点按百分比定位即与图片对齐 */
.mp-canvas {
  position: relative;
  display: inline-block;
  /* 仅按宽度约束缩放（宽图等比缩小）；高度随图片自适应，高图完整显示供滚动 */
  max-width: 100%;
  /* 居中；溢出时自动边距失效，保证可滚动到图片边缘 */
  margin: auto;
}

.mp-image {
  display: block;
  max-width: 100%;
  border-radius: var(--radius-md);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}

/* 路径线层（图片之上、节点之下） */
.mp-paths {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.mp-path-line {
  stroke: rgb(0, 136, 247);
  stroke-width: 1;
  stroke-linecap: round;
}

/* 场景节点标记 */
.mp-node {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  padding: 0.25rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--radius-md);
  background: rgba(20, 30, 40, 0.8);
  color: var(--text-primary);
  font-size: var(--font-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.mp-node:hover {
  background: rgba(78, 205, 196, 0.35);
  border-color: var(--accent);
  transform: translate(-50%, -50%) scale(1.08);
}

.mp-node-name {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

/* .mp-node-name::before {
  content: '📍';
  font-size: 0.9em;
} */

/* 当前所在节点高亮 */
.mp-node-current {
  border-color: #ffd700;
  background: rgba(35, 29, 0, 0.696);
  box-shadow: 0 0 12px rgba(61, 52, 0, 0.683);
}

.mp-node-current:hover {
  background: rgba(255, 215, 0, 0.4);
}

/* 不可达节点（有路径配置但当前无可行路线）：弱化显示 */
.mp-node-unreachable {
  opacity: 0.4;
  border-color: rgba(255, 255, 255, 0.15);
}

.mp-node-unreachable:hover {
  background: rgba(20, 30, 40, 0.8);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translate(-50%, -50%);
}

.mp-node:disabled {
  cursor: default;
}

/* 玩家位置标记（金色圆点，沿路径动画移动） */
.mp-player {
  position: absolute;
  z-index: 3;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe680, #ffd700 60%, #c99700);
  border: 2px solid #fff;
  box-shadow:
    0 0 10px rgba(255, 215, 0, 0.9),
    0 2px 4px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%);
  transition:
    left 0.6s ease-in-out,
    top 0.6s ease-in-out;
  pointer-events: none;
}

/* 底部返回 */
.mp-footer {
  padding: 0.6rem 1.2rem;
  border-top: 1px solid var(--border-weak);
  flex-shrink: 0;
}

.btn-back {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}
</style>
