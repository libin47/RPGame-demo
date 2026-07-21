// recipe.ts - 配方基础数据结构

import type { Condition } from './effect'
import type { SurvivalSkillId } from './skill'

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
  /** 修复（修理系统） */
  REPAIR = 'repair',
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

  /** 所需场景条件（如必须在基地、必须在河边等） */
  sceneCondition?: Condition

  /** 所需时间（游戏内分钟数） */
  timeMinutes: number
}

/**
 * 技能等级要求
 */
export interface SkillRequirement {
  /** 技能ID */
  skillId: SurvivalSkillId | string
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
  /** 数量是否受技能等级加成 */
  quantityBonusPerSkillLevel?: {
    skillId: SurvivalSkillId | string
    /** 每级增加的额外数量（可为小数，最终数量向下取整） */
    bonusPerLevel: number
  }
  /** 产物品质是否受技能等级影响（某些配方低技能产出普通品质，高技能产出稀有品质） */
  qualityBySkillLevel?: {
    skillId: SurvivalSkillId | string
    /** 品质等级映射：技能等级 -> 产出物品ID */
    qualityOverrides: Record<number, string>
  }
}

// ============================================================
// 失败机制
// ============================================================

/**
 * 配方失败配置（可选，适用于制作和修复）
 */
export interface RecipeFailureConfig {
  /** 基础失败概率（0-1） */
  baseFailureChance: number
  /** 技能等级降低失败概率（每级降低多少） */
  failureReductionPerSkillLevel: number
  /** 最低失败概率（不会低于此值） */
  minFailureChance: number

  /** 失败后的产物（如"损坏的材料"） */
  failureProduct?: {
    itemId: string
    quantity: number
  }
  /** 失败时是否消耗材料 */
  consumeMaterialsOnFailure: boolean
  /** 失败时消耗材料的比例（0-1，1为全部消耗） */
  materialLossRatio: number
  /** 失败描述文本 */
  failureText?: string
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
  /** 配方描述 */
  description: string

  /** 配方类型 */
  recipeType: RecipeType

  /** 配方所属分类（用于UI筛选，如"工具"、"武器"、"建筑"、"食物"等） */
  category: string

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

  /** 失败配置（不填则表示此配方不会失败） */
  failureConfig?: RecipeFailureConfig

  /** 是否可以重复制作/烹饪（建造通常为一次性） */
  isRepeatable: boolean

  /** 是否有制作/烹饪动画 */
  hasAnimation: boolean
  /** 动画资源ID */
  animationId?: string
}

export interface RecipeRegistry {
  recipes: Record<string, BaseRecipe>
  recipesByType: Record<RecipeType, string[]>
  
  /** 
   * 技能等级 → 配方ID列表 的反向索引
   * 用于技能升级时自动解锁对应配方
   * 例：{ "cooking": { 3: ["recipe_stew", "recipe_bread"], 5: ["recipe_feast"] } }
   */
  skillLevelUnlocks?: Record<string, Record<number, string[]>>
}