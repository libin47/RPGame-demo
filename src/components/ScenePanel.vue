<!-- ScenePanel.vue - 场景面板
     参考风格：暗角遮罩、渐变背景、文字阴影、独立链接装饰
     显示当前场景描述文本（含可点击事件入口）和固定交互按钮 -->
<template>
  <div class="scene-panel">
    <!-- 场景描述区域（带暗角氛围） -->
    <div
      class="scene-narrative"
      :style="
        backgroundColor
          ? { background: `linear-gradient(180deg, ${backgroundColor} 0%, rgba(0,0,0,0.3) 100%)` }
          : undefined
      "
    >
      <div class="vignette-overlay"></div>
      <div class="content">
        <p class="scene-line">
          <template v-for="segment in parsedSegments" :key="segment.segmentKey">
            <!-- 普通文本段 -->
            <span v-if="segment.type === 'text'">{{ segment.content }}</span>
            <!-- 事件入口段（可点击链接） -->
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
      </div>
    </div>

    <!-- 固定交互按钮 -->
    <div class="interactions">
      <button
        v-for="interaction in interactions"
        :key="interaction.id"
        class="interaction-btn"
        :class="interactionButtonClass(interaction)"
        @click="onInteractionClick(interaction.id)"
      >
        {{ interaction.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SceneDescription, SceneEventEntry, SceneInteraction } from '@/types/scene'

// ============================================================
// 解析后的文本段类型
// ============================================================

/** 场景文本段：普通文字或可点击事件入口 */
interface TextSegment {
  /** 段类型 */
  type: 'text' | 'entry'
  /** 展示内容 */
  content: string
  /** 唯一标识 */
  segmentKey: string
  /** 事件ID（仅 entry 类型） */
  eventId?: string
  /** 入口显示文本（仅 entry 类型） */
  displayText?: string
}

// ============================================================
// 组件属性
// ============================================================

const props = defineProps<{
  /** 当前展示的场景描述文本（已替换占位符） */
  resolvedDescription: string
  /** 当前场景描述配置（包含 eventEntries） */
  descriptionConfig: SceneDescription | null
  /** 当前可用的交互按钮列表 */
  interactions: SceneInteraction[]
  /** 随时段变化的背景色 */
  backgroundColor?: string
}>()

// ============================================================
// 事件
// ============================================================

const emit = defineEmits<{
  /** 点击事件入口 */
  (e: 'enterEvent', eventId: string): void
  /** 点击交互按钮 */
  (e: 'interaction', interactionId: string): void
}>()

// ============================================================
// 文本解析（将 {key} 占位符替换为事件入口链接）
// ============================================================

/** 解析后的文本段列表 */
const parsedSegments = computed<TextSegment[]>(() => {
  const text = props.resolvedDescription
  const entries = props.descriptionConfig?.eventEntries || []

  if (entries.length === 0) {
    // 没有事件入口，整段为纯文本
    return [{ type: 'text', content: text, segmentKey: 'text-0' }]
  }

  const segments: TextSegment[] = []
  let remaining = text
  let segmentIndex = 0
  let match: RegExpExecArray | null

  // 正则匹配 {key} 占位符（key 由字母、数字、下划线组成）
  const placeholderRegex = /\{(\w+)\}/g

  while ((match = placeholderRegex.exec(remaining)) !== null) {
    const placeholderStart = match.index
    const fullMatch = match[0]
    const key = match[1]

    // 占位符前的文本
    if (placeholderStart > 0) {
      const beforeText = remaining.slice(0, placeholderStart)
      if (beforeText) {
        segments.push({ type: 'text', content: beforeText, segmentKey: `text-${segmentIndex++}` })
      }
    }

    // 查找对应的事件入口
    const entry = entries.find((e: SceneEventEntry) => e.key === key)
    if (entry) {
      segments.push({
        type: 'entry',
        content: entry.displayText,
        segmentKey: `entry-${entry.key}`,
        eventId: entry.eventId,
        displayText: entry.displayText,
      })
    } else {
      // 未找到对应入口，保留原文
      segments.push({
        type: 'text',
        content: fullMatch,
        segmentKey: `text-unresolved-${segmentIndex++}`,
      })
    }

    // 继续解析剩余文本
    remaining = remaining.slice(placeholderStart + fullMatch.length)
    placeholderRegex.lastIndex = 0 // 重置正则位置
  }

  // 剩余的文本
  if (remaining) {
    segments.push({ type: 'text', content: remaining, segmentKey: `text-${segmentIndex++}` })
  }

  return segments
})

// ============================================================
// 事件处理
// ============================================================

/** 点击事件入口 */
function onEntryClick(eventId: string | undefined): void {
  if (!eventId) return
  emit('enterEvent', eventId)
}

/** 点击交互按钮 */
function onInteractionClick(interactionId: string): void {
  emit('interaction', interactionId)
}

/** 交互按钮样式类 */
function interactionButtonClass(interaction: SceneInteraction): string {
  const style = interaction.buttonStyle
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
   场景叙述区（参考风格：暗角 + 渐变）
   ═══════════════════════════════════════════ */
.scene-narrative {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.2rem 1.5rem;
  line-height: 1.75;
  font-size: var(--font-lg);
  position: relative;
}

/* 暗角遮罩 */
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

/* ═══════════════════════════════════════════
   事件入口链接（参考风格）
   ═══════════════════════════════════════════ */
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
   交互按钮区
   ═══════════════════════════════════════════ */
.interactions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  border-top: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.2);
}

.interaction-btn {
  padding: 0.45rem 1.1rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.interaction-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.interaction-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

.btn-primary {
  border-color: rgba(78, 205, 196, 0.5);
  color: var(--accent);
}

.btn-primary:hover {
  background: var(--accent-dim);
  border-color: var(--accent);
}

.btn-danger {
  border-color: rgba(255, 107, 107, 0.5);
  color: #ff6b6b;
}

.btn-danger:hover {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}

.btn-special {
  border-color: rgba(255, 213, 79, 0.5);
  color: #ffd54f;
}

.btn-special:hover {
  background: rgba(255, 213, 79, 0.1);
  border-color: #ffd54f;
}
</style>
