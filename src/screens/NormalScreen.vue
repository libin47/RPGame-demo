<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useGameDispatch } from '@/composables/useGameDispatch'
import StatusBar from '@/components/StatusBar.vue'
import NarrativePanel from '@/components/NarrativePanel.vue'
import ActionDock from '@/components/ActionDock.vue'
import type { DockButton } from '@/components/ActionDock.vue'

const session = useSessionStore()
const { dispatch } = useGameDispatch()

const interactionMode = computed(() =>
  session.ui.state.mode === 'dialogue' ||
  session.ui.state.mode === 'map' ||
  session.ui.state.mode === 'craft',
)

function systemButtons(): DockButton[] {
  return [
    { id: 'system', label: '系统' },
    { id: 'inventory', label: '背包' },
    { id: 'stats', label: '属性' },
  ]
}

function sceneButtons(): DockButton[] {
  if (session.ui.state.mode === 'map') {
    const btns: DockButton[] = [{ id: 'closeMap', label: '返回', primary: true }]
    for (const exit of session.mapExits) {
      if (exit.unlocked) {
        btns.push({
          id: `travel:${exit.to}`,
          label: `${exit.name} (${exit.travelMinutes}分)`,
          disabled: false,
        })
      } else {
        btns.push({ id: `locked:${exit.to}`, label: `${exit.name} (未解锁)`, disabled: true })
      }
    }
    return btns
  }

  if (session.ui.state.mode === 'craft') {
    const btns: DockButton[] = [{ id: 'closeCraft', label: '返回', primary: true }]
    for (const r of session.craftRecipes) {
      btns.push({ id: `craft:${r.id}`, label: r.name })
    }
    if (btns.length === 1) {
      btns.push({ id: 'no_recipe', label: '无可制作配方', disabled: true })
    }
    return btns
  }

  if (session.ui.state.mode === 'dungeon') {
    return [
      { id: 'dungeon_n', label: '北' },
      { id: 'dungeon_s', label: '南' },
      { id: 'dungeon_e', label: '东' },
      { id: 'dungeon_w', label: '西' },
      { id: 'exitDungeon', label: '离开', offset: true },
    ]
  }

  if (session.ui.state.mode === 'dialogue') {
    if (session.dialogueChoices.length) {
      const btns: DockButton[] = []
      for (const c of session.dialogueChoices) {
        btns.push({ id: `dialogue:${c.index}`, label: c.label })
      }
      return btns
    }
    if (session.currentDialogueNode?.next) {
      return [{ id: 'advanceDialogue', label: '继续', primary: true }]
    }
    return [{ id: 'endDialogue', label: '结束对话', primary: true }]
  }

  const btns: DockButton[] = []
  for (const act of session.locationActions) {
    btns.push({ id: `act:${act.id}`, label: act.label })
  }
  return btns
}
</script>

<template>
  <div class="normal-screen">
    <template v-if="session.ui.state.mode !== 'map' && session.ui.state.mode !== 'craft'">
      <StatusBar />
      <div class="location-header">
        <span class="location-name">{{ session.location?.name ?? '未知区域' }}</span>
      </div>
    </template>
    <NarrativePanel
      :lines="session.ui.state.narrativeLines"
      @examine="dispatch({ type: 'examine', targetId: $event })"
    />
    <ActionDock
      :system-buttons="systemButtons()"
      :scene-buttons="sceneButtons()"
      :interaction-mode="interactionMode"
      @press="
        (id: string) => {
          if (id === 'system') dispatch({ type: 'openMenu', menu: 'system' })
          else if (id === 'inventory') dispatch({ type: 'openMenu', menu: 'inventory' })
          else if (id === 'stats') dispatch({ type: 'openMenu', menu: 'stats' })
          else if (id === 'closeMap') dispatch({ type: 'closeMap' })
          else if (id === 'closeCraft') dispatch({ type: 'closeCraft' })
          else if (id.startsWith('travel:')) dispatch({ type: 'travel', locationId: id.slice(7) })
          else if (id.startsWith('craft:')) dispatch({ type: 'craft', recipeId: id.slice(6) })
          else if (id.startsWith('act:')) dispatch({ type: 'locationAction', actionId: id.slice(4) })
          else if (id.startsWith('dialogue:'))
            dispatch({ type: 'chooseDialogue', choiceIndex: Number(id.slice(9)) })
          else if (id === 'dungeon_n') dispatch({ type: 'dungeonMove', dir: 'n' })
          else if (id === 'dungeon_s') dispatch({ type: 'dungeonMove', dir: 's' })
          else if (id === 'dungeon_e') dispatch({ type: 'dungeonMove', dir: 'e' })
          else if (id === 'dungeon_w') dispatch({ type: 'dungeonMove', dir: 'w' })
          else if (id === 'exitDungeon') dispatch({ type: 'exitDungeon' })
          else if (id === 'advanceDialogue') dispatch({ type: 'advanceCutscene' })
          else if (id === 'endDialogue') dispatch({ type: 'advanceCutscene' })
        }
      "
    />
  </div>
</template>

<style scoped>
.normal-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--ei-bg);
}

.location-header {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
  background: var(--ei-gradient-panel);
  border-bottom: 1px solid var(--ei-border);
}

.location-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--ei-accent);
  letter-spacing: 0.05em;
  padding: 0.35rem 0.6rem;
  background: rgba(90, 154, 106, 0.08);
  border-radius: var(--ei-radius-sm);
}
</style>
