// config/craftRecipes.ts
import type { CraftRecipe, CraftRecipeRegistry } from '../types/craft'
import { RecipeCostType, RecipeType } from '../types/recipe'
import { CraftCategory } from '../types/craft'

const craftBandage: CraftRecipe = {
  id: 'craft_bandage',
  name: '制作绷带',
  recipeType: RecipeType.CRAFT,
  iconId: 'icon_bandage',
  unlockHint: '初始解锁',
  craftCategory: CraftCategory.CONSUMABLE,
  requiredDeviceLevel: 0,
  materials: [
    {
      itemId: 'cloth_scrap',
      quantity: 2,
      isConsumed: true,
    },
  ],
  requirements: {
    skillRequirements: [],
    attributeRequirements: [],
    timeMinutes: 5,
  },
  costs: [],
  products: [
    {
      itemId: 'bandage',
      baseQuantity: 1,
    },
  ],
  isRepeatable: true,
  experienceReward: {
    skillId: 'cooking',
    expPerCraft: 5,
    firstTimeBonusExp: 20,
  },
  minCraftQuantity: 1,
  maxCraftQuantity: 10,
  additionalTimePerItem: 5,
}

const craftChitinArmor: CraftRecipe = {
  id: 'craft_chitin_armor',
  name: '制作甲壳护甲',
  recipeType: RecipeType.CRAFT,
  iconId: 'icon_chitin_shell',
  unlockHint: '获得甲壳后解锁',
  craftCategory: CraftCategory.ARMOR,
  requiredDeviceLevel: 1,
  materials: [
    {
      itemId: 'chitin_shell',
      quantity: 3,
      isConsumed: true,
    },
    {
      itemId: 'cloth_scrap',
      quantity: 2,
      isConsumed: true,
    },
  ],
  requirements: {
    skillRequirements: [],
    attributeRequirements: [],
    timeMinutes: 30,
  },
  costs: [
    {
      costType: RecipeCostType.STAMINA,
      value: 30,
      affectedByCoefficient: true,
    },
  ],
  products: [
    {
      itemId: 'chitin_armor',
      baseQuantity: 1,
    },
  ],
  isRepeatable: true,
  experienceReward: {
    skillId: 'cooking',
    expPerCraft: 30,
    firstTimeBonusExp: 50,
  },
  minCraftQuantity: 1,
  maxCraftQuantity: 5,
  additionalTimePerItem: 30,
}

export const craftRecipeRegistry: CraftRecipeRegistry = {
  recipes: {
    craft_bandage: craftBandage,
    craft_chitin_armor: craftChitinArmor,
  },
}