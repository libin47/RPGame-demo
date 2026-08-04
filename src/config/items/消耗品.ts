// 消耗品物品配置
import type { ConsumableItem } from '@/types/item'
import { ItemCategory, ItemRarity, ConsumableType } from '@/types/item'
import { EffectType, AttributeType, AttributeOperation } from '@/types/effect'

/** 压缩饼干 */
const 压缩饼干: ConsumableItem = {
  id: '压缩饼干',
  name: '压缩饼干',
  description: '一块军用压缩饼干，热量高、体积小，能迅速补充体力。',
  category: ItemCategory.CONSUMABLE,
  iconId: 'icon_compressed_biscuit',
  weight: 0.2,
  maxStackSize: 10,
  isSellable: true,
  basePrice: 5,
  isKeyItem: false,
  consumableType: ConsumableType.FOOD,
  perishMinutes: 0,
  effects: [
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.SATIETY,
        operation: AttributeOperation.ADD,
        value: 25,
      },
      probability: 1,
      description: '恢复25点饱食度',
    },
  ],
  useText: '你啃了一口压缩饼干，干涩但管饱。',
  tags: ['consumable', 'food', 'dry_food'],
}

// 蟹肉
const 蟹肉: ConsumableItem = {
  id: '蟹肉',
  name: '蟹肉',
  description: '大螃蟹的肉，热量高、体积小，但散发着不妙的气味。',
  category: ItemCategory.CONSUMABLE,
  iconId: 'icon_compressed_biscuit',
  weight: 0.2,
  maxStackSize: 10,
  isSellable: true,
  basePrice: 5,
  isKeyItem: false,
  consumableType: ConsumableType.FOOD,
  perishMinutes: 0,
  effects: [
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.SATIETY,
        operation: AttributeOperation.ADD,
        value: 25,
      },
      probability: 1,
      description: '恢复25点饱食度',
    },
  ],
  useText: '你啃了一口蟹肉，有一种腐烂的味道。',
  tags: ['consumable', 'food', 'dry_food'],
}

/** 矿泉水 */
const 矿泉水: ConsumableItem = {
  id: '矿泉水',
  name: '矿泉水',
  description: '一瓶未开封的矿泉水，清澈干净。',
  category: ItemCategory.CONSUMABLE,
  iconId: 'icon_water_bottle',
  weight: 0.5,
  maxStackSize: 5,
  isSellable: true,
  basePrice: 4,
  isKeyItem: false,
  consumableType: ConsumableType.DRINK,
  perishMinutes: 0,
  remainingItemId: '空瓶',
  effects: [
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.SATIETY,
        operation: AttributeOperation.ADD,
        value: 40,
      },
      probability: 1,
      description: '恢复40点饱食度',
    },
  ],
  useText: '你拧开瓶盖，一口气喝掉了半瓶矿泉水。',
  tags: ['consumable', 'drink', 'water'],
}
/** 椰子 */
const 椰子: ConsumableItem = {
  id: '椰子',
  name: '椰子',
  description: '椰子，颜色为黄色。',
  category: ItemCategory.CONSUMABLE,
  iconId: 'icon_coconut',
  weight: 0.5,
  maxStackSize: 5,
  isSellable: true,
  basePrice: 4,
  isKeyItem: false,
  consumableType: ConsumableType.DRINK,
  perishMinutes: 0,
  effects: [
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.SATIETY,
        operation: AttributeOperation.ADD,
        value: 40,
      },
      probability: 1,
      description: '恢复40点饱食度',
    },
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.HP,
        operation: AttributeOperation.ADD,
        value: 100,
      },
      probability: 1,
      description: '恢复40点饱食度',
    },
  ],
  useText: '椰汁可口',
  tags: ['consumable', 'drink', 'coconut'],
}
/** 止痛药 */
const 止痛药: ConsumableItem = {
  id: '止痛药',
  name: '止痛药',
  description: '一板止痛药片，还有几粒剩余。可以缓解疼痛和不适。',
  category: ItemCategory.CONSUMABLE,
  iconId: 'icon_painkiller',
  weight: 0.05,
  maxStackSize: 5,
  isSellable: true,
  basePrice: 12,
  isKeyItem: false,
  consumableType: ConsumableType.MEDICINE,
  perishMinutes: 0,
  effects: [
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.HP,
        operation: AttributeOperation.ADD,
        value: 15,
      },
      probability: 1,
      description: '恢复15点生命值',
    },
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.SAN,
        operation: AttributeOperation.ADD,
        value: 5,
      },
      probability: 1,
      description: '恢复5点SAN值',
    },
  ],
  usesRemaining: 3,
  useText: '你吞下一粒止痛药，苦涩在舌尖化开。',
  tags: ['consumable', 'medicine', 'painkiller'],
}

/** 消毒酒精 */
const 消毒酒精: ConsumableItem = {
  id: '消毒酒精',
  name: '消毒酒精',
  description: '一小瓶医用酒精，可以用来消毒伤口或作为引火助燃剂。',
  category: ItemCategory.CONSUMABLE,
  iconId: 'icon_alcohol',
  weight: 0.2,
  maxStackSize: 3,
  isSellable: true,
  basePrice: 10,
  isKeyItem: false,
  consumableType: ConsumableType.MEDICINE,
  perishMinutes: 0,
  effects: [
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.HP,
        operation: AttributeOperation.ADD,
        value: 10,
      },
      probability: 1,
      description: '恢复10点生命值',
    },
    {
      effect: {
        type: EffectType.STATUS,
        statusId: 'infected',
        apply: false,
      },
      probability: 1,
      description: '消除感染状态',
    },
  ],
  usesRemaining: 3,
  useText: '你用酒精棉擦拭伤口，刺痛感让你倒吸一口凉气。',
  tags: ['consumable', 'medicine', 'alcohol'],
}

/** 绷带 */
const 绷带: ConsumableItem = {
  id: '绷带',
  name: '绷带',
  description: '一卷干净的医用绷带，可以包扎伤口止血。',
  category: ItemCategory.CONSUMABLE,
  iconId: 'icon_bandage',
  weight: 0.1,
  maxStackSize: 10,
  isSellable: true,
  basePrice: 5,
  isKeyItem: false,
  consumableType: ConsumableType.MEDICINE,
  perishMinutes: 0,
  effects: [
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.HP,
        operation: AttributeOperation.ADD,
        value: 20,
      },
      probability: 1,
      description: '恢复20点生命值',
    },
    {
      effect: {
        type: EffectType.STATUS,
        statusId: 'bleeding',
        apply: false,
      },
      probability: 1,
      description: '移除流血状态',
    },
  ],
  useText: '你熟练地用绷带包扎了伤口。',
  tags: ['consumable', 'medicine', 'bandage'],
}

/** 信号弹 */
const 信号弹: ConsumableItem = {
  id: '信号弹',
  name: '信号弹',
  description: '一枚信号弹，发射后能在空中发出明亮的红光。关键时刻或许能救命。',
  category: ItemCategory.CONSUMABLE,
  iconId: 'icon_flare',
  weight: 0.3,
  maxStackSize: 3,
  isSellable: true,
  basePrice: 15,
  isKeyItem: false,
  consumableType: ConsumableType.TOOL,
  perishMinutes: 0,
  effects: [],
  useText: '你拉燃信号弹，一道红光划破天际。',
  tags: ['consumable', 'tool', 'flare'],
}

export { 压缩饼干, 矿泉水, 止痛药, 消毒酒精, 绷带, 信号弹, 蟹肉, 椰子 }
