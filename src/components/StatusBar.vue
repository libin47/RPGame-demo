<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()

const weatherLabel: Record<string, string> = {
  clear: '晴',
  rain: '雨',
  storm: '暴雨',
  fog: '雾',
}

const showSan = computed(() => session.inventory.state.slots.some((s) => s.itemId === 'ration'))

const showTime = computed(() => {
  return true
})

const timeDisplay = computed(() => {
  const h = Math.floor(session.world.state.minuteOfDay / 60)
  const m = session.world.state.minuteOfDay % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

const timeEmoji = computed(() => {
  const weather = session.world.state.weather
  const minute = session.world.state.minuteOfDay
  if (weather === 'rain' || weather === 'storm') return '🌧️'
  if (weather === 'fog') return '🌫️'
  if (minute >= 5 * 60 && minute < 8 * 60) return '🌅'
  if (minute >= 8 * 60 && minute < 12 * 60) return '☀️'
  if (minute >= 12 * 60 && minute < 17 * 60) return '🌤️'
  if (minute >= 17 * 60 && minute < 19 * 60) return '🌇'
  if (minute >= 19 * 60 && minute < 22 * 60) return '🌙'
  return '🌑'
})

const seasonLabel: Record<string, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
}

const hpPercent = computed(() => (session.player.state.survival.hp / session.player.state.survivalMax.hp) * 100)
const hungerPercent = computed(() => (session.player.state.survival.hunger / session.player.state.survivalMax.hunger) * 100)
const thirstPercent = computed(() => (session.player.state.survival.thirst / session.player.state.survivalMax.thirst) * 100)
const sanPercent = computed(() => (session.player.state.survival.san / session.player.state.survivalMax.san) * 100)
</script>

<template>
  <header class="status-bar">
    <div class="row top">
      <div class="left">
        <span class="day">
          <span class="day-icon">📅</span>
          <span class="day-text">第{{ session.world.state.day }}日</span>
        </span>
        <span class="season">{{ seasonLabel[session.world.state.season] }}</span>
        <span class="weather">{{ weatherLabel[session.world.state.weather] ?? session.world.state.weather }}</span>
      </div>
      <div class="right">
        <span class="emoji">{{ timeEmoji }}</span>
        <span class="time" v-if="showTime">{{ timeDisplay }}</span>
      </div>
    </div>
    <div class="row bars">
      <div class="bar hp" title="生命">
        <span class="bar-icon">❤️</span>
        <span class="bar-track">
          <span
            class="bar-fill"
            :class="{ low: hpPercent < 30, critical: hpPercent < 15 }"
            :style="{ width: hpPercent.toFixed(1) + '%' }"
          ></span>
          <span class="bar-value">{{ Math.round(session.player.state.survival.hp) }}/{{ session.player.state.survivalMax.hp }}</span>
        </span>
      </div>
      <div class="bar hunger" title="饱食度">
        <span class="bar-icon">🍖</span>
        <span class="bar-track">
          <span
            class="bar-fill"
            :class="{ low: hungerPercent < 30 }"
            :style="{ width: hungerPercent.toFixed(1) + '%' }"
          ></span>
          <span class="bar-value">{{ Math.round(session.player.state.survival.hunger) }}</span>
        </span>
      </div>
      <div class="bar thirst" title="口渴度">
        <span class="bar-icon">💧</span>
        <span class="bar-track">
          <span
            class="bar-fill"
            :class="{ low: thirstPercent < 30 }"
            :style="{ width: thirstPercent.toFixed(1) + '%' }"
          ></span>
          <span class="bar-value">{{ Math.round(session.player.state.survival.thirst) }}</span>
        </span>
      </div>
      <div v-if="showSan" class="bar san" title="理智值">
        <span class="bar-icon">🧠</span>
        <span class="bar-track">
          <span
            class="bar-fill"
            :class="{ low: sanPercent < 40, warning: sanPercent < 20 }"
            :style="{ width: sanPercent.toFixed(1) + '%' }"
          ></span>
          <span class="bar-value">{{ Math.round(session.player.state.survival.san) }}</span>
        </span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.status-bar {
  padding: 0.4rem 0.8rem;
  background: linear-gradient(180deg, rgba(21, 21, 26, 0.95) 0%, rgba(21, 21, 26, 0.85) 100%);
  border-bottom: 1px solid var(--ei-border);
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  position: relative;
}

.status-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--ei-accent) 50%, transparent 100%);
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
  color: var(--ei-text-muted);
}

.left {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.day {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  color: var(--ei-accent);
}

.day-icon {
  font-size: 0.9rem;
}

.day-text {
  font-size: 0.82rem;
}

.season {
  font-size: 0.78rem;
  padding: 0.15rem 0.4rem;
  background: rgba(90, 154, 106, 0.15);
  border-radius: 4px;
  color: var(--ei-accent);
}

.weather {
  font-size: 0.78rem;
}

.right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.emoji {
  font-size: 1.1rem;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.2));
}

.time {
  font-variant-numeric: tabular-nums;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ei-text);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.bars {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}

.bar {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
}

.bar-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.bar-fill {
  display: block;
  height: 100%;
  border-radius: 7px;
  transition: width 0.4s ease;
  position: relative;
}

.bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
  border-radius: 7px;
}

.bar-value {
  font-variant-numeric: tabular-nums;
  font-size: 0.65rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}

.bar.hp .bar-fill {
  background: linear-gradient(90deg, #c44a4a 0%, #a43a3a 100%);
  box-shadow: 0 0 10px rgba(196, 74, 74, 0.3);
}

.bar.hp .bar-fill.low {
  background: linear-gradient(90deg, #d8a12c 0%, #b8811c 100%);
  box-shadow: 0 0 10px rgba(216, 161, 44, 0.3);
}

.bar.hp .bar-fill.critical {
  background: linear-gradient(90deg, #c44a4a 0%, #d45a5a 100%);
  box-shadow: 0 0 15px rgba(196, 74, 74, 0.5);
  animation: pulse 1s ease-in-out infinite;
}

.bar.hunger .bar-fill {
  background: linear-gradient(90deg, #d8a12c 0%, #b8811c 100%);
  box-shadow: 0 0 10px rgba(216, 161, 44, 0.3);
}

.bar.hunger .bar-fill.low {
  background: linear-gradient(90deg, #c44a4a 0%, #a43a3a 100%);
  box-shadow: 0 0 12px rgba(196, 74, 74, 0.4);
}

.bar.thirst .bar-fill {
  background: linear-gradient(90deg, #4a9ad4 0%, #3a8ac4 100%);
  box-shadow: 0 0 10px rgba(74, 154, 212, 0.3);
}

.bar.thirst .bar-fill.low {
  background: linear-gradient(90deg, #c44a4a 0%, #a43a3a 100%);
  box-shadow: 0 0 12px rgba(196, 74, 74, 0.4);
}

.bar.san .bar-fill {
  background: linear-gradient(90deg, #9a6ab4 0%, #8a5aa4 100%);
  box-shadow: 0 0 10px rgba(154, 106, 180, 0.3);
}

.bar.san .bar-fill.low {
  background: linear-gradient(90deg, #b86a6a 0%, #a85a5a 100%);
  box-shadow: 0 0 12px rgba(184, 106, 106, 0.4);
}

.bar.san .bar-fill.warning {
  background: linear-gradient(90deg, #c44a4a 0%, #d43a3a 100%);
  box-shadow: 0 0 15px rgba(196, 74, 74, 0.5);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
