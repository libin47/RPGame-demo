// build.ts - 建造配方数据结构

import type {
  BaseRecipe,
  RequiredMaterial,
  RecipeRequirements,
  RecipeCost,
  RecipeProduct,
} from './recipe'
import type { RecipeType } from './recipe'
import type { BuildResult } from './building'
import type { BuildCategory } from './building'


// ============================================================
// 建造配方
// ============================================================

/**
 * 建造配方配置
 * 在基地或临时营地中建造的建筑/设施。
 * 例如：建造木墙、建造工作台、建造田地、建造床铺等。
 */
export interface BuildRecipe extends BaseRecipe {
  recipeType: RecipeType.BUILD

  /** 建造类型细分 */
  buildCategory: BuildCategory

  /** 建造产物为建筑实体（建筑在场景中以交互对象形式存在，而非背包物品） */
  buildResult: BuildResult

  /** 建造前置条件（必须先建造某些建筑才能建造此建筑） */
  prerequisiteBuildings?: string[]
}





// ============================================================
// 建造配方注册表
// ============================================================

/**
 * 建造配方注册表
 */
export interface BuildRecipeRegistry {
  /** 所有建造配方 */
  recipes: Record<string, BuildRecipe>
}
