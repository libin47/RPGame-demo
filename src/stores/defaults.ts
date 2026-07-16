import type { CharacterDef } from '@/types/content'
import type {
  BaseState,
  CombatState,
  FlagsState,
  InventoryState,
  PlayerState,
  UiState,
  WorldState,
} from '@/types/state'

export function createPlayer(character: CharacterDef, playerName?: string): PlayerState {
  const attrs = {
    strength: 10 + (character.bonuses.strength ?? 0) + (character.weaknesses?.strength ?? 0),
    agility: 10 + (character.bonuses.agility ?? 0) + (character.weaknesses?.agility ?? 0),
    constitution:
      10 + (character.bonuses.constitution ?? 0) + (character.weaknesses?.constitution ?? 0),
    intelligence:
      10 + (character.bonuses.intelligence ?? 0) + (character.weaknesses?.intelligence ?? 0),
  }

  return {
    characterId: character.id,
    name: (playerName && playerName.trim()) || character.name,
    survival: {
      hp: 100 + (character.weaknesses?.hp ?? 0),
      hunger: 70,
      thirst: 70,
      san: 80 + (character.weaknesses?.san ?? 0),
      warmth: 55,
    },
    survivalMax: {
      hp: 100,
      hunger: 100,
      thirst: 100,
      san: 100,
      warmth: 100,
    },
    attrs,
    skills: {
      scout: character.bonuses.scout ?? 0,
      craft: character.bonuses.craft ?? 0,
      chop: 0,
      climb: 0,
      shoot: 0,
      brawl: 1,
      dodge: 0,
      run: 0,
      stealth: character.bonuses.stealth ?? 0,
      melee: 1,
      unarmed: 1,
    },
    equipment: {
      head: null,
      body: null,
      legs: null,
      hands: null,
      accessory: null,
    },
    accessories: Array.from({ length: 8 }, () => null),
    infected: false,
    statusEffects: [],
  }
}

export function createWorld(): WorldState {
  return {
    locationId: 'beach',
    unlockedLocations: ['beach'],
    day: 1,
    minuteOfDay: 7 * 60,
    season: 'summer',
    weather: 'clear',
    inDungeon: false,
    dungeonId: null,
    dungeonX: 0,
    dungeonY: 0,
  }
}

export function createInventory(): InventoryState {
  return {
    slots: [
      { itemId: 'cloth', count: 2 },
      { itemId: 'wood', count: 1 },
    ],
    capacity: 40,
  }
}

export function createBase(): BaseState {
  return { bases: [] }
}

export function createFlags(): FlagsState {
  return { flags: {} }
}

export function createCombat(): CombatState {
  return {
    active: false,
    enemyId: null,
    player: null,
    enemies: [],
    deadEnemies: [],
    turn: 0,
    log: [],
    loot: [],
    resultText: '',
  }
}

export function createUi(): UiState {
  return {
    mode: 'cutscene',
    previousMode: 'normal',
    menu: null,
    dialogueId: null,
    dialogueNodeId: null,
    narrativeLines: [],
    toasts: [],
    unlockNotices: [],
    cutsceneAppend: false,
  }
}
