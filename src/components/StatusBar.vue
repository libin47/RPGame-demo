<!-- StatusBar.vue - 顶部状态栏
     参考风格：渐变背景、顶部装饰线、进度条内发光 + 阴影
     第一行：左（第N天·季节·天气） 右（时段·时间）
     第二行：HP/饱食/体力/SAN 带图标进度条（数值居中）+ 温暖度描述
     第三行：[⚙️设置] [🎒背包] [📊属性]（带背景区分） | 场景名称 -->
<template>
  <header class="status-bar" :style="{ background: barBackground }">
    <!-- ═══════ 第一行：世界信息 — 左（天数·季节·天气） 右（时段·时间） ═══════ -->
    <div class="row top">
      <div class="top-left">
        <span class="day-chip">第{{ playerState.progress.day }}天</span>
        <span class="sep">·</span>
        <span class="season-chip">{{ seasonLabel }}</span>
        <span class="sep">·</span>
        <span>{{ weatherName }}</span>
      </div>
      <div class="top-right">
        <span>{{ timePeriodName }}</span>
        <span class="sep">·</span>
        <span class="time-text" :class="{ muted: !hasTimeItem }">{{
          hasTimeItem ? timeLabel : '??:??'
        }}</span>
      </div>
    </div>

    <!-- ═══════ 第二行：生存属性条（参考风格） ═══════ -->
    <div class="row bars">
      <!-- HP -->
      <div class="bar">
        <span class="bar-track">
          <span class="bar-icon">❤️</span>
          <span
            class="bar-fill hp-fill"
            :class="hpBarMod"
            :style="{ width: hpPercent + '%' }"
          ></span>
          <span class="bar-value">{{ displayHp }}</span>
        </span>
      </div>
      <!-- 饱食 -->
      <div class="bar">
        <span class="bar-track">
          <span class="bar-icon">🍖</span>
          <span
            class="bar-fill satiety-fill"
            :class="{ low: satietyPercent < 30 }"
            :style="{ width: satietyPercent + '%' }"
          ></span>
          <span class="bar-value">{{ displaySatiety }}</span>
        </span>
      </div>
      <!-- 体力 -->
      <div class="bar">
        <span class="bar-track">
          <span class="bar-icon">⚡</span>
          <span
            class="bar-fill stamina-fill"
            :class="{ low: staminaPercent < 30 }"
            :style="{ width: staminaPercent + '%' }"
          ></span>
          <span class="bar-value">{{ displayStamina }}</span>
        </span>
      </div>
      <!-- SAN -->
      <template v-if="hasSanItem">
        <div class="bar">
          <span class="bar-track">
            <span class="bar-icon">🧠</span>
            <span
              class="bar-fill san-fill"
              :class="sanBarMod"
              :style="{ width: sanPercent + '%' }"
            ></span>
            <span class="bar-value">{{ displaySan }}</span>
          </span>
        </div>
      </template>
      <template v-else>
        <div class="bar san-text-bar">
          <span class="bar-icon">🧠</span>
          <span class="san-text-inline" :class="sanLevelClass">{{ sanLevelText }}</span>
        </div>
      </template>
      <!-- 温暖度：文本描述 -->
      <div class="bar warmth-bar">
        <span class="bar-icon">🌡️</span>
        <span class="warmth-text-inline" :class="warmthClass">{{ warmthLabel }}</span>
      </div>
    </div>

    <!-- ═══════ 第三行：操作按钮（带图标+背景区分）+ 场景名称 ═══════ -->
    <div class="row toolbar-row">
      <div class="toolbar-left">
        <button class="tool-btn" @click="$emit('openSettings')">
          <span class="tool-icon">⚙️</span>
          <span class="tool-label">设置</span>
        </button>
        <button class="tool-btn btn-accent" @click="$emit('openInventory')">
          <span class="tool-icon">🎒</span>
          <span class="tool-label">背包</span>
        </button>
        <button class="tool-btn btn-info" @click="$emit('openAttributes')">
          <span class="tool-icon">📊</span>
          <span class="tool-label">属性</span>
        </button>
      </div>
      <div class="toolbar-right">
        <span class="scene-name">{{ sceneName }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerState } from '@/types/player'
import { SeasonPhase } from '@/types/seasonWeather'
import { getRegistry, getTimeOfDay } from '@/engine'

const props = defineProps<{
  playerState: PlayerState
  sceneName: string
  hasTimeItem: boolean
  hasSanItem: boolean
  backgroundColor: string
}>()

defineEmits<{
  (e: 'openSettings'): void
  (e: 'openInventory'): void
  (e: 'openAttributes'): void
}>()

const registry = getRegistry()

/** 状态栏背景：使用传入背景色 + 渐变叠加 */
const barBackground = computed<string>(() => {
  return `linear-gradient(180deg, ${props.backgroundColor} 0%, rgba(0,0,0,0.15) 100%), ${props.backgroundColor}`
})

// ── 第一行 ──

/** 季节标签（含阶段）：夏盛 */
const seasonLabel = computed<string>(() => {
  const { season, seasonPhase } = props.playerState.progress
  const cfg = registry.getSeason(season)
  const name = cfg ? cfg.name : season
  const phaseMap: Record<SeasonPhase, string> = {
    [SeasonPhase.EARLY]: '初',
    [SeasonPhase.MID]: '盛',
    [SeasonPhase.LATE]: '末',
  }
  return `${name}${phaseMap[seasonPhase] || ''}`
})

/** 天气名称 */
const weatherName = computed<string>(() => {
  const id = props.playerState.progress.weatherId
  const cfg = registry.getWeather(id)
  return cfg ? cfg.name : id
})

/** 时间 HH:MM */
const timeLabel = computed<string>(() => {
  const t = props.playerState.progress.timeMinutes
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
})

/** 当前时段 */
const currentTimeOfDay = computed(() => getTimeOfDay(props.playerState.progress.timeMinutes))

/** 时段名称 */
const timePeriodName = computed<string>(() => {
  return registry.getTimeOfDayConfig(currentTimeOfDay.value)?.name || ''
})

/** 温暖度标签 */
const warmthLabel = computed<string>(() => {
  const map: Record<string, string> = {
    comfortable: '舒适',
    cold: '寒冷',
    hot: '炎热',
    freezing: '严寒',
    scorching: '酷热',
  }
  return map[props.playerState.survival.warmthLevel] || '未知'
})

const warmthClass = computed<string>(() => {
  const lv = props.playerState.survival.warmthLevel
  if (lv === 'comfortable') return 'warmth-comfortable'
  if (lv === 'cold' || lv === 'freezing') return 'warmth-cold'
  if (lv === 'hot' || lv === 'scorching') return 'warmth-hot'
  return ''
})

// ── 第二行 ──

const hpPercent = computed<number>(() =>
  props.playerState.survival.maxHp > 0
    ? Math.round((props.playerState.survival.hp / props.playerState.survival.maxHp) * 100)
    : 0,
)
const satietyPercent = computed<number>(() =>
  props.playerState.survival.maxSatiety > 0
    ? Math.round((props.playerState.survival.satiety / props.playerState.survival.maxSatiety) * 100)
    : 0,
)
const staminaPercent = computed<number>(() =>
  props.playerState.survival.maxStamina > 0
    ? Math.round((props.playerState.survival.stamina / props.playerState.survival.maxStamina) * 100)
    : 0,
)
const sanPercent = computed<number>(() =>
  props.playerState.survival.maxSan > 0
    ? Math.round((props.playerState.survival.san / props.playerState.survival.maxSan) * 100)
    : 0,
)

const displayHp = computed<number>(() => Math.floor(props.playerState.survival.hp))
const displaySatiety = computed<number>(() => Math.floor(props.playerState.survival.satiety))
const displayStamina = computed<number>(() => Math.floor(props.playerState.survival.stamina))
const displaySan = computed<number>(() => Math.floor(props.playerState.survival.san))

/** HP 条修饰类：normal / low / critical */
const hpBarMod = computed<Record<string, boolean>>(() => {
  const pct = hpPercent.value
  return {
    low: pct < 30 && pct >= 15,
    critical: pct < 15,
  }
})

/** SAN 条修饰类 */
const sanBarMod = computed<Record<string, boolean>>(() => {
  const pct = sanPercent.value
  return {
    low: pct < 40 && pct >= 20,
    warning: pct < 20,
  }
})

/** SAN 文本等级 */
const sanLevelText = computed<string>(() => {
  const ratio =
    props.playerState.survival.maxSan > 0
      ? props.playerState.survival.san / props.playerState.survival.maxSan
      : 0
  if (ratio >= 0.7) return '理智'
  if (ratio >= 0.4) return '不安'
  if (ratio >= 0.2) return '混乱'
  return '疯狂'
})

const sanLevelClass = computed<string>(() => {
  const ratio =
    props.playerState.survival.maxSan > 0
      ? props.playerState.survival.san / props.playerState.survival.maxSan
      : 0
  if (ratio >= 0.7) return 'san-rational'
  if (ratio >= 0.4) return 'san-unrest'
  if (ratio >= 0.2) return 'san-confused'
  return 'san-mad'
})
</script>

<style scoped>
/* ═══════════════════════════════════════════
   容器
   ═══════════════════════════════════════════ */
.status-bar {
  padding: 0.45rem 0.8rem 0.35rem;
  border-bottom: 1px solid var(--border-weak);
  box-shadow: var(--shadow-panel);
  flex-shrink: 0;
  transition: background 0.6s ease;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  position: relative;
  font-size: var(--font-sm);
  letter-spacing: 0.02em;
}

/* 顶部装饰线 */
.status-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%);
}

/* ═══════════════════════════════════════════
   第一行
   ═══════════════════════════════════════════ */
.row.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-muted);
  margin-top: 0.3rem;
  margin-bottom: 0.3rem;
}

.top-left {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow-x: auto;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: nowrap;
  white-space: nowrap;
  flex-shrink: 0;
}

.day-chip {
  font-weight: 600;
  color: var(--accent);
}

.season-chip {
  /* padding: 0.1rem 0.38rem; */
  background: var(--accent-dim);
  border-radius: var(--radius-sm);
  color: var(--accent);
}

.sep {
  color: #ffffff;
  margin: 0 0.15rem;
  flex-shrink: 0;
}

.time-text {
  font-variant-numeric: tabular-nums;
}
.time-text.muted {
  opacity: 0.25;
}

.warmth-comfortable {
  color: var(--accent);
}
.warmth-cold {
  color: #7ec8e3;
}
.warmth-hot {
  color: #ff6b6b;
}

/* ═══════════════════════════════════════════
   第二行：属性条（参考风格）
   ═══════════════════════════════════════════ */
.row.bars {
  display: flex;
  gap: 0.45rem;
  align-items: center;
  margin-top: 0.3rem;
  margin-bottom: 0.3rem;
}

.bar {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.bar-icon {
  font-size: 1rem;
  flex-shrink: 0;
  line-height: 1;
}

/* 进度条内部的 icon：绝对定位在左侧，不随填充宽度变化 */
.bar-track > .bar-icon {
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.bar-track {
  flex: 1;
  height: 22px;
  border-radius: 7px;
  background: #5f5f5f;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: 7px;
  transition: width 0.4s ease;
  position: relative;
}

/* 进度条内发光 */
.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.25) 0%, transparent 50%);
  border-radius: 7px;
}

/* 数值居中在进度条内 */
.bar-value {
  font-variant-numeric: tabular-nums;
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  pointer-events: none;
  letter-spacing: 0;
}

/* ── HP ── */
.hp-fill {
  background: linear-gradient(90deg, #a43a3a 0%, #c44a4a 100%);
  box-shadow: 0 0 10px rgba(196, 74, 74, 0.3);
}
.hp-fill.low {
  background: linear-gradient(90deg, #b8811c 0%, #d8a12c 100%);
  box-shadow: 0 0 10px rgba(216, 161, 44, 0.3);
}
.hp-fill.critical {
  background: linear-gradient(90deg, #c44a4a 0%, #d45a5a 100%);
  box-shadow: 0 0 15px rgba(196, 74, 74, 0.5);
  animation: pulse 1s ease-in-out infinite;
}

/* ── 饱食 ── */
.satiety-fill {
  background: linear-gradient(90deg, #b8811c 0%, #d8a12c 100%);
  box-shadow: 0 0 10px rgba(216, 161, 44, 0.3);
}
.satiety-fill.low {
  background: linear-gradient(90deg, #a43a3a 0%, #c44a4a 100%);
  box-shadow: 0 0 12px rgba(196, 74, 74, 0.4);
}

/* ── 体力 ── */
.stamina-fill {
  background: linear-gradient(90deg, #3a7ac4 0%, #4a9ad4 100%);
  box-shadow: 0 0 10px rgba(74, 154, 212, 0.3);
}
.stamina-fill.low {
  background: linear-gradient(90deg, #a43a3a 0%, #c44a4a 100%);
  box-shadow: 0 0 12px rgba(196, 74, 74, 0.4);
}

/* ── SAN ── */
.san-fill {
  background: linear-gradient(90deg, #8a5aa4 0%, #9a6ab4 100%);
  box-shadow: 0 0 10px rgba(154, 106, 180, 0.3);
}
.san-fill.low {
  background: linear-gradient(90deg, #b86a6a 0%, #a85a5a 100%);
  box-shadow: 0 0 12px rgba(184, 106, 106, 0.4);
}
.san-fill.warning {
  background: linear-gradient(90deg, #c44a4a 0%, #d43a3a 100%);
  box-shadow: 0 0 15px rgba(196, 74, 74, 0.5);
  animation: pulse 1.5s ease-in-out infinite;
}

/* SAN 文本行（无道具时） */
.san-text-bar {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.san-text-inline {
  font-size: var(--font-sm);
  font-weight: 600;
}
.san-rational {
  color: #81c784;
}
.san-unrest {
  color: #ffb74d;
}
.san-confused {
  color: #ff8a65;
}
.san-mad {
  color: #e57373;
}

/* 温暖度文本行 */
.warmth-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding-left: 0.3rem;
  border-left: 1px solid var(--border-weak);
}
.warmth-text-inline {
  font-size: var(--font-sm);
  font-weight: 600;
  white-space: nowrap;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

/* ═══════════════════════════════════════════
   第三行：工具栏
   ═══════════════════════════════════════════ */
.row.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.25);
  border-radius: var(--radius-md);
  padding: 0.35rem 0.5rem;
  margin-top: 0.1rem;
}

.toolbar-left {
  display: flex;
  gap: 0.35rem;
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  font-size: var(--font-sm);
  padding: 0.3rem 0.65rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  line-height: 1.4;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.3);
  color: var(--text-primary);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.tool-btn:active {
  transform: translateY(1px);
}

.tool-btn.btn-accent {
  border-color: rgba(78, 205, 196, 0.4);
  background: rgba(78, 205, 196, 0.08);
}
.tool-btn.btn-accent:hover {
  border-color: var(--accent);
  background: rgba(78, 205, 196, 0.18);
  color: var(--accent);
}

.tool-btn.btn-info {
  border-color: rgba(100, 181, 246, 0.4);
  background: rgba(100, 181, 246, 0.08);
}
.tool-btn.btn-info:hover {
  border-color: #64b5f6;
  background: rgba(100, 181, 246, 0.18);
  color: #64b5f6;
}

.tool-icon {
  font-size: 1.05rem;
  line-height: 1;
}

.tool-label {
  font-size: var(--font-sm);
}

.toolbar-right {
  flex: 1;
  text-align: right;
  padding-left: 0.5rem;
  overflow: hidden;
}

.scene-name {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
