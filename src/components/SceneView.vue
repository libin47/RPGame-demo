<!-- src/components/SceneView.vue -->

<template>
  <div class="scene-view">
    <!-- 当前位置 -->
    <div class="scene-location">
      {{ locationName }}
    </div>

    <!-- 场景描述文本（支持可点击事件入口） -->
    <div class="scene-description">
      <template v-for="(part, index) in resolvedParts" :key="index">
        <!-- 事件入口：蓝色可点击链接 -->
        <span
          v-if="part.isEntry && part.eventId"
          class="event-link"
          @click="$emit('enterEvent', part.eventId!)"
        >
          {{ part.text }}
        </span>
        <!-- 普通文本 -->
        <span v-else>{{ part.text }}</span>
      </template>
    </div>

    <!-- 交互按钮 -->
    <div class="scene-interactions">
      <button
        v-for="interaction in interactions"
        :key="interaction.id"
        class="interaction-btn"
        @click="$emit('interact', interaction.id)"
      >
        {{ interaction.name }}
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import type { SceneInteraction, SceneDescription } from '@/types/scene'
import type { Scene, SubScene } from '@/types/scene'

const props = defineProps<{
  /** 当前场景 */
  scene: Scene
  /** 当前子场景（可能为 null） */
  subScene: SubScene | null
  /** 当前场景描述文本 */
  description: string
  /** 当前场景描述配置（包含事件入口定义） */
  descriptionConfig: SceneDescription | null
  /** 交互按钮列表 */
  interactions: SceneInteraction[]
  /** 占位符替换函数 */
  resolveText: (text: string) => string
}>()

defineEmits<{
  interact: [interactionId: string]
  enterEvent: [eventId: string]
}>()

/**
 * 描述文本解析片段
 * 将带有 {key} 占位符的文本拆分为普通文本和可点击事件入口的混合数组
 */
interface TextPart {
  /** 显示文本 */
  text: string
  /** 是否为事件入口 */
  isEntry: boolean
  /** 事件ID（仅 isEntry 为 true 时有值） */
  eventId?: string
}

/** 当前位置名称 */
const locationName = computed(() => {
  const target = props.subScene || props.scene
  if (props.subScene) {
    return `${props.scene.name} - ${props.subScene.name}`
  }
  return props.scene.name
})

/**
 * 将描述文本解析为片段数组
 * 识别 {key} 占位符，根据 descriptionConfig.eventEntries 替换为可点击链接
 */
const resolvedParts = computed<TextPart[]>(() => {
  const text = props.resolveText(props.description)
  const entries = props.descriptionConfig?.eventEntries || []

  // 如果没有任何事件入口，直接返回纯文本
  if (entries.length === 0) {
    return [{ text, isEntry: false }]
  }

  // 使用正则匹配所有 {key} 占位符
  const parts: TextPart[] = []
  const regex = /\{(\w+)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // 占位符之前的普通文本
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        isEntry: false,
      })
    }

    // 查找对应的事件入口
    const key = match[1]
    const entry = entries.find(e => e.key === key)

    if (entry) {
      // 检查显示条件（简化处理：如果 hideWhenUnavailable 为 true 且不满足条件，则渲染为普通文本）
      parts.push({
        text: entry.displayText,
        isEntry: true,
        eventId: entry.eventId,
      })
    } else {
      // 未找到对应入口，保留原始占位符文本
      parts.push({
        text: match[0],
        isEntry: false,
      })
    }

    lastIndex = regex.lastIndex
  }

  // 剩余文本
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isEntry: false,
    })
  }

  return parts
})
</script>

<style scoped>
.scene-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
}

.scene-location {
  font-size: 13px;
  color: #888;
  margin-bottom: 12px;
  text-align: right;
}

.scene-description {
  flex: 1;
  font-size: 16px;
  line-height: 1.8;
  color: #e0e0e0;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

/* 事件入口：蓝色可点击链接 */
.event-link {
  color: #4dabf7;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;
}

.event-link:hover {
  color: #74c0fc;
}

.event-link:active {
  color: #a5d8ff;
}

.scene-interactions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #333;
}

.interaction-btn {
  padding: 10px 20px;
  background: #16213e;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 6px;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.interaction-btn:hover {
  background: #0f3460;
}

.interaction-btn:active {
  background: #1a1a4e;
}
</style>