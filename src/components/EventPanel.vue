<!-- EventPanel.vue - 事件面板
     显示事件文本描述与可选的交互选项
     样式与 ScenePanel 视觉统一 -->
<template>
  <div class="event-panel">
    <!-- 事件文本区（带暗角氛围） -->
    <div class="event-text">
      <div class="vignette-overlay"></div>
      <div class="content">
        <!-- 上一帧选项结果文本 -->
        <div v-if="frameTextPrefix" class="result-prefix">{{ frameTextPrefix }}</div>
        <p class="frame-text">{{ resolvedText }}</p>
        <!-- 文本变体（斜体、条件满足时显示） -->
        <p v-for="v in props.variations" :key="v.content" class="text-variation">{{ v.content }}</p>
      </div>
    </div>

    <!-- 选项列表 -->
    <div class="option-list">
      <button
        v-for="option in options"
        :key="option.id"
        class="option-btn"
        :class="[optionButtonClass(option), { 'opt-unavailable': !isAvailable(option.id) }]"
        :disabled="!isAvailable(option.id)"
        @click="onOptionClick(option.id)"
      >
        {{ option.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EventFrame, EventOption, EventTextVariation } from '@/types/event'

// ============================================================
// 组件属性
// ============================================================

const props = defineProps<{
  /** 当前事件帧 */
  frame: EventFrame
  /** 已替换占位符的事件文本 */
  resolvedText: string
  /** 上一帧选项结果文本（带样式区分） */
  frameTextPrefix: string
  /** 过滤后的可见选项列表（由 GameView 计算传入） */
  options: EventOption[]
  /** 可见的文本变体列表（由 GameView 计算传入） */
  variations: EventTextVariation[]
  /** 选项可用性映射（optionId -> 是否满足 availableCondition） */
  optionAvailability: Record<string, boolean>
}>()

// ============================================================
// 事件
// ============================================================

const emit = defineEmits<{
  /** 选择选项 */
  (e: 'selectOption', optionId: string): void
}>()

// ============================================================
// 选项计算
// ============================================================

/** 当前帧的选项列表（已由 GameView 过滤） */
const options = computed<EventOption[]>(() => {
  return props.options || []
})

// ============================================================
// 选项样式
// ============================================================

/** 根据选项样式类型返回 CSS 类名 */
function optionButtonClass(option: EventOption): string {
  const style = option.buttonStyle
  if (style === 'danger') return 'opt-danger'
  if (style === 'special') return 'opt-special'
  if (style === 'hidden') return 'opt-hidden'
  if (style === 'madness') return 'opt-madness'
  return 'opt-default'
}

/** 选择选项 */
function onOptionClick(optionId: string): void {
  if (!isAvailable(optionId)) return
  emit('selectOption', optionId)
}

/** 判断选项是否可用（满足 availableCondition） */
function isAvailable(optionId: string): boolean {
  return props.optionAvailability[optionId] !== false
}
</script>

<style scoped>
/* ═══════════════════════════════════════════
   容器
   ═══════════════════════════════════════════ */
.event-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
}

/* ═══════════════════════════════════════════
   事件文本区（与 ScenePanel 的 scene-narrative 统一）
   ═══════════════════════════════════════════ */
.event-text {
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

/* 上一帧选项结果文本（与 ScenePanel 的 scene-prefix 统一） */
.result-prefix {
  margin: 0 0 0.8em 0;
  font-style: italic;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
  padding: 0.4em 0.6em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: pre-wrap;
  color: var(--text-primary);
  line-height: 1.75;
  font-size: var(--font-lg);
}

.frame-text {
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: pre-wrap;
  color: var(--text-primary);
}

/* 文本变体：斜体，其余与主文本相同 */
.text-variation {
  font-style: italic;
  white-space: pre-wrap;
  line-height: 1.75;
  margin-top: 0.6em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* ═══════════════════════════════════════════
   选项区（与 ScenePanel 的 interactions 统一）
   ═══════════════════════════════════════════ */
.option-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  border-top: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.2);
}

.option-btn {
  padding: 0.45rem 1.1rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: var(--font-md);
  cursor: pointer;
  text-align: left;
  transition: all var(--transition-fast);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.option-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.option-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

/* 默认选项 */
.opt-default {
  border-color: var(--border-mid);
  color: var(--text-secondary);
}

.opt-default:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

/* 危险选项（红色） */
.opt-danger {
  border-color: rgba(255, 107, 107, 0.5);
  color: #ff6b6b;
}

.opt-danger:hover {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}

/* 特殊选项（金色） */
.opt-special {
  border-color: rgba(255, 213, 79, 0.5);
  color: #ffd54f;
}

.opt-special:hover {
  background: rgba(255, 213, 79, 0.1);
  border-color: #ffd54f;
}

/* 隐藏选项（半透明、虚线边框） */
.opt-hidden {
  opacity: 0.5;
  border-style: dashed;
}

.opt-hidden:hover {
  opacity: 0.85;
}

/* 疯狂选项（紫色） */
.opt-madness {
  border-color: rgba(123, 31, 162, 0.5);
  color: #ce93d8;
}

.opt-madness:hover {
  background: rgba(123, 31, 162, 0.1);
  border-color: #7b1fa2;
}

/* 不可用选项（条件不满足，灰色不可点击） */
.opt-unavailable {
  opacity: 0.45;
  cursor: not-allowed;
  border-color: var(--border-weak);
  color: #888;
}

.opt-unavailable:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--border-weak);
  color: #888;
  box-shadow: none;
  transform: none;
}
</style>
