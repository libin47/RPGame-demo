export type GameAction =
  | { type: 'advanceCutscene' }
  | { type: 'chooseDialogue'; choiceIndex: number }
  | { type: 'examine'; targetId: string }
  | { type: 'locationAction'; actionId: string }
  | { type: 'openMap' }
  | { type: 'closeMap' }
  | { type: 'travel'; locationId: string }
  | { type: 'explore' }
  | { type: 'openMenu'; menu: 'system' | 'inventory' | 'stats' }
  | { type: 'closeMenu' }
  | { type: 'craft'; recipeId: string }
  | { type: 'openCraft' }
  | { type: 'closeCraft' }
  | { type: 'combatSkill'; skillId: string }
  | { type: 'combatFlee' }
  | { type: 'confirmCombatResult' }
  | { type: 'dungeonMove'; dir: 'n' | 's' | 'e' | 'w' }
  | { type: 'dungeonExplore' }
  | { type: 'exitDungeon' }
  | { type: 'camp' }
  | { type: 'sleep' }
  | { type: 'buryCamp' }
  | { type: 'useItem'; itemId: string }
  | { type: 'equipItem'; itemId: string }
  | { type: 'unequip'; slot: string }
  | { type: 'dismissToast' }
  | { type: 'dismissUnlock' }
  | { type: 'save'; slot: number }
  | { type: 'returnTitle' }

export interface ActionResult {
  ok: boolean
  reason?: string
  events: NarrativeEvent[]
}

export type NarrativeEvent =
  | { kind: 'text'; text: string }
  | { kind: 'toast'; text: string }
  | { kind: 'unlock'; locationId: string; name: string }
  | { kind: 'mode'; mode: string }
  | { kind: 'ending'; endingId: string }
