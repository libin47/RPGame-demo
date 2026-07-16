import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UiState } from '@/types/state'
import { createUi } from './defaults'

export const useUiStore = defineStore('ui', () => {
  const state = ref<UiState>(createUi())

  function replace(next: UiState) {
    state.value = next
  }

  function reset() {
    state.value = createUi()
  }

  return { state, replace, reset }
})
