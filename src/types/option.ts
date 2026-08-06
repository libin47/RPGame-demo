import type { Conditions } from './effect'

/**
 * 交互按钮基类
 */
export interface ButtonOption {
  // 交互ID
  id: string
  // 交互名称（显示在按钮上）
  name: string | textVariation[]
  // 描述
  description?: string | textVariation[]
  // 描述标题
  descriptionTitle?: string | textVariation[]

  // ========== 显示控制 ==========
  // 显示条件（满足条件时此交互按钮才显示）
  displayCondition?: Conditions
  // 此交互是否只能使用一次
  isOneTime?: boolean
  // 使用后设置的标志位
  usedFlag?: string
  usedCountFlag?: string
  // 可用条件（满足条件时此按钮才可点击，不满足时灰显）
  availableCondition?: Conditions
  // 不可用时的提示文本
  unavailableTooltip?: string
  // 确认弹窗文本
  confirmationText?: string
  // ========== 消耗 ==========
  // 执行此交互消耗的资源
  costs?: OptionCost[]
  // 花费时间 分钟
  costTime?: number
  // 花费体力
  costEnergy?: number
  // 花费SAN值
  costSan?: number
  // 花费生命值
  costHp?: number

  // ========== 视觉效果 ==========
  // 背景图片
  backgroundImage?: string
  // 交互动画效果
  animationEffect?: 'none' | 'fade' | 'slide' | 'shake'
  // 按钮图标资源ID
  iconId?: string
  // 按钮样式
  buttonStyle?: 'default' | 'primary' | 'danger' | 'special' | 'hidden' | 'madness'
}

export interface textVariation {
  /** 变体文本 */
  content: string
  /** 显示条件 */
  displayCondition?: Conditions
}

/**
 * 交互消耗
 */
export interface OptionCost {
  // 消耗类型
  costType: OptionCostType
  // 消耗值（基础值，可能受系数影响）
  value: number
  // 消耗值是否受玩家体力消耗系数影响
  affectedByCoefficient?: boolean

  // ========== 物品消耗专用 ==========
  // 消耗的物品ID（仅当 costType 为 ITEM 时使用）
  itemId?: string
  // 消耗的物品数量（仅当 costType 为 ITEM 时使用，默认1）
  itemQuantity?: number
}

/**
 * 交互消耗类型
 */
export enum OptionCostType {
  // 体力
  STAMINA = 'stamina',
  // 饱食度
  SATIETY = 'satiety',
  // SAN值
  SAN = 'san',
  // 生命值
  HP = 'hp',
  // 物品（需配合 itemId 和 itemQuantity）
  ITEM = 'item',
}
