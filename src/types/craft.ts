// craft.ts - 制作配方数据结构

import type {
  BaseRecipe,
  RequiredMaterial,
  RecipeRequirements,
  RecipeCost,
  RecipeProduct,
} from './recipe'
import type { RecipeType } from './recipe'

// ============================================================
// 制作配方
// ============================================================

/**
 * 制作配方配置
 * 在工作台/设备上进行的物品制作。
 * 例如：制作木剑、制作绷带、制作箭矢等。
 */
export interface CraftRecipe extends BaseRecipe {
  recipeType: RecipeType.CRAFT

  /** 制作类型细分 */
  craftCategory: CraftCategory

  /** 所需设备等级（0=徒手，1=简易工作台，2=铁砧/高级工作台，3=精密设备等） */
  requiredDeviceLevel: number

  /** 制作经验奖励（完成时获得的生存技能经验） */
  experienceReward: CraftExperienceReward

  /** 最小制作数量（批量制作） */
  minCraftQuantity: number
  /** 最大制作数量（批量制作，-1=无上限，取决于材料） */
  maxCraftQuantity: number
  /** 批量制作时，后续每件额外消耗时间（分钟，用于计算批量总时间） */
  additionalTimePerItem: number
}

/**
 * 制作类型
 */
export enum CraftCategory {
  /** 武器 */
  WEAPON = 'weapon',
  /** 防具 */
  ARMOR = 'armor',
  /** 工具 */
  TOOL = 'tool',
  /** 弹药 */
  AMMUNITION = 'ammunition',
  /** 消耗品/药品 */
  CONSUMABLE = 'consumable',
  /** 建筑组件（用于建造的中间材料） */
  BUILDING_COMPONENT = 'buildingComponent',
  /** 容器 */
  CONTAINER = 'container',
  /** 陷阱 */
  TRAP = 'trap',
  /** 照明 */
  LIGHT = 'light',
  /** 其他 */
  OTHER = 'other',
}

/**
 * 制作经验奖励
 */
export interface CraftExperienceReward {
  /** 技能ID */
  skillId: string
  /** 每次制作获得的经验（批量制作时每件获得此经验） */
  expPerCraft: number
  /** 首次制作额外经验 */
  firstTimeBonusExp: number
}

// ============================================================
// 制作配方注册表
// ============================================================

/**
 * 制作配方注册表
 */
export interface CraftRecipeRegistry {
  /** 所有制作配方 */
  recipes: Record<string, CraftRecipe>
}
