<!-- ReadingView.vue - 阅读界面覆盖层
     全屏覆盖（含状态栏），三种样式取决于 sourceType：diary=白天 / file=傍晚 / terminal=夜晚(黑体)
     返回关闭；前一页/后一页按页条件切换内容 -->
<template>
  <div v-if="config" class="reading-overlay" :data-sourcetype="sourceType">
    <div class="reading-sheet">
      <!-- 标题区 + 作者 -->
      <header class="reading-header">
        <h2 class="reading-title">{{ headerTitle }}</h2>
        <p v-if="currentPage?.title && config.author" class="reading-author">{{ config.author }}</p>
      </header>

      <!-- 正文（仅此区域滚动） -->
      <div class="reading-body">
        <p class="reading-content">{{ currentPageContent }}</p>
        <div v-if="visiblePages.length > 1" class="reading-page-num">
          {{ currentIndex + 1 }} / {{ visiblePages.length }}
        </div>
      </div>

      <!-- 按钮区：第一行 前一页(左)/下一页(右)，第二行 返回 -->
      <footer class="reading-footer">
        <div class="footer-nav-row">
          <button v-if="hasPrev" class="reading-btn" @click="prevPage">上一页</button>
          <span v-else class="footer-nav-spacer"></span>
          <button v-if="hasNext" class="reading-btn" @click="nextPage">下一页</button>
          <span v-else class="footer-nav-spacer"></span>
        </div>
        <div class="footer-return-row">
          <button class="reading-btn btn-return" @click="$emit('close')">返回</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { evaluateCondition } from '@/engine'
import type { ReadingConfig } from '@/types/reading'
import type { PlayerState } from '@/types/player'

const props = defineProps<{
  reading: ReadingConfig
  playerState: PlayerState
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const config = computed(() => props.reading)
const sourceType = computed(() => config.value?.sourceType ?? 'file')

/** 按页条件过滤后的可见页列表 */
const visiblePages = computed(() => {
  const pages = config.value?.pages ?? []
  return pages.filter((p) => !p.condition || evaluateCondition(p.condition, props.playerState))
})

const currentIndex = ref(0)

onMounted(() => {
  if (!config.value || visiblePages.value.length === 0) return
  const lastIndex = visiblePages.value.length - 1
  const cp = config.value.currentPage
  if (cp === undefined || cp === 0) {
    currentIndex.value = 0
  } else if (cp === -1) {
    currentIndex.value = lastIndex
  } else {
    currentIndex.value = Math.min(Math.max(cp, 0), lastIndex)
  }
})

/** 当前页 */
const currentPage = computed(() => visiblePages.value[currentIndex.value])
/** 页头标题：优先当前页标题（如日记"第n日"），否则用阅读整体标题 */
const headerTitle = computed(() => currentPage.value?.title || config.value?.title || '')
const currentPageContent = computed(() => currentPage.value?.content ?? '')

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < visiblePages.value.length - 1)

function prevPage(): void {
  if (currentIndex.value > 0) currentIndex.value -= 1
}
function nextPage(): void {
  if (currentIndex.value < visiblePages.value.length - 1) currentIndex.value += 1
}
</script>

<style scoped>
/* ── 覆盖层：全屏、浮于所有内容之上（含状态栏） ── */
.reading-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 上下各空 3%，左右各空 2%，中间为文本/按钮区域 */
  padding: 3vh 2vw;
  background: rgba(0, 0, 0, 0.62);
  /* 默认：日记/白天式样 */
  --read-paper: linear-gradient(180deg, #efe6d1 0%, #e7dcc3 100%);
  --read-paper-solid: #efe6d1;
  --read-ink: #000000;
  --read-ink-mid: #5f5545;
  --read-accent: #4a6a5a;
  --read-border: rgba(74, 106, 90, 0.45);
  --read-font: 'FangSong', 'STFangsong', 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
}

/* 文件/傍晚式样 */
.reading-overlay[data-sourcetype='file'] {
  --read-paper: linear-gradient(180deg, #392c1b 0%, #2e2314 100%);
  --read-paper-solid: #392c1b;
  --read-ink: #efe6d2;
  --read-ink-mid: #c4b59b;
  --read-accent: #7fb0a8;
  --read-border: rgba(127, 176, 168, 0.4);
}

/* 终端/夜晚式样（黑体） */
.reading-overlay[data-sourcetype='terminal'] {
  --read-paper: linear-gradient(180deg, #14100a 0%, #0c0906 100%);
  --read-paper-solid: #14100a;
  --read-ink: #d8cfbb;
  --read-ink-mid: #b0a68f;
  --read-accent: #6fa39a;
  --read-border: rgba(111, 163, 154, 0.4);
  --read-font:
    'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimHei', 'Noto Sans SC', sans-serif;
}

/* ── 纸张：占满中间区域，标题/作者/按钮固定，仅正文滚动 ── */
.reading-sheet {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--read-paper);
  color: var(--read-ink);
  border: 1px solid var(--read-border);
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.75);
  font-family: var(--read-font);
  overflow: hidden;
}

.reading-header {
  flex-shrink: 0;
  text-align: center;
  padding: 3vh 44px 2vh;
  border-bottom: 1px solid var(--read-border);
}

.reading-title {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.reading-author {
  margin: 0.8vh 0 0;
  font-size: 0.95rem;
  color: var(--read-ink-mid);
}

/* ── 正文区域：仅此区域滚动 ── */
.reading-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 3vh 4vw 2vh;
}

.reading-content {
  margin: 0;
  font-size: 1.2rem;
  line-height: 2;
  text-indent: 2.2em;
  white-space: pre-wrap;
}

.reading-page-num {
  margin-top: 3vh;
  text-align: center;
  font-size: 0.9rem;
  color: var(--read-ink-mid);
  flex-shrink: 0;
}

/* ── 按钮区：两行 ── */
.reading-footer {
  flex-shrink: 0;
  padding: 1.6vh 4vw 3vh;
  border-top: 1px solid var(--read-border);
}

.footer-nav-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.footer-nav-spacer {
  flex: 1;
}

.footer-return-row {
  display: flex;
  justify-content: center;
  margin-top: 1.5vh;
}

.reading-btn {
  padding: 0.7em 2.4em;
  border: 1px solid var(--read-border);
  border-radius: 6px;
  background: transparent;
  color: var(--read-ink);
  font-family: inherit;
  font-size: 1rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.18s ease;
}

.reading-btn:hover {
  background: color-mix(in srgb, var(--read-accent) 16%, transparent);
  border-color: var(--read-accent);
}

.reading-btn.btn-return {
  border-color: var(--read-accent);
  color: var(--read-accent);
  min-width: 220px;
}
.reading-btn.btn-return:hover {
  background: var(--read-accent);
  color: var(--read-paper-solid);
}
</style>
