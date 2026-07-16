import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { InventoryState } from '@/types/state'
import { createInventory } from './defaults'

export const useInventoryStore = defineStore('inventory', () => {
  const state = ref<InventoryState>(createInventory())

  function replace(next: InventoryState) {
    state.value = next
  }

  function reset() {
    state.value = createInventory()
  }

  return { state, replace, reset }
})
