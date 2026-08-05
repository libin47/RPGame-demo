// config/craftRecipes.ts
// 合成配方 — 基于 config/items/ 中定义的实际物品

import type { CraftRecipe, CraftRecipeRegistry } from '../types/craft'
import { RecipeCostType, RecipeType } from '../types/recipe'
import { CraftCategory } from '../types/craft'

// ============================================================
// 工具
// ============================================================

/** 石斧：木头×2 + 石头×2 → 石斧 */
const craftStoneAxe: CraftRecipe = {
  id: 'craft_stone_axe',
  name: '石斧',
  recipeType: RecipeType.CRAFT,
  iconId: 'icon_stone_axe',
  unlockHint: '初始解锁',
  craftCategory: CraftCategory.TOOL,
  requiredDeviceLevel: 0,
  materials: [
    { itemId: '木头', quantity: 2, isConsumed: true },
    { itemId: '石头', quantity: 2, isConsumed: true },
  ],
  requirements: { attributeRequirements: [], timeMinutes: 15 },
  costs: [{ costType: RecipeCostType.STAMINA, value: 15, affectedByCoefficient: true }],
  products: [{ itemId: '石斧', baseQuantity: 1 }],
  isRepeatable: true,
  minCraftQuantity: 1,
  maxCraftQuantity: 1,
  additionalTimePerItem: 0,
}

/** 木矛：木头×3 + 尼龙绳×1 → 木矛 */
const craftWoodenSpear: CraftRecipe = {
  id: 'craft_wooden_spear',
  name: '木矛',
  recipeType: RecipeType.CRAFT,
  iconId: 'icon_wooden_spear',
  unlockHint: '初始解锁',
  craftCategory: CraftCategory.TOOL,
  requiredDeviceLevel: 0,
  materials: [
    { itemId: '木头', quantity: 3, isConsumed: true },
    { itemId: '尼龙绳', quantity: 1, isConsumed: true },
  ],
  requirements: { attributeRequirements: [], timeMinutes: 10 },
  costs: [{ costType: RecipeCostType.STAMINA, value: 10, affectedByCoefficient: true }],
  products: [{ itemId: '木矛', baseQuantity: 1 }],
  isRepeatable: true,
  minCraftQuantity: 1,
  maxCraftQuantity: 1,
  additionalTimePerItem: 0,
}

/** 石刀：石头×1 + 布料×1 → 石刀 */
const craftStoneKnife: CraftRecipe = {
  id: 'craft_stone_knife',
  name: '石刀',
  recipeType: RecipeType.CRAFT,
  iconId: 'icon_stone_knife',
  unlockHint: '初始解锁',
  craftCategory: CraftCategory.TOOL,
  requiredDeviceLevel: 0,
  materials: [
    { itemId: '石头', quantity: 1, isConsumed: true },
    { itemId: '布料', quantity: 1, isConsumed: true },
  ],
  requirements: { attributeRequirements: [], timeMinutes: 8 },
  costs: [{ costType: RecipeCostType.STAMINA, value: 10, affectedByCoefficient: true }],
  products: [{ itemId: '石刀', baseQuantity: 1 }],
  isRepeatable: true,
  minCraftQuantity: 1,
  maxCraftQuantity: 1,
  additionalTimePerItem: 0,
}

/** 简易鱼竿：木竿×1 + 尼龙绳×1 → 简易鱼竿 */
const craftFishingRod: CraftRecipe = {
  id: 'craft_fishing_rod',
  name: '简易鱼竿',
  recipeType: RecipeType.CRAFT,
  iconId: 'icon_fishing_rod',
  unlockHint: '获得木竿后解锁',
  craftCategory: CraftCategory.TOOL,
  requiredDeviceLevel: 0,
  materials: [
    { itemId: '木竿', quantity: 1, isConsumed: true },
    { itemId: '尼龙绳', quantity: 1, isConsumed: true },
  ],
  requirements: { attributeRequirements: [], timeMinutes: 12 },
  costs: [{ costType: RecipeCostType.STAMINA, value: 10, affectedByCoefficient: true }],
  products: [{ itemId: '简易鱼竿', baseQuantity: 1 }],
  isRepeatable: true,
  minCraftQuantity: 1,
  maxCraftQuantity: 1,
  additionalTimePerItem: 0,
}

/** 木竿：木头×3 → 木竿 */
const craftWoodenPole: CraftRecipe = {
  id: 'craft_wooden_pole',
  name: '木竿',
  recipeType: RecipeType.CRAFT,
  iconId: 'icon_log',
  unlockHint: '初始解锁',
  craftCategory: CraftCategory.TOOL,
  requiredDeviceLevel: 0,
  materials: [{ itemId: '木头', quantity: 3, isConsumed: true }],
  requirements: { attributeRequirements: [], timeMinutes: 5 },
  costs: [{ costType: RecipeCostType.STAMINA, value: 5, affectedByCoefficient: true }],
  products: [{ itemId: '木竿', baseQuantity: 1 }],
  isRepeatable: true,
  minCraftQuantity: 1,
  maxCraftQuantity: 1,
  additionalTimePerItem: 0,
}

// ============================================================
// 消耗品 / 医疗
// ============================================================

/** 绷带：布料×2 → 绷带 */
const craftBandage: CraftRecipe = {
  id: 'craft_bandage',
  name: '绷带',
  recipeType: RecipeType.CRAFT,
  iconId: 'icon_bandage',
  unlockHint: '初始解锁',
  craftCategory: CraftCategory.CONSUMABLE,
  requiredDeviceLevel: 0,
  materials: [{ itemId: '布料', quantity: 2, isConsumed: true }],
  requirements: { attributeRequirements: [], timeMinutes: 5 },
  costs: [{ costType: RecipeCostType.STAMINA, value: 5, affectedByCoefficient: true }],
  products: [{ itemId: '绷带', baseQuantity: 1 }],
  isRepeatable: true,
  minCraftQuantity: 1,
  maxCraftQuantity: 5,
  additionalTimePerItem: 3,
}

// ============================================================
// 材料加工
// ============================================================

/** 布料碎片：布料×1 → 布料碎片×3 */
const craftClothScrap: CraftRecipe = {
  id: 'craft_cloth_scrap',
  name: '布料碎片',
  recipeType: RecipeType.CRAFT,
  iconId: 'icon_cloth',
  unlockHint: '初始解锁',
  craftCategory: CraftCategory.BUILDING_COMPONENT,
  requiredDeviceLevel: 0,
  materials: [{ itemId: '布料', quantity: 1, isConsumed: true }],
  requirements: { attributeRequirements: [], timeMinutes: 3 },
  costs: [{ costType: RecipeCostType.STAMINA, value: 3, affectedByCoefficient: true }],
  products: [{ itemId: '布料碎片', baseQuantity: 3 }],
  isRepeatable: true,
  minCraftQuantity: 1,
  maxCraftQuantity: 10,
  additionalTimePerItem: 2,
}

/** 铁片：金属碎片×2 → 铁片 */
const craftIronSheet: CraftRecipe = {
  id: 'craft_iron_sheet',
  name: '锻制铁片',
  recipeType: RecipeType.CRAFT,
  iconId: 'icon_metal_fragment',
  unlockHint: '获得金属碎片后解锁',
  craftCategory: CraftCategory.BUILDING_COMPONENT,
  requiredDeviceLevel: 0,
  materials: [{ itemId: '金属碎片', quantity: 2, isConsumed: true }],
  requirements: { attributeRequirements: [], timeMinutes: 5 },
  costs: [{ costType: RecipeCostType.STAMINA, value: 8, affectedByCoefficient: true }],
  products: [{ itemId: '铁片', baseQuantity: 1 }],
  isRepeatable: true,
  minCraftQuantity: 1,
  maxCraftQuantity: 5,
  additionalTimePerItem: 4,
}

// ============================================================
// 注册表
// ============================================================

export const craftRecipeRegistry: CraftRecipeRegistry = {
  recipes: {
    craft_stone_axe: craftStoneAxe,
    craft_wooden_spear: craftWoodenSpear,
    craft_stone_knife: craftStoneKnife,
    craft_fishing_rod: craftFishingRod,
    craft_wooden_pole: craftWoodenPole,
    craft_bandage: craftBandage,
    craft_cloth_scrap: craftClothScrap,
    craft_iron_sheet: craftIronSheet,
  },
}
