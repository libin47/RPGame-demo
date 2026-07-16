import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CombatState } from '@/types/state'
import { createCombat } from './defaults'

export const useCombatStore = defineStore('combat', () => {
  const state = ref<CombatState>(createCombat())

  function replace(next: CombatState) {
    state.value = next
  }

  function reset() {
    state.value = createCombat()
  }

  return { state, replace, reset }
})
