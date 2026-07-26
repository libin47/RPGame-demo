// flag.ts - 标志位数据结构

// ============================================================
// 标志位定义
// ============================================================

/**
 * 标志位配置
 * 标志位用于追踪游戏中的各种状态：
 * - 事件是否已触发
 * - 场景描述是否已看过
 * - 物品是否已获得过
 * - 任务进度
 * - 各种解锁状态
 * 等等
 */
export interface Flag {
  /** 标志位唯一ID */
  id: string
  /** 标志位名称（开发者可见，便于调试） */
  name: string
  /** 标志位备注 */
  notes?: string

  /** 标志位数据类型 */
  type: FlagType

  /** 默认值 */
  defaultValue: FlagValue

  /** 时间变化规则（可选，配置后引擎自动按时间修正此标志位值） */
  timeVarying?: TimeVaryingRule
}

// ============================================================
// 时间变化规则
// ============================================================

/**
 * 时间变化规则
 * 配置后，引擎在每次推进时间时会自动按规则修正 player.flags 中的对应值。
 * 事件效果仍然可以手动覆盖该值，引擎下次推进时再基于覆盖后的值继续修正。
 *
 * 模式说明：
 * - accumulate: 每经过 deltaPerMinute 分钟值变化指定的量，被钳制在 [min, max]
 *   （正数 delta 为累积，如资源再生；负数 delta 为衰减，如属性缓慢流失）
 * - reset_daily: 每天午夜0点重置为 resetValue
 * - periodic: 根据当前游戏时间（分钟 0-1439）查 schedule 确定值，覆盖写入
 */
export interface TimeVaryingRule {
  /** 时间变化模式 */
  mode: 'accumulate' | 'reset_daily' | 'periodic'

  /**
   * accumulate 模式使用：
   * 每经过一分钟值的变化量（正数增加，负数减少）
   * 值会被钳制在 [min, max] 范围内
   */
  deltaPerMinute?: number

  /** 最小值（accumulate 模式钳制下限） */
  min?: number

  /** 最大值（accumulate 模式钳制上限） */
  max?: number

  /** 每日重置值（reset_daily 模式使用） */
  resetValue?: FlagValue

  /** 周期性调度（periodic 模式使用，按游戏分钟 0-1439 判定） */
  schedule?: Array<{
    /** 起始分钟（含，0-1439） */
    startMinute: number
    /** 结束分钟（不含，0-1439，结束值可小于起始值表示跨天） */
    endMinute: number
    /** 此时间段内的值 */
    value: FlagValue
  }>
}

// ============================================================
// 标志位类型
// ============================================================

/**
 * 标志位数据类型
 */
export enum FlagType {
  /** 布尔型（最常用，如"是否触发过某事件"） */
  BOOLEAN = 'boolean',
  /** 数值型（如"击杀某敌人次数"、"捐赠物资数量"） */
  NUMBER = 'number',
  /** 字符串型（如"当前任务阶段名称"、"NPC好感度等级"） */
  STRING = 'string',
}

// ============================================================
// 标志位值
// ============================================================

/**
 * 标志位值类型
 */
export type FlagValue = boolean | number | string

/**
 * 标志位操作
 */
export enum FlagOperation {
  /** 设置值 */
  SET = 'set',
  /** 布尔取反 */
  TOGGLE = 'toggle',
  /** 数值增加 */
  ADD = 'add',
  /** 数值减少 */
  SUBTRACT = 'subtract',
}

// ============================================================
// 标志位注册表
// ============================================================

/**
 * 标志位注册表（全局标志位配置汇总）
 */
export interface FlagRegistry {
  /** 所有标志位配置，按ID索引 */
  flags: Record<string, Flag>
}
