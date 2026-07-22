// enemy.ts - 敌人数据结构

import type { Condition } from './effect'
import type { EffectResult } from './effect'
import type { FlagValue } from './flag'

// ============================================================
// 敌人配置
// ============================================================

/**
 * 敌人配置
 */
export interface Enemy {
  /** 敌人唯一ID */
  id: string
  /** 敌人名称（显示用） */
  name: string
  /** 敌人名称变体（根据条件显示不同名称，如SAN值影响认知） */
  nameVariations?: EnemyNameVariation[]
  /** 敌人备注（开发者可见） */
  notes?: string

  /** 敌人类型 */
  enemyType: EnemyType

  /** 敌人描述（战斗中的观察/分析结果） */
  description: string
  /** 描述变体（不同SAN值下观察结果不同） */
  descriptionVariations?: EnemyDescriptionVariation[]

  /** 敌人图标/立绘资源ID */
  imageId: string
  /** 图片变体（根据SAN值等条件显示不同外观） */
  imageVariations?: EnemyImageVariation[]

  // ============================================================
  // 基础属性
  // ============================================================

  /** 生命值 */
  hp: number
  /** 力量（影响伤害） */
  strength: number
  /** 敏捷（影响出手顺序和逃跑难度） */
  agility: number

  // ============================================================
  // 防御属性
  // ============================================================

  /** 防御属性 */
  defenses: Record<string, number>

  // ============================================================
  // 战斗行为
  // ============================================================

  /** 敌人技能列表，至少包含一个默认普攻技能 */
  skills: EnemySkill[]

  /** AI行为参数 */
  behavior: EnemyBehavior

  // ============================================================
  // 特殊机制
  // ============================================================

  /** 腐化度修正（腐化度影响敌人强度） */
  corruptionScaling?: EnemyCorruptionScaling

  /** 逃跑难度修正系数（逃跑公式：玩家敏捷/(玩家敏捷+敌人敏捷*此系数)） */
  escapeDifficultyModifier: number

  /** 是否禁止逃跑 */
  canNotEscape: boolean

  // ============================================================
  // 战利品
  // ============================================================

  /** 战利品列表 */
  loot: EnemyLoot[]

  /** 击败后设置标志位 */
  defeatFlag?: string
  /** 击败后触发的效果 */
  onDefeatEffects?: EffectResult[]

  /** 首次击败额外战利品 */
  firstDefeatBonusLoot?: EnemyLoot[]

  // ============================================================
  // 出现条件
  // ============================================================

  /** 出现条件（用于随机遭遇生成时筛选） */
  spawnCondition?: Condition
  /** 出现权重（多个敌人满足条件时，权重越高出现概率越大） */
  spawnWeight?: number
  /** 出现所需最低腐化度 */
  minCorruption?: number
  /** 出现所需最高腐化度 */
  maxCorruption?: number
}

// ============================================================
// 敌人类型
// ============================================================

/**
 * 敌人类型
 */
export enum EnemyType {
  /** 普通生物（野兽、人类等） */
  NORMAL = 'normal',
  /** 变异生物（受孢子影响的生物） */
  MUTATED = 'mutated',
  /** 梦境怪物（低SAN值时出现，半真实半幻觉） */
  DREAM_CREATURE = 'dreamCreature',
  /** 变异人（曾经是人类） */
  MUTATED_HUMAN = 'mutatedHuman',
  /** BOSS */
  BOSS = 'boss',
  /** 不可战胜的敌人（剧情用，战斗必败或通过特定方式解决） */
  INVINCIBLE = 'invincible',
  /** 友好/中立单位（可对话，不应主动触发战斗） */
  NEUTRAL = 'neutral',
}

// ============================================================
// 名称与描述变体
// ============================================================

/**
 * 敌人名称变体
 * 例如：SAN值正常时显示"野狼"，低SAN值时显示"扭曲的狼形生物"
 */
export interface EnemyNameVariation {
  /** 变体名称 */
  name: string
  /** 显示条件 */
  condition: Condition
}

/**
 * 敌人描述变体
 * 不同SAN值下观察/分析获得的描述不同
 */
export interface EnemyDescriptionVariation {
  /** 变体描述 */
  description: string
  /** 显示条件 */
  condition: Condition
}

/**
 * 敌人图片变体
 */
export interface EnemyImageVariation {
  /** 图片资源ID */
  imageId: string
  /** 显示条件 */
  condition: Condition
  /** 过渡效果 */
  transitionEffect?: 'fade' | 'glitch' | 'instant'
}

// ============================================================
// 敌人技能
// ============================================================

/**
 * 敌人技能
 */
export interface EnemySkill {
  /** 技能ID（敌人内唯一） */
  id: string
  /** 技能名称 */
  name: string
  /** 技能描述（玩家观察成功时可见） */
  description?: string

  /** 使用优先级（数字越大越优先，优先级相同时按概率选取） */
  priority: number
  /** 使用概率权重（同一优先级下按权重比例随机） */
  weight: number

  /** 使用条件（不满足时此技能不会被选取） */
  useCondition?: EnemySkillCondition

  /** 一场战斗中最多使用次数（-1表示无限） */
  maxUses: number

  /** 伤害类型 */
  damageTypeId?: string

  /** 技能数值 */
  stats: EnemySkillStats

  /** 技能消耗（敌人通常不消耗资源，留空即可；特殊敌人可消耗自身HP等） */
  costs?: EnemySkillCost[]

  /** 冷却（回合数，0表示无冷却） */
  cooldown: number

  /** 目标类型 */
  targetType: EnemySkillTargetType

  /** 发动延迟（蓄力回合数，0表示立即生效） */
  chargeTime: number
  /** 蓄力时的提示文本列表（如"敌人正在蓄力..."） */
  chargeText?: string[]

  /** 命中后施加的效果 */
  onHitEffects?: EffectResult[]

  /** 技能使用时的描述文本（用于战斗日志） */
  useTextTemplate?: string
}

/**
 * 敌人技能使用条件
 */
export interface EnemySkillCondition {
  /** 自身HP低于此比例时可用（0-1） */
  hpBelowRatio?: number
  /** 自身HP高于此比例时可用（0-1） */
  hpAboveRatio?: number
  /** 战斗回合数大于等于此值时可用 */
  minTurn?: number
  /** 战斗回合数小于等于此值时可用 */
  maxTurn?: number
  /** 仅在满足此条件时可用 */
  customCondition?: Condition
}

/**
 * 敌人技能数值
 */
export interface EnemySkillStats {
  /** 基础伤害 */
  baseDamage: number
  /** 伤害浮动范围（最终伤害 = baseDamage * (1 ± variance)） */
  damageVariance: number
  /** 力量对伤害的加成系数 */
  strengthScaling: number
  /** 敏捷对伤害的加成系数 */
  agilityScaling: number

  /** 命中修正 */
  accuracyModifier: number
  /** 暴击率（0-1） */
  criticalChance: number
  /** 暴击倍率 */
  criticalMultiplier: number
}

/**
 * 敌人技能消耗
 */
export interface EnemySkillCost {
  /** 消耗类型 */
  costType: 'hp' | 'stamina'
  /** 消耗值（固定值或百分比，百分比为0-1） */
  value: number | { type: 'percentage'; value: number }
}

/**
 * 敌人技能目标类型
 */
export enum EnemySkillTargetType {
  /** 单个玩家 */
  SINGLE_PLAYER = 'singlePlayer',
  /** 全体（仅玩家，单人游戏中等同于singlePlayer） */
  ALL_PLAYERS = 'allPlayers',
  /** 自身 */
  SELF = 'self',
  /** 随机目标（若有多个友方） */
  RANDOM = 'random',
}

// ============================================================
// AI行为
// ============================================================

/**
 * 敌人AI行为参数
 */
export interface EnemyBehavior {
  /** 攻击倾向（0-1，0=完全随机选择技能，1=总是选择伤害最高的技能） */
  aggression: number
  /** HP低于此比例时行为改变（0-1，如0.3表示低于30%HP时触发） */
  desperationThreshold?: number
  /** 濒死时行为变化 */
  desperationBehavior?: EnemyDesperationBehavior
}

/**
 * 敌人濒死行为
 */
export interface EnemyDesperationBehavior {
  /** 行为类型 */
  type: 'flee' | 'enrage' | 'selfDestruct' | 'transform'
  /** 行为参数（如逃跑概率、狂暴伤害加成、自爆伤害等） */
  params?: Record<string, number>
  /** 触发时的文本描述 */
  triggerText?: string
  /** 触发时执行的效果 */
  effects?: EffectResult[]
}

// ============================================================
// 腐化度缩放
// ============================================================

/**
 * 腐化度对敌人强度的修正
 */
export interface EnemyCorruptionScaling {
  /** 腐化度对HP的加成（每点腐化度增加多少%HP） */
  hpPerCorruption: number
  /** 腐化度对伤害的加成（每点腐化度增加多少%伤害） */
  damagePerCorruption: number
  /** 腐化度对新技能解锁（腐化度达到阈值时解锁新技能） */
  skillUnlocks?: {
    corruptionThreshold: number
    skillIds: string[]
  }[]
}

// ============================================================
// 属性修正
// ============================================================

/**
 * 敌人属性修正（SAN值效果、腐化度缩放等使用）
 */
export interface EnemyStatModifier {
  /** 目标属性 */
  stat:
    | 'hp'
    | 'strength'
    | 'agility'
    | 'slashDefense'
    | 'bluntDefense'
    | 'rangedDefense'
    | 'poisonDefense'
    | 'fireDefense'
    | 'mentalDefense'
  /** 修正类型 */
  modifierType: 'add' | 'multiply' | 'set'
  /** 修正值 */
  value: number
}

// ============================================================
// 战利品
// ============================================================

/**
 * 敌人战利品
 */
export interface EnemyLoot {
  /** 物品ID */
  itemId: string
  /** 掉落概率（0-1） */
  probability: number
  /** 最小数量 */
  minQuantity: number
  /** 最大数量 */
  maxQuantity: number
  /** 是否受玩家属性/技能影响掉落概率（如剥皮技能提升皮革掉落） */
  affectedByPlayerSkill?: {
    skillId: string
    /** 每级技能增加的概率 */
    bonusPerLevel: number
    /** 每级额外增加的最大数量（可选） */
    quantityBonusPerLevel?: number
  }
}

// ============================================================
// 敌人注册表
// ============================================================

/**
 * 敌人注册表（全局敌人配置汇总）
 */
export interface EnemyRegistry {
  /** 所有敌人配置，按ID索引 */
  enemies: Record<string, Enemy>
}
