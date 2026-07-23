// config/items.ts
import type {
  WeaponItem,
  ArmorItem,
  ConsumableItem,
  MaterialItem,
  ValuableItem,
  DocumentItem,
  RecipeItem,
  MiscItem,
  ItemRegistry,
} from '../types/item'
import { ItemCategory, ItemRarity, EquipmentSlot, ConsumableType } from '../types/item'
import { RecipeType } from '../types/recipe'
import { EffectType, AttributeType, AttributeOperation } from '../types/effect'

// ===== 武器 =====

const rustySword: WeaponItem = {
  id: 'rusty_sword',
  name: '生锈的铁剑',
  description: '一把锈迹斑斑的铁剑，虽然破旧但依然锋利',
  category: ItemCategory.WEAPON,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_rusty_sword',
  weight: 2.5,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 25,
  isKeyItem: false,
  weaponTypeId: 'sword',
  durability: {
    maxDurability: 50,
    initialDurability: 35,
    isRepairable: true,
    repairMaterials: [{ itemId: 'iron_scrap', quantity: 2 }],
    repairWorkbenchLevel: 1,
    destroyOnBreak: false,
    brokenItemId: 'broken_rusty_sword',
  },
  equipmentSlot: EquipmentSlot.WEAPON,
  weaponStats: {
    baseDamage: 10,
    damageTypeId: 'slash',
    damageVariance: 0.15,
    accuracyModifier: 0.0,
    criticalChanceModifier: 0.05,
    criticalMultiplier: 2.0,
  },
  isDualWieldable: false,
  isTwoHanded: false,
  attributeModifiers: [],
  grantedSkillIds: ['basic_slash'],
  tags: ['weapon', 'metal', 'sword'],
}

const makeshiftBow: WeaponItem = {
  id: 'makeshift_bow',
  name: '简易木弓',
  description: '用树枝和藤蔓制作的简易弓，射程有限但聊胜于无',
  category: ItemCategory.WEAPON,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_makeshift_bow',
  weight: 1.5,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 15,
  isKeyItem: false,
  weaponTypeId: 'bow',
  durability: {
    maxDurability: 40,
    initialDurability: 40,
    isRepairable: true,
    repairMaterials: [{ itemId: 'wood', quantity: 3 }],
    repairWorkbenchLevel: 0,
    destroyOnBreak: true,
  },
  equipmentSlot: EquipmentSlot.WEAPON,
  weaponStats: {
    baseDamage: 8,
    damageTypeId: 'pierce',
    damageVariance: 0.2,
    accuracyModifier: -0.05,
    criticalChanceModifier: 0.1,
    criticalMultiplier: 2.5,
  },
  isDualWieldable: false,
  isTwoHanded: true,
  attributeModifiers: [],
  grantedSkillIds: ['quick_shot'],
  tags: ['weapon', 'wood', 'bow'],
}

// ===== 物品 =====

const chitinShell: MaterialItem = {
  id: 'chitin_shell',
  name: '甲壳碎片',
  description: '从变异蟹身上剥下的坚硬甲壳碎片，可用于制作护甲',
  category: ItemCategory.MATERIAL,
  rarity: ItemRarity.UNCOMMON,
  iconId: 'icon_chitin_shell',
  weight: 1.0,
  maxStackSize: 10,
  isSellable: true,
  basePrice: 8,
  isKeyItem: false,
  materialType: 'chitin',
  tags: ['material', 'chitin'],
}

const oneNote: MiscItem = {
  id: 'one_note',
  name: '笔记本',
  description: '一个笔记本，你或许能用它来写点儿东西。',
  category: ItemCategory.MISC,
  rarity: ItemRarity.UNCOMMON,
  iconId: 'icon_note',
  weight: 0.0,
  maxStackSize: 1,
  isSellable: false,
  basePrice: 0,
  isKeyItem: true,
  isCombinable: false,
}

// ===== 消耗品 =====

const bandage: ConsumableItem = {
  id: 'bandage',
  name: '绷带',
  description: '简易的布质绷带，可用于包扎伤口',
  category: ItemCategory.CONSUMABLE,
  rarity: ItemRarity.COMMON,
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
  useText: '你用绷带仔细包扎了伤口',
  tags: ['consumable', 'medicine'],
}

const cookedCrab: ConsumableItem = {
  id: 'cooked_crab',
  name: '烤蟹肉',
  description: '烤熟的变异蟹肉，味道尚可',
  category: ItemCategory.CONSUMABLE,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_cooked_crab',
  weight: 0.3,
  maxStackSize: 5,
  isSellable: true,
  basePrice: 8,
  isKeyItem: false,
  consumableType: ConsumableType.FOOD,
  perishMinutes: 720,
  spoiledItemId: 'spoiled_food',
  effects: [
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.SATIETY,
        operation: AttributeOperation.ADD,
        value: 30,
      },
      probability: 1,
      description: '恢复30点饱食度',
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
  useText: '你吃下烤蟹肉，味道还不错',
  tags: ['consumable', 'food', 'cooked'],
}

const strengthPotion: ConsumableItem = {
  id: 'strength_potion',
  name: '力量药水',
  description: '一瓶泛着微光的药水，喝下后短时间内力量大增',
  category: ItemCategory.CONSUMABLE,
  rarity: ItemRarity.RARE,
  iconId: 'icon_strength_potion',
  weight: 0.2,
  maxStackSize: 3,
  isSellable: true,
  basePrice: 50,
  isKeyItem: false,
  consumableType: ConsumableType.SPECIAL,
  perishMinutes: 0,
  effects: [
    {
      effect: {
        type: EffectType.STATUS,
        statusId: 'strength_boost',
        apply: true,
        duration: 30,
        durationUnit: 'minute',
      },
      probability: 1,
      description: '获得30分钟力量增强效果',
    },
  ],
  applyStatus: [
    {
      statusId: 'strength_boost',
      durationMinutes: 30,
      probability: 1,
    },
  ],
  useText: '你喝下力量药水，感觉浑身充满力量',
  tags: ['consumable', 'potion', 'buff'],
}

// ===== 材料 =====

const wood: MaterialItem = {
  id: 'wood',
  name: '木材',
  description: '普通的木材，可用于建造和制作',
  category: ItemCategory.MATERIAL,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_wood',
  weight: 1.0,
  maxStackSize: 50,
  isSellable: true,
  basePrice: 2,
  isKeyItem: false,
  materialType: 'wood',
  tags: ['material', 'wood'],
}

const stone: MaterialItem = {
  id: 'stone',
  name: '石头',
  description: '普通的石头，可用于建造基础建筑',
  category: ItemCategory.MATERIAL,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_stone',
  weight: 2.0,
  maxStackSize: 30,
  isSellable: true,
  basePrice: 1,
  isKeyItem: false,
  materialType: 'stone',
  tags: ['material', 'stone'],
}

const crabMeat: MaterialItem = {
  id: 'crab_meat',
  name: '蟹肉',
  description: '从变异蟹身上获取的肉，需要烹饪后才能安全食用',
  category: ItemCategory.MATERIAL,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_crab_meat',
  weight: 0.5,
  maxStackSize: 10,
  isSellable: true,
  basePrice: 3,
  isKeyItem: false,
  materialType: 'meat',
  tags: ['material', 'food_raw', 'meat'],
}

const clothScrap: MaterialItem = {
  id: 'cloth_scrap',
  name: '布料碎片',
  description: '从衣物或织物上撕下的碎片',
  category: ItemCategory.MATERIAL,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_cloth_scrap',
  weight: 0.1,
  maxStackSize: 20,
  isSellable: true,
  basePrice: 1,
  isKeyItem: false,
  materialType: 'cloth',
  tags: ['material', 'cloth'],
}

const ironScrap: MaterialItem = {
  id: 'iron_scrap',
  name: '铁片',
  description: '从残骸中收集的铁片，可用于修理金属物品',
  category: ItemCategory.MATERIAL,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_iron_scrap',
  weight: 0.5,
  maxStackSize: 20,
  isSellable: true,
  basePrice: 3,
  isKeyItem: false,
  materialType: 'metal',
  tags: ['material', 'metal'],
}

// ===== 贵重物品 =====

const goldCoin: ValuableItem = {
  id: 'gold_coin',
  name: '金币',
  description: '一枚闪闪发光的金币，在岛上似乎没什么用',
  category: ItemCategory.VALUABLE,
  rarity: ItemRarity.UNCOMMON,
  iconId: 'icon_gold_coin',
  weight: 0.01,
  maxStackSize: 999,
  isSellable: true,
  basePrice: 10,
  isKeyItem: false,
  priceMultiplier: 1.0,
  tags: ['valuable', 'currency'],
}

// ===== 杂项（特殊功能物品） =====

const watch: MiscItem = {
  id: 'watch',
  name: '老旧的腕表',
  description: '一块还能正常走时的机械腕表，表盘上显示着当前时间',
  category: ItemCategory.MISC,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_watch',
  weight: 0.1,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 15,
  isKeyItem: false,
  isCombinable: false,
  tags: ['tool', 'show_time'],
}

const sanMeter: MiscItem = {
  id: 'san_meter',
  name: '精神检测仪',
  description: '一个能够检测精神状态的简易装置，指针显示着当前的理智水平',
  category: ItemCategory.MISC,
  rarity: ItemRarity.UNCOMMON,
  iconId: 'icon_san_meter',
  weight: 0.2,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 30,
  isKeyItem: false,
  isCombinable: false,
  tags: ['tool', 'show_san'],
}

// ===== 文档 =====

const journalFragment: DocumentItem = {
  id: 'journal_fragment',
  name: '研究日志残页',
  description: '一份被撕下的研究日志，上面记录着令人不安的内容',
  category: ItemCategory.DOCUMENT,
  rarity: ItemRarity.UNCOMMON,
  iconId: 'icon_journal_fragment',
  weight: 0.1,
  maxStackSize: 1,
  isSellable: false,
  basePrice: 0,
  isKeyItem: true,
  content:
    '...孢子扩散速度远超预期。实验体#7在48小时内完成了全身变异，但它依然保持着理智。它说它能听到孢子说话。我们必须...',
  onReadEffects: [],
  isConsumedOnRead: false,
  author: 'Dr.██████',
  tags: ['document', 'lore', 'key'],
}

// ===== 蓝图/配方 =====

const campfireBlueprint: RecipeItem = {
  id: 'campfire_blueprint',
  name: '篝火建造图',
  description: '记录了如何搭建一个简易篝火',
  category: ItemCategory.RECIPE,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_blueprint',
  weight: 0.1,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 10,
  isKeyItem: false,
  recipeType: RecipeType.BUILD,
  unlocksRecipeId: ['build_campfire'],
  tags: ['recipe', 'blueprint'],
}

// config/items.ts 中新增以下物品

// ===== 损坏的武器 =====

const brokenRustySword: WeaponItem = {
  id: 'broken_rusty_sword',
  name: '断裂的铁剑',
  description: '这把铁剑已经断成两截，完全无法使用。也许可以回炉重铸',
  category: ItemCategory.WEAPON,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_broken_rusty_sword',
  weight: 1.5,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 5,
  isKeyItem: false,
  weaponTypeId: 'sword',
  durability: {
    maxDurability: 0,
    initialDurability: 0,
    isRepairable: true,
    repairMaterials: [
      { itemId: 'iron_scrap', quantity: 4 },
      { itemId: 'wood', quantity: 1 },
    ],
    repairWorkbenchLevel: 1,
    destroyOnBreak: false,
  },
  equipmentSlot: EquipmentSlot.WEAPON,
  weaponStats: {
    baseDamage: 2,
    damageTypeId: 'slash',
    damageVariance: 0.3,
    accuracyModifier: -0.3,
    criticalChanceModifier: 0,
    criticalMultiplier: 1.0,
  },
  isDualWieldable: false,
  isTwoHanded: false,
  attributeModifiers: [],
  grantedSkillIds: [],
  tags: ['weapon', 'metal', 'sword', 'broken'],
}

const spoiledFood: ConsumableItem = {
  id: 'spoiled_food',
  name: '腐坏的食物',
  description: '这团东西已经看不出原本是什么了，散发着令人作呕的气味',
  category: ItemCategory.CONSUMABLE,
  rarity: ItemRarity.COMMON,
  iconId: 'icon_spoiled_food',
  weight: 0.3,
  maxStackSize: 5,
  isSellable: false,
  basePrice: 0,
  isKeyItem: false,
  consumableType: ConsumableType.FOOD,
  perishMinutes: 0,
  effects: [
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.SATIETY,
        operation: AttributeOperation.ADD,
        value: 5,
      },
      probability: 1,
      description: '恢复5点饱食度',
    },
    {
      effect: {
        type: EffectType.STATUS,
        statusId: 'poisoned',
        apply: true,
        duration: 30,
        durationUnit: 'minute',
      },
      probability: 0.7,
      description: '有概率中毒',
    },
    {
      effect: {
        type: EffectType.ATTRIBUTE,
        attribute: AttributeType.SAN,
        operation: AttributeOperation.SUBTRACT,
        value: 5,
      },
      probability: 1,
      description: '让你感到恶心',
    },
  ],
  useText: '你强忍着恶心吃下了这团东西',
  tags: ['consumable', 'food', 'spoiled'],
}

const chitinArmor: ArmorItem = {
  id: 'chitin_armor',
  name: '甲壳护甲',
  description: '用变异螃蟹的甲壳精心制作的护甲，轻便且坚固',
  category: ItemCategory.ARMOR,
  rarity: ItemRarity.UNCOMMON,
  iconId: 'icon_chitin_armor',
  weight: 3.5,
  maxStackSize: 1,
  isSellable: true,
  basePrice: 60,
  isKeyItem: false,
  durability: {
    maxDurability: 80,
    initialDurability: 80,
    isRepairable: true,
    repairMaterials: [{ itemId: 'chitin_shell', quantity: 1 }],
    repairWorkbenchLevel: 1,
    destroyOnBreak: true,
  },
  equipmentSlot: EquipmentSlot.BODY,
  defenseStats: {
    slashDefense: 4,
    bluntDefense: 2,
    rangedDefense: 2,
    poisonDefense: 1,
    fireDefense: 0,
  },
  attributeModifiers: [],
  temperatureResistance: {
    lowModifier: 0,
    highModifier: -2,
  },
  tags: ['armor', 'chitin'],
}

export const itemRegistry: ItemRegistry = {
  items: {
    rusty_sword: rustySword,
    broken_rusty_sword: brokenRustySword,
    makeshift_bow: makeshiftBow,
    chitin_armor: chitinArmor,
    bandage,
    cooked_crab: cookedCrab,
    spoiled_food: spoiledFood,
    strength_potion: strengthPotion,
    wood: wood,
    stone: stone,
    one_note: oneNote,
    crab_meat: crabMeat,
    chitin_shell: chitinShell,
    cloth_scrap: clothScrap,
    iron_scrap: ironScrap,
    gold_coin: goldCoin,
    journal_fragment: journalFragment,
    campfire_blueprint: campfireBlueprint,
    watch,
    san_meter: sanMeter,
  },
}
