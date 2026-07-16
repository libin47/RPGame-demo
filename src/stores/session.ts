import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { content } from '@/content'
import type { GameAction } from '@/types/actions'
import {
  executeAction,
  getCurrentDialogueChoices,
  getVisibleLocationActions,
  type GameContext,
} from '@/engine/actions/executor'
import { availableExits } from '@/engine/map'
import { listCraftable } from '@/engine/crafting'
import { defaultPlayerSkills } from '@/engine/combat'
import { resolveSanText } from '@/engine/conditions'
import { sanTheme } from '@/engine/san'
import { readSave, listSaveSlots } from '@/engine/save/serialize'
import { formatGameTime, timePhaseFromMinute } from '@/types/state'
import { usePlayerStore } from './player'
import { useWorldStore } from './world'
import { useInventoryStore } from './inventory'
import { useBaseStore } from './base'
import { useFlagsStore } from './flags'
import { useCombatStore } from './combat'
import { useUiStore } from './ui'
import {
  createBase,
  createCombat,
  createFlags,
  createInventory,
  createPlayer,
  createUi,
  createWorld,
} from './defaults'

export const useSessionStore = defineStore('session', () => {
  const player = usePlayerStore()
  const world = useWorldStore()
  const inventory = useInventoryStore()
  const base = useBaseStore()
  const flags = useFlagsStore()
  const combat = useCombatStore()
  const ui = useUiStore()

  function ctx(): GameContext {
    return {
      player: player.state,
      world: world.state,
      inventory: inventory.state,
      base: base.state,
      flags: flags.state,
      combat: combat.state,
      ui: ui.state,
      content,
    }
  }

  function newGame(characterId: string, playerName?: string) {
    const character = content.characters[characterId] ?? content.characters.doctor!
    player.replace(createPlayer(character, playerName))
    world.replace(createWorld())
    inventory.replace(createInventory())
    base.replace(createBase())
    flags.replace(createFlags())
    combat.replace(createCombat())
    const nextUi = createUi()
    nextUi.mode = 'cutscene'
    nextUi.dialogueId = 'intro'
    nextUi.dialogueNodeId = content.dialogues.intro!.start
    const startNode = content.dialogues.intro!.nodes.find((n) => n.id === nextUi.dialogueNodeId)
    nextUi.narrativeLines = startNode ? [startNode.text] : ['……']
    ui.replace(nextUi)
  }

  function loadGame(slot: number): boolean {
    const file = readSave(slot)
    if (!file) return false
    player.replace(file.snapshot.player)
    world.replace(file.snapshot.world)
    inventory.replace(file.snapshot.inventory)
    base.replace(file.snapshot.base)
    flags.replace(file.snapshot.flags)
    combat.replace(file.snapshot.combat)
    const nextUi = createUi()
    nextUi.mode = world.state.inDungeon ? 'dungeon' : 'normal'
    const loc = content.locations[world.state.locationId]
    nextUi.narrativeLines = loc
      ? [resolveSanText(loc.description, player.state.survival.san)]
      : ['……']
    ui.replace(nextUi)
    return true
  }

  const pendingEndingId = ref<string | null>(null)

  function dispatch(action: GameAction) {
    const result = executeAction(ctx(), action)
    if (action.type === 'locationAction' && action.actionId === 'fight_tutorial') {
      flags.state.flags['tutorial_fight_done'] = true
    }
    if (action.type === 'locationAction' && action.actionId === 'hunt') {
      flags.state.flags['jungle_hunt_done'] = true
    }
    if (action.type === 'combatSkill' || action.type === 'confirmCombatResult') {
      if (
        combat.state.enemyId === 'mutant_chief' &&
        flags.state.flags[`killed_${combat.state.enemyId}`]
      ) {
        // merge ending flag already set via killed_
      }
    }

    for (const ev of result.events) {
      if (ev.kind === 'ending') {
        pendingEndingId.value = ev.endingId
      }
    }
    return result
  }

  function consumeEnding(): string | null {
    const id = pendingEndingId.value
    pendingEndingId.value = null
    return id
  }

  const timeLabel = computed(() =>
    formatGameTime(world.state.day, world.state.minuteOfDay, world.state.season),
  )
  const phase = computed(() => timePhaseFromMinute(world.state.minuteOfDay))
  const theme = computed(() => sanTheme(player.state.survival.san))
  const location = computed(() => content.locations[world.state.locationId])
  const locationActions = computed(() => getVisibleLocationActions(ctx()))
  const dialogueChoices = computed(() => getCurrentDialogueChoices(ctx()))
  const mapExits = computed(() => availableExits(content, world.state, flags.state))
  const craftRecipes = computed(() =>
    listCraftable(content, ctx(), (id) =>
      base.state.bases.some(
        (b) =>
          (b.locationId === world.state.locationId || b.temporary) &&
          b.buildings.some((x) => x.buildingType === id),
      ),
    ),
  )
  const combatSkills = computed(() => defaultPlayerSkills())
  const saves = computed(() => listSaveSlots(5))

  const currentDialogueNode = computed(() => {
    const d = ui.state.dialogueId ? content.dialogues[ui.state.dialogueId] : undefined
    if (!d || !ui.state.dialogueNodeId) return null
    return d.nodes.find((n) => n.id === ui.state.dialogueNodeId) ?? null
  })

  return {
    content,
    newGame,
    loadGame,
    dispatch,
    consumeEnding,
    pendingEndingId,
    timeLabel,
    phase,
    theme,
    location,
    locationActions,
    dialogueChoices,
    mapExits,
    craftRecipes,
    combatSkills,
    saves,
    currentDialogueNode,
    player,
    world,
    inventory,
    base,
    flags,
    combat,
    ui,
  }
})
