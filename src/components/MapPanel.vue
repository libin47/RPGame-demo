<!-- MapPanel.vue - 大地图界面
     显示大地图图片，根据配置在图片上按坐标标注场景节点，点击节点可移动过去 -->
<template>
  <div class="map-panel">
    <!-- 头部 -->
    <div class="mp-header">
      <h2 class="mp-title">🗺️ {{ map.name }}</h2>
      <span class="mp-hint">点击场景名称即可前往</span>
    </div>

    <!-- 地图画布：图片 + 节点标记 -->
    <div class="mp-canvas-wrap">
      <div class="mp-canvas">
        <img
          ref="mapImgEl"
          :src="mapImage"
          alt="大地图"
          class="mp-image"
          @load="onImageLoad"
        />
        <button
          v-for="node in map.nodes"
          :key="node.id"
          class="mp-node"
          :class="{ 'mp-node-current': node.sceneId === currentSceneId }"
          :style="nodeStyle(node)"
          @click="onNodeClick(node)"
        >
          <span class="mp-node-name">{{ nodeDisplayName(node) }}</span>
        </button>
      </div>
    </div>

    <!-- 底部返回 -->
    <div class="mp-footer">
      <button class="btn-back" @click="$emit('close')">← 返回场景</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { GameMap, MapNode } from '@/types/map'
import { getRegistry } from '@/engine'

const props = defineProps<{
  /** 当前大地图配置 */
  map: GameMap
  /** 当前所在场景ID（用于高亮当前节点） */
  currentSceneId: string
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

function onImageLoad(e: Event): void {
  const img = e.target as HTMLImageElement
  imgSize.value = { width: img.naturalWidth, height: img.naturalHeight }
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

/** 节点显示名称：displayName 优先，否则用场景配置名称 */
function nodeDisplayName(node: MapNode): string {
  if (node.displayName) return node.displayName
  const scene = registry.getScene(node.sceneId)
  return scene?.name ?? node.sceneId
}

function onNodeClick(node: MapNode): void {
  emit('moveTo', node.sceneId)
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
  justify-content: center;
  align-items: center;
  min-height: 0;
}

.mp-canvas {
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
}

.mp-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--radius-md);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
}

/* 场景节点标记 */
.mp-node {
  position: absolute;
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

.mp-node-name::before {
  content: '📍';
  font-size: 0.9em;
}

/* 当前所在节点高亮 */
.mp-node-current {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.25);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
}

.mp-node-current:hover {
  background: rgba(255, 215, 0, 0.4);
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