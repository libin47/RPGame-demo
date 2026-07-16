<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import CharacterSelect from './CharacterSelect.vue'

const router = useRouter()
const session = useSessionStore()

const showCharSelect = ref(false)
const showLoad = ref(false)

function startNew() {
  showCharSelect.value = true
}

function selectCharacter(characterId: string, playerName: string) {
  session.newGame(characterId, playerName)
  router.push({ name: 'play' })
}

function showLoadMenu() {
  showLoad.value = true
}

function loadSlot(slot: number) {
  const ok = session.loadGame(slot)
  if (ok) {
    router.push({ name: 'play' })
  } else {
    alert('槽位为空')
  }
}
</script>

<template>
  <CharacterSelect v-if="showCharSelect" @select="selectCharacter" />
  <div v-else-if="showLoad" class="title-screen">
    <h2 class="head">读取存档</h2>
    <div class="actions">
      <button
        v-for="(s, i) in session.saves"
        :key="i"
        class="btn"
        :disabled="!s"
        @click="loadSlot(i + 1)"
      >
        槽位 {{ i + 1 }}{{ s ? ` - ${new Date(s.savedAt).toLocaleString()}` : '（空）' }}
      </button>
      <button class="btn" @click="showLoad = false">返回</button>
    </div>
  </div>
  <div v-else class="title-screen">
    <h1 class="title">蚀岛</h1>
    <p class="subtitle">EROSION ISLAND</p>
    <div class="actions">
      <button class="btn primary" @click="startNew">新游戏</button>
      <button class="btn" @click="showLoadMenu">读取存档</button>
    </div>
    <p class="hint">蚀岛在等你。</p>
  </div>
</template>

<style scoped>
.title-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 2rem 1.5rem;
  text-align: center;
  background: var(--ei-bg);
}

.head {
  font-size: 1.4rem;
  color: var(--ei-accent);
  margin-bottom: 1.5rem;
}

.title {
  font-size: 2.8rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: var(--ei-accent);
  margin-bottom: 0.2rem;
}

.subtitle {
  font-size: 0.85rem;
  letter-spacing: 0.3em;
  color: var(--ei-muted);
  margin-bottom: 2.5rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
  max-width: 300px;
}

.btn {
  appearance: none;
  border: 1px solid var(--ei-border);
  background: var(--ei-btn);
  color: var(--ei-text);
  padding: 0.7rem 1.2rem;
  font: inherit;
  font-size: 0.95rem;
  border-radius: 2px;
  cursor: pointer;
  text-align: center;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--ei-accent);
  border-color: transparent;
  color: #f4f0e6;
}

.hint {
  margin-top: 2.5rem;
  font-size: 0.8rem;
  color: var(--ei-muted);
  opacity: 0.7;
}
</style>
