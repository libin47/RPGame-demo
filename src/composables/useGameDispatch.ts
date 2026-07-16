import { watch } from 'vue'
import { useRouter } from 'vue-router'
import type { GameAction } from '@/types/actions'
import { useSessionStore } from '@/stores/session'

export function useGameDispatch() {
  const session = useSessionStore()
  const router = useRouter()

  watch(
    () => session.pendingEndingId,
    (id) => {
      if (!id) return
      const endingId = session.consumeEnding()
      if (endingId) void router.push({ name: 'ending', params: { id: endingId } })
    },
  )

  function dispatch(action: GameAction) {
    const result = session.dispatch(action)
    if (action.type === 'returnTitle') {
      router.push({ name: 'home' })
    }
    return result
  }

  return { session, dispatch }
}