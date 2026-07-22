import type { EffectResult } from './effect'
import type { Condition } from './effect'
import type { RepairMaterial } from './item'



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
  descriptionConfig: BuildingDescriptionConfig
  // 是否纯装饰建筑
  isDecorativeOnly: boolean
  /** 建筑类型 */
  buildingType: BuildCategory
  /** 建筑是否可升级 */
  isUpgradable: boolean
  /** 升级目标配方ID列表 */
  upgradeRecipeIds?: string[]
  /** 同一类型的建筑是否只能建一个 */
  isUnique: boolean
  /** 是否可以拆除 */
  isDeconstructable: boolean
  /** 拆除返还材料比例（0-1） */
  deconstructionReturnRatio: number
  /** 建筑是否可以被敌人攻击/摧毁 */
  isDestructible: boolean
  /** 建筑耐久度（被摧毁前可承受的攻击次数或伤害值） */
  durability?: number
  /** 修复所需材料及数量 */
  repairMaterials?: RepairMaterial[]
  /** 建造完成后产生的持续效果（如床铺提供休息加成） */
  passiveEffects?: EffectResult[]
  /** 建筑提供的交互功能（建好后场景中出现的新交互） */
  providedInteractions?: BuildProvidedInteraction[]
  /** 建筑外观（在地图/场景中显示的图标） */
  visualConfig?: BuildVisualConfig
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
  interactionType: 'craft' | 'cook' | 'rest' | 'store' | 'collect' | 'repair' | 'special' | 'event'
  /** 交互参数 */
  params?: Record<string, unknown>
  /** 交互显示条件 */
  displayCondition?: Condition
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

export interface BuildRegistry {
  /** 所有建造配方 */
  build: Record<string, BuildResult>
}
