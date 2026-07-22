<!-- src/components/StatusBar.vue -->

<template>
  <div class="status-bar">
    <!-- 第一行：日期、季节、天气、时间 -->
    <div class="status-row-top">
      <span class="status-day">第 {{ player.progress.day }} 天</span>
      <span class="status-season">{{ seasonName }}</span>
      <span class="status-weather">{{ weatherName }}</span>
      <span class="status-time">{{ timeDisplay }}</span>
    </div>

    <!-- 第二行：生存属性 -->
    <div class="status-row-main">
      <div class="status-attr status-hp" title="生命值">
        ❤️ {{ player.survival.hp }}/{{ player.survival.maxHp }}
      </div>
      <div class="status-attr status-satiety" title="饱食度">
        🍖 {{ player.survival.satiety }}/{{ player.survival.maxSatiety }}
      </div>
      <div class="status-attr status-stamina" title="体力值">
        ⚡ {{ player.survival.stamina }}/{{ player.survival.maxStamina }}
      </div>
      <div class="status-attr status-san" title="理智值">
        🧠 {{ sanDisplay }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerState } from '@/types/player'
import { getRegistry } from '@/engine'
import { Season } from '@/types/seasonWeather'

const props = defineProps<{
  player: PlayerState
}>()

const registry = getRegistry()

/** 季节名称 */
const seasonName = computed(() => {
  const seasonConfig = registry.getSeason(props.player.progress.season)
  return seasonConfig ? seasonConfig.name : props.player.progress.season
})

/** 天气名称 */
const weatherName = computed(() => {
  const weatherConfig = registry.getWeather(props.player.progress.weatherId)
  return weatherConfig ? weatherConfig.name : props.player.progress.weatherId
})

/** 时间显示 */
const timeDisplay = computed(() => {
  const minutes = props.player.progress.timeMinutes
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
})

/** SAN值显示（用文字而非数字，因为没有测量道具） */
const sanDisplay = computed(() => {
  const san = props.player.survival.san
  if (san > 80) return '理智'
  if (san > 60) return '不安'
  if (san > 40) return '动摇'
  if (san > 20) return '崩溃'
  return '疯狂'
})
</script>

<style scoped>
.status-bar {
  background: #1a1a2e;
  color: #e0e0e0;
  padding: 8px 12px;
  font-size: 14px;
  border-bottom: 1px solid #333;
  user-select: none;
}

.status-row-top {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
  opacity: 0.8;
  font-size: 12px;
}

.status-row-main {
  display: flex;
  gap: 16px;
}

.status-attr {
  padding: 2px 8px;
  border-radius: 4px;
  background: #16213e;
}

.status-hp {
  color: #ff6b6b;
}

.status-satiety {
  color: #ffd93d;
}

.status-stamina {
  color: #6bcb77;
}

.status-san {
  color: #4d96ff;
}
</style>