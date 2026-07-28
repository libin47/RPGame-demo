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
          id: 'craft',
          name: '制造',
          interactionType: 'craft',
          buildLevel: 1,
        },
        {
          id: 'cook',
          name: '烹饪',
          interactionType: 'cook',
          buildLevel: 1,
        },
        {
          id: 'event',
          name: '触发事件',
          interactionType: 'event',
          eventId: 'campfire_event',
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
      isDestructible: true,
      durability: 30,
      repairMaterials: [
        { itemId: '木头', quantity: 2 },
        { itemId: '石头', quantity: 2 },
      ],
      interactions: [],
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
  },
}
