// effect.ts - 效果数据结构

import type { RecipeType } from './recipe'
import type { FlagOperation } from './flag'

// ============================================================
// 效果类型枚举
// ============================================================

export enum EffectType {
  /** 属性变动 */
  ATTRIBUTE = 'attribute',
  /** 状态施加/移除 */
  STATUS = 'status',
  /** 物品获得/失去 */
  ITEM = 'item',
  /** 场景切换 */
  SCENE = 'scene',
  /** 标志位设置 */
  FLAG = 'flag',
  /** 战斗触发 */
  BATTLE = 'battle',
  /** CG触发 */
  CG = 'cg',
  /** 事件触发 */
  EVENT = 'event',
  /** 解锁配方 */
  UNLOCK_RECIPE = 'unlockRecipe',
  /** 解锁技能 */
  UNLOCK_SKILL = 'unlockSkill',
  /** 获得经验 */
  GAIN_EXP = 'gainExp',
  /** 条件判断 */
  CONDITION = 'condition',
  /** 复合效果（多个效果组合） */
  COMPOSITE = 'composite',
}

// ============================================================
// 属性类型
// ============================================================

export enum AttributeType {
  // 生存属性
  HP = 'hp',
  SATIETY = 'satiety',
  STAMINA = 'stamina',
  SAN = 'san',
  WARMTH = 'warmth',
  CARRY_WEIGHT = 'carryWeight',

  // 基础属性
  STRENGTH = 'strength',
  AGILITY = 'agility',
  INTELLIGENCE = 'intelligence',
  CONSTITUTION = 'constitution',

  // 经验值
  STRENGTH_EXP = 'strengthExp',
  AGILITY_EXP = 'agilityExp',
  INTELLIGENCE_EXP = 'intelligenceExp',
  CONSTITUTION_EXP = 'constitutionExp',

  // 武器熟练度
  WEAPON_PROFICIENCY = 'weaponProficiency',
  WEAPON_PROFICIENCY_EXP = 'weaponProficiencyExp',

  // 防御属性
  SLASH_DEFENSE = 'slashDefense',
  BLUNT_DEFENSE = 'bluntDefense',
  RANGED_DEFENSE = 'rangedDefense',
  POISON_DEFENSE = 'poisonDefense',
  FIRE_DEFENSE = 'fireDefense',

  // 技能等级
  SKILL_LEVEL = 'skillLevel',
  SKILL_EXP = 'skillExp',

  // 系数属性
  RECOVERY_RATE_COEFFICIENT = 'recoveryRateCoefficient',
  SATIETY_UPPER_LIMIT_COEFFICIENT = 'satietyUpperLimitCoefficient',
  SATIETY_LOSS_COEFFICIENT = 'satietyLossCoefficient',
  STAMINA_CONSUMPTION_COEFFICIENT = 'staminaConsumptionCoefficient',
  STAMINA_RECOVERY_COEFFICIENT = 'staminaRecoveryCoefficient',
  STAMINA_RECOVERY_FIX = 'staminaRecoveryFix',
  SAN_MODIFIER = 'sanModifier',
  TEMPERATURE_LOW = 'temperatureLow',
  TEMPERATURE_HIGH = 'temperatureHigh',
  CARRY_WEIGHT_MODIFIER = 'carryWeightModifier',
}

// ============================================================
// 属性操作
// ============================================================

export enum AttributeOperation {
  SET = 'set',
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
}

// ============================================================
// 效果接口
// ============================================================

/** 属性效果 */
export interface AttributeEffect {
  type: EffectType.ATTRIBUTE
  attribute: AttributeType
  operation: AttributeOperation
  value: number
  /** 子类型（武器熟练度/技能等需要指定具体类型时使用） */
  subType?: string
}

/** 状态效果（施加或移除异常状态） */
export interface StatusEffect {
  type: EffectType.STATUS
  /** 状态模板ID（对应 status.ts 中的 StatusConfig.id） */
  statusId: string
  /** 是施加(true)还是移除(false) */
  apply: boolean
  /** 持续时间值（-1=使用状态模板默认值） */
  duration?: number
  /** 持续时间单位（不填则使用状态模板默认单位） */
  durationUnit?: 'turn' | 'minute' | 'hour' | 'permanent'
  /** 施加层数（apply=true时生效，受状态模板叠加规则约束） */
  stackCount?: number
  /** 来源描述（用于战斗日志等，如"来自毒蛇之咬"） */
  sourceId?: string
  /** 覆盖状态模板的参数 */
  params?: Record<string, number>
}

/** 物品效果 */
export interface ItemEffect {
  type: EffectType.ITEM
  itemId: string
  changeType: ItemChangeType
  quantity?: number
  randomQuantity?: {
    min: number
    max: number
  }
  probability?: number
  condition?: Condition
}

export enum ItemChangeType {
  ADD = 'add',
  REMOVE = 'remove',
  EQUIP = 'equip',
  UNEQUIP = 'unequip',
}

/** 场景切换效果 */
export interface SceneEffect {
  type: EffectType.SCENE
  sceneId: string
  subSceneId?: string
  immediate?: boolean
}

/** 标志位效果 */
export interface FlagEffect {
  type: EffectType.FLAG
  flagId: string
  operation: FlagOperation
  value?: number | string | boolean
}


/** 战斗效果 */
export interface BattleEffect {
  type: EffectType.BATTLE
  enemyId: string
  victoryEffects?: Effect[]
  defeatEffects?: Effect[]
  canEscape?: boolean
  firstEncounterBonus?: boolean
}

/** CG效果 */
export interface CGEffect {
  type: EffectType.CG
  cgId: string
}

/** 事件触发效果 */
export interface EventTriggerEffect {
  type: EffectType.EVENT
  eventId: string
  triggerTiming: 'immediate' | 'onSceneEnter' | 'onConditionMet'
  condition?: Condition
}

/** 解锁配方效果 */
export interface UnlockRecipeEffect {
  type: EffectType.UNLOCK_RECIPE
  recipeId: string
  recipeType: RecipeType
}

/** 解锁技能效果 */
export interface UnlockSkillEffect {
  type: EffectType.UNLOCK_SKILL
  skillId: string
}

/** 获得经验效果 */
export interface GainExpEffect {
  type: EffectType.GAIN_EXP
  /** 经验目标类型 */
  target: GainExpTarget
  /** 目标ID（技能ID/武器类型ID/属性类型） */
  targetId: string
  /** 经验值 */
  amount: number
}

export enum GainExpTarget {
  /** 生存技能 */
  SURVIVAL_SKILL = 'survivalSkill',
  /** 武器熟练度 */
  WEAPON_PROFICIENCY = 'weaponProficiency',
  /** 战斗技能 */
  BATTLE_SKILL = 'battleSkill',
  /** 基础属性（力量/敏捷/智力/体质） */
  ATTRIBUTE = 'attribute',
}

/** 复合效果 */
export interface CompositeEffect {
  type: EffectType.COMPOSITE
  effects: Effect[]
  executionMode: 'sequential' | 'random' | 'weighted_random'
  weights?: number[]
}

// ============================================================
// 效果联合类型
// ============================================================

export type Effect =
  | AttributeEffect
  | StatusEffect
  | ItemEffect
  | SceneEffect
  | FlagEffect
  | BattleEffect
  | CGEffect
  | EventTriggerEffect
  | UnlockRecipeEffect
  | UnlockSkillEffect
  | GainExpEffect
  | CompositeEffect

// ============================================================
// 效果结果
// ============================================================

export interface EffectResult {
  effect: Effect
  probability?: number
  condition?: Condition
  description?: string
}

// ============================================================
// 条件系统
// ============================================================

export enum ComparisonOperator {
  EQUAL = 'equal',
  NOT_EQUAL = 'notEqual',
  GREATER = 'greater',
  GREATER_EQUAL = 'greaterEqual',
  LESS = 'less',
  LESS_EQUAL = 'lessEqual',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'notIn',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists',
}

export enum LogicOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not',
}

export interface Condition {
  logic?: LogicOperator
  subConditions?: Condition[]
  target?: ConditionTarget
  operator?: ComparisonOperator
  value?: number | string | boolean | number[]
  value2?: number
}

export enum ConditionTargetType {
  ATTRIBUTE = 'attribute',
  FLAG = 'flag',
  ITEM = 'item',
  STATUS = 'status',
  SCENE = 'scene',
  TIME = 'time',
  WEATHER = 'weather',
  SEASON = 'season',
  SAN_LEVEL = 'sanLevel',
  CORRUPTION = 'corruption',
  SKILL = 'skill',
  WEAPON_PROFICIENCY = 'weaponProficiency',
  /** 配方是否已解锁 */
  RECIPE_UNLOCKED = 'recipeUnlocked',
  /** 玩家金币数量 */
  PLAYER_GOLD = 'playerGold',
  /** 负重率 */
  CARRY_WEIGHT_RATE = 'carryWeightRate',
}

export interface ConditionTarget {
  type: ConditionTargetType
  id?: string
  attributeType?: AttributeType
  subType?: string
}