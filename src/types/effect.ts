// effect.ts - 效果数据结构

/**
 * 效果类型枚举
 */
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
  /** 条件判断 */
  CONDITION = 'condition',
  /** 复合效果（多个效果组合） */
  COMPOSITE = 'composite',
}

/**
 * 属性类型
 */
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

  // 其他属性
  RECOVERY_RATE_COEFFICIENT = 'recoveryRateCoefficient', // 恢复速率系数
  SATIETY_UPPER_LIMIT_COEFFICIENT = 'satietyUpperLimitCoefficient', // 饱食度上限系数
  SATIETY_LOSS_COEFFICIENT = 'satietyLossCoefficient', // 饱食度损失系数
  STAMINA_CONSUMPTION_COEFFICIENT = 'staminaConsumptionCoefficient', // 体力消耗系数
  STAMINA_RECOVERY_COEFFICIENT = 'staminaRecoveryCoefficient', // 体力恢复系数
  STAMINA_RECOVERY_FIX = 'staminaRecoveryFix', // 体力恢复修正
  SAN_MODIFIER = 'sanModifier', // SAN修正指数
  TEMPERATURE_LOW = 'temperatureLow', // 适宜温度低值
  TEMPERATURE_HIGH = 'temperatureHigh', // 适宜温度高值
  CARRY_WEIGHT_MODIFIER = 'carryWeightModifier', // 负重修正
}

/**
 * 属性操作类型
 */
export enum AttributeOperation {
  /** 设置（覆盖） */
  SET = 'set',
  /** 增加 */
  ADD = 'add',
  /** 减少 */
  SUBTRACT = 'subtract',
  /** 乘以 */
  MULTIPLY = 'multiply',
  /** 除以 */
  DIVIDE = 'divide',
}

/**
 * 属性效果
 */
export interface AttributeEffect {
  type: EffectType.ATTRIBUTE
  /** 目标属性 */
  attribute: AttributeType
  /** 操作类型 */
  operation: AttributeOperation
  /** 变动值 */
  value: number
  /** 如果是武器熟练度/技能等，指定具体类型 */
  subType?: string
}

/**
 * 状态类型
 */
export enum StatusType {
  /** 属性变动引发的常驻状态 */
  HUNGER = 'hunger',
  COLD = 'cold',
  HOT = 'hot',
  FREEZING = 'freezing',
  SCORCHING = 'scorching',
  LIGHT_LOAD = 'lightLoad',
  HEAVY_LOAD = 'heavyLoad',
  OVERLOAD = 'overload',

  /** 临时状态（由具体配置定义） */
  TEMPORARY = 'temporary',

  /** 常驻状态（由具体配置定义） */
  PERMANENT = 'permanent',
}

/**
 * 状态效果
 */
export interface StatusEffect {
  type: EffectType.STATUS
  /** 状态ID */
  statusId: string
  /** 是施加(true)还是移除(false) */
  apply: boolean
  /** 持续时间（回合数/分钟数，-1表示常驻） */
  duration?: number
  /** 状态的具体效果参数 */
  params?: Record<string, number>
}

/**
 * 物品变动类型
 */
export enum ItemChangeType {
  ADD = 'add',
  REMOVE = 'remove',
  EQUIP = 'equip',
  UNEQUIP = 'unequip',
}

/**
 * 物品效果
 */
export interface ItemEffect {
  type: EffectType.ITEM
  /** 物品ID */
  itemId: string
  /** 变动类型 */
  changeType: ItemChangeType
  /** 数量 */
  quantity?: number
  /** 是否随机数量 */
  randomQuantity?: {
    min: number
    max: number
  }
  /** 获得概率 (0-1) */
  probability?: number
  /** 条件（满足条件才生效） */
  condition?: Condition
}

/**
 * 场景效果
 */
export interface SceneEffect {
  type: EffectType.SCENE
  /** 目标场景ID */
  sceneId: string
  /** 子场景ID（可选） */
  subSceneId?: string
  /** 是否立即切换 */
  immediate?: boolean
}

/**
 * 标志位操作
 */
export enum FlagOperation {
  SET = 'set',
  UNSET = 'unset',
  TOGGLE = 'toggle',
  INCREMENT = 'increment',
  DECREMENT = 'decrement',
}

/**
 * 标志位效果
 */
export interface FlagEffect {
  type: EffectType.FLAG
  /** 标志位ID */
  flagId: string
  /** 操作类型 */
  operation: FlagOperation
  /** 值（SET/INCREMENT/DECREMENT时使用） */
  value?: number | string | boolean
}

/**
 * 战斗效果
 */
export interface BattleEffect {
  type: EffectType.BATTLE
  /** 敌人配置ID */
  enemyId: string
  /** 胜利后的效果 */
  victoryEffects?: Effect[]
  /** 失败后的效果 */
  defeatEffects?: Effect[]
  /** 是否可逃跑 */
  canEscape?: boolean
  /** 是否有初见加成 */
  firstEncounterBonus?: boolean
}

/**
 * CG效果
 */
export interface CGEffect {
  type: EffectType.CG
  /** CG配置ID */
  cgId: string
}

/**
 * 事件触发效果
 */
export interface EventTriggerEffect {
  type: EffectType.EVENT
  /** 事件ID */
  eventId: string
  /** 触发时机（立即触发/下次进入场景触发/特定条件触发） */
  triggerTiming: 'immediate' | 'onSceneEnter' | 'onConditionMet'
  /** 触发条件 */
  condition?: Condition
}

/**
 * 条件比较运算符
 */
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

/**
 * 条件逻辑运算符（用于复合条件）
 */
export enum LogicOperator {
  AND = 'and',
  OR = 'or',
  NOT = 'not',
}

/**
 * 条件定义
 */
export interface Condition {
  /** 逻辑运算符（如果是复合条件） */
  logic?: LogicOperator
  /** 子条件列表（用于复合条件） */
  subConditions?: Condition[]
  /** 条件检查的目标 */
  target?: ConditionTarget
  /** 比较运算符 */
  operator?: ComparisonOperator
  /** 比较值 */
  value?: number | string | boolean | number[]
  /** 取值范围的第二个值（BETWEEN时使用） */
  value2?: number
}

/**
 * 条件检查目标类型
 */
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
}

/**
 * 条件目标
 */
export interface ConditionTarget {
  type: ConditionTargetType
  /** 具体目标ID */
  id?: string
  /** 属性子类型（如果type是attribute） */
  attributeType?: AttributeType
  /** 子类型（武器类型、技能类型等） */
  subType?: string
}

/**
 * 复合效果（包含多个子效果）
 */
export interface CompositeEffect {
  type: EffectType.COMPOSITE
  /** 子效果列表 */
  effects: Effect[]
  /** 执行方式 */
  executionMode: 'sequential' | 'random' | 'weighted_random'
  /** 权重（weighted_random时使用） */
  weights?: number[]
}

/**
 * 效果联合类型
 */
export type Effect =
  | AttributeEffect
  | StatusEffect
  | ItemEffect
  | SceneEffect
  | FlagEffect
  | BattleEffect
  | CGEffect
  | EventTriggerEffect
  | CompositeEffect

/**
 * 效果结果（包含概率和条件）
 */
export interface EffectResult {
  /** 效果 */
  effect: Effect
  /** 触发概率 (0-1, 1为必定触发) */
  probability?: number
  /** 触发条件 */
  condition?: Condition
  /** 效果描述（用于显示） */
  description?: string
}

/**
 * 选项结果配置
 */
export interface OptionResult {
  /** 结果类型 */
  type: 'end' | 'battle' | 'trade' | 'cg' | 'nextEvent' | 'composite'
  /** 子事件ID（nextEvent时使用） */
  nextEventId?: string
  /** 参数（战斗敌人ID、CG ID等） */
  params?: Record<string, unknown>
  /** 效果列表 */
  effects?: EffectResult[]
  /** 战斗胜利后的子事件 */
  victoryEventId?: string
  /** 战斗失败后的子事件 */
  defeatEventId?: string
}

/**
 * 事件效果批处理配置
 */
export interface EventEffectConfig {
  /** 事件开始时触发的效果 */
  onEventStart?: EffectResult[]
  /** 事件结束时触发的效果 */
  onEventEnd?: EffectResult[]
  /** 事件内选项对应的效果 */
  optionEffects?: Record<string, OptionResult>
}
