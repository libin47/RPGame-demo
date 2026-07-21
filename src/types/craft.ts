import type { Condition, EffectResult } from './effect'
import type { SurvivalSkillType } from './player'

export enum CraftType {
  CRAFT = 'craft',
  BUILD = 'build',
  COOK = 'cook',
  REPAIR = 'repair',
}

export enum BuildingType {
  DEFENSE = 'defense',
  PRODUCTION = 'production',
  STORAGE = 'storage',
  LIVING = 'living',
  CRAFTING = 'crafting',
}

export interface CraftRecipe {
  id: string
  name: string
  description: string
  type: CraftType
  resultItemId: string
  resultQuantity: number
  requiredMaterials: CraftMaterial[]
  requiredSkills?: CraftRequiredSkill[]
  requiredConditions?: Condition
  requiredBuildingId?: string
  timeCostMinutes: number
  staminaCost: number
  effects?: EffectResult[]
  isUnlocked?: boolean
  unlockCondition?: Condition
}

export interface CraftMaterial {
  itemId: string
  quantity: number
}

export interface CraftRequiredSkill {
  skillType: SurvivalSkillType
  minLevel: number
}

export interface Building {
  id: string
  name: string
  description: string
  type: BuildingType
  icon: string
  maxLevel: number
  currentLevel: number
  requiredMaterials: CraftMaterial[]
  requiredConditions?: Condition
  buildTimeMinutes: number
  staminaCost: number
  effects?: BuildingEffect[]
  upgradeCost?: BuildingUpgradeCost[]
  isUnlocked?: boolean
  unlockCondition?: Condition
}

export interface BuildingEffect {
  type: 'production' | 'storage' | 'defense' | 'comfort' | 'crafting'
  description: string
  value?: number
  productionRate?: number
  storageCapacity?: number
  defenseBonus?: number
}

export interface BuildingUpgradeCost {
  level: number
  materials: CraftMaterial[]
  timeCostMinutes: number
  staminaCost: number
}

export interface CookingRecipe {
  id: string
  name: string
  description: string
  resultItemId: string
  resultQuantity: number
  requiredIngredients: CraftMaterial[]
  requiredSkill?: { skillType: SurvivalSkillType; minLevel: number }
  requiredConditions?: Condition
  cookingTimeMinutes: number
  staminaCost: number
  effects?: EffectResult[]
  isUnlocked?: boolean
  unlockCondition?: Condition
}

export interface RepairRecipe {
  id: string
  targetItemId: string
  description: string
  requiredMaterials: CraftMaterial[]
  requiredSkill?: { skillType: SurvivalSkillType; minLevel: number }
  repairAmount: number
  timeCostMinutes: number
  staminaCost: number
  isUnlocked?: boolean
  unlockCondition?: Condition
}

export interface CraftState {
  unlockedRecipes: string[]
  unlockedBuildings: string[]
  currentBuildingId?: string
  craftingProgress?: number
  craftingItemId?: string
}

export interface Camp {
  id: string
  name: string
  sceneId: string
  buildings: Building[]
  isMainBase: boolean
  storageItems: StorageItem[]
  maxStorageWeight: number
}

export interface StorageItem {
  itemId: string
  quantity: number
}