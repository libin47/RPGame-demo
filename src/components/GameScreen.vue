<!-- src/components/GameScreen.vue -->

<template>
  <div class="game-screen">
    <!-- 顶部状态栏 -->
    <StatusBar :player="state.player" />

    <!-- 常态界面：场景视图 -->
    <SceneView
      v-if="state.mode === 'normal'"
      :scene="state.currentScene"
      :subScene="state.currentSubScene"
      :description="state.sceneDescription"
      :descriptionConfig="state.currentDescriptionConfig"
      :interactions="getCurrentInteractions()"
      :resolveText="resolveText"
      @interact="handleInteraction"
      @enterEvent="enterEvent"
    />

    <!-- 事件界面：事件视图 -->
    <EventView
      v-else-if="state.mode === 'event' && state.currentFrame"
      :frame="state.currentFrame"
      :resolveText="resolveText"
      @selectOption="selectEventOption"
    />

    <!-- 底部日志 -->
    <div v-if="state.logMessage" class="game-log">
      {{ state.logMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerState } from '@/types/player'
import StatusBar from './StatusBar.vue'
import SceneView from './SceneView.vue'
import EventView from './EventView.vue'
import { useGame } from '@/composables/useGame'

const props = defineProps<{
  playerState: PlayerState
}>()

const {
  state,
  enterEvent,
  selectEventOption,
  handleInteraction,
  getCurrentInteractions,
  resolveText,
} = useGame(props.playerState)
</script>

<style scoped>
.game-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0f0f1a;
  color: #e0e0e0;
}

.game-log {
  padding: 8px 16px;
  background: #1a1a2e;
  color: #aaa;
  font-size: 13px;
  border-top: 1px solid #333;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>