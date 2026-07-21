// cook.ts - 烹饪配方数据结构

import type { BaseRecipe, RequiredMaterial, RecipeRequirements, RecipeCost, RecipeProduct, RecipeFailureConfig } from './recipe'
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
  cookCategory: CookCategory

  /** 所需设备类型 */
  requiredDevice: CookDevice

  /** 烹饪所需温度等级（1=小火，2=中火，3=大火，部分高级烹饪需要控温） */
  requiredTemperatureLevel: number
  /** 烹饪时间（游戏内分钟数，覆写 requirements.timeMinutes 用于烹饪系统特有计算） */
  cookTimeMinutes: number
  /** 是否需要翻面/搅拌等中间操作（不操作则可能失败或降低品质） */
  requiresAttention: boolean
  /** 需要关注的回合数（requiresAttention为true时，每隔多少分钟需要操作一次） */
  attentionIntervalMinutes?: number

  /** 食材新鲜度影响（新鲜度低于此比例时，烹饪品质下降） */
  freshnessThreshold?: number

  /** 烹饪经验奖励 */
  experienceReward: CookExperienceReward

  /** 烹饪产物品质 */
  qualityLevels?: CookQualityLevel[]
}

/**
 * 烹饪类型
 */
export enum CookCategory {
  /** 烤制 */
  ROAST = 'roast',
  /** 炖煮 */
  STEW = 'stew',
  /** 烘焙 */
  BAKE = 'bake',
  /** 风干/腌制（无需加热） */
  PRESERVE = 'preserve',
  /** 酿造 */
  BREW = 'brew',
  /** 生食处理（切割摆盘等） */
  RAW_PREPARE = 'rawPrepare',
  /** 特殊仪式料理 */
  RITUAL = 'ritual',
}

/**
 * 烹饪设备
 */
export enum CookDevice {
  /** 无设备（可直接生食处理） */
  NONE = 'none',
  /** 篝火 */
  CAMPFIRE = 'campfire',
  /** 简易炉灶 */
  SIMPLE_STOVE = 'simpleStove',
  /** 厨房 */
  KITCHEN = 'kitchen',
  /** 熏制架 */
  SMOKER = 'smoker',
  /** 酿造桶 */
  BREWING_BARREL = 'brewingBarrel',
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
  /** 品质名称（显示用，如"焦糊的肉"、"美味的炖汤"） */
  name: string
  /** 对应产出的物品ID（不同品质可能是不同物品） */
  productItemId?: string
  /** 达到此品质所需的最低技能等级 */
  minSkillLevel: number
  /** 此品质的概率权重（与技能等级相关，高技能等级高权重） */
  weight: number
  /** 品质描述 */
  description?: string
}

// ============================================================
// 烹饪配方注册表
// ============================================================

/**
 * 烹饪配方注册表
 */
export interface CookRecipeRegistry {
  /** 所有烹饪配方 */
  recipes: Record<string, CookRecipe>
  /** 按设备类型分组 */
  recipesByDevice: Record<CookDevice, string[]>
  /** 按烹饪类型分组 */
  recipesByCategory: Record<CookCategory, string[]>
  /** 技能等级解锁映射 */
  skillLevelUnlocks: Record<string, Record<number, string[]>>
}