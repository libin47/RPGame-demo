<!-- src/components/EventView.vue -->

<template>
  <div class="event-view">
    <!-- 事件文本 -->
    <div class="event-text">
      {{ resolvedText }}
    </div>

    <!-- 事件选项 -->
    <div class="event-options">
      <button
        v-for="option in frame.options"
        :key="option.id"
        class="option-btn"
        :class="getOptionClass(option.optionStyle)"
        @click="$emit('selectOption', option.id)"
      >
        {{ option.text }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EventFrame } from '@/types/event'
import { EventOptionStyle } from '@/types/event'

const props = defineProps<{
  /** 当前事件帧 */
  frame: EventFrame
  /** 占位符替换函数 */
  resolveText: (text: string) => string
}>()

defineEmits<{
  selectOption: [optionId: string]
}>()

/** 替换占位符后的事件文本 */
const resolvedText = computed(() => {
  return props.resolveText(props.frame.text)
})

/**
 * 根据选项样式返回 CSS 类名
 */
function getOptionClass(style?: EventOptionStyle): string {
  switch (style) {
    case EventOptionStyle.DANGER:
      return 'option-danger'
    case EventOptionStyle.SPECIAL:
      return 'option-special'
    case EventOptionStyle.HIDDEN:
      return 'option-hidden'
    case EventOptionStyle.MADNESS:
      return 'option-madness'
    default:
      return ''
  }
}
</script>

<style scoped>
.event-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
}

.event-text {
  flex: 1;
  font-size: 16px;
  line-height: 1.8;
  color: #e0e0e0;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.event-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #333;
}

.option-btn {
  padding: 10px 20px;
  background: #16213e;
  color: #e0e0e0;
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.option-btn:hover {
  background: #0f3460;
}

/* 危险操作：红色边框 */
.option-danger {
  border-color: #ff4444;
  color: #ff6b6b;
}

.option-danger:hover {
  background: #4a1a1a;
}

/* 特殊操作：金色边框 */
.option-special {
  border-color: #ffd700;
  color: #ffd700;
}

.option-special:hover {
  background: #3d3d1a;
}

/* 隐藏选项：半透明 */
.option-hidden {
  opacity: 0.6;
  border-style: dashed;
}

/* 疯狂选项：紫色闪烁效果 */
.option-madness {
  border-color: #9b59b6;
  color: #c39bdb;
}

.option-madness:hover {
  background: #2a1a3d;
}
</style>