<!-- src/App.vue -->

<template>
  <GameScreen :playerState="playerState" />
</template>

<script setup lang="ts">
import type { PlayerState } from '@/types/player'
import GameScreen from '@/components/GameScreen.vue'

defineProps<{
  playerState: PlayerState
}>()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #0f0f1a;
  overflow: hidden;
}
</style>