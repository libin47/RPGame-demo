// skill.ts - 技能数据结构

import type { Condition } from './effect'
import type { EffectResult } from './effect'
import type { AttributeType } from './effect'

// ============================================================
// 公共基础
// ============================================================

/**
 * 技能属性加成
 * 用于技能对玩家属性的被动修正
 */
export interface SkillAttributeBonus {
  /** 目标属性 */
  attribute: AttributeType
  /** 加成值 */
  value: number
  /** 加成类型 */
  modifierType: 'add' | 'multiply'
  /** 子类型（武器熟练度、特定技能等需要指定） */
  subType?: string
}

// ============================================================
// 战斗技能
// ============================================================

/**
 * 战斗技能配置
 * 在战斗中使用的能力，由武器熟练度、事件或道具解锁。
 * 包括普攻（默认解锁）和各类主动技能。
 */
export interface BattleSkill {
  /** 技能唯一ID */
  id: string
  /** 技能名称 */
  name: string
  /** 技能描述 */
  description: string
  /** 技能图标资源ID */
  iconId?: string

  /** 攻击距离（默认1.0，即直接攻击目标），-1为不限制距离 */
  attackDistance?: number

  /**
   * 使用本技能后附带的位置移动（正数=拉近/突进，负数=拉开/后跳，0或未设置=不移动）
   * 距离判定在使用前按当前距离进行；位移在技能结算后生效，范围始终限制在 [1, 5]
   * 示例：突进技能可配置 attackDistance: -1 + moveDistance: 2（任意距离可用，先冲近2格再命中）
   */
  moveDistance?: number

  /** 技能类型 */
  skillType: 'battle'

  /** 解锁所需武器熟练度等级（普攻等基础技能为0） */
  unlockLevel?: number

  /** 是否锁定，通过其他方式解锁 */
  lock?: boolean
  // 解锁条件，仅作备注，逻辑不生效
  unlockCondition?: string

  /** 武器类型限制（为空则不限武器，徒手或任意武器均可使用） */
  weaponRestriction?: string

  /** 伤害类型（普攻时使用武器自身的伤害类型） */
  damageTypeId?: string

  /** 技能数值（含效果与描述文本） */
  stats: BattleSkillStats

  /** 技能消耗 */
  costs: BattleSkillCost[]

  /** 技能冷却（回合数，可选，默认0） */
  cooldown?: number

  /** 目标选择（可选，默认单个敌人） */
  targetType?: BattleSkillTargetType
}

/**
 * 战斗技能数值
 * 所有字段均为可选，未填写时使用默认值。
 */
export interface BattleSkillStats {
  /** 伤害倍率（基于武器骰子伤害的倍率，默认1） */
  damageMultiplier?: number
  /** 额外固定伤害（不受武器影响，默认0） */
  bonusDamage?: number
  /** 加成属性（力量/敏捷/智力/体质，默认力量） */
  scalingAttribute?: AttributeType
  /** 命中修正（d100判定修正，加到命中阈值上，可为负数，默认0） */
  accuracyModifier?: number
  /** 暴击修正（d100暴击阈值修正，加到暴击阈值上，可为负数，默认0） */
  criticalModifier?: number
  /** 释放次数（默认1，大于1时依次进行d100判定并结算） */
  hitCount?: number
  /** 命中后施加的效果 */
  onHitEffects?: EffectResult[]
  /** 暴击时额外施加的效果 */
  onCritEffects?: EffectResult[]
  /** 描述文本（使用时随机抽取，支持占位符如 {damage}、{weapon}、{target}） */
  narrativeTexts?: {
    /** 普通命中文本 */
    hit?: string[]
    /** 未命中文本 */
    miss?: string[]
    /** 暴击命中文本 */
    critHit?: string[]
    /** 暴击未命中文本 */
    critMiss?: string[]
  }
}

/**
 * 战斗技能消耗
 */
export interface BattleSkillCost {
  /** 消耗类型 */
  costType: 'stamina' | 'hp' | 'san' | 'satiety'
  /** 消耗值 */
  value: number
}

/**
 * 战斗技能目标类型
 */
export enum BattleSkillTargetType {
  /** 单个敌人 */
  SINGLE_ENEMY = 'singleEnemy',
  /** 所有敌人 */
  ALL_ENEMIES = 'allEnemies',
  /** 自身 */
  SELF = 'self',
  /** 随机一个敌人 */
  RANDOM_ENEMY = 'randomEnemy',
}

// ============================================================
// 被动技能
// ============================================================

/**
 * 被动技能配置
 * 习得后永久生效的技能，不会成长，不可移除。
 * 通过事件、道具习得。
 * 效果持续生效于角色属性或战斗计算中。
 */
export interface PassiveSkill {
  /** 技能唯一ID */
  id: string
  /** 技能名称 */
  name: string
  /** 技能描述 */
  description: string
  /** 技能图标资源ID */
  iconId: string

  /** 技能类型 */
  skillType: 'passive'

  /** 被动效果列表（习得后永久生效） */
  effects: EffectResult[]

  /** 属性加成（直接作用于玩家属性面板） */
  attributeBonuses?: SkillAttributeBonus[]

  /** 该被动是否可重复习得（多数被动仅可习得一次） */
  isStackable: boolean
  /** 最大叠层数（isStackable为true时有效） */
  maxStacks?: number

  /** 习得条件（仅用于事件或道具中引用，被动技能本身不主动触发习得） */
  acquireCondition?: Condition
}

// ============================================================
// 联合类型
// ============================================================

/** 所有技能类型 */
export type Skill = BattleSkill | PassiveSkill

// ============================================================
// 技能注册表
// ============================================================

/**
 * 技能注册表（全局技能配置汇总）
 */
export interface SkillRegistry {
  /** 战斗技能 */
  battleSkills: Record<string, BattleSkill>
  /** 被动技能 */
  passiveSkills: Record<string, PassiveSkill>
}
