<!-- RichText.vue - 支持颜色标记的富文本
     解析 {{green}}…{{/green}}、{{red}}…{{/red}} 标记为对应颜色的 span，
     其余文本原样输出（供属性/经验变动提醒等使用，与普通文本可混排） -->
<template>
  <span v-for="seg in segments" :key="seg.key" :class="seg.color ? 'rich-' + seg.color : ''">
    {{ seg.text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
}>()

type Segment = { key: string; text: string; color: 'green' | 'red' | null }

/** 解析颜色标记，拆分为普通段与着色段 */
const segments = computed<Segment[]>(() => {
  const result: Segment[] = []
  const regex = /\{\{(green|red)\}\}([\s\S]*?)\{\{\/\1\}\}/g
  let last = 0
  let index = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(props.text)) !== null) {
    if (match.index > last) {
      result.push({ key: `t-${index++}`, text: props.text.slice(last, match.index), color: null })
    }
    result.push({ key: `c-${index++}`, text: match[2] ?? '', color: match[1] as 'green' | 'red' })
    last = regex.lastIndex
  }
  if (last < props.text.length) {
    result.push({ key: `t-${index++}`, text: props.text.slice(last), color: null })
  }
  return result
})
</script>

<style scoped>
.rich-green {
  color: #81c784;
}

.rich-red {
  color: #ef5350;
}
</style>
