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
        <div v-if="frameTextPrefix" class="result-prefix">
          <RichText :text="frameTextPrefix" />
        </div>
        <p class="frame-text">
          <CorruptText :text="resolvedText" :tier="sanTier" />
        </p>
        <!-- 资源不足等拦截提示（显示在帧文本下方） -->
        <div v-if="frameTextSuffix" class="result-suffix">
          <RichText :text="frameTextSuffix" />
        </div>
        <!-- 文本变体（斜体、条件满足时显示） -->
        <p v-for="v in props.variations" :key="v.content" class="text-variation">
          <CorruptText :text="v.content" :tier="sanTier" />
        </p>
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
        <span class="option-name">{{ option.name }}</span
        ><span v-if="optionResultIcon(option)" class="option-result-icon">{{
          optionResultIcon(option)
        }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EventFrame, EventOption, EventTextVariation } from '@/types/event'
import { getOptionResultIcon } from '@/engine'
import RichText from './RichText.vue'
import CorruptText from './CorruptText.vue'

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
  /** 资源不足等拦截提示（显示在帧文本下方） */
  frameTextSuffix: string
  /** 过滤后的可见选项列表（由 GameView 计算传入） */
  options: EventOption[]
  /** 可见的文本变体列表（由 GameView 计算传入） */
  variations: EventTextVariation[]
  /** 选项可用性映射（optionId -> 是否满足 availableCondition） */
  optionAvailability: Record<string, boolean>
  /** SAN 异常档位（0 正常 ~ 4 极度），用于事件主文本与变体的异常渲染 */
  sanTier?: number
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

/** 获取选项结果类型图标（条件判断⚖️ / 掷骰🎲 / 概率🎰，直接执行无图标） */
function optionResultIcon(option: EventOption): string {
  return getOptionResultIcon(option)
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
  background: var(--paper-root);
  font-family: 'FangSong', 'STFangsong', 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
}

/* ═══════════════════════════════════════════
   事件主文本区（与 ScenePanel 的 scene-narrative 完全一致）
   ═══════════════════════════════════════════ */
.event-text {
  flex: 1;
  overflow-y: auto;
  padding: 1.3rem 1.5rem 1.8rem;
  line-height: 1.9;
  font-size: var(--font-lg);
  position: relative;
  background:
    radial-gradient(ellipse at 50% 0%, var(--narr-glow), transparent 55%),
    linear-gradient(180deg, var(--narr-top) 0%, var(--narr-bottom) 100%);
}

/* 暗角遮罩（与 ScenePanel 的 vignette-overlay 一致，随主题令牌变化） */
.vignette-overlay {
  position: absolute;
  inset: 0;
  background: var(--vignette);
  pointer-events: none;
  z-index: 1;
}

.content {
  position: relative;
  z-index: 2;
}

/* 上一帧选项结果文本（与 ScenePanel 的 scene-prefix 统一：手写批注条） */
.result-prefix {
  margin: 0 0 0.8em 0;
  font-style: italic;
  color: var(--text-secondary);
  background: var(--prefix-bg);
  border: 1px solid var(--line-soft);
  border-left: 3px solid var(--prefix-line);
  border-radius: 0 6px 6px 0;
  padding: 0.45em 0.7em;
  box-shadow: 0 1px 2px var(--shadow);
  white-space: pre-wrap;
  line-height: 1.75;
  font-size: var(--font-lg);
}

.frame-text {
  margin: 0;
  text-shadow: var(--text-shadow);
  white-space: pre-wrap;
  color: var(--text-primary);
}

/* 资源不足等拦截提示（显示在帧文本下方，与 ScenePanel 的 scene-suffix 统一） */
.result-suffix {
  margin: 1em 0 0.8em 0;
  font-style: italic;
  color: var(--text-secondary);
  background: var(--prefix-bg);
  border: 1px solid var(--line-soft);
  border-left: 3px solid var(--prefix-line);
  border-radius: 0 6px 6px 0;
  padding: 0.45em 0.7em;
  box-shadow: 0 1px 2px var(--shadow);
  white-space: pre-wrap;
  line-height: 1.75;
  font-size: var(--font-lg);
}

/* 文本变体：斜体，其余与主文本相同 */
.text-variation {
  font-style: italic;
  white-space: pre-wrap;
  line-height: 1.75;
  margin-top: 0.6em;
  text-shadow: var(--text-shadow);
}

/* ═══════════════════════════════════════════
   选项区（与 ScenePanel 的 interactions 统一）
   ═══════════════════════════════════════════ */
.option-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.9rem 1.2rem 1.1rem;
  border-top: 1px solid var(--border-weak);
  background: var(--bar-bg);
}

.option-btn {
  min-height: 48px;
  padding: 0.6rem 1.15rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-md);
  letter-spacing: 0.03em;
  cursor: pointer;
  text-align: left;
  transition:
    all var(--transition-fast),
    transform 0.12s ease;
  box-shadow: 0 1px 2px var(--shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  font-family: inherit;
  border-color: rgba(233, 215, 178, 0.18);
}

/* 结果类型图标（⚖️🎲🎰） */
.option-result-icon {
  font-size: 1.05em;
  line-height: 1;
  flex-shrink: 0;
  opacity: 0.9;
}

.option-btn:hover {
  background: var(--card-hover);
  border-color: var(--border-mid);
  color: var(--text-primary);
  box-shadow: 0 4px 12px var(--shadow-strong);
  transform: translateY(-1px);
}

.option-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px var(--shadow);
}

/* 默认选项 */
.opt-default {
  border-color: var(--border-mid);
  color: var(--text-secondary);
}

.opt-default:hover {
  background: var(--card-hover);
  border-color: var(--border-mid);
  color: var(--text-primary);
}

/* 危险选项（朱砂红，醒目） */
.opt-danger {
  border-color: rgba(255, 107, 107, 0.5);
  color: #ff6b6b;
}

.opt-danger:hover {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}

/* 特殊选项（亮金，醒目） */
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

/* 疯狂选项（亮紫） */
.opt-madness {
  border-color: rgba(168, 155, 200, 0.5);
  color: #b8a8cc;
}

.opt-madness:hover {
  background: rgba(168, 155, 200, 0.1);
  border-color: #a89bc8;
}

/* 不可用选项（条件不满足，灰色不可点击） */
.opt-unavailable {
  opacity: 0.45;
  cursor: not-allowed;
  border-color: var(--border-weak);
  color: var(--text-muted);
}

.opt-unavailable:hover {
  background: transparent;
  border-color: var(--border-weak);
  color: var(--text-muted);
  box-shadow: none;
  transform: none;
}
</style>
