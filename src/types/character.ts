import type { BaseAttributes, Skill, InventoryItem, PassiveSkill } from './player'

export type CharacterClass = 'survivor' | 'soldier' | 'scientist' | 'medic' | 'engineer' | 'hunter' | 'chef'

export interface Character {
  id: string
  name: string
  class: CharacterClass
  description: string
  avatar: string
  startingAttributes: Partial<BaseAttributes>
  startingSkills: Skill[]
  startingItems: InventoryItem[]
  uniqueAbility: UniqueAbility
  attributeBonuses: CharacterAttributeBonus
  skillBonuses: CharacterSkillBonus
  backgroundStory: string
}

export interface UniqueAbility {
  id: string
  name: string
  description: string
  effect: AbilityEffect
  isPassive: boolean
  cooldown?: number
}

export interface AbilityEffect {
  type: 'attribute' | 'skill' | 'crafting' | 'combat' | 'survival' | 'healing'
  target?: string
  modifier?: number
  description?: string
  unlockCondition?: AbilityUnlockCondition
}

export interface AbilityUnlockCondition {
  skillLevel?: { skillId: string; level: number }
  attributeLevel?: { attribute: string; level: number }
  eventId?: string
}

export interface CharacterAttributeBonus {
  strength?: number
  agility?: number
  intelligence?: number
  constitution?: number
  maxHp?: number
  maxSatiety?: number
  maxStamina?: number
  maxSan?: number
  maxCarryWeight?: number
}

export interface CharacterSkillBonus {
  survivalSkills?: Record<string, number>
  combatSkills?: Record<string, number>
  weaponProficiencies?: Record<string, number>
}

export interface CharacterClassConfig {
  class: CharacterClass
  name: string
  description: string
  attributeBonuses: CharacterAttributeBonus
  skillBonuses: CharacterSkillBonus
  uniqueAbility: UniqueAbility
  startingEquipment?: string[]
  flavorText: string
}

export interface CharacterState {
  characterId: string
  class: CharacterClass
  level: number
  experience: number
  passiveSkills: PassiveSkill[]
  learnedAbilities: string[]
}