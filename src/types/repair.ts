// repair.ts - 修复配方数据结构

import type { BaseRecipe, RequiredMaterial, RecipeRequirements, RecipeCost, RecipeProduct, RecipeFailureConfig } from './recipe'
import type { RecipeType } from './recipe'
import type { ItemId } from './item'

// ============================================================
// 修复配方
// ============================================================

/**
 * 修复配方配置
 * 修复损坏的武器、防具、工具等有耐久度的物品。
 * 例如：修复铁剑、修复皮甲、修复斧头等。
 */
export interface RepairRecipe extends BaseRecipe {
  recipeType: RecipeType.REPAIR

  /** 可修复的物品类别 */
  repairableCategory: RepairableCategory

  /** 具体可修复的物品ID列表（为空则修复该类别下所有物品） */
  repairableItemIds?: ItemId[]

  /** 修复所需最低物品稀有度（低于此稀有度的物品不可修复） */
  minRarityToRepair?: string

  /** 修复量 */
  repairAmount: RepairAmount

  /** 所需设备等级 */
  requiredDeviceLevel: number

  /** 修复是否需要消耗特定工具（如磨刀石） */
  requiredToolId?: ItemId
  /** 工具是否消耗 */
  toolIsConsumed: boolean

  /** 修复限制 */
  repairLimit?: RepairLimit

  /** 修复经验奖励 */
  experienceReward: RepairExperienceReward
}

/**
 * 可修复类别
 */
export enum RepairableCategory {
  /** 武器 */
  WEAPON = 'weapon',
  /** 防具 */
  ARMOR = 'armor',
  /** 工具 */
  TOOL = 'tool',
  /** 任何可修理物品 */
  ANY = 'any',
}

/**
 * 修复量配置
 */
export interface RepairAmount {
  /** 固定修复量 */
  fixedAmount?: number
  /** 按最大耐久百分比修复（0-1） */
  percentageAmount?: number
  /** 修复量是否受技能等级加成 */
  bonusPerSkillLevel?: {
    skillId: string
    /** 每级额外修复量 */
    bonusAmount: number
  }
}

/**
 * 修复限制
 */
export interface RepairLimit {
  /** 同一物品最多修复次数（-1=无限） */
  maxRepairCount: number
  /** 每次修复后最大耐久度衰减比例（0-1，如0.05表示每次修复后最大耐久降低5%） */
  maxDurabilityDegradationRatio: number
  /** 最低最大耐久度（不会低于此比例，0-1，如0.3表示最低降至原最大耐久的30%） */
  minMaxDurabilityRatio: number
}

/**
 * 修复经验奖励
 */
export interface RepairExperienceReward {
  /** 技能ID */
  skillId: string
  /** 每次修复获得的经验 */
  expPerRepair: number
  /** 修复量额外经验（每修复1点耐久获得的额外经验） */
  expPerDurabilityPoint: number
}

// ============================================================
// 修复配方注册表
// ============================================================

/**
 * 修复配方注册表
 */
export interface RepairRecipeRegistry {
  /** 所有修复配方 */
  recipes: Record<string, RepairRecipe>
  /** 按可修复类别分组 */
  recipesByCategory: Record<RepairableCategory, string[]>
  /** 技能等级解锁映射 */
  skillLevelUnlocks: Record<string, Record<number, string[]>>
}