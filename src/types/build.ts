// build.ts - 建造配方数据结构

import type { BaseRecipe, RequiredMaterial, RecipeRequirements, RecipeCost, RecipeProduct } from './recipe'
import type { RecipeType } from './recipe'
import type { EffectResult } from './effect'
import type { Condition } from './effect'

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

  /** 建造所需空间（占几格，用于基地空间管理，-1表示不限制） */
  spaceRequired: number

  /** 是否可以拆除 */
  isDeconstructable: boolean
  /** 拆除返还材料比例（0-1） */
  deconstructionReturnRatio: number

  /** 建筑是否可以被敌人攻击/摧毁 */
  isDestructible: boolean
  /** 建筑耐久度（被摧毁前可承受的攻击次数或伤害值） */
  durability?: number

  /** 建造完成后产生的持续效果（如床铺提供休息加成） */
  passiveEffects?: EffectResult[]

  /** 建筑提供的交互功能（建好后场景中出现的新交互） */
  providedInteractions?: BuildProvidedInteraction[]

  /** 建筑外观（在地图/场景中显示的图标） */
  visualConfig?: BuildVisualConfig
}

/**
 * 建造类型
 */
export enum BuildCategory {
  /** 防御建筑（墙壁、栅栏、陷阱） */
  DEFENSE = 'defense',
  /** 生产建筑（田地、集雨器、养殖场） */
  PRODUCTION = 'production',
  /** 储存建筑（箱子、仓库、冰箱） */
  STORAGE = 'storage',
  /** 生活建筑（床、椅子、桌子） */
  LIVING = 'living',
  /** 制作建筑（工作台、铁砧、厨房） */
  CRAFTING_STATION = 'craftingStation',
  /** 照明建筑（火把、路灯、篝火） */
  LIGHTING = 'lighting',
  /** 装饰建筑 */
  DECORATION = 'decoration',
  /** 基础设施（地板、屋顶、道路） */
  INFRASTRUCTURE = 'infrastructure',
  /** 祭坛/仪式建筑 */
  RITUAL = 'ritual',
}

/**
 * 建造产物
 */
export interface BuildResult {
  /** 建筑实体ID（用于场景中标识此建筑） */
  buildingId: string
  /** 建筑名称（显示用） */
  buildingName: string
  /** 建筑描述 */
  buildingDescription: string
  /** 建筑类型 */
  buildingType: BuildCategory
  /** 建筑尺寸（占几格宽*几格高，用于场景布局） */
  size: {
    width: number
    height: number
  }
  /** 建筑是否可升级 */
  isUpgradable: boolean
  /** 升级目标配方ID列表 */
  upgradeRecipeIds?: string[]
  /** 同一类型的建筑是否只能建一个 */
  isUnique: boolean
}

/**
 * 建筑提供的交互
 */
export interface BuildProvidedInteraction {
  /** 交互ID（对应场景交互ID或新生成的交互） */
  interactionId: string
  /** 交互名称（按钮显示文本） */
  interactionName: string
  /** 交互类型 */
  interactionType: 'craft' | 'cook' | 'rest' | 'store' | 'collect' | 'repair' | 'special'
  /** 交互参数 */
  params?: Record<string, unknown>
  /** 交互显示条件 */
  displayCondition?: Condition
}

/**
 * 建筑外观配置
 */
export interface BuildVisualConfig {
  /** 建筑完整状态图标资源ID */
  intactImageId: string
  /** 建筑损坏状态图标资源ID */
  damagedImageId?: string
  /** 建筑被摧毁状态图标资源ID */
  destroyedImageId?: string
  /** 建筑占位图标（建造中） */
  constructionImageId?: string
  /** 动画效果ID */
  animationId?: string
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
  /** 按建造类型分组 */
  recipesByCategory: Record<BuildCategory, string[]>
  /** 建筑前置依赖映射（建筑ID -> 依赖它的建筑配方ID列表） */
  buildingDependencyMap: Record<string, string[]>
  /** 技能等级解锁映射 */
  skillLevelUnlocks: Record<string, Record<number, string[]>>
}