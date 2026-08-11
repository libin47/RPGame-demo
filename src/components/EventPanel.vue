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
        <p class="frame-text">{{ resolvedText }}</p>
        <!-- 资源不足等拦截提示（显示在帧文本下方） -->
        <div v-if="frameTextSuffix" class="result-suffix">
          <RichText :text="frameTextSuffix" />
        </div>
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

/* 资源不足等拦截提示（显示在帧文本下方，与 ScenePanel 的 scene-suffix 统一） */
.result-suffix {
  margin: 1em 0 0.8em 0;
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
  gap: 0.7rem;
  padding: 0.9rem 1.2rem 1.1rem;
  border-top: 1px solid var(--border-weak);
  background: rgba(0, 0, 0, 0.2);
}

.option-btn {
  min-height: 48px;
  padding: 0.6rem 1.15rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  font-size: var(--font-md);
  letter-spacing: 0.03em;
  cursor: pointer;
  text-align: left;
  transition:
    all var(--transition-fast),
    transform 0.12s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

/* 结果类型图标（⚖️🎲🎰） */
.option-result-icon {
  font-size: 1.05em;
  line-height: 1;
  flex-shrink: 0;
  opacity: 0.9;
}

.option-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}

.option-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
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

/* ═════════════════════════════════════════════════════════
   原型试验：陈年暗纸·手记风
   用于与 ScenePanel 的「浅色书页」风格对比，仅覆盖本面板。
   选中方案后可整体铺开，或整块删除还原。
   ═════════════════════════════════════════════════════════ */
.event-panel {
  position: relative;
  --text-primary: #d9cfbd;
  --text-secondary: #a99a83;
  --text-muted: #847663;
  --accent: #7fb0a8;
  --accent-dim: rgba(127, 176, 168, 0.15);
  --link: #8ab8b0;
  --link-hover: #a6ccc5;
  --border-weak: rgba(233, 215, 178, 0.12);
  --border-mid: rgba(233, 215, 178, 0.22);
  color: var(--text-primary);
  font-family: 'KaiTi', 'STKaiti', 'KaiTi SC', 'FangSong', 'SimSun', 'Songti SC', serif;
  background:
    radial-gradient(ellipse at 50% 18%, rgba(255, 214, 150, 0.07), transparent 55%),
    linear-gradient(180deg, #221a11 0%, #160f09 100%);
}

/* 纸张颗粒感（暖白噪声，overlay 叠加在深色纸面上） */
.event-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  opacity: 0.5;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E");
}

.event-panel .event-text {
  padding: 1.2rem 1.4rem 1.6rem;
}

.event-panel .frame-text,
.event-panel .text-variation {
  color: var(--text-primary);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

.event-panel .result-prefix,
.event-panel .result-suffix {
  color: var(--text-primary);
  background: rgba(255, 238, 205, 0.06);
  border: 1px solid rgba(233, 215, 178, 0.1);
}

/* 暗纸氛围晕影（比原来更沉，保留灯下感） */
.event-panel .vignette-overlay {
  background:
    radial-gradient(
      ellipse at center top,
      rgba(0, 0, 0, 0) 25%,
      rgba(10, 6, 2, 0.25) 62%,
      rgba(8, 5, 2, 0.42) 100%
    ),
    radial-gradient(ellipse at center bottom, rgba(0, 0, 0, 0) 25%, rgba(10, 6, 2, 0.18) 55%);
}

.event-panel .option-list {
  border-top: 1px solid rgba(233, 215, 178, 0.12);
  background: rgba(10, 6, 2, 0.3);
}

.event-panel .option-btn {
  font-family: inherit;
  border-color: rgba(233, 215, 178, 0.18);
  background: rgba(255, 240, 210, 0.035);
  color: var(--text-secondary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
}

.event-panel .option-btn:hover {
  background: rgba(255, 240, 210, 0.07);
  border-color: rgba(233, 215, 178, 0.3);
  color: var(--text-primary);
}

/* 危险选项：朱砂 */
.event-panel .opt-danger {
  border-color: rgba(201, 100, 79, 0.55);
  color: #d98a72;
}

.event-panel .opt-danger:hover {
  background: rgba(201, 100, 79, 0.12);
  border-color: #c9644f;
}

/* 特殊选项：赭金 */
.event-panel .opt-special {
  border-color: rgba(201, 168, 106, 0.55);
  color: #d9b878;
}

.event-panel .opt-special:hover {
  background: rgba(201, 168, 106, 0.12);
  border-color: #c9a86a;
}

/* 疯狂选项：墨紫 */
.event-panel .opt-madness {
  border-color: rgba(164, 128, 184, 0.55);
  color: #b69bc8;
}

.event-panel .opt-madness:hover {
  background: rgba(164, 128, 184, 0.12);
  border-color: #a480b8;
}
</style>
