<!-- EventPanel.vue - 事件面板
     显示事件文本描述与可选的交互选项 -->
<template>
  <div class="event-panel">
    <!-- 事件文本 -->
    <div class="event-text">{{ resolvedText }}</div>

    <!-- 分割线 -->
    <div class="divider"></div>

    <!-- 选项列表 -->
    <div class="option-list">
      <button
        v-for="option in options"
        :key="option.id"
        class="option-btn"
        :class="optionButtonClass(option)"
        @click="onOptionClick(option.id)"
      >
        {{ option.text }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EventFrame, EventOption } from '@/types/event'
import { EventOptionStyle } from '@/types/event'

// ============================================================
// 组件属性
// ============================================================

const props = defineProps<{
  /** 当前事件帧 */
  frame: EventFrame
  /** 已替换占位符的事件文本 */
  resolvedText: string
  /** 过滤后的可见选项列表（由 GameView 计算传入） */
  options: EventOption[]
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
  const style = option.optionStyle
  if (style === EventOptionStyle.DANGER) return 'opt-danger'
  if (style === EventOptionStyle.SPECIAL) return 'opt-special'
  if (style === EventOptionStyle.HIDDEN) return 'opt-hidden'
  if (style === EventOptionStyle.MADNESS) return 'opt-madness'
  return 'opt-default'
}

/** 选择选项 */
function onOptionClick(optionId: string): void {
  emit('selectOption', optionId)
}
</script>

<style scoped>
.event-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #e0e0e0;
}

.event-text {
  flex: 1;
  padding: 24px 20px 16px;
  overflow-y: auto;
  line-height: 2.0;
  font-size: 15px;
  white-space: pre-wrap;
  color: #f0f0f0;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  margin: 0 20px;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.15);
}

.option-btn {
  padding: 12px 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #d0d0d0;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.option-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.option-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
}

/* 危险选项（红色） */
.opt-danger {
  border-color: rgba(229, 57, 53, 0.5);
  color: #ff6b6b;
}

.opt-danger:hover {
  background: rgba(229, 57, 53, 0.1);
  border-color: #e53935;
}

/* 特殊选项（金色） */
.opt-special {
  border-color: rgba(255, 179, 0, 0.5);
  color: #ffd54f;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 200, 0, 0.03));
}

.opt-special:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 200, 0, 0.06));
  border-color: #ffb300;
}

/* 隐藏选项（半透明） */
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02), rgba(123, 31, 162, 0.04));
}

.opt-madness:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(123, 31, 162, 0.08));
  border-color: #7b1fa2;
}
</style>
