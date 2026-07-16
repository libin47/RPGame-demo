import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FlagsState } from '@/types/state'
import { createFlags } from './defaults'

export const useFlagsStore = defineStore('flags', () => {
  const state = ref<FlagsState>(createFlags())

  function replace(next: FlagsState) {
    state.value = next
  }

  function reset() {
    state.value = createFlags()
  }

  return { state, replace, reset }
})
