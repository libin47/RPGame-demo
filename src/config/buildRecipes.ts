// config/buildRecipes.ts
import type { BuildRecipe, BuildRecipeRegistry } from '../types/build'
import { RecipeCostType, RecipeType } from '../types/recipe'
import { BuildCategory } from '../types/building'
import { AttributeOperation, AttributeType, EffectType } from '@/types/effect'

const buildCampfire: BuildRecipe = {
  id: 'build_campfire',
  name: '建造篝火',
  recipeType: RecipeType.BUILD,
  iconId: 'icon_campfire',
  unlockHint: '获得篝火建造图后解锁',
  buildCategory: BuildCategory.LIGHTING,
  materials: [
    {
      itemId: 'wood',
      quantity: 5,
      isConsumed: true,
    },
    {
      itemId: 'stone',
      quantity: 3,
      isConsumed: true,
    },
  ],
  requirements: {
    skillRequirements: [],
    attributeRequirements: [],
    timeMinutes: 15,
  },
  costs: [
    {
      costType: RecipeCostType.STAMINA,
      value: 20,
      affectedByCoefficient: true,
    },
  ],
  products: [
    {
      itemId: 'campfire',
      baseQuantity: 1,
    },
  ],
  isRepeatable: true,
  buildResult: {
    buildingId: 'campfire',
    buildingName: '篝火',
    descriptionConfig: {
      description: '一个温暖的篝火，可以用来烹饪食物和取暖',
      damageDescription: '篝火被部分破坏，火焰变小了',
      destroyedDescription: '篝火已经熄灭，只剩下一堆灰烬',
    },
    isDecorativeOnly: false,
    buildingType: BuildCategory.LIGHTING,
    isUpgradable: true,
    upgradeRecipeIds: ['build_bonfire'],
    isUnique: false,
    isDeconstructable: true,
    deconstructionReturnRatio: 0.5,
    isDestructible: true,
    durability: 30,
    repairMaterials: [
      { itemId: 'wood', quantity: 2 },
    ],
    passiveEffects: [
      {
        effect: {
          type: EffectType.ATTRIBUTE,
          attribute: AttributeType.TEMPERATURE_LOW,
          operation: AttributeOperation.ADD,
          value: 5,
        },
        probability: 1,
        description: '提供温暖',
      },
    ],
    providedInteractions: [
      {
        interactionId: 'cook_at_campfire',
        interactionName: '烹饪',
        interactionType: 'cook',
      },
      {
        interactionId: 'rest_at_campfire',
        interactionName: '休息',
        interactionType: 'rest',
      },
    ],
  },
}

const buildWoodenWall: BuildRecipe = {
  id: 'build_wooden_wall',
  name: '建造木墙',
  recipeType: RecipeType.BUILD,
  iconId: 'icon_wooden_wall',
  unlockHint: '初始解锁',
  buildCategory: BuildCategory.DEFENSE,
  materials: [
    {
      itemId: 'wood',
      quantity: 10,
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
      value: 40,
      affectedByCoefficient: true,
    },
  ],
  products: [
    {
      itemId: 'wooden_wall',
      baseQuantity: 1,
    },
  ],
  isRepeatable: true,
  buildResult: {
    buildingId: 'wooden_wall',
    buildingName: '木墙',
    descriptionConfig: {
      description: '一面用木材搭建的简易围墙，可以提供基本的防护',
      damageDescription: '木墙被部分破坏，出现了裂缝',
      destroyedDescription: '木墙已被完全摧毁，只剩下一堆碎木',
    },
    isDecorativeOnly: false,
    buildingType: BuildCategory.DEFENSE,
    isUpgradable: true,
    upgradeRecipeIds: ['build_stone_wall'],
    isUnique: false,
    isDeconstructable: true,
    deconstructionReturnRatio: 0.6,
    isDestructible: true,
    durability: 100,
    repairMaterials: [
      { itemId: 'wood', quantity: 5 },
    ],
  },
}

export const buildRecipeRegistry: BuildRecipeRegistry = {
  recipes: {
    build_campfire: buildCampfire,
    build_wooden_wall: buildWoodenWall,
  }
}