// skill.ts - 技能数据结构

import type { Condition } from './effect'
import type { EffectResult } from './effect'
import type { AttributeType } from './effect'
import type { FlagValue } from './flag'

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
// 生存技能
// ============================================================

/**
 * 生存技能配置
 * 非战斗状态下使用的技能，影响对应的交互效率、结果及判定条件。
 * 如：探索、砍伐、挖掘、采集、制作、种植、烹饪
 */
export interface SurvivalSkill {
  /** 技能唯一ID */
  id: string
  /** 技能名称 */
  name: string
  /** 技能描述 */
  description: string
  /** 技能图标资源ID */
  iconId: string

  /** 技能类型 */
  skillType: 'survival'

  /** 技能等级上限 */
  maxLevel: number

  /** 升级所需经验公式（当前等级 -> 所需经验） */
  expToNextLevel: (currentLevel: number) => number

  /** 技能等级对交互效果的加成公式 */
  levelBonus: SurvivalSkillLevelBonus

  /** 该技能相关的交互ID列表（用于判断哪些交互可获得此技能经验） */
  relatedInteractionIds?: string[]

  /** 执行相关交互时获得的经验值 */
  expPerAction: number
}

/**
 * 生存技能等级加成配置
 */
export interface SurvivalSkillLevelBonus {
  /** 效果倍率（如采集数量倍率 = 1 + level * bonusPerLevel） */
  bonusPerLevel: number
  /** 高等级解锁的特殊能力 */
  specialAbilities?: SurvivalSkillSpecialAbility[]
}

/**
 * 生存技能特殊能力
 */
export interface SurvivalSkillSpecialAbility {
  /** 所需技能等级 */
  requiredLevel: number
  /** 能力描述 */
  description: string
  /** 能力效果（解锁后产生的被动效果） */
  effects: EffectResult[]
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
  iconId: string

  /** 技能类型 */
  skillType: 'battle'

  /** 技能等级（部分技能可升级，0表示不可升级） */
  level: number
  /** 最大等级 */
  maxLevel: number

  /** 解锁条件 */
  unlockCondition: string //仅作备注，逻辑不生效

  /** 武器类型限制（为空则不限武器，徒手或任意武器均可使用） */
  weaponRestriction?: string

  /** 伤害类型（普攻时使用武器自身的伤害类型） */
  damageTypeId?: string

  /** 技能数值 */
  stats: BattleSkillStats

  /** 技能消耗 */
  costs: BattleSkillCost[]

  /** 技能冷却（回合数） */
  cooldown: number

  /** 目标选择 */
  targetType: BattleSkillTargetType

  /** 命中后施加的效果 */
  onHitEffects?: EffectResult[]
  /** 暴击时额外施加的效果 */
  onCritEffects?: EffectResult[]

  /** 技能使用时的描述文本（用于战斗日志，支持占位符如 {damage}） */
  useTextTemplate?: string
  /** 技能未命中时的描述文本 */
  missTextTemplate?: string

  /** 此技能是否为默认普攻（武器熟练度0时自动解锁） */
  isDefaultAttack?: boolean
}

/**
 * 战斗技能数值
 */
export interface BattleSkillStats {
  /** 伤害倍率（基于武器基础伤害的倍率，1.0 = 普攻伤害） */
  damageMultiplier: number
  /** 额外固定伤害（不受武器影响） */
  bonusDamage?: number
  /** 力量对伤害的加成系数（0表示不受力量加成） */
  strengthScaling: number
  /** 敏捷对伤害的加成系数（0表示不受敏捷加成） */
  agilityScaling: number
  /** 智力对伤害的加成系数（0表示不受智力加成） */
  intelligenceScaling: number

  /** 命中修正（加到基础命中上） */
  accuracyModifier: number
  /** 暴击率修正（0.1 = +10%） */
  criticalChanceModifier: number
  /** 暴击倍率修正（加到武器暴击倍率上） */
  criticalMultiplierBonus: number
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
export type Skill = SurvivalSkill | BattleSkill | PassiveSkill

/** 可成长的技能（生存技能和战斗技能有等级/经验） */
export type GrowableSkill = SurvivalSkill | BattleSkill

// ============================================================
// 技能注册表
// ============================================================

/**
 * 技能注册表（全局技能配置汇总）
 */
export interface SkillRegistry {
  /** 生存技能 */
  survivalSkills: Record<string, SurvivalSkill>
  /** 战斗技能 */
  battleSkills: Record<string, BattleSkill>
  /** 被动技能 */
  passiveSkills: Record<string, PassiveSkill>
}
