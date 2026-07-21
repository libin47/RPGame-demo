import type { Condition } from './effect'

export enum WarmthLevel {
  COMFORTABLE = 'comfortable',
  COLD = 'cold',
  HOT = 'hot',
  FREEZING = 'freezing',
  SCORCHING = 'scorching',
}

export enum SANLevel {
  RATIONAL = 'rational',
  UNEASY = 'uneasy',
  SHAKEN = 'shaken',
  BROKEN = 'broken',
  INSANE = 'insane',
}

export enum SkillType {
  SURVIVAL = 'survival',
  COMBAT = 'combat',
  PASSIVE = 'passive',
}

export enum SurvivalSkillType {
  EXPLORATION = 'exploration',
  FELLING = 'felling',
  MINING = 'mining',
  COLLECTION = 'collection',
  CRAFTING = 'crafting',
  PLANTING = 'planting',
  COOKING = 'cooking',
}

export enum WeaponType {
  SWORD = 'sword',
  AXE = 'axe',
  SPEAR = 'spear',
  BOW = 'bow',
  FIREARM = 'firearm',
  MACE = 'mace',
  DAGGER = 'dagger',
  STAFF = 'staff',
}

export enum DefenseType {
  SLASH = 'slash',
  BLUNT = 'blunt',
  RANGED = 'ranged',
  POISON = 'poison',
  FIRE = 'fire',
}

export interface Player {
  id: string
  name: string
  characterId: string
  survivalAttributes: SurvivalAttributes
  baseAttributes: BaseAttributes
  weaponProficiencies: WeaponProficiency[]
  defenseAttributes: DefenseAttributes
  skills: Skill[]
  inventory: InventoryItem[]
  equipment: EquipmentSlots
  statusEffects: PlayerStatusEffect[]
  passiveSkills: PassiveSkill[]
  flags: Record<string, boolean | number | string>
}

export interface SurvivalAttributes {
  hp: number
  maxHp: number
  hpAccumulator: number
  satiety: number
  maxSatiety: number
  satietyUpperLimitCoefficient: number
  satietyLossCoefficient: number
  stamina: number
  maxStamina: number
  staminaConsumptionCoefficient: number
  staminaRecoveryCoefficient: number
  staminaRecoveryFix: number
  san: number
  maxSan: number
  sanModifier: number
  warmth: WarmthLevel
  temperatureLow: number
  temperatureHigh: number
  carryWeight: number
  maxCarryWeight: number
  carryWeightModifier: number
  recoveryRateCoefficient: number
}

export interface BaseAttributes {
  strength: number
  strengthModifier: number
  strengthExp: number
  agility: number
  agilityModifier: number
  agilityExp: number
  intelligence: number
  intelligenceModifier: number
  intelligenceExp: number
  constitution: number
  constitutionModifier: number
  constitutionExp: number
}

export interface WeaponProficiency {
  weaponType: WeaponType
  level: number
  exp: number
}

export interface DefenseAttributes {
  slash: number
  blunt: number
  ranged: number
  poison: number
  fire: number
}

export interface Skill {
  id: string
  type: SkillType
  skillType?: SurvivalSkillType | string
  level: number
  exp: number
  unlocked: boolean
  description?: string
}

export interface PassiveSkill {
  id: string
  name: string
  description: string
  effects: PassiveSkillEffect[]
}

export interface PassiveSkillEffect {
  attribute: string
  modifier: number
  description?: string
}

export interface InventoryItem {
  itemId: string
  quantity: number
}

export interface EquipmentSlots {
  weapon?: string
  armor?: string
  accessory?: string
  helmet?: string
  boots?: string
}

export interface PlayerStatusEffect {
  id: string
  name: string
  type: 'buff' | 'debuff'
  duration: number
  effects: StatusEffectDetail[]
  description?: string
  icon?: string
}

export interface StatusEffectDetail {
  attribute: string
  modifier: number
  modifierType: 'flat' | 'percent'
}

export interface PlayerSaveData {
  player: Player
  timestamp: number
  gameVersion: string
}
