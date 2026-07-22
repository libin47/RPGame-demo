// event.ts - 事件数据结构

import type { Condition } from './effect'
import type { EffectResult } from './effect'
import type { FlagValue } from './flag'

// ============================================================
// 事件配置
// ============================================================

/**
 * 事件配置
 * 事件是游戏内容的核心载体，负责：
 * - 展示叙事文本（含根据条件变化的文本变体）
 * - 提供选项供玩家选择
 * - 通过选项结果驱动：属性变动、物品获得、战斗触发、CG播放、场景切换、标志位设置等
 *
 * 事件由多帧（EventFrame）组成，每帧可包含多个选项。
 * 事件总是以某个结束型选项终止（结束事件、进入战斗、切换场景、播放CG等）。
 */
export interface GameEvent {
  /** 事件唯一ID */
  id: string
  /** 事件名称（开发者可见） */
  name: string
  /** 事件备注 */
  notes?: string

  /** 事件帧序列（至少一帧） */
  frames: EventFrame[]

  /** 事件触发条件（不满足则无法进入此事件） */
  triggerCondition?: Condition

  /** 事件开始时自动触发的效果（进入事件时立即执行） */
  onEnterEffects?: EffectResult[]

  /** 事件类型 */
  eventType: EventType

  /** 事件是否可重复触发（false表示只能触发一次） */
  isRepeatable: boolean
  /** 触发后设置的标志位（用于追踪是否已触发过） */
  triggeredFlag?: string

  /** 事件是否可被中断（如战斗中逃跑返回事件） */
  isInterruptible: boolean

  /** 事件图片（覆盖场景图片） */
  backgroundImage?: string
  /** 事件图片变体（根据条件显示不同图片） */
  backgroundImageVariations?: EventImageVariation[]
}

/**
 * 事件类型
 */
export enum EventType {
  /** 普通事件 */
  NORMAL = 'normal',
  /** 战斗事件（可直接进入战斗） */
  BATTLE = 'battle',
  /** 交易事件 */
  TRADE = 'trade',
  /** CG事件（播放CG） */
  CG = 'cg',
  /** 遭遇事件（移动途中触发的随机事件） */
  ENCOUNTER = 'encounter',
  /** 梦境事件（低SAN值时触发） */
  DREAM = 'dream',
  /** 特殊事件（结局、关键剧情等） */
  SPECIAL = 'special',
}

/**
 * 事件图片变体
 */
export interface EventImageVariation {
  /** 图片资源ID */
  imageId: string
  /** 显示条件 */
  condition: Condition
  /** 过渡效果 */
  transitionEffect?: 'fade' | 'glitch' | 'instant'
}

// ============================================================
// 事件帧
// ============================================================

/**
 * 事件帧
 * 事件的每个步骤/页面，包含描述文本和选项列表。
 * 当玩家选择某个选项后，根据选项结果跳转到下一帧或结束事件。
 */
export interface EventFrame {
  /** 帧ID（事件内唯一） */
  id: string
  /** 帧序号（用于排序） */
  order: number

  /** 帧文本（展示给玩家的内容，支持换行） */
  text: string
  /** 文本变体（根据条件显示不同文本，如SAN值影响叙事） */
  textVariations?: EventTextVariation[]

  /** 帧图片（可选，覆盖事件的背景图） */
  imageId?: string

  /** 帧选项列表 */
  options: EventOption[]

  /** 帧显示条件（满足条件时才显示此帧，否则跳过） */
  displayCondition?: Condition

  /** 进入此帧时自动触发的效果 */
  onEnterEffects?: EffectResult[]
  /** 离开此帧时自动触发的效果 */
  onExitEffects?: EffectResult[]
}

/**
 * 事件文本变体
 */
export interface EventTextVariation {
  /** 变体文本 */
  content: string
  /** 显示条件 */
  condition: Condition
}

// ============================================================
// 事件选项
// ============================================================

/**
 * 事件选项
 * 玩家在事件帧中可点击的选项按钮。
 * 选项可以：
 * - 跳转到同一事件的另一个帧（继续叙事）
 * - 结束事件（返回场景）
 * - 触发战斗
 * - 播放CG
 * - 进入交易界面
 * - 切换场景
 * - 触发其他事件
 */
export interface EventOption {
  /** 选项ID（帧内唯一） */
  id: string

  /** 选项文本（显示在按钮上） */
  text: string
  /** 文本变体（根据条件显示不同文本） */
  textVariations?: EventTextVariation[]

  /** 选项描述（可选，长按或tooltip显示） */
  description?: string

  /** 选项显示条件（满足条件时才显示此选项） */
  displayCondition?: Condition
  /** 选项可用条件（满足条件时才可点击，不满足时灰显） */
  availableCondition?: Condition
  /** 不可用时的提示文本 */
  unavailableTooltip?: string

  /** 选项样式 */
  optionStyle?: EventOptionStyle

  /** 选择此选项消耗的资源 */
  costs?: EventOptionCost[]

  /** 选项结果（选择后发生的事情） */
  result: EventOptionResult

  /** 选项优先级（数字越大显示越靠前） */
  displayPriority?: number

  /** 是否需要确认弹窗（防止误操作重要选项） */
  requiresConfirmation?: boolean
  /** 确认弹窗文本 */
  confirmationText?: string

  /** 此选项是否只能选择一次（再次进入此帧时灰显或隐藏） */
  isOneTime?: boolean
  /** 选择后设置的标志位 */
  selectedFlag?: string

  /** 选择后选项文本的变化（如"敲门"→"再次敲门"） */
  textAfterSelected?: string
}

/**
 * 事件选项样式
 */
export enum EventOptionStyle {
  /** 默认样式 */
  DEFAULT = 'default',
  /** 危险操作（红色，如攻击、跳崖等） */
  DANGER = 'danger',
  /** 特殊/关键操作（金色/高亮） */
  SPECIAL = 'special',
  /** 隐藏选项（满足条件才显示，显示时可能是半透明或特殊效果） */
  HIDDEN = 'hidden',
  /** 理智相关选项（低SAN值下特有样式） */
  MADNESS = 'madness',
}

/**
 * 事件选项消耗
 */
export interface EventOptionCost {
  /** 消耗类型 */
  costType: EventOptionCostType
  /** 消耗值 */
  value: number
  /** 消耗的物品ID（costType为ITEM时使用） */
  itemId?: string
  /** 消耗的物品数量（costType为ITEM时使用） */
  itemQuantity?: number
}

/**
 * 事件选项消耗类型
 */
export enum EventOptionCostType {
  STAMINA = 'stamina',
  SATIETY = 'satiety',
  SAN = 'san',
  HP = 'hp',
  ITEM = 'item',
}

// ============================================================
// 事件选项结果
// ============================================================

/**
 * 事件选项结果（联合类型）
 * 选项的结果必为以下之一：
 * - 跳转到同一事件的另一个帧
 * - 结束事件返回场景
 * - 触发战斗
 * - 播放CG
 * - 进入交易
 * - 切换场景
 * - 触发另一个事件
 */
export type EventOptionResult =
  | NextFrameResult
  | EndEventResult
  | TriggerBattleResult
  | PlayCGResult
  | OpenTradeResult
  | SwitchSceneResult
  | TriggerEventResult

/**
 * 跳转到同一事件的另一个帧
 */
export interface NextFrameResult {
  type: 'nextFrame'
  /** 目标帧ID（同一事件内） */
  targetFrameId: string
  /** 执行的效果列表 */
  effects?: EffectResult[]
  /** 设置标志位 */
  setFlags?: Record<string, FlagValue>
}

/**
 * 结束事件，返回场景
 */
export interface EndEventResult {
  type: 'endEvent'
  /** 执行的效果列表 */
  effects?: EffectResult[]
  /** 设置标志位 */
  setFlags?: Record<string, FlagValue>
  /** 返回场景后显示的文字（可选，如"你离开了小屋"） */
  exitText?: string
}

/**
 * 触发战斗
 */
export interface TriggerBattleResult {
  type: 'triggerBattle'
  /** 敌人配置ID */
  enemyId: string[]
  /** 战斗胜利后跳转的帧ID（同一事件内） */
  victoryFrameId?: string
  /** 战斗失败后跳转的帧ID（不填则战斗失败进入结局判定） */
  defeatFrameId?: string
  /** 战斗逃跑后跳转的帧ID（不填则逃跑后返回场景） */
  escapeFrameId?: string
  /** 是否可逃跑 */
  canEscape?: boolean
  /** 战前执行的效果列表 */
  effects?: EffectResult[]
  /** 设置标志位 */
  setFlags?: Record<string, FlagValue>
  /** 是否有初见加成（初见时逃跑概率翻倍） */
  firstEncounterBonus?: boolean
}

/**
 * 播放CG
 */
export interface PlayCGResult {
  type: 'playCG'
  /** CG配置ID */
  cgId: string
  /** CG结束后跳转的帧ID（不填则CG结束后返回场景） */
  returnFrameId?: string
  /** 执行的效果列表 */
  effects?: EffectResult[]
  /** 设置标志位 */
  setFlags?: Record<string, FlagValue>
}

/**
 * 进入交易界面
 */
export interface OpenTradeResult {
  type: 'openTrade'
  /** 交易对象ID */
  traderId: string
  /** 交易结束后跳转的帧ID（不填则交易结束后返回场景） */
  returnFrameId?: string
  /** 执行的效果列表 */
  effects?: EffectResult[]
  /** 设置标志位 */
  setFlags?: Record<string, FlagValue>
}

/**
 * 切换场景
 */
export interface SwitchSceneResult {
  type: 'switchScene'
  /** 目标场景ID */
  sceneId: string
  /** 目标子场景ID（可选） */
  subSceneId?: string
  /** 执行的效果列表 */
  effects?: EffectResult[]
  /** 设置标志位 */
  setFlags?: Record<string, FlagValue>
  /** 进入新场景后显示的文字（可选） */
  enterText?: string
}

/**
 * 触发另一个事件
 */
export interface TriggerEventResult {
  type: 'triggerEvent'
  /** 目标事件ID */
  eventId: string
  /** 目标事件结束后跳转的帧ID（不填则返回场景） */
  returnFrameId?: string
  /** 执行的效果列表 */
  effects?: EffectResult[]
  /** 设置标志位 */
  setFlags?: Record<string, FlagValue>
}

// ============================================================
// 事件注册表
// ============================================================

/**
 * 事件注册表（全局事件配置汇总）
 */
export interface EventRegistry {
  /** 所有事件配置，按ID索引 */
  events: Record<string, GameEvent>
  /** 按类型分组的事件ID列表 */
  eventsByType: Record<EventType, string[]>
}
