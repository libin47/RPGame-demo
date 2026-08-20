<!-- RichText.vue - 支持颜色标记的富文本
     解析 {{green}}…{{/green}}、{{red}}…{{/red}}、
     {{neutral}}…{{/neutral}}、{{special}}…{{/special}}
     标记为对应颜色的 span，其余文本原样输出
     （供属性/经验变动提醒、状态叙事等使用，与普通文本可混排） -->
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

type RichColor = 'green' | 'red' | 'neutral' | 'special'
type Segment = { key: string; text: string; color: RichColor | null }

/** 解析颜色标记，拆分为普通段与着色段 */
const segments = computed<Segment[]>(() => {
  const result: Segment[] = []
  const regex = /\{\{(green|red|neutral|special)\}\}([\s\S]*?)\{\{\/\1\}\}/g
  let last = 0
  let index = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(props.text)) !== null) {
    if (match.index > last) {
      result.push({ key: `t-${index++}`, text: props.text.slice(last, match.index), color: null })
    }
    result.push({ key: `c-${index++}`, text: match[2] ?? '', color: match[1] as RichColor })
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
  color: var(--rc-suf);
}

.rich-red {
  color: var(--rc-crit);
}

.rich-neutral {
  color: var(--ink-weak);
}

.rich-special {
  color: var(--madness);
}
</style>
