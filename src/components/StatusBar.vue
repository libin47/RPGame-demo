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
  // if (session.inventory.state.slots.some((s) => s.itemId === 'watch')) return true
  // if (session.player.state.equipment.accessory === 'watch') return true
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
</script>

<template>
  <header class="status-bar">
    <div class="row top">
      <div class="left">
        <span class="day">第{{ session.world.state.day }}日</span>
        <span class="weather">{{ weatherLabel[session.world.state.weather] ?? session.world.state.weather }}</span>
      </div>
      <div class="right">
        <span class="emoji">{{ timeEmoji }}</span>
        <span class="time" v-if="showTime">{{ timeDisplay }}</span>
      </div>
    </div>
    <div class="row bars">
      <div class="bar hp" title="生命">
        <span class="label">HP</span>
        <span class="track">
          <span
            class="fill"
            :style="{ width: (session.player.state.survival.hp / session.player.state.survivalMax.hp * 100).toFixed(1) + '%' }"
          ></span>
          <span class="value">{{ Math.round(session.player.state.survival.hp) }}/{{ session.player.state.survivalMax.hp }}</span>
        </span>
      </div>
      <div class="bar hunger" title="饱食度">
        <span class="label">饱</span>
        <span class="track">
          <span
            class="fill"
            :style="{ width: (session.player.state.survival.hunger / session.player.state.survivalMax.hunger * 100).toFixed(1) + '%' }"
          ></span>
          <span class="value">{{ Math.round(session.player.state.survival.hunger) }}</span>
        </span>
      </div>
      <div class="bar thirst" title="口渴度">
        <span class="label">渴</span>
        <span class="track">
          <span
            class="fill"
            :style="{ width: (session.player.state.survival.thirst / session.player.state.survivalMax.thirst * 100).toFixed(1) + '%' }"
          ></span>
          <span class="value">{{ Math.round(session.player.state.survival.thirst) }}</span>
        </span>
      </div>
      <div v-if="showSan" class="bar san" title="理智值">
        <span class="label">SAN</span>
        <span class="track">
          <span
            class="fill"
            :style="{ width: (session.player.state.survival.san / session.player.state.survivalMax.san * 100).toFixed(1) + '%' }"
          ></span>
          <span class="value">{{ Math.round(session.player.state.survival.san) }}</span>
        </span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.status-bar {
  padding: 0.35rem 0.75rem;
  background: color-mix(in srgb, var(--ei-panel) 92%, transparent);
  border-bottom: 1px solid var(--ei-border);
  font-size: 0.75rem;
  letter-spacing: 0.02em;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
  color: var(--ei-muted);
}

.left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.day {
  font-weight: 600;
  color: var(--ei-accent);
}

.weather {
  font-size: 0.78rem;
}

.right {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.emoji {
  font-size: 1rem;
}

.time {
  font-variant-numeric: tabular-nums;
  font-size: 0.82rem;
}

.bars {
  display: flex;
  flex-direction: row;
  gap: 0.6rem;
}

.bar {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.3rem;
}

.label {
  font-weight: 600;
  font-size: 0.68rem;
  width: 2em;
  flex-shrink: 0;
}

.track {
  flex: 1;
  height: 14px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
}

.fill {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.value {
  font-variant-numeric: tabular-nums;
  font-size: 0.62rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}

.bar.hp .label { color: #c44; }
.bar.hp .fill { background: #c44; }

.bar.hunger .label { color: #d8a12c; }
.bar.hunger .fill { background: #d8a12c; }

.bar.thirst .label { color: #4a9ad4; }
.bar.thirst .fill { background: #4a9ad4; }

.bar.san .label { color: #9a6ab4; }
.bar.san .fill { background: #9a6ab4; }
</style>