<!-- CorruptText.vue - 受 SAN 影响的异常文本渲染
     按字符拆分，根据异常档位概率随机对个别字施加：
       涂黑（ct-blot）：黑块遮住文字
       错位（ct-shift）：轻微位移
       乱码（ct-glyph）：替换为乱码符号
     tier 0 时无任何异常，直接原样输出 -->
<template>
  <span class="corrupt-text">
    <template v-for="(ch, i) in chars" :key="i">
      <span v-if="ch.cls" class="ct-char" :class="ch.cls" :style="ch.style">{{ ch.char }}</span>
      <template v-else>{{ ch.char }}</template>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 原始文本（含换行） */
  text: string
  /** SAN 异常档位：0 正常 / 1 轻微 / 2 明显 / 3 混乱 / 4 极度 */
  tier: number
}>()

/** 各档位下单个字符出现异常的概率 */
const PROB: Record<number, number> = { 0: 0, 1: 0.02, 2: 0.05, 3: 0.1, 4: 0.18 }

/** 乱码字符池（混入全角/半角符号，模拟文字损坏） */
const GLYPHS = ['█', '▓', '▒', '░', '#', '%', '&', '@', '＊', '？', '§', '◼', '◇', 'λ', 'Δ']

interface Char {
  char: string
  cls: string
  style: string
}

/** 按字符生成渲染结果（依赖 text + tier，档位变化时重新随机） */
const chars = computed<Char[]>(() => {
  const p = PROB[props.tier] ?? 0
  const out: Char[] = []
  for (const ch of props.text) {
    // 换行符不参与异常，保持原样
    if (ch === '\n') {
      out.push({ char: ch, cls: '', style: '' })
      continue
    }
    if (Math.random() < p) {
      const r = Math.random()
      if (r < 0.4) {
        // 涂黑：遮住原字
        out.push({ char: ch, cls: 'ct-blot', style: '' })
      } else if (r < 0.72) {
        // 错位：随机方向位移
        const dx = (Math.random() * 7 - 3.5).toFixed(1)
        const dy = (Math.random() * 7 - 3.5).toFixed(1)
        out.push({ char: ch, cls: 'ct-shift', style: `--dx:${dx}px;--dy:${dy}px;` })
      } else {
        // 乱码：替换为符号
        out.push({
          char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          cls: 'ct-glyph',
          style: '',
        })
      }
    } else {
      out.push({ char: ch, cls: '', style: '' })
    }
  }
  return out
})
</script>

<style scoped>
.corrupt-text {
  /* 继承外层文本样式 */
}

/* 每个字符独立内联块，保证位移/涂黑只作用于单字 */
.ct-char {
  display: inline-block;
}

/* 涂黑：墨黑块遮住文字 */
.ct-blot {
  background: #16120a;
  color: transparent;
  border-radius: 1px;
  box-shadow: 0 0 0 1px rgba(22, 18, 10, 0.85);
}

/* 错位：利用 CSS 变量控制位移 */
.ct-shift {
  transform: translate(var(--dx, 0), var(--dy, 0));
}

/* 乱码：保持当前颜色，视觉上为损坏符号 */
.ct-glyph {
  font-style: normal;
}
</style>
