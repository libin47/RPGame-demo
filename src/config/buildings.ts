// config/buildings.ts

import type { BuildResult, BuildRegistry } from '../types/building'
import { BuildCategory } from '../types/building'

const campfire: BuildResult = {
  buildingId: 'campfire',
  buildingName: '篝火',
  descriptionConfig: {
    description: '一个温暖的篝火，火焰在微风中摇曳',
    longDescription: '用木材和石头搭建的简易篝火。可以用来烹饪食物、取暖，在夜晚提供照明。火光照亮了你周围的一小片区域，让黑暗中的某些东西不敢靠近。',
    damageDescription: '篝火被部分破坏，火焰变小了，木柴散落一地',
    destroyedDescription: '篝火已经熄灭，只剩下一堆焦黑的灰烬和散落的石块',
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
        type: 'attribute' as any,
        attribute: 'temperatureLow' as any,
        operation: 'add' as any,
        value: 5,
      },
      probability: 1,
      description: '提供温暖，提升低温耐受',
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
  visualConfig: {
    intactImageId: 'building_campfire',
    damagedImageId: 'building_campfire_damaged',
    destroyedImageId: 'building_campfire_destroyed',
  },
}

const woodenWall: BuildResult = {
  buildingId: 'wooden_wall',
  buildingName: '木墙',
  descriptionConfig: {
    description: '一面用粗壮木材搭建的围墙，提供了基本的防护',
    damageDescription: '木墙上出现了裂缝和被撞击的凹痕',
    destroyedDescription: '木墙已被完全摧毁，只剩下一堆碎裂的木板',
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
  visualConfig: {
    intactImageId: 'building_wooden_wall',
    damagedImageId: 'building_wooden_wall_damaged',
    destroyedImageId: 'building_wooden_wall_destroyed',
  },
}

// 初始场景中已存在的建筑（非玩家建造）
const abandonedHut: BuildResult = {
  buildingId: 'abandoned_hut',
  buildingName: '废弃小屋',
  descriptionConfig: {
    description: '一间破旧的小木屋，看起来已经荒废了很久',
    longDescription: '木屋的墙壁已经有些倾斜，屋顶破了一个大洞。门上挂着一块生锈的铁牌，字迹已经模糊不清。屋内弥漫着霉味和灰尘，但至少能遮风挡雨。角落里有一张快要散架的床。',
    damageDescription: '废弃小屋的结构变得更加不稳，屋顶的破洞更大了',
    destroyedDescription: '废弃小屋终于支撑不住，轰然倒塌，变成了一堆废木料',
  },
  isDecorativeOnly: false,
  buildingType: BuildCategory.LIVING,
  isUpgradable: true,
  upgradeRecipeIds: ['build_repair_hut'],
  isUnique: true,
  isDeconstructable: true,
  deconstructionReturnRatio: 0.4,
  isDestructible: true,
  durability: 50,
  repairMaterials: [
    { itemId: 'wood', quantity: 8 },
    { itemId: 'stone', quantity: 4 },
  ],
  passiveEffects: [
    {
      effect: {
        type: 'attribute' as any,
        attribute: 'temperatureLow' as any,
        operation: 'add' as any,
        value: 3,
      },
      probability: 1,
    },
    {
      effect: {
        type: 'attribute' as any,
        attribute: 'temperatureHigh' as any,
        operation: 'add' as any,
        value: 3,
      },
      probability: 1,
    },
  ],
  providedInteractions: [
    {
      interactionId: 'rest_at_hut',
      interactionName: '休息',
      interactionType: 'rest',
    },
    {
      interactionId: 'store_at_hut',
      interactionName: '存放物品',
      interactionType: 'store',
    },
  ],
  visualConfig: {
    intactImageId: 'building_abandoned_hut',
    damagedImageId: 'building_abandoned_hut_damaged',
    destroyedImageId: 'building_abandoned_hut_destroyed',
  },
}

export const buildRegistry: BuildRegistry = {
  build: {
    campfire,
    wooden_wall: woodenWall,
    abandoned_hut: abandonedHut,
  },
}