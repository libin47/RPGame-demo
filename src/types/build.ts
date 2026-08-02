// build.ts - 建造配方数据结构

import type {
  BaseRecipe,
  RequiredMaterial,
  RecipeRequirements,
  RecipeCost,
  RecipeProduct,
} from './recipe'
import type { RepairMaterial } from './item'
import type { Condition, EffectResult } from './effect'
import type { ButtonOption } from './option'

// ============================================================
// 建筑
// ============================================================

/**
 * 建造产物
 */
export interface Build {
  /** 建筑实体ID（用于场景中标识此建筑） */
  buildId: string
  // 子建筑配置（build作为一类建筑，一类建筑只允许一个，根据升级情况在子建筑中选择）
  subBuild: SubBuild[]
  // 默认子建筑ID
  defaultBuild: string
  // 默认是否需要锁起
  defaultLock?: boolean
  // 默认建造材料
  defaultItems: RepairMaterial[]
  // 默认建造花费
  defaultCost: RecipeCost[]
  defaultTime: number
  // 默认建造条件
  requirements?: RecipeRequirements
  // 默认建造建筑依赖
  prerequisiteBuildings?: BuildDependency[]
}

export interface SubBuild {
  /** 建筑实体ID */
  buildId: string
  /** 建筑名称 */
  buildName: string
  /** 建筑描述 */
  descriptionConfig: BuildingDescriptionConfig
  // 是否纯装饰建筑
  isDecorativeOnly?: boolean
  /** 建筑升级路径 */
  upgrade?: buildUpgrade[]
  /** 是否可以拆除 */
  isDeconstructable: boolean
  /** 拆除返还材料及数量 */
  deconstructionReturnItems?: RepairMaterial[]
  // 拆除时间（时间）
  deconstructionTime?: number
  // 拆除花费
  deconstructionCost?: RecipeCost[]
  /** 建筑是否可以被敌人攻击/摧毁 */
  isDestructible: boolean
  /** 建筑耐久度（被摧毁前可承受的攻击次数或伤害值） */
  durability?: number
  /** 修复所需材料及数量 */
  repairMaterials?: RepairMaterial[]
  /** 建造完成后产生的持续效果（如床铺提供休息加成） */
  passiveEffects?: EffectResult[]
  /** 建筑提供的交互功能（建好后场景中出现的新交互） */
  interactions?: buildOption[]
  /** 建筑外观（在地图/场景中显示的图标） */
  visualConfig?: BuildVisualConfig
  /** 建筑最大存储格数（仅store类型建筑有效，默认20） */
  maxStorageSlots?: number
}

export interface buildUpgrade {
  /** 升级后的建筑子ID */
  targetBuildId: string
  /** 所需升级材料及数量 */
  upgradeItems: RepairMaterial[]
  /** 升级条件 */
  requirements?: RecipeRequirements
  /** 升级花费（时间） */
  upgradeCost: RecipeCost[]
  /** 升级建筑依赖 */
  prerequisiteBuildings?: BuildDependency[]
}

/**
 * 建筑提供的交互
 */
export interface buildOption extends ButtonOption {
  /** 交互类型 */
  interactionType: 'craft' | 'cook' | 'rest' | 'store' | 'collect' | 'repair' | 'special' | 'event'
  /** 交互参数 */
  buildLevel?: number
  /** 事件：事件ID */
  eventId?: string
  /** 休息：休息场所的描述 */
  restDescription?: string
  /** 交互的最终描述 */
  description?: string
}

// 建筑描述配置
export interface BuildingDescriptionConfig {
  /** 建筑描述 */
  description: string
  /** 建筑描述（长） */
  longDescription?: string
  /** 建筑损坏描述 */
  damageDescription?: string
  /** 建筑损坏描述（长） */
  damageLongDescription?: string
  /** 建筑被摧毁描述 */
  destroyedDescription?: string
  /** 建筑被摧毁描述（长） */
  destroyedLongDescription?: string
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
}

// 建筑依赖
export interface BuildDependency {
  /** 建筑依赖ID */
  buildId: string
  /** 建筑依赖子建筑ID */
  buildSubId?: string
}

// ============================================================
// 建造配方注册表
// ============================================================

/**
 * 建造配方注册表
 */
export interface BuildRegistry {
  /** 所有建造配方 */
  builds: Record<string, Build>
}
