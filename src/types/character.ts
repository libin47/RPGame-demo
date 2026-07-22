// character.ts - 玩家职业/角色配置

import type { EffectResult } from './effect'
import type { AttributeType } from './effect'
import type { FlagValue } from './flag'

// ============================================================
// 职业定义
// ============================================================

/**
 * 职业配置
 * 定义玩家可选的初始职业，决定开局属性、物品、技能和独特能力。
 */
export interface CharacterClass {
  /** 职业唯一ID */
  id: string
  /** 职业名称（显示用） */
  name: string
  /** 职业备注（开发者可见） */
  notes?: string

  /** 职业描述（选择界面展示） */
  description: string
  /** 职业详细说明（展示在确认界面） */
  detailedDescription?: string

  /** 职业图标资源ID */
  iconId: string
  /** 职业立绘/插画资源ID（选择界面展示） */
  portraitImageId?: string

  /** 职业难度（1-5，在选择界面显示） */
  difficulty: number
  /** 职业难度描述（如"适合新手"、"挑战性极高"） */
  difficultyDescription?: string

  // ============================================================
  // 初始属性
  // ============================================================

  /** 初始基础属性 */
  initialAttributes: CharacterAttributes

  /** 初始生存属性（覆盖默认值） */
  initialSurvivalAttributes?: CharacterSurvivalAttributes

  // ============================================================
  // 初始物品
  // ============================================================

  /** 初始装备（直接装备在身上） */
  initialEquipment: CharacterInitialEquipment[]

  /** 初始背包物品 */
  initialInventory: CharacterInitialItem[]

  // ============================================================
  // 初始技能
  // ============================================================

  /** 初始已解锁的被动技能ID列表 */
  initialPassiveSkillIds: string[]

  /** 初始生存技能等级 */
  initialSurvivalSkillLevels: CharacterInitialSkillLevel[]

  /** 初始武器熟练度 */
  initialWeaponProficiency: CharacterInitialWeaponProficiency[]

  /** 初始已解锁的战斗技能ID列表 */
  initialBattleSkillIds?: string[]

  // ============================================================
  // 初始配方
  // ============================================================

  /** 初始已解锁的制作配方ID列表 */
  initialCraftRecipeIds: string[]
  /** 初始已解锁的烹饪配方ID列表 */
  initialCookRecipeIds: string[]
  /** 初始已解锁的建造配方ID列表 */
  initialBuildRecipeIds: string[]

  // ============================================================
  // 职业专属能力
  // ============================================================

  /** 职业专属被动加成（非技能，与职业绑定的特殊效果） */
  classBonuses: ClassBonus[]

  /** 职业专属配方（仅此职业可解锁的配方ID列表） */
  exclusiveRecipeIds?: string[]
  /** 职业专属技能（仅此职业可解锁的技能ID列表） */
  exclusiveSkillIds?: string[]

  // ============================================================
  // 初始剧情
  // ============================================================

  /** 初始标志位（开局时设置的标志位，用于引导不同职业的初始剧情） */
  initialFlags: Record<string, FlagValue>
}

// ============================================================
// 初始属性
// ============================================================

/**
 * 初始基础属性
 */
export interface CharacterAttributes {
  /** 力量（默认10，取值范围0-100） */
  strength: number
  /** 敏捷（默认10） */
  agility: number
  /** 智力（默认10） */
  intelligence: number
  /** 体质（默认10） */
  constitution: number
}

/**
 * 初始生存属性（仅需覆写的字段）
 */
export interface CharacterSurvivalAttributes {
  /** 生命值（默认由体质计算） */
  hp?: number
  /** 饱食度（默认100） */
  satiety?: number
  /** 体力值（默认100） */
  stamina?: number
  /** SAN值（默认100） */
  san?: number
}

// ============================================================
// 初始物品
// ============================================================

/**
 * 初始装备
 */
export interface CharacterInitialEquipment {
  /** 物品ID */
  itemId: string
  /** 装备槽位 */
  slot: string
  /** 初始耐久度（为空则使用物品默认耐久） */
  initialDurability?: number
}

/**
 * 初始背包物品
 */
export interface CharacterInitialItem {
  /** 物品ID */
  itemId: string
  /** 数量 */
  quantity: number
  /** 物品耐久度（如有耐久度系统，为空则使用默认值） */
  durability?: number
}

// ============================================================
// 初始技能
// ============================================================

/**
 * 初始生存技能等级
 */
export interface CharacterInitialSkillLevel {
  /** 技能ID */
  skillId: string
  /** 初始等级 */
  level: number
  /** 初始经验值（0为从该等级0经验开始） */
  exp?: number
}

/**
 * 初始武器熟练度
 */
export interface CharacterInitialWeaponProficiency {
  /** 武器类型ID */
  weaponTypeId: string
  /** 初始熟练度等级 */
  level: number
  /** 初始经验值 */
  exp?: number
}

// ============================================================
// 职业专属加成
// ============================================================

/**
 * 职业专属加成
 * 与职业绑定的永久被动效果，非技能系统管理，无法通过其他方式获得或移除。
 */
export interface ClassBonus {
  /** 加成ID */
  id: string
  /** 加成名称 */
  name: string
  /** 加成描述 */
  description: string

  /** 加成效果列表 */
  effects: EffectResult[]

  /** 直接属性修正（显示在属性面板） */
  attributeModifiers?: ClassAttributeModifier[]

  /** 触发条件（部分加成有条件触发，如"烹饪时有30%概率产出双倍"） */
  triggerCondition?: string
}

/**
 * 职业属性修正
 */
export interface ClassAttributeModifier {
  /** 属性类型 */
  attribute: AttributeType
  /** 修正值 */
  value: number
  /** 修正类型 */
  modifierType: 'add' | 'multiply'
  /** 子类型 */
  subType?: string
}

// ============================================================
// 职业注册表
// ============================================================

/**
 * 职业注册表
 */
export interface CharacterRegistry {
  /** 所有职业 */
  classes: Record<string, CharacterClass>
  /** 职业选择界面排序（职业ID列表，按此顺序展示） */
  selectionOrder: string[]
  /** 默认职业ID（快速开始时使用） */
  defaultClassId: string
}
