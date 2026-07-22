// item.ts - 物品数据结构

import type { Condition } from './effect'
import type { EffectResult } from './effect'
import type { AttributeType } from './effect'
import type { RecipeType } from './recipe'
// ============================================================
// 基础标识类型
// ============================================================

/** 物品类别 */
export enum ItemCategory {
  /** 武器 */
  WEAPON = 'weapon',
  /** 防具（身体/头部/手部等装备） */
  ARMOR = 'armor',
  /** 工具（斧、镐、火把等非武器功能装备） */
  TOOL = 'tool',
  /** 消耗品（食物、药品、一次性道具） */
  CONSUMABLE = 'consumable',
  /** 材料（木材、石头、草药等） */
  MATERIAL = 'material',
  /** 贵重物品（金币、宝石等，主要用于交易） */
  VALUABLE = 'valuable',
  /** 文档（信件、日记、研究笔记等可阅读物品） */
  DOCUMENT = 'document',
  /** 蓝图/配方（解锁制作、建造、烹饪配方） */
  RECIPE = 'recipe',
  /** 杂项（不属于以上分类的物品） */
  MISC = 'misc',
}

/** 物品稀有度 */
export enum ItemRarity {
  /** 普通（白色） */
  COMMON = 'common',
  /** 不凡（绿色） */
  UNCOMMON = 'uncommon',
  /** 稀有（蓝色） */
  RARE = 'rare',
  /** 史诗（紫色） */
  EPIC = 'epic',
  /** 传说（橙色） */
  LEGENDARY = 'legendary',
  /** 神话（红色/暗金色，关联克苏鲁元素） */
  MYTHIC = 'mythic',
}

// ============================================================
// 物品基础定义
// ============================================================

/**
 * 物品基础配置（所有物品的公共字段）
 */
export interface BaseItem {
  /** 物品唯一ID */
  id: string
  /** 物品名称（显示用） */
  name: string
  /** 物品备注（开发者可见） */
  notes?: string
  /** 物品描述（显示给玩家的说明文本） */
  description: string
  /** 描述变体（根据条件显示不同描述，如SAN值影响对物品的认知） */
  descriptionVariations?: ItemDescriptionVariation[]

  /** 物品类别 */
  category: ItemCategory
  /** 物品稀有度 */
  rarity: ItemRarity

  /** 物品图标资源ID */
  iconId: string

  /** 单个物品重量（kg） */
  weight: number
  /** 物品最大堆叠数量（1表示不可堆叠，-1表示无限堆叠） */
  maxStackSize: number

  /** 是否可在交易中出售 */
  isSellable: boolean
  /** 基础售价（货币单位） */
  basePrice: number

  /** 使用/装备条件 */
  useCondition?: Condition
  /** 条件不满足时的提示文本 */
  useConditionHint?: string

  /** 物品标签（用于过滤、分类、事件判定等） */
  tags?: string[]

  /** 是否为关键物品（关键物品不可丢弃、不可出售、不可销毁） */
  isKeyItem: boolean
}

/**
 * 物品描述变体
 * 根据条件（如SAN值）显示不同的物品描述
 * 例如：低SAN值下，普通肉干的描述可能变成"这块肉似乎在微微蠕动"
 */
export interface ItemDescriptionVariation {
  /** 变体描述文本 */
  description: string
  /** 显示条件 */
  condition: Condition
}

// ============================================================
// 耐久度系统
// ============================================================

/**
 * 耐久度配置（武器、防具、工具等可损耗物品使用）
 */
export interface DurabilityConfig {
  /** 最大耐久度 */
  maxDurability: number
  /** 初始耐久度（通常等于maxDurability） */
  initialDurability: number
  /** 是否可修理 */
  isRepairable: boolean
  /** 修理所需的材料及数量 */
  repairMaterials?: RepairMaterial[]
  /** 修理所需工作台等级（0表示徒手可修） */
  repairWorkbenchLevel?: number
  /** 耐久度归零后物品是否销毁（false则变为"损坏的XXX"状态，不可用但可修理） */
  destroyOnBreak: boolean
  /** 损坏后的替代物品ID（destroyOnBreak为false时生效） */
  brokenItemId?: string
}

/**
 * 修理材料
 */
export interface RepairMaterial {
  /** 材料物品ID */
  itemId: string
  /** 所需数量 */
  quantity: number
}

// ============================================================
// 武器
// ============================================================

/**
 * 武器配置
 */
export interface WeaponItem extends BaseItem {
  category: ItemCategory.WEAPON

  /** 武器类型ID（关联武器类型配置，如'sword'、'bow'、'spear'等） */
  weaponTypeId: string

  /** 耐久度配置 */
  durability: DurabilityConfig

  /** 装备槽位 */
  equipmentSlot: EquipmentSlot.WEAPON

  /** 武器基础属性 */
  weaponStats: WeaponStats

  /** 武器是否可双持（双持时可装备两把同类型武器） */
  isDualWieldable: boolean

  /** 是否为双手武器（双手武器占用两个武器槽位） */
  isTwoHanded: boolean

  /** 装备此武器时提供的属性修正 */
  attributeModifiers?: AttributeModifier[]

  /** 装备此武器时解锁的战斗技能ID列表 */
  grantedSkillIds?: string[]

  /** 装备此武器时提供的被动技能ID列表 */
  grantedPassiveIds?: string[]

  /** 使用条件（覆盖BaseItem的useCondition，可额外要求武器熟练度等） */
  proficiencyRequirement?: {
    weaponTypeId: string
    minLevel: number
  }
}

/**
 * 武器属性
 */
export interface WeaponStats {
  /** 基础伤害 */
  baseDamage: number
  /** 伤害类型ID（如'slash'、'pierce'、'blunt'等） */
  damageTypeId: string
  /** 伤害浮动范围（最终伤害 = baseDamage * (1 ± damageVariance)） */
  damageVariance: number

  /** 基础命中修正（加到命中计算中） */
  accuracyModifier: number
  /** 基础暴击率修正（0.1 = +10%暴击率） */
  criticalChanceModifier: number
  /** 暴击倍率（默认2.0，即暴击时伤害×2） */
  criticalMultiplier: number
}

// ============================================================
// 防具
// ============================================================

/**
 * 防具配置
 */
export interface ArmorItem extends BaseItem {
  category: ItemCategory.ARMOR

  /** 耐久度配置 */
  durability: DurabilityConfig

  /** 装备槽位 */
  equipmentSlot: ArmorSlot

  /** 防具提供的防御属性 */
  defenseStats: Record<string, number>

  /** 防具提供的属性修正 */
  attributeModifiers?: AttributeModifier[]

  /** 装备此防具时提供的被动技能ID列表 */
  grantedPassiveIds?: string[]

  /** 防具提供的温度抗性修正（影响温暖度计算中的适宜温度范围） */
  temperatureResistance?: {
    /** 低温适宜值修正（增加此值可耐受更冷环境） */
    lowModifier: number
    /** 高温适宜值修正（增加此值可耐受更热环境） */
    highModifier: number
  }
}

// ============================================================
// 工具
// ============================================================

/**
 * 工具配置（斧、镐、火把、钓鱼竿等非武器功能装备）
 */
export interface ToolItem extends BaseItem {
  category: ItemCategory.TOOL

  /** 耐久度配置（火把等消耗品可选填，无耐久则省略） */
  durability?: DurabilityConfig

  /** 工具类型ID（如'axe'、'pickaxe'、'torch'、'fishingRod'等） */
  toolTypeId: string

  /** 工具等级（影响采集效率、可采集资源等级等） */
  toolLevel: number
}

// ============================================================
// 消耗品
// ============================================================

/**
 * 消耗品配置（食物、药品、一次性道具）
 */
export interface ConsumableItem extends BaseItem {
  category: ItemCategory.CONSUMABLE

  /** 消耗品类型 */
  consumableType: ConsumableType

  /** 保质期（游戏内分钟数）0代表永久保质 */
  perishMinutes: number
  /** 过期后变质的产物物品ID（如"腐烂的鱼"，不填则超期后直接消失） */
  spoiledItemId?: string

  /** 使用消耗品后触发的效果列表 */
  effects: EffectResult[]

  /** 使用消耗品后可能施加的状态 */
  applyStatus?: ConsumableStatusEffect[]

  /** 是否可以多次使用（如某种药膏可以用3次） */
  usesRemaining?: number
  /** 使用完毕后是否留下容器（如喝完水留下空瓶） */
  remainingItemId?: string

  /** 使用时的文本描述（覆盖默认的"使用了XXX"） */
  useText?: string
  /** 使用文本变体 */
  useTextVariations?: ItemDescriptionVariation[]
}

/**
 * 消耗品类型
 */
export enum ConsumableType {
  /** 食物（恢复饱食度） */
  FOOD = 'food',
  /** 饮料（恢复口渴度/提供特殊效果） */
  DRINK = 'drink',
  /** 药品（恢复生命值/治疗状态） */
  MEDICINE = 'medicine',
  /** 一次性道具（照明弹、绳索等） */
  TOOL = 'consumableTool',
  /** 书籍（阅读后获得经验/解锁技能/触发事件） */
  BOOK = 'book',
  /** 特殊消耗品（仪式用品、注射剂等） */
  SPECIAL = 'special',
}

/**
 * 消耗品施加的状态效果
 */
export interface ConsumableStatusEffect {
  /** 状态ID */
  statusId: string
  /** 持续时间（游戏内分钟数，-1表示永久直到被移除） */
  durationMinutes: number
  /** 触发概率（0-1） */
  probability: number
}

// ============================================================
// 材料
// ============================================================

/**
 * 材料配置（木材、石头、草药、金属锭等）
 */
export interface MaterialItem extends BaseItem {
  category: ItemCategory.MATERIAL

  /** 材料类型（用于分类和配方匹配） */
  materialType: string
}

// ============================================================
// 贵重物品
// ============================================================

/**
 * 贵重物品配置（金币、宝石、艺术品等交易用物品）
 */
export interface ValuableItem extends BaseItem {
  category: ItemCategory.VALUABLE

  /** 实际售价倍率（最终售价 = basePrice * priceMultiplier） */
  priceMultiplier: number
}

// ============================================================
// 文档
// ============================================================

/**
 * 文档配置（信件、日记、研究笔记等可阅读物品）
 */
export interface DocumentItem extends BaseItem {
  category: ItemCategory.DOCUMENT

  /** 文档内容（纯文本，支持换行） */
  content: string
  /** 文档内容变体（根据条件显示不同内容，如SAN值影响阅读到的文字） */
  contentVariations?: DocumentContentVariation[]
  /** 阅读后触发的效果（如获得线索、解锁配方、触发事件等） */
  onReadEffects?: EffectResult[]
  /** 阅读后是否消耗此文档 */
  isConsumedOnRead: boolean
  /** 阅读文档是否需要特定条件（如语言能力） */
  readCondition?: Condition
  /** 文档作者/来源（显示用） */
  author?: string
}

/**
 * 文档内容变体
 */
export interface DocumentContentVariation {
  /** 变体内容 */
  content: string
  /** 显示条件 */
  condition: Condition
}

// ============================================================
// 蓝图/配方
// ============================================================

/**
 * 蓝图/配方配置
 */
export interface RecipeItem extends BaseItem {
  category: ItemCategory.RECIPE
  /** 配方类型 */
  recipeType: RecipeType
  /** 解锁的配方ID（关联制作表/建造表/烹饪表的配方ID） */
  unlocksRecipeId: string[]
}

// ============================================================
// 杂项
// ============================================================

/**
 * 杂项物品配置（不属于以上任何分类的物品）
 */
export interface MiscItem extends BaseItem {
  category: ItemCategory.MISC

  /** 是否可以与其他物品组合 */
  isCombinable: boolean
  /** 组合配方（组合目标物品ID -> 产物物品ID） */
  combineRecipes?: Record<string, string>
  /** 使用效果（如果可"使用"的话） */
  useEffects?: EffectResult[]
}

// ============================================================
// 联合类型
// ============================================================

/** 所有物品类型的联合 */
export type Item =
  | WeaponItem
  | ArmorItem
  | ToolItem
  | ConsumableItem
  | MaterialItem
  | ValuableItem
  | DocumentItem
  | RecipeItem
  | MiscItem

/** 可装备物品类型 */
export type EquippableItem = WeaponItem | ArmorItem

/** 可堆叠物品类型（排除装备和不可堆叠的消耗品） */
export type StackableItem = MaterialItem | ConsumableItem | ValuableItem | MiscItem

// ============================================================
// 装备槽位
// ============================================================

/**
 * 装备槽位枚举
 */
export enum EquipmentSlot {
  /** 主手武器 */
  WEAPON = 'weapon',
  /** 副手武器/盾牌 */
  OFF_HAND = 'offHand',
  /** 头部 */
  HEAD = 'head',
  /** 身体/躯干 */
  BODY = 'body',
  /** 手部 */
  HANDS = 'hands',
  /** 脚部 */
  FEET = 'feet',
  /** 背部（背包、披风等） */
  BACK = 'back',
  /** 颈部（护身符、项链等） */
  NECK = 'neck',
  /** 手指（戒指） */
  FINGER = 'finger',
}

/** 防具槽位（排除武器和工具） */
export type ArmorSlot =
  | EquipmentSlot.HEAD
  | EquipmentSlot.BODY
  | EquipmentSlot.HANDS
  | EquipmentSlot.FEET
  | EquipmentSlot.BACK
  | EquipmentSlot.NECK
  | EquipmentSlot.FINGER

// ============================================================
// 属性修正
// ============================================================

/**
 * 属性修正（装备、消耗品等对属性的加成）
 */
export interface AttributeModifier {
  /** 目标属性类型 */
  attribute: AttributeType
  /** 修正值（可为负数表示惩罚） */
  value: number
  /** 修正类型 */
  modifierType: 'add' | 'multiply'
  /** 如果是武器熟练度/技能等，指定具体子类型 */
  subType?: string
}

/**
 * 技能加成（工具对技能的加成）
 */
export interface SkillBonus {
  /** 技能ID */
  skillId: string
  /** 加成值 */
  bonus: number
}

// ============================================================
// 物品注册表
// ============================================================

/**
 * 物品注册表（全局物品配置汇总）
 */
export interface ItemRegistry {
  /** 所有物品配置，按ID索引 */
  items: Record<string, Item>
  /** 按类别分组的物品ID列表（便于快速查找） */
  itemsByCategory: Record<ItemCategory, string[]>
  /** 按标签分组的物品ID列表 */
  itemsByTag: Record<string, string[]>
}
