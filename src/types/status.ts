// status.ts - 异常状态数据结构

import type { EffectResult } from './effect'
import type { Condition } from './effect'
import type { AttributeType } from './effect'

// ============================================================
// 状态配置
// ============================================================

/**
 * 异常状态配置
 * 定义一种可施加到玩家或敌人身上的临时状态模板。
 * 状态的实例化（施加到具体目标、带剩余时间）是运行时数据。
 * 施加/移除通过 Effect 系统中的 StatusEffect 触发。
 */
export interface StatusConfig {
  /** 状态唯一ID */
  id: string
  /** 状态名称（显示用） */
  name: string
  /** 状态备注（开发者可见） */
  notes?: string
  /** 状态描述（显示给玩家） */
  description: string
  /** 状态描述变体（根据条件显示不同文本） */
  descriptionVariations?: StatusDescriptionVariation[]

  /** 状态图标资源ID */
  iconId: string

  // ============================================================
  // 状态分类
  // ============================================================

  /** 状态类型 */
  statusType: StatusType

  /** 状态标签（用于筛选、判定、互斥等） */
  tags: StatusTag[]

  // ============================================================
  // 时间与叠层
  // ============================================================

  /** 默认持续时间 */
  defaultDuration: StatusDuration

  /** 是否显示剩余时间 */
  showRemainingTime: boolean
  /** 是否在状态栏显示层数 */
  showStackCount: boolean

  /** 叠加规则 */
  stackingRule: StatusStackingRule

  // ============================================================
  // 效果
  // ============================================================

  /** 状态效果（每周期触发） */
  effects: StatusEffectConfig[]

  /** 状态施加时立即触发的效果（仅一次） */
  onApplyEffects?: EffectResult[]
  /** 状态移除时触发的效果（仅一次） */
  onRemoveEffects?: EffectResult[]

  // ============================================================
  // 显示与视听
  // ============================================================

  /** 视觉效果 */
  visualEffects?: StatusVisualEffect[]

  /** 状态音效资源ID（循环播放） */
  soundEffectId?: string
  /** 施加音效资源ID */
  applySoundId?: string
  /** 移除音效资源ID */
  removeSoundId?: string

  // ============================================================
  // 移除与互斥
  // ============================================================

  /** 可否被驱散（某些状态如诅咒不可被常规手段移除） */
  isDispellable: boolean
  /** 驱散所需物品ID列表（特定物品才能移除，为空则通用驱散即可） */
  dispelItemIds?: string[]

  /** 自动移除条件（满足条件时提前移除，如"玩家进入水中则移除燃烧"） */
  autoRemoveCondition?: Condition

  /** 互斥状态ID列表（施加此状态时自动移除列表中的状态） */
  exclusiveWith: string[]
  /** 被移除时的提示文本 */
  exclusiveRemovalText?: string

  // ============================================================
  // 死亡相关
  // ============================================================

  /** 此状态是否在角色死亡时移除 */
  removeOnDeath: boolean
  /** 此状态是否在战斗结束后移除 */
  removeOnBattleEnd: boolean
  /** 此状态是否在休息/睡觉后移除 */
  removeOnRest: boolean
}

// ============================================================
// 状态类型
// ============================================================

/**
 * 状态类型
 */
export enum StatusType {
  /** 负面状态（中毒、流血、恐惧等） */
  DEBUFF = 'debuff',
  /** 正面状态（力量增强、护盾、加速等） */
  BUFF = 'buff',
  /** 中立状态（标记类，如"被猎人标记"，本身无害） */
  NEUTRAL = 'neutral',
  /** 特殊状态（诅咒、感染、腐化等，有独特机制） */
  SPECIAL = 'special',
}

/**
 * 状态标签
 */
export enum StatusTag {
  /** 物理伤害类 */
  PHYSICAL_DOT = 'physicalDot',
  /** 精神伤害类 */
  MENTAL = 'mental',
  /** 移动限制类 */
  MOVEMENT_IMPAIR = 'movementImpair',
  /** 属性削弱类 */
  STAT_REDUCTION = 'statReduction',
  /** 属性增强类 */
  STAT_BOOST = 'statBoost',
  /** 恢复类 */
  REGENERATION = 'regeneration',
  /** 控制类（眩晕、冰冻等） */
  CONTROL = 'control',
  /** 感知类（影响视野、SAN值认知） */
  PERCEPTION = 'perception',
  /** 生存类（影响饱食度、温暖度等） */
  SURVIVAL = 'survival',
  /** 腐化/感染类 */
  CORRUPTION = 'corruption',
  /** 战斗类 */
  COMBAT = 'combat',
}

// ============================================================
// 时间与叠层
// ============================================================

/**
 * 状态持续时间
 */
export interface StatusDuration {
  /** 持续时间值 */
  value: number
  /** 时间单位 */
  unit: 'turn' | 'minute' | 'hour' | 'permanent'
  /** 最小持续时间限制（施加时若指定时间小于此值则使用此值） */
  minValue?: number
  /** 最大持续时间限制（施加时若指定时间大于此值则使用此值） */
  maxValue?: number
}

/**
 * 状态叠加规则
 */
export enum StatusStackingRule {
  /** 不可叠加：已存在时忽略新施加（不刷新时间） */
  NONE = 'none',
  /** 刷新时间：已存在时仅刷新持续时间，不增加层数 */
  REFRESH = 'refresh',
  /** 独立叠加：每层独立计时，效果×层数 */
  STACK_INDEPENDENT = 'stackIndependent',
  /** 刷新叠加：层数+1且刷新所有层持续时间 */
  STACK_REFRESH = 'stackRefresh',
  /** 仅叠层：层数+1但保持原有持续时间不变 */
  STACK_NO_REFRESH = 'stackNoRefresh',
}

// ============================================================
// 状态效果
// ============================================================

/**
 * 状态效果配置
 * 定义状态每个周期（回合/分钟/小时）对属性的影响
 */
export interface StatusEffectConfig {
  /** 效果的触发周期 */
  interval: StatusInterval

  /** 属性变动列表 */
  attributeChanges: StatusAttributeChange[]

  /** 效果触发时的描述文本（战斗日志/状态提示） */
  triggerText?: string

  /** 效果触发概率（0-1，1=必定触发） */
  triggerChance: number

  /** 效果是否受层数影响（如每层中毒独立造成伤害） */
  scalesWithStacks: boolean

  /** 触发条件（满足条件才触发此效果） */
  condition?: Condition
}

/**
 * 状态触发周期
 */
export interface StatusInterval {
  /** 周期值 */
  value: number
  /** 周期单位 */
  unit: 'turn' | 'minute' | 'hour'
}

/**
 * 状态属性变动
 */
export interface StatusAttributeChange {
  /** 目标属性 */
  attribute: StatusAffectedAttribute
  /** 变动类型 */
  operation: 'add' | 'multiply' | 'set'
  /** 变动值（正数为增益，负数为减益） */
  value: number
  /** 子类型（用于武器熟练度、特定技能等） */
  subType?: string
}

/**
 * 状态可影响的属性（涵盖策划书中临时状态可影响的全部属性）
 */
export enum StatusAffectedAttribute {
  // 生存属性
  HP = 'hp',
  SATIETY = 'satiety',
  STAMINA = 'stamina',
  SAN = 'san',

  // 基础属性
  STRENGTH = 'strength',
  AGILITY = 'agility',
  INTELLIGENCE = 'intelligence',
  CONSTITUTION = 'constitution',

  // 系数属性
  RECOVERY_RATE_COEFFICIENT = 'recoveryRateCoefficient',
  SATIETY_LOSS_COEFFICIENT = 'satietyLossCoefficient',
  STAMINA_CONSUMPTION_COEFFICIENT = 'staminaConsumptionCoefficient',
  STAMINA_RECOVERY_COEFFICIENT = 'staminaRecoveryCoefficient',
  STAMINA_RECOVERY_FIX = 'staminaRecoveryFix',

  // 防御
  SLASH_DEFENSE = 'slashDefense',
  BLUNT_DEFENSE = 'bluntDefense',
  RANGED_DEFENSE = 'rangedDefense',
  POISON_DEFENSE = 'poisonDefense',
  FIRE_DEFENSE = 'fireDefense',

  // 温度
  TEMPERATURE_LOW = 'temperatureLow',
  TEMPERATURE_HIGH = 'temperatureHigh',

  // 其他
  CARRY_WEIGHT_MODIFIER = 'carryWeightModifier',
  SAN_MODIFIER = 'sanModifier',
}

// ============================================================
// 视觉效果
// ============================================================

/**
 * 状态视觉效果
 */
export interface StatusVisualEffect {
  /** 效果类型 */
  type: StatusVisualEffectType
  /** 效果强度（0-1） */
  intensity: number
  /** 是否随状态剩余时间渐变（时间越少效果越强/弱） */
  intensityByRemainingTime?: 'increase' | 'decrease'
  /** 效果颜色 */
  color?: string
}

/**
 * 视觉效果类型
 */
export enum StatusVisualEffectType {
  /** 屏幕边框闪烁 */
  SCREEN_BORDER_FLASH = 'screenBorderFlash',
  /** 屏幕边框常驻颜色 */
  SCREEN_BORDER_STATIC = 'screenBorderStatic',
  /** 屏幕抖动 */
  SCREEN_SHAKE = 'screenShake',
  /** 画面模糊 */
  BLUR = 'blur',
  /** 画面色调偏移 */
  COLOR_SHIFT = 'colorShift',
  /** 画面暗角 */
  VIGNETTE = 'vignette',
  /** 粒子效果（血滴、冰晶等） */
  PARTICLES = 'particles',
  /** 角色头顶图标 */
  OVERHEAD_ICON = 'overheadIcon',
}

// ============================================================
// 状态描述变体
// ============================================================

/**
 * 状态描述变体
 */
export interface StatusDescriptionVariation {
  /** 变体描述 */
  description: string
  /** 显示条件 */
  condition: Condition
}

// ============================================================
// 状态预设ID常量
// ============================================================

export const StatusId = {
  // 伤害类
  BLEED: 'bleed',
  POISON: 'poison',
  BURN: 'burn',
  FROSTBITE: 'frostbite',

  // 精神类
  FEAR: 'fear',
  MADNESS: 'madness',
  HALLUCINATION: 'hallucination',

  // 控制类
  STUN: 'stun',
  FROZEN: 'frozen',
  ROOT: 'root',
  SLOW: 'slow',

  // 增益类
  STRENGTH_BOOST: 'strengthBoost',
  REGENERATION: 'regeneration',
  FORTIFIED: 'fortified',
  HASTE: 'haste',

  // 生存类
  STARVATION: 'starvation',
  HYPOTHERMIA: 'hypothermia',
  HEAT_STROKE: 'heatStroke',
  INFECTION: 'infection',
  CORRUPTED: 'corrupted',
} as const

export type StatusId = (typeof StatusId)[keyof typeof StatusId]

// ============================================================
// 状态注册表
// ============================================================

/**
 * 状态注册表
 */
export interface StatusRegistry {
  /** 所有状态配置，按ID索引 */
  statuses: Record<string, StatusConfig>
  /** 按标签分组 */
  statusesByTag: Record<StatusTag, string[]>
  /** 按类型分组 */
  statusesByType: Record<StatusType, string[]>
}