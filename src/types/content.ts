export type Id = string

export type TimePhase = 'dawn' | 'day' | 'dusk' | 'night'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type Weather = 'clear' | 'rain' | 'storm' | 'fog'

export type BaseAttr = 'strength' | 'agility' | 'constitution' | 'intelligence'
export type SurvivalAttr = 'hp' | 'hunger' | 'thirst' | 'san' | 'warmth'
export type SkillId =
  | 'scout'
  | 'chop'
  | 'craft'
  | 'climb'
  | 'shoot'
  | 'brawl'
  | 'dodge'
  | 'run'
  | 'stealth'
  | 'melee'
  | 'unarmed'

export type EquipSlot = 'head' | 'body' | 'legs' | 'hands' | 'accessory'

/** Condition DSL */
export type When =
  | { flag: string }
  | { notFlag: string }
  | { attrGte: { attr: BaseAttr | SurvivalAttr; value: number } }
  | { attrLte: { attr: BaseAttr | SurvivalAttr; value: number } }
  | { skillGte: { skill: SkillId; value: number } }
  | { sanIn: { min?: number; max?: number } }
  | { hasItem: { itemId: string; count?: number } }
  | { timePhase: TimePhase | TimePhase[] }
  | { location: string }
  | { all: When[] }
  | { any: When[] }

export type Effect =
  | { type: 'setFlag'; flag: string; value?: boolean | number }
  | { type: 'addItem'; itemId: string; count?: number }
  | { type: 'removeItem'; itemId: string; count?: number }
  | { type: 'modAttr'; attr: BaseAttr | SurvivalAttr; delta: number }
  | { type: 'modSan'; delta: number }
  | { type: 'unlockLocation'; locationId: string }
  | { type: 'startCombat'; enemyId: string }
  | { type: 'startDialogue'; dialogueId: string; nodeId?: string }
  | { type: 'advanceTime'; minutes: number }
  | { type: 'grantXp'; skill: SkillId; amount: number }
  | { type: 'setLocation'; locationId: string }
  | { type: 'enterDungeon'; dungeonId: string; x?: number; y?: number }
  | { type: 'exitDungeon' }
  | { type: 'narrative'; text: string }
  | { type: 'toast'; text: string }
  | { type: 'checkEnding' }
  | { type: 'heal'; amount: number }
  | { type: 'rest'; hours: number }

export interface SanText {
  default: string
  /** Use first matching entry where san <= max (sorted ascending by max). */
  sanBelow?: { max: number; text: string }[]
}

export interface CharacterDef {
  id: Id
  name: string
  description: string
  bonuses: Partial<Record<BaseAttr | SkillId, number>>
  weaknesses?: Partial<Record<BaseAttr | SurvivalAttr, number>>
  traits?: string[]
}

export interface LocationExit {
  to: Id
  travelMinutes: number
  unlockFlag?: string
  when?: When
  label?: string
}

export interface LocationAction {
  id: Id
  label: string
  type: string
  timeCost?: number
  when?: When
  effects?: Effect[]
  dungeonId?: string
  enemyId?: string
  dialogueId?: string
  recipeId?: string
}

export interface InteractableDef {
  id: Id
  label: string
  type: 'examine' | 'take' | 'use'
  text?: SanText
  textKey?: string
  when?: When
  effects?: Effect[]
  onceFlag?: string
}

export interface LocationDef {
  id: Id
  name: string
  image?: string
  description: SanText
  exits: LocationExit[]
  actions: LocationAction[]
  interactables?: InteractableDef[]
  canBuildBase?: boolean
  tags?: string[]
}

export interface DialogueChoice {
  label: string
  next?: string
  when?: When
  effects?: Effect[]
  end?: boolean
}

export interface DialogueNode {
  id: Id
  text: string
  next?: string
  choices?: DialogueChoice[]
  effects?: Effect[]
}

export interface DialogueDef {
  id: Id
  title?: string
  start: string
  nodes: DialogueNode[]
  /** If true, treat as cutscene (tap to advance). */
  cutscene?: boolean
}

export interface ItemDef {
  id: Id
  name: string
  description: string
  weight: number
  stackable?: boolean
  maxStack?: number
  equipSlot?: EquipSlot
  armor?: number
  warmth?: number
  weaponType?: 'melee' | 'ranged' | 'unarmed'
  damage?: number
  usable?: boolean
  useEffects?: Effect[]
  tags?: string[]
}

export interface RecipeDef {
  id: Id
  name: string
  resultItemId: string
  resultCount?: number
  materials: { itemId: string; count: number }[]
  timeCost: number
  blueprintFlag?: string
  workbenchId?: string
  skillReq?: { skill: SkillId; level: number }
  intReq?: number
  when?: When
}

export interface CombatSkillDef {
  id: Id
  name: string
  skill: SkillId
  cooldown: number
  /** Damage expression placeholders: STR, AGI, LEVEL */
  damageFormula: string
  hitBonus?: number
  description?: string
}

export interface EnemyDef {
  id: Id
  name: string
  description: string
  hp: number
  damage: number
  armor?: number
  skills: CombatSkillDef[]
  loot?: { itemId: string; count: number; chance?: number }[]
  sanLossOnSight?: number
}

export interface DungeonCell {
  x: number
  y: number
  description: string
  exits: ('n' | 's' | 'e' | 'w')[]
  events?: Effect[]
  onceFlag?: string
}

export interface DungeonDef {
  id: Id
  name: string
  exitLocationId: string
  start: { x: number; y: number }
  cells: DungeonCell[]
}

export interface EndingDef {
  id: Id
  name: string
  description: string
  when: When
  priority?: number
}

export interface TextEntry {
  id: Id
  text: SanText
}

export interface ContentRegistry {
  characters: Record<Id, CharacterDef>
  locations: Record<Id, LocationDef>
  dialogues: Record<Id, DialogueDef>
  items: Record<Id, ItemDef>
  recipes: Record<Id, RecipeDef>
  enemies: Record<Id, EnemyDef>
  dungeons: Record<Id, DungeonDef>
  endings: Record<Id, EndingDef>
  texts: Record<Id, TextEntry>
}
