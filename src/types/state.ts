import type {
  BaseAttr,
  EquipSlot,
  Season,
  SkillId,
  SurvivalAttr,
  TimePhase,
  Weather,
} from './content'

export type GameMode =
  | 'cutscene'
  | 'normal'
  | 'map'
  | 'combat'
  | 'combat_result'
  | 'dialogue'
  | 'craft'
  | 'dungeon'

export type MenuId = 'system' | 'inventory' | 'stats' | null

export interface PlayerState {
  characterId: string
  name: string
  survival: Record<SurvivalAttr, number>
  survivalMax: Record<SurvivalAttr, number>
  attrs: Record<BaseAttr, number>
  skills: Partial<Record<SkillId, number>>
  equipment: Partial<Record<EquipSlot, string | null>>
  accessories: (string | null)[]
  infected: boolean
  statusEffects: string[]
}

export interface WorldState {
  locationId: string
  unlockedLocations: string[]
  day: number
  minuteOfDay: number
  season: Season
  weather: Weather
  inDungeon: boolean
  dungeonId: string | null
  dungeonX: number
  dungeonY: number
}

export interface InventorySlot {
  itemId: string
  count: number
}

export interface InventoryState {
  slots: InventorySlot[]
  capacity: number
}

export interface BuildingInstance {
  id: string
  buildingType: string
  hp: number
}

export interface BaseInstance {
  id: string
  locationId: string
  temporary: boolean
  daysLeft: number | null
  buildings: BuildingInstance[]
  storage: InventorySlot[]
  buried: boolean
}

export interface BaseState {
  bases: BaseInstance[]
}

export interface FlagsState {
  flags: Record<string, boolean | number>
}

export interface CombatantState {
  id: string
  name: string
  hp: number
  maxHp: number
  armor: number
  cooldowns: Record<string, number>
  isPlayer: boolean
}

export interface CombatState {
  active: boolean
  enemyId: string | null
  player: CombatantState | null
  enemies: CombatantState[]
  deadEnemies: string[]
  turn: number
  log: string[]
  loot: InventorySlot[]
  resultText: string
}

export interface UiState {
  mode: GameMode
  previousMode: GameMode
  menu: MenuId
  dialogueId: string | null
  dialogueNodeId: string | null
  narrativeLines: string[]
  toasts: string[]
  unlockNotices: string[]
  cutsceneAppend: boolean
}

export interface SaveSnapshot {
  player: PlayerState
  world: WorldState
  inventory: InventoryState
  base: BaseState
  flags: FlagsState
  combat: CombatState
}

export interface SaveFile {
  version: number
  savedAt: string
  slot: number
  snapshot: SaveSnapshot
}

export const SAVE_VERSION = 1

export function timePhaseFromMinute(minuteOfDay: number): TimePhase {
  if (minuteOfDay < 6 * 60) return 'night'
  if (minuteOfDay < 8 * 60) return 'dawn'
  if (minuteOfDay < 18 * 60) return 'day'
  if (minuteOfDay < 20 * 60) return 'dusk'
  return 'night'
}

export function formatGameTime(day: number, minuteOfDay: number, season: Season): string {
  const h = Math.floor(minuteOfDay / 60)
  const m = minuteOfDay % 60
  const seasonLabel: Record<Season, string> = {
    spring: '春',
    summer: '夏',
    autumn: '秋',
    winter: '冬',
  }
  return `${seasonLabel[season]} 第${day}日 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
