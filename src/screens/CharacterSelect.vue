<script setup lang="ts">
import { ref } from 'vue'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const characters = Object.values(session.content.characters)

const playerName = ref('')
const error = ref('')

const emit = defineEmits<{
  select: [characterId: string, playerName: string]
}>()

function trySelect(characterId: string) {
  const name = playerName.value.trim()
  if (!name) {
    error.value = '请输入姓名'
    return
  }
  if (name.length > 10) {
    error.value = '姓名最多10个字'
    return
  }
  error.value = ''
  emit('select', characterId, name)
}
</script>

<template>
  <div class="char-select">
    <h2 class="heading">创建角色</h2>
    <p class="desc">请输入你的名字并选择职业。</p>
    <div class="input-area">
      <input
        v-model="playerName"
        type="text"
        class="name-input"
        placeholder="你的名字（最长10字）"
        maxlength="10"
        @keyup.enter="() => {}"
      />
      <span class="count">{{ playerName.length }}/10</span>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="list">
      <button
        v-for="c in characters"
        :key="c.id"
        class="card"
        :disabled="!playerName.trim()"
        @click="trySelect(c.id)"
      >
        <strong class="name">{{ c.name }}</strong>
        <span class="text">{{ c.description }}</span>
        <span class="traits">
          <template v-for="(v, k) in c.bonuses" :key="k">
            <span class="bonus">+{{ v }} {{ k }}</span>
          </template>
          <template v-for="(v, k) in c.weaknesses" :key="k">
            <span class="weak">{{ v }} {{ k }}</span>
          </template>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.char-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 2rem 1.5rem;
  background: var(--ei-bg);
}

.heading {
  font-size: 1.5rem;
  margin-top: 2rem;
  color: var(--ei-accent);
}

.desc {
  font-size: 0.85rem;
  color: var(--ei-muted);
  margin-bottom: 1rem;
}

.input-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  max-width: 340px;
  margin-bottom: 0.8rem;
}

.name-input {
  flex: 1;
  appearance: none;
  border: 1px solid var(--ei-border);
  background: var(--ei-panel);
  color: var(--ei-text);
  padding: 0.65rem 0.8rem;
  font: inherit;
  font-size: 1rem;
  border-radius: 2px;
  outline: none;
}

.name-input:focus {
  border-color: var(--ei-accent);
}

.name-input::placeholder {
  color: var(--ei-muted);
  opacity: 0.6;
}

.count {
  font-size: 0.78rem;
  color: var(--ei-muted);
  white-space: nowrap;
}

.error {
  font-size: 0.82rem;
  color: #c55;
  margin-bottom: 0.5rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
  max-width: 340px;
}

.card {
  appearance: none;
  border: 1px solid var(--ei-border);
  background: var(--ei-panel);
  color: var(--ei-text);
  padding: 0.9rem 1rem;
  font: inherit;
  text-align: left;
  border-radius: 2px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.name {
  font-size: 1.05rem;
  color: var(--ei-accent);
}

.text {
  font-size: 0.85rem;
  color: var(--ei-muted);
}

.traits {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
}

.bonus {
  color: #4a9;
}

.weak {
  color: #c55;
}
</style>
