// params.ts - 参数数据结构
// 全局使用的复杂参数，区别于flag只会随事件、场景变动，此参数可随时间和其他因素变化

// ============================================================
// 参数定义
// ============================================================

/**
 * 参数配置
 * 参数用于追踪游戏中的各种状态：
 * - 事件是否已触发
 * - 场景描述是否已看过
 * - 物品是否已获得过
 * - 任务进度
 * - 各种解锁状态
 * 等等
 */
export interface Param {
  /** 参数唯一ID */
  id: string
  /** 参数名称（开发者可见，便于调试） */
  name?: string
  /** 默认值 */
  defaultValue: number
  /** 时间变化规则（可选，配置后引擎自动按时间修正此参数值） */
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
   * 每经过一天的变化量（正数增加，负数减少）
   * 值会被钳制在 [min, max] 范围内
   */
  deltaPerDay?: number
  // 恢复系数（accumulate 模式使用）与现有值正比，用于计算每分钟变化量
  recoveryPerDay?: number
  // 关联的参数ID，用于计算恢复系数，没有则是自己
  recoveryBaseId?: string

  /** 最小值（accumulate 模式钳制下限） */
  min?: number

  /** 最大值（accumulate 模式钳制上限） */
  max?: number

  /** 每日重置值（reset_daily 模式使用） */
  resetValue?: number

  /** 周期性调度（periodic 模式使用，按游戏分钟 0-1439 判定） */
  schedule?: Array<{
    /** 起始分钟（含，0-1439） */
    startMinute: number
    /** 结束分钟（不含，0-1439，结束值可小于起始值表示跨天） */
    endMinute: number
    /** 此时间段内的值 */
    value: number
  }>
}

// ============================================================
// 标志位注册表
// ============================================================

/**
 * 参数注册表（全局参数配置汇总）
 */
export interface ParamRegistry {
  /** 所有参数配置，按ID索引 */
  params: Record<string, Param>
}
