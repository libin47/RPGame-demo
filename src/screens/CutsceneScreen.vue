<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
import { useGameDispatch } from '@/composables/useGameDispatch'

const session = useSessionStore()
const { dispatch } = useGameDispatch()
</script>

<template>
  <div class="cutscene" @click="dispatch({ type: 'advanceCutscene' })">
    <div class="content">
      <p v-for="(line, i) in session.ui.state.narrativeLines" :key="i" class="line">{{ line }}</p>
    </div>
    <div v-if="session.dialogueChoices.length" class="choices" @click.stop>
      <button v-for="(c, i) in session.dialogueChoices" :key="i" class="btn"
        @click="dispatch({ type: 'chooseDialogue', choiceIndex: i })">
        {{ c.label }}
      </button>
    </div>
    <div v-else class="hint">点击任意位置继续</div>
  </div>
</template>

<style scoped>
.cutscene {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  cursor: pointer;
  user-select: none;
}

.content {
  max-width: 480px;
  text-align: center;
  line-height: 1.8;
}

.line {
  margin-bottom: 0.8rem;
  font-size: 1.05rem;
  opacity: 0.92;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
  width: 100%;
  max-width: 280px;
}

.btn {
  appearance: none;
  border: 1px solid var(--ei-border);
  background: var(--ei-btn);
  color: var(--ei-text);
  padding: 0.6rem 1rem;
  font: inherit;
  font-size: 0.92rem;
  border-radius: 2px;
  cursor: pointer;
}

.hint {
  margin-top: 2rem;
  font-size: 0.75rem;
  color: var(--ei-muted);
  opacity: 0.5;
}
</style>
