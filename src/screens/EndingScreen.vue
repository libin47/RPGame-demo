<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const endingId = computed(() => route.params.id as string)
const ending = computed(() => session.content.endings[endingId.value])
</script>

<template>
  <div class="ending-screen">
    <template v-if="ending">
      <h1 class="name">{{ ending.name }}</h1>
      <p class="desc">{{ ending.description }}</p>
    </template>
    <template v-else>
      <h1 class="name">未知结局</h1>
      <p class="desc">故事在此终结。</p>
    </template>
    <div class="actions">
      <button class="btn" @click="router.push({ name: 'home' })">返回标题</button>
    </div>
  </div>
</template>

<style scoped>
.ending-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 2rem;
  text-align: center;
  background: var(--ei-bg);
}

.name {
  font-size: 2rem;
  color: var(--ei-accent);
  margin-bottom: 1rem;
  letter-spacing: 0.1em;
}

.desc {
  font-size: 1rem;
  color: var(--ei-muted);
  max-width: 400px;
  line-height: 1.7;
  margin-bottom: 2.5rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  appearance: none;
  border: 1px solid var(--ei-border);
  background: var(--ei-btn);
  color: var(--ei-text);
  padding: 0.6rem 1.2rem;
  font: inherit;
  font-size: 0.92rem;
  border-radius: 2px;
  cursor: pointer;
}
</style>