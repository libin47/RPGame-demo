// status.ts - 异常状态数据结构

import type { EffectResult } from './effect'
import type { Conditions } from './effect'
import type { AttributeType } from './effect'
import type { DamageTypeId } from './damage'

// ============================================================
// 状态配置
// ============================================================

export interface AttStatusConfig extends StatusConfig {
  conditions?: Conditions
}

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
  description: StatusDescription
  /** 状态描述变体（根据条件显示不同文本） */
  descriptionVariations?: StatusDescriptionVariation[]

  /** 状态图标资源ID */
  iconId?: string

  // ============================================================
  // 状态分类
  // ============================================================

  /** 状态类型，区分显示颜色 */
  statusType: StatusType

  // ============================================================
  // 时间与叠层
  // ============================================================

  /** 默认持续时间，具体以施加的事件时间为准, 单位为分钟，战斗中一回合=1分钟。-1表示永久状态 */
  defaultDuration: number

  /** 叠加规则 */
  stackingRule: StatusStackingRule

  // ============================================================
  // 移除相关
  // ============================================================

  /** 此状态是否在战斗结束后移除 */
  removeOnBattleEnd: boolean
  /** 此状态是否在休息/睡觉后移除 */
  removeOnRest: boolean

  // ============================================================
  // 效果
  // ============================================================
  modifier?: ModifierConfig

  /** 状态效果-非战斗中（单个周期效果配置） */
  effects?: StatusEffectConfig
  /** 战斗中状态效果（单个周期效果配置） */
  battleEffects?: StatusEffectConfig

  /** 状态施加时立即触发的效果（仅一次） */
  onApplyEffects?: EffectResult[]
  /** 状态移除时触发的效果（仅一次） */
  onRemoveEffects?: EffectResult[]

  // ============================================================
  // 显示与视听
  // ============================================================

  /** 视觉效果 */
  visualEffects?: StatusVisualEffect[]
}
export interface StatusDescription {
  tooltip?: string /** 状态提示中的描述文本 */
  start?: string[] /** 状态开始时显示的文本 */
  end?: string[] /** 状态结束时显示的文本 */
  triggerText?: string[] /** 状态触发时显示的文本 */
  summary?: string[] /** 状态总结文本，非战斗中显示 */
  normalText?: string[] /** 状态未触发时显示的文本 */
}
export interface ModifierConfig {
  /** 力量临时修正 */
  strengthModifier?: number
  /** 敏捷临时修正 */
  agilityModifier?: number
  /** 智力临时修正 */
  intelligenceModifier?: number
  /** 体质临时修正 */
  constitutionModifier?: number
  /** 幸运临时修正 */
  luckModifier?: number
  /** 负重修正（kg） */
  carryWeightModifier?: number
  /** 防御修正（以伤害类型ID为键，正=提高防御，负=降低） */
  defenses?: Partial<Record<DamageTypeId, number>>
  /** 系数修正（加法型增量） */
  coefficients?: {
    /** 生命值恢复速率系数修正 */
    recoveryRateCoefficient?: number
    /** 饱食度损失系数修正 */
    satietyLossCoefficient?: number
    /** 体力消耗系数修正 */
    staminaConsumptionCoefficient?: number
    /** 体力恢复系数修正 */
    staminaRecoveryCoefficient?: number
    /** 体力恢复修正值修正 */
    staminaRecoveryFix?: number
    /** SAN修正指数修正 */
    sanModifier?: number
    /** SAN值恢复系数修正 */
    sanRecoveryCoefficient?: number
  }
  /** 适宜温度低值修正 */
  temperatureLowModifier?: number
  /** 适宜温度高值修正 */
  temperatureHighModifier?: number
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

// ============================================================
// 时间与叠层
// ============================================================

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
  /** 效果的触发周期 ， 单位为分钟和回合*/
  interval: number

  /** 属性变动列表 */
  attributeChanges: StatusAttributeChange[]

  /** 效果触发时的描述文本（战斗日志/状态提示） */
  triggerText?: string

  /** 效果触发概率（0-1，1=必定触发） */
  triggerChance?: number
  // 效果触发-roll，以属性roll，满足难度的成功时方可豁免
  triggerRollAtt?: '力量' | '敏捷' | '智力' | '体质' | '幸运' | 'san'
  triggerRollLevel?: '普通' | '困难' | '极难'

  /** 效果是否受层数影响（如每层中毒独立造成伤害） */
  scalesWithStacks: boolean

  /** 触发条件（满足条件才触发此效果） */
  conditions?: Conditions
}

/**
 * 状态属性变动
 */
export interface StatusAttributeChange {
  /** 目标属性（仅支持生存四项属性 HP/饱食度/体力/SAN） */
  attribute: StatusAffectedAttribute
  /** 变动类型 */
  operation: 'add' | 'multiply' | 'set' | 'percentMax'
  /** 变动值（正数为增益，负数为减益） */
  value: number
  /** 子类型（用于武器熟练度、特定技能等） */
  subType?: string
}

/**
 * 状态可影响的属性（周期类效果仅作用于生存四项属性；
 * 其余属性（力量/系数/防御/温度等）的持续修正统一走 modifier 或面板属性）
 */
export enum StatusAffectedAttribute {
  // 生存属性
  HP = 'hp',
  SATIETY = 'satiety',
  STAMINA = 'stamina',
  SAN = 'san',
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
  description: StatusDescription
  /** 显示条件 */
  conditions?: Conditions
}

// ============================================================
// 状态注册表
// ============================================================

/**
 * 状态注册表
 */
export interface StatusRegistry {
  statuses: Record<string, StatusConfig>
}
