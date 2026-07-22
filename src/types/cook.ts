// cook.ts - 烹饪配方数据结构

import type {
  BaseRecipe,
  RequiredMaterial,
  RecipeRequirements,
  RecipeCost,
  RecipeProduct,
} from './recipe'
import type { RecipeType } from './recipe'

// ============================================================
// 烹饪配方
// ============================================================

/**
 * 烹饪配方配置
 * 在火堆/厨房等加热设备上进行的食物烹饪。
 * 例如：烤肉、炖汤、烘焙面包等。
 */
export interface CookRecipe extends BaseRecipe {
  recipeType: RecipeType.COOK

  /** 烹饪类型细分 */
  cookMode: CookMode
  /** 所需设备等级 */
  requiredDeviceLevel: number

  /** 烹饪时间（游戏内分钟数，覆写 requirements.timeMinutes 用于烹饪系统特有计算） */
  cookTimeMinutes: number

  /** 烹饪经验奖励 */
  experienceReward: CookExperienceReward

  /** 烹饪产物品质 */
  qualityLevels?: CookQualityLevel[]
}

/**
 * 烹饪类型
 */
export enum CookMode {
  /** 即食 */
  COOK = 'cook',
  /** 酿造 */
  BREW = 'brew',
}

/**
 * 烹饪经验奖励
 */
export interface CookExperienceReward {
  /** 技能ID（通常为cooking） */
  skillId: string
  /** 每次烹饪获得的经验 */
  expPerCook: number
  /** 完美烹饪额外经验 */
  perfectBonusExp: number
  /** 首次烹饪此配方额外经验 */
  firstTimeBonusExp: number
}

/**
 * 烹饪品质等级
 * 根据技能等级和随机因素，烹饪可能产出不同品质的食物
 */
export interface CookQualityLevel {
  /** 品质等级（0=失败，1=普通，2=良好，3=完美） */
  level: number
  /** 品质名称，描述品质特征，例如完满的烹饪、普通烹饪等 */
  name: string
  /** 对应产出的物品ID（不同品质可能是不同物品） */
  productItemId?: string
  /** 达到此品质所需的最低技能等级 */
  minSkillLevel: number
  /** 此品质的概率权重（与技能等级相关，高技能等级高权重） */
  weight: number
}

// ============================================================
// 烹饪配方注册表
// ============================================================

/**
 * 烹饪配方注册表
 */
export interface CookRecipeRegistry {
  recipes: Record<string, CookRecipe>
}
