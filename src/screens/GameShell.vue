<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useGameDispatch } from '@/composables/useGameDispatch'
import CutsceneScreen from './CutsceneScreen.vue'
import NormalScreen from './NormalScreen.vue'
import CombatScreen from './CombatScreen.vue'
import MenuOverlay from '@/components/menus/MenuOverlay.vue'

const router = useRouter()
const session = useSessionStore()
const { dispatch } = useGameDispatch()

onMounted(() => {
  if (!session.ui.state.dialogueId && session.ui.state.mode === 'cutscene' && !session.player.state.name) {
    router.replace({ name: 'home' })
  }
})
</script>

<template>
  <div class="shell" :style="{ filter: session.theme.filter }">
    <CutsceneScreen v-if="session.ui.state.mode === 'cutscene'" />
    <NormalScreen v-else-if="session.ui.state.mode === 'normal' || session.ui.state.mode === 'dialogue' || session.ui.state.mode === 'map' || session.ui.state.mode === 'craft' || session.ui.state.mode === 'dungeon'" />
    <CombatScreen v-else-if="session.ui.state.mode === 'combat' || session.ui.state.mode === 'combat_result'" />
    <div v-else class="placeholder">
      <p>Loading...</p>
    </div>
    <MenuOverlay v-if="session.ui.state.menu" />
    <div v-if="session.ui.state.toasts.length" class="toasts">
      <div v-for="(t, i) in session.ui.state.toasts" :key="i" class="toast" @click="dispatch({ type: 'dismissToast' })">
        {{ t }}
      </div>
    </div>
    <div v-if="session.ui.state.unlockNotices.length" class="unlock-notice" @click="dispatch({ type: 'dismissUnlock' })">
      <div class="card">
        <p class="label">新地点解锁</p>
        <p class="name">{{ session.ui.state.unlockNotices[0] }}</p>
        <p class="tap">点击确认</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--ei-bg);
  color: var(--ei-text);
  overflow: hidden;
  position: relative;
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ei-muted);
}

.toasts {
  position: fixed;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  pointer-events: none;
}

.toast {
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  padding: 0.45rem 0.9rem;
  font-size: 0.82rem;
  border-radius: 2px;
  pointer-events: auto;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
}

.unlock-notice {
  position: fixed;
  inset: 0;
  z-index: 180;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
}

.unlock-notice .card {
  background: var(--ei-panel);
  border: 1px solid var(--ei-accent);
  padding: 1.5rem 2rem;
  text-align: center;
  border-radius: 2px;
}

.unlock-notice .label {
  font-size: 0.8rem;
  color: var(--ei-muted);
  margin-bottom: 0.3rem;
}

.unlock-notice .name {
  font-size: 1.2rem;
  color: var(--ei-accent);
  margin-bottom: 0.8rem;
}

.unlock-notice .tap {
  font-size: 0.75rem;
  color: var(--ei-muted);
  opacity: 0.7;
}
</style>