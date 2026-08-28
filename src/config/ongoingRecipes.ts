// config/ongoingRecipes.ts
// 进行中（需要时间）配方 — 投产后经过时间方可完成

import type { OngoingRecipe, OngoingRecipeRegistry } from '../types/ongoing'
import { OngoingMode } from '../types/ongoing'
import { RecipeType } from '../types/recipe'

/** 晒干蟹肉：蟹肉×1 → 蟹肉（晒干） */
const ongoing_晒干蟹肉: OngoingRecipe = {
  id: 'ongoing_晒干蟹肉',
  name: '晒干蟹肉',
  recipeType: RecipeType.ONGOING,
  ongoingMode: OngoingMode.DRYING,
  displayProgress: true,
  unlockHint: '初始解锁',
  materials: [{ itemId: '蟹肉', quantity: 1, isConsumed: true }],
  requirements: {
    attributeRequirements: [],
    timeMinutes: 120,
    requiredDeviceLevel: 0,
  },
  costs: [],
  products: [{ itemId: '蟹肉', baseQuantity: 1 }],
  qualityLevels: [
    { level: 0, name: '泛潮的蟹肉干', minDeviceLevel: 0, weight: 20 },
    { level: 1, name: '蟹肉干', minDeviceLevel: 0, weight: 50 },
    { level: 2, name: '咸香的蟹肉干', minDeviceLevel: 2, weight: 30 },
  ],
  isRepeatable: true,
}

export const ongoingRecipeRegistry: OngoingRecipeRegistry = {
  recipes: {
    ongoing_晒干蟹肉,
  },
}