// recipe.ts - 配方基础数据结构

import type { Condition } from './effect'

// ============================================================
// 配方基础类型（共用）
// ============================================================

/**
 * 配方类型枚举
 */
export enum RecipeType {
  /** 制作（工作台系统） */
  CRAFT = 'craft',
  /** 烹饪（火堆/厨房系统） */
  COOK = 'cook',
  /** 建造（基地系统） */
  BUILD = 'build',
}

// ============================================================
// 所需材料
// ============================================================

/**
 * 所需材料
 */
export interface RequiredMaterial {
  /** 物品ID */
  itemId: string
  /** 所需数量 */
  quantity: number
  /** 是否消耗（某些配方中材料作为工具使用，不消耗） */
  isConsumed: boolean
  /** 是否接受替代品（如"任意木材"） */
  acceptSubstitutes?: string[]
}

// ============================================================
// 所需条件
// ============================================================

/**
 * 配方所需条件
 */
export interface RecipeRequirements {
  /** 所需生存技能等级 */
  skillRequirements?: SkillRequirement[]

  /** 所需基础属性 */
  attributeRequirements?: AttributeRequirement[]

  /** 所需设备ID（如工作台、火堆、铁砧等） */
  requiredDeviceId?: string
  /** 所需设备等级 */
  requiredDeviceLevel?: number

  /** 所需时间（游戏内分钟数） */
  timeMinutes: number
}

/**
 * 技能等级要求
 */
export interface SkillRequirement {
  /** 技能ID */
  skillId: string
  /** 最低等级 */
  minLevel: number
}

/**
 * 基础属性要求
 */
export interface AttributeRequirement {
  /** 属性类型 */
  attribute: 'strength' | 'agility' | 'intelligence' | 'constitution'
  /** 最低值 */
  minValue: number
}

// ============================================================
// 消耗
// ============================================================

/**
 * 配方消耗（玩家生存属性）
 */
export interface RecipeCost {
  /** 消耗类型 */
  costType: RecipeCostType
  /** 消耗值 */
  value: number
  /** 是否受玩家属性/技能系数影响 */
  affectedByCoefficient: boolean
}

/**
 * 配方消耗类型
 */
export enum RecipeCostType {
  STAMINA = 'stamina',
  SATIETY = 'satiety',
  SAN = 'san',
  HP = 'hp',
}

// ============================================================
// 产物
// ============================================================

/**
 * 配方产物
 */
export interface RecipeProduct {
  /** 产物物品ID */
  itemId: string
  /** 基础产出数量 */
  baseQuantity: number
}

// ============================================================
// 基础配方接口
// ============================================================

/**
 * 基础配方配置（所有配方类型的公共字段）
 */
export interface BaseRecipe {
  /** 配方唯一ID */
  id: string
  /** 配方名称（显示用） */
  name: string
  /** 配方备注（开发者可见） */
  notes?: string

  /** 配方类型 */
  recipeType: RecipeType

  /** 配方图标资源ID（通常使用产物的图标） */
  iconId?: string

  /** 解锁条件（蓝图物品ID、事件标志位、技能等级等）（仅文档/编辑器展示用途，游戏逻辑不读取此字段） */
  unlockCondition?: Condition

  /** 解锁条件描述（显示给玩家的提示，如"需要获得铁匠蓝图"） */
  unlockHint?: string

  /** 所需材料 */
  materials: RequiredMaterial[]

  /** 所需条件 */
  requirements: RecipeRequirements

  /** 执行消耗 */
  costs: RecipeCost[]

  /** 产物 */
  products: RecipeProduct[]

  /** 是否可以重复制作/烹饪（建造通常为一次性） */
  isRepeatable: boolean
}

export interface RecipeRegistry {
  recipes: Record<string, BaseRecipe>
}
