import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BaseState } from '@/types/state'
import { createBase } from './defaults'

export const useBaseStore = defineStore('base', () => {
  const state = ref<BaseState>(createBase())

  function replace(next: BaseState) {
    state.value = next
  }

  function reset() {
    state.value = createBase()
  }

  return { state, replace, reset }
})
