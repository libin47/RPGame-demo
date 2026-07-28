// config/cookRecipes.ts
// 烹饪配方 — 基于 config/items/消耗品.ts 中定义的实际食材

import type { CookRecipe, CookRecipeRegistry } from '../types/cook'
import { RecipeType } from '../types/recipe'
import { CookMode } from '../types/cook'

/** 烤蟹肉：蟹肉×1 → 蟹肉（品质提升） */
const cookCrabMeat: CookRecipe = {
  id: 'cook_crab_meat',
  name: '烤蟹肉',
  recipeType: RecipeType.COOK,
  iconId: 'icon_cooked_crab',
  unlockHint: '初始解锁',
  cookMode: CookMode.COOK,
  requiredDeviceLevel: 0,
  materials: [
    { itemId: '蟹肉', quantity: 1, isConsumed: true },
  ],
  requirements: {
    skillRequirements: [],
    attributeRequirements: [],
    timeMinutes: 10,
  },
  costs: [],
  products: [
    { itemId: '蟹肉', baseQuantity: 1 },
  ],
  isRepeatable: true,
  cookTimeMinutes: 10,
  experienceReward: {
    skillId: 'cooking',
    expPerCook: 15,
    perfectBonusExp: 10,
    firstTimeBonusExp: 30,
  },
  qualityLevels: [
    { level: 0, name: '焦糊的蟹肉', minSkillLevel: 0, weight: 10 },
    { level: 1, name: '普通的烤蟹肉', minSkillLevel: 0, weight: 50 },
    { level: 2, name: '美味的烤蟹肉', minSkillLevel: 3, weight: 30 },
    { level: 3, name: '完美的烤蟹肉', minSkillLevel: 7, weight: 10 },
  ],
}

/** 烤椰子：椰子×1 → 椰子（加热后风味更佳） */
const cookCoconut: CookRecipe = {
  id: 'cook_coconut',
  name: '烤椰子',
  recipeType: RecipeType.COOK,
  iconId: 'icon_coconut',
  unlockHint: '初始解锁',
  cookMode: CookMode.COOK,
  requiredDeviceLevel: 0,
  materials: [
    { itemId: '椰子', quantity: 1, isConsumed: true },
  ],
  requirements: {
    skillRequirements: [],
    attributeRequirements: [],
    timeMinutes: 5,
  },
  costs: [],
  products: [
    { itemId: '椰子', baseQuantity: 1 },
  ],
  isRepeatable: true,
  cookTimeMinutes: 5,
  experienceReward: {
    skillId: 'cooking',
    expPerCook: 8,
    perfectBonusExp: 5,
    firstTimeBonusExp: 15,
  },
  qualityLevels: [
    { level: 0, name: '焦糊的椰子', minSkillLevel: 0, weight: 10 },
    { level: 1, name: '温热的椰子', minSkillLevel: 0, weight: 50 },
    { level: 2, name: '香烤椰子', minSkillLevel: 3, weight: 30 },
    { level: 3, name: '完美的烤椰子', minSkillLevel: 7, weight: 10 },
  ],
}

export const cookRecipeRegistry: CookRecipeRegistry = {
  recipes: {
    cook_crab_meat: cookCrabMeat,
    cook_coconut: cookCoconut,
  },
}
