import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PlayerState } from '@/types/state'
import { createPlayer } from './defaults'
import { content } from '@/content'

export const usePlayerStore = defineStore('player', () => {
  const state = ref<PlayerState>(createPlayer(content.characters.doctor!))

  function replace(next: PlayerState) {
    state.value = next
  }

  function reset(characterId: string, playerName?: string) {
    const character = content.characters[characterId] ?? content.characters.doctor!
    state.value = createPlayer(character, playerName)
  }

  return { state, replace, reset }
})
