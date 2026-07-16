import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WorldState } from '@/types/state'
import { createWorld } from './defaults'

export const useWorldStore = defineStore('world', () => {
  const state = ref<WorldState>(createWorld())

  function replace(next: WorldState) {
    state.value = next
  }

  function reset() {
    state.value = createWorld()
  }

  return { state, replace, reset }
})
