// config/cookRecipes.ts
import type { CookRecipe, CookRecipeRegistry } from '../types/cook'
import { RecipeType } from '../types/recipe'
import { CookMode } from '../types/cook'

const cookCrabMeat: CookRecipe = {
  id: 'cook_crab_meat',
  name: '烤蟹肉',
  recipeType: RecipeType.COOK,
  iconId: 'icon_cooked_crab',
  unlockHint: '初始解锁',
  cookMode: CookMode.COOK,
  requiredDeviceLevel: 1,
  materials: [
    {
      itemId: 'crab_meat',
      quantity: 1,
      isConsumed: true,
    },
  ],
  requirements: {
    skillRequirements: [],
    attributeRequirements: [],
    timeMinutes: 10,
    requiredDeviceId: 'campfire',
    requiredDeviceLevel: 1,
  },
  costs: [],
  products: [
    {
      itemId: 'cooked_crab',
      baseQuantity: 1,
    },
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
    {
      level: 0,
      name: '焦糊的蟹肉',
      productItemId: 'cooked_crab',
      minSkillLevel: 0,
      weight: 10,
    },
    {
      level: 1,
      name: '普通的烤蟹肉',
      productItemId: 'cooked_crab',
      minSkillLevel: 0,
      weight: 50,
    },
    {
      level: 2,
      name: '美味的烤蟹肉',
      productItemId: 'cooked_crab',
      minSkillLevel: 3,
      weight: 30,
    },
    {
      level: 3,
      name: '完美的烤蟹肉',
      productItemId: 'cooked_crab',
      minSkillLevel: 7,
      weight: 10,
    },
  ],
}

export const cookRecipeRegistry: CookRecipeRegistry = {
  recipes: {
    cook_crab_meat: cookCrabMeat,
  },
}