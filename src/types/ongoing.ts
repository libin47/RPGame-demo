// ongoing.ts - 需要时间进行的配方数据结构

import type {
  BaseRecipe,
  RequiredMaterial,
  RecipeRequirements,
  RecipeCost,
  RecipeProduct,
} from './recipe'
import type { RecipeType } from './recipe'

// ============================================================
// 需要时间进行的配方
// ============================================================

/**
 * 需要时间进行的配方配置
 * 例如酿造、收集雨水、晒干等。
 */
export interface OngoingRecipe extends BaseRecipe {
  recipeType: RecipeType.ONGOING

  /** 类型细分 */
  ongoingMode: OngoingMode

  /** 满足条件时时间才会流逝 */
  condition?: number

  /** 执行产物品质 */
  qualityLevels?: OngoingQualityLevel[]
}

/**
 * 烹饪类型
 */
export enum OngoingMode {
  /** 晒干 */
  DRYING = 'drying',
  /** 酿造 */
  BREW = 'brew',
  /** 雨水 */
  RAIN = 'rain',
}

/**
 * 烹饪品质等级
 * 根据建筑等级和随机因素，烹饪可能产出不同品质的食物
 */
export interface OngoingQualityLevel {
  /** 品质等级（0=失败，1=普通，2=良好，3=完美） */
  level: number
  /** 品质名称，描述品质特征，例如完满的执行、普通执行等 */
  name: string
  /** 对应产出的物品（不同品质可能是不同物品） */
  productItems?: RecipeProduct[]
  /** 达到此品质所需的最低设备（建筑）等级 */
  minDeviceLevel: number
  /** 此品质的概率权重（与设备等级相关，高设备等级高权重） */
  weight: number
}

// ============================================================
// 执行配方注册表
// ============================================================

/**
 * 执行配方注册表
 */
export interface OngoingRecipeRegistry {
  recipes: Record<string, OngoingRecipe>
}
