// ongoing.ts - 需要时间进行的配方数据结构

import type { Conditions } from './effect'
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
  conditions?: {
    /** 条件值 */
    conditions: Conditions
    /** 满足条件时的叠加倍率，例如1.5表示1.5倍的时间流逝，多个之间相加 */
    value: number
  }[]
  /** 是否显示进度条 */
  displayProgress?: boolean
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

// ============================================================
// 运行时进行中任务
// ============================================================

/**
 * 一个进行中的制作任务（运行时数据）
 * 存储在 player.progress.ongoingJobs[容器键] 中，容器键区分建筑与采集点。
 */
export interface OngoingJob {
  /** 所在容器的空位下标（0 起） */
  slotIndex: number
  /** 进行的配方ID */
  recipeId: string
  /** 已流逝的有效时间（分钟），达到 requirements.timeMinutes 即完成 */
  elapsedMinutes: number
  /** 制作状态 */
  status: 'crafting' | 'completed'
}
