// config/buildings.ts

import { FunctionType, InteractionType } from '@/types/scene'
import type { Build, BuildRegistry } from '../types/build'
import { RecipeCostType } from '../types/recipe'
import { AttributeOperation, AttributeType, EffectType } from '@/types/effect'

const 营火: Build = {
  /** 建筑实体ID（用于场景中标识此建筑） */
  buildId: '营火',
  // 子建筑配置（build作为一类建筑，一类建筑只允许一个，根据升级情况在子建筑中选择）
  subBuild: [
    {
      buildId: '营火',
      buildName: '营火',
      descriptionConfig: {
        description: '一个温暖的营火，火焰在微风中摇曳',
        longDescription:
          '用木材搭建的简易营火。可以用来烹饪食物、取暖，在夜晚提供照明。火光照亮了你周围的一小片区域，让黑暗中的某些东西不敢靠近。',
        damageDescription: '营火被部分破坏，火焰变小了，木柴散落一地',
        destroyedDescription: '营火已经熄灭，只剩下一堆焦黑的灰烬',
      },
      isDecorativeOnly: false,
      upgrade: [
        {
          targetBuildId: '加固营火',
          /** 所需升级材料及数量 */
          upgradeItems: [
            { itemId: '木头', quantity: 5 },
            { itemId: '石头', quantity: 5 },
          ],
          /** 升级花费（时间） */
          upgradeCost: [
            { costType: RecipeCostType.STAMINA, value: 30, affectedByCoefficient: true },
          ],
        },
      ],
      isDeconstructable: true,
      deconstructionReturnItems: [{ itemId: '木头', quantity: 2 }],
      isDestructible: true,
      durability: 30,
      repairMaterials: [{ itemId: '木头', quantity: 2 }],
      interactions: [
        {
          id: 'cook',
          name: '烹饪',
          interactionType: 'cook',
          buildLevel: 1,
        },
        {
          id: 'rest',
          name: '休息',
          interactionType: 'rest',
          restDescription: '蜷缩在火堆旁并不舒服，但这燃烧的火焰能给予你微弱的安全感—里。',
          description: '你蜷缩在火堆旁休息了{time}个小时，醒来浑身都是沙子。',
        },
      ],
      visualConfig: {
        intactImageId: 'building_campfire',
        damagedImageId: 'building_campfire_damaged',
        destroyedImageId: 'building_campfire_destroyed',
      },
    },
    {
      buildId: '加固营火',
      buildName: '加固营火',
      descriptionConfig: {
        description: '一个温暖的营火，围着一圈石头，火焰在微风中摇曳',
        longDescription:
          '用木材和石头搭建的简易营火。可以用来烹饪食物、取暖，在夜晚提供照明。火光照亮了你周围的一小片区域，让黑暗中的某些东西不敢靠近。',
        damageDescription: '营火被部分破坏，火焰变小了，木柴散落一地',
        destroyedDescription: '营火已经熄灭，只剩下一堆焦黑的灰烬和散落的石块',
      },
      isDecorativeOnly: false,
      isDeconstructable: true,
      deconstructionReturnItems: [
        { itemId: '木头', quantity: 5 },
        { itemId: '石头', quantity: 3 },
      ],
      upgrade: [
        {
          targetBuildId: '大型营火',
          /** 所需升级材料及数量 */
          upgradeItems: [
            { itemId: '木头', quantity: 20 },
            { itemId: '石头', quantity: 20 },
          ],
          /** 升级花费（时间） */
          upgradeCost: [
            { costType: RecipeCostType.STAMINA, value: 30, affectedByCoefficient: true },
          ],
        },
      ],
      isDestructible: true,
      durability: 30,
      repairMaterials: [
        { itemId: '木头', quantity: 2 },
        { itemId: '石头', quantity: 2 },
      ],
      interactions: [
        {
          id: 'cook',
          name: '烹饪',
          interactionType: 'cook',
          buildLevel: 2,
        },
        {
          id: 'rest',
          name: '休息',
          interactionType: 'rest',
          buildLevel: 2,
        },
      ],
      visualConfig: {
        intactImageId: 'building_campfire',
        damagedImageId: 'building_campfire_damaged',
        destroyedImageId: 'building_campfire_destroyed',
      },
    },
    {
      buildId: '大型营火',
      buildName: '大型营火',
      descriptionConfig: {
        description: '一个温暖的大型营火，围着一圈石头，火焰在微风中摇曳，经久不灭。',
        longDescription:
          '用大量木材和石头搭建的大型营火。可以用来烹饪食物、取暖，在夜晚提供照明。火光照亮了你周围的一小片区域，让黑暗中的某些东西不敢靠近。',
        damageDescription: '营火被部分破坏，火焰变小了，木柴散落一地',
        destroyedDescription: '营火已经熄灭，只剩下一堆焦黑的灰烬和散落的石块',
      },
      isDecorativeOnly: false,
      isDeconstructable: true,
      deconstructionReturnItems: [
        { itemId: '木头', quantity: 25 },
        { itemId: '石头', quantity: 20 },
      ],
      isDestructible: true,
      durability: 30,
      repairMaterials: [
        { itemId: '木头', quantity: 5 },
        { itemId: '石头', quantity: 5 },
      ],
      interactions: [
        {
          id: 'cook',
          name: '烹饪',
          interactionType: 'cook',
          buildLevel: 3,
        },
        {
          id: 'rest',
          name: '休息',
          interactionType: 'rest',
          buildLevel: 2,
        },
      ],
      visualConfig: {
        intactImageId: 'building_campfire',
        damagedImageId: 'building_campfire_damaged',
        destroyedImageId: 'building_campfire_destroyed',
      },
    },
  ],
  // 默认子建筑ID
  defaultBuild: '营火',
  // 默认建造材料
  defaultItems: [{ itemId: '木头', quantity: 5 }],
  // 默认建造花费
  defaultCost: [{ costType: RecipeCostType.STAMINA, value: 20, affectedByCoefficient: true }],
  defaultTime: 30,
}

const 工作台: Build = {
  /** 建筑实体ID（用于场景中标识此建筑） */
  buildId: '工作台',
  // 子建筑配置（build作为一类建筑，一类建筑只允许一个，根据升级情况在子建筑中选择）
  subBuild: [
    {
      buildId: '简易工作台',
      buildName: '简易工作台',
      descriptionConfig: {
        description: '一个简单的的工作台，可以制作一些简单的物品。',
        longDescription: '用木材搭建的简易工作台。可以用来制作一些简单的物品。',
        damageDescription: '工作台被部分破坏。',
        destroyedDescription: '工作台已经破坏',
      },
      isDecorativeOnly: false,
      upgrade: [
        {
          targetBuildId: '工作台',
          /** 所需升级材料及数量 */
          upgradeItems: [
            { itemId: '木头', quantity: 25 },
            { itemId: '金属碎片', quantity: 20 },
          ],
          /** 升级花费（时间） */
          upgradeCost: [
            { costType: RecipeCostType.STAMINA, value: 30, affectedByCoefficient: true },
          ],
        },
      ],
      isDeconstructable: true,
      deconstructionReturnItems: [{ itemId: '木头', quantity: 2 }],
      isDestructible: true,
      durability: 30,
      repairMaterials: [{ itemId: '木头', quantity: 3 }],
      interactions: [
        {
          id: 'craft',
          name: '制作',
          interactionType: 'craft',
          buildLevel: 1,
        },
        {
          id: 'repair',
          name: '修复',
          interactionType: 'repair',
          buildLevel: 1,
        },
      ],
      visualConfig: {
        intactImageId: 'building_workbench',
        damagedImageId: 'building_workbench_damaged',
        destroyedImageId: 'building_workbench_destroyed',
      },
    },
    {
      buildId: '工作台',
      buildName: '工作台',
      descriptionConfig: {
        description: '标准工作台，能够制作普通物品。',
        longDescription: '用木材和金属碎片搭建的标准工作台。可以用来制作普通物品。',
        damageDescription: '工作台被部分破坏。',
        destroyedDescription: '工作台已经破坏',
      },
      isDecorativeOnly: false,
      isDeconstructable: true,
      deconstructionReturnItems: [
        { itemId: '木头', quantity: 15 },
        { itemId: '金属碎片', quantity: 20 },
      ],
      upgrade: [
        {
          targetBuildId: '高级工作台',
          /** 所需升级材料及数量 */
          upgradeItems: [{ itemId: '金属碎片', quantity: 50 }],
          /** 升级花费（时间） */
          upgradeCost: [
            { costType: RecipeCostType.STAMINA, value: 30, affectedByCoefficient: true },
          ],
        },
      ],
      isDestructible: true,
      durability: 30,
      repairMaterials: [
        { itemId: '木头', quantity: 5 },
        { itemId: '金属碎片', quantity: 5 },
      ],
      interactions: [
        {
          id: 'craft',
          name: '制作',
          interactionType: 'craft',
          buildLevel: 2,
        },
        {
          id: 'repair',
          name: '修复',
          interactionType: 'repair',
          buildLevel: 2,
        },
      ],
      visualConfig: {
        intactImageId: 'building_workbench',
        damagedImageId: 'building_workbench_damaged',
        destroyedImageId: 'building_workbench_destroyed',
      },
    },
    {
      buildId: '高级工作台',
      buildName: '高级工作台',
      descriptionConfig: {
        description: '一个高级的工作台，能够制作高级物品。',
        longDescription: '用大量木材和金属碎片搭建的高级工作台。可以用来制作高级物品。',
        damageDescription: '工作台被部分破坏。',
        destroyedDescription: '工作台已经破坏',
      },
      isDecorativeOnly: false,
      isDeconstructable: true,
      deconstructionReturnItems: [
        { itemId: '木头', quantity: 25 },
        { itemId: '金属碎片', quantity: 50 },
      ],
      isDestructible: true,
      durability: 30,
      repairMaterials: [
        { itemId: '木头', quantity: 5 },
        { itemId: '金属碎片', quantity: 5 },
      ],
      interactions: [
        {
          id: 'craft',
          name: '制作',
          interactionType: 'craft',
          buildLevel: 3,
        },
        {
          id: 'repair',
          name: '维修',
          interactionType: 'repair',
          buildLevel: 3,
        },
      ],
      visualConfig: {
        intactImageId: 'building_workbench',
        damagedImageId: 'building_workbench_damaged',
        destroyedImageId: 'building_workbench_destroyed',
      },
    },
  ],
  // 默认子建筑ID
  defaultBuild: '简易工作台',
  // 默认建造材料
  defaultItems: [{ itemId: '木头', quantity: 5 }],
  // 默认建造花费
  defaultCost: [{ costType: RecipeCostType.STAMINA, value: 20, affectedByCoefficient: true }],
  defaultTime: 30,
}

const 木墙: Build = {
  buildId: '木墙',
  subBuild: [
    {
      buildId: '木墙',
      buildName: '木墙',
      descriptionConfig: {
        description: '一面用粗壮木材搭建的围墙，提供了基本的防护',
        longDescription: '一面用粗壮木材搭建的围墙，提供了基本的防护，可以保护玩家和环境免受伤害。',
        damageDescription: '木墙上出现了裂缝和被撞击的凹痕',
        destroyedDescription: '木墙已被完全摧毁，只剩下一堆碎裂的木板',
      },
      isDecorativeOnly: false,
      upgrade: [],
      isDeconstructable: true,
      deconstructionReturnItems: [{ itemId: '木头', quantity: 2 }],
      isDestructible: true,
      durability: 30,
      repairMaterials: [{ itemId: '木头', quantity: 2 }],
      passiveEffects: [],
      visualConfig: {
        intactImageId: 'building_wall',
        damagedImageId: 'building_wall_damaged',
        destroyedImageId: 'building_wall_destroyed',
      },
    },
  ],
  // 默认子建筑ID
  defaultBuild: '木墙',
  // 默认建造材料
  defaultItems: [{ itemId: '木头', quantity: 5 }],
  // 默认建造花费
  defaultCost: [{ costType: RecipeCostType.STAMINA, value: 20, affectedByCoefficient: true }],
  defaultTime: 30,
}

const 储物箱: Build = {
  buildId: '储物箱',
  subBuild: [
    {
      buildId: '小型储物箱',
      buildName: '小型储物箱',
      descriptionConfig: {
        description: '一个小型的储物箱，用来存储物品',
        longDescription: '一个小型的储物箱，用来存储物品。',
        damageDescription: '储物箱被部分破坏。',
        destroyedDescription: '储物箱已经破坏',
      },
      interactions: [
        {
          id: 'store',
          name: '存储',
          interactionType: 'store',
          buildLevel: 1,
        },
      ],
      isDecorativeOnly: false,
      maxStorageSlots: 20,
      upgrade: [
        {
          targetBuildId: '中型储物箱',
          /** 所需升级材料及数量 */
          upgradeItems: [{ itemId: '木头', quantity: 20 }],
          /** 升级花费（时间） */
          upgradeCost: [
            { costType: RecipeCostType.STAMINA, value: 30, affectedByCoefficient: true },
          ],
        },
      ],
      isDeconstructable: true,
      deconstructionReturnItems: [{ itemId: '木头', quantity: 2 }],
      isDestructible: true,
      durability: 30,
      repairMaterials: [{ itemId: '木头', quantity: 2 }],
      passiveEffects: [],
      visualConfig: {
        intactImageId: 'building_storage',
        damagedImageId: 'building_storage_damaged',
        destroyedImageId: 'building_storage_destroyed',
      },
    },
    {
      buildId: '中型储物箱',
      buildName: '中型储物箱',
      descriptionConfig: {
        description: '一个中型的储物箱，用来存储物品',
        longDescription: '一个中型的储物箱，用来存储物品。',
        damageDescription: '储物箱被部分破坏。',
        destroyedDescription: '储物箱已经破坏',
      },
      interactions: [
        {
          id: 'store',
          name: '存储',
          interactionType: 'store',
          buildLevel: 2,
        },
      ],
      isDecorativeOnly: false,
      maxStorageSlots: 40,
      upgrade: [
        {
          targetBuildId: '大型加固储物箱',
          /** 所需升级材料及数量 */
          upgradeItems: [
            { itemId: '木头', quantity: 50 },
            { itemId: '金属碎片', quantity: 50 },
          ],
          /** 升级花费（时间） */
          upgradeCost: [
            { costType: RecipeCostType.STAMINA, value: 30, affectedByCoefficient: true },
          ],
        },
      ],
      isDeconstructable: true,
      deconstructionReturnItems: [{ itemId: '木头', quantity: 20 }],
      isDestructible: true,
      durability: 100,
      repairMaterials: [{ itemId: '木头', quantity: 5 }],
      passiveEffects: [],
      visualConfig: {
        intactImageId: 'building_storage',
        damagedImageId: 'building_storage_damaged',
        destroyedImageId: 'building_storage_destroyed',
      },
    },
    {
      buildId: '大型加固储物箱',
      buildName: '大型加固储物箱',
      descriptionConfig: {
        description: '一个大型的储物箱，用来存储物品，使用金属加固，耐久度增加',
        longDescription: '一个大型的储物箱，用来存储物品。',
        damageDescription: '储物箱被部分破坏。',
        destroyedDescription: '储物箱已经破坏',
      },
      interactions: [
        {
          id: 'store',
          name: '存储',
          interactionType: 'store',
          buildLevel: 3,
        },
      ],
      isDecorativeOnly: false,
      maxStorageSlots: 60,
      isDeconstructable: true,
      deconstructionReturnItems: [
        { itemId: '木头', quantity: 20 },
        { itemId: '金属碎片', quantity: 50 },
      ],
      isDestructible: true,
      durability: 500,
      repairMaterials: [
        { itemId: '木头', quantity: 5 },
        { itemId: '金属碎片', quantity: 5 },
      ],
      passiveEffects: [],
      visualConfig: {
        intactImageId: 'building_storage',
        damagedImageId: 'building_storage_damaged',
        destroyedImageId: 'building_storage_destroyed',
      },
    },
  ],
  // 默认子建筑ID
  defaultBuild: '小型储物箱',
  // 默认建造材料
  defaultItems: [{ itemId: '木头', quantity: 5 }],
  // 默认建造花费
  defaultCost: [{ costType: RecipeCostType.STAMINA, value: 20, affectedByCoefficient: true }],
  defaultTime: 30,
}

const 废弃小屋: Build = {
  buildId: '废弃小屋',
  subBuild: [
    {
      buildId: '废弃小屋',
      buildName: '废弃小屋',
      descriptionConfig: {
        description: '一间破旧的小木屋，看起来已经荒废了很久',
        longDescription:
          '木屋的墙壁已经有些倾斜，屋顶破了一个大洞。门上挂着一块生锈的铁牌，字迹已经模糊不清。屋内弥漫着霉味和灰尘，但至少能遮风挡雨。角落里有一张快要散架的床。',
        damageDescription: '废弃小屋的结构变得更加不稳，屋顶的破洞更大了',
        destroyedDescription: '废弃小屋终于支撑不住，轰然倒塌，变成了一堆废木料',
      },
      isDecorativeOnly: false,
      upgrade: [],
      isDeconstructable: true,
      deconstructionReturnItems: [{ itemId: '木头', quantity: 2 }],
      isDestructible: true,
      durability: 30,
      repairMaterials: [{ itemId: '木头', quantity: 2 }],
      passiveEffects: [],
      visualConfig: {
        intactImageId: 'building_wall',
        damagedImageId: 'building_wall_damaged',
        destroyedImageId: 'building_wall_destroyed',
      },
    },
  ],
  // 默认子建筑ID
  defaultBuild: '废弃小屋',
  // 默认建造材料
  defaultItems: [{ itemId: '木头', quantity: 5 }],
  // 默认建造花费
  defaultCost: [{ costType: RecipeCostType.STAMINA, value: 20, affectedByCoefficient: true }],
  defaultTime: 30,
}

export const buildRegistry: BuildRegistry = {
  builds: {
    营火: 营火,
    木墙: 木墙,
    废弃小屋: 废弃小屋,
    工作台: 工作台,
    储物箱: 储物箱,
  },
}
