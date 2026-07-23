// src/types/ending.ts
// 结局类型定义

/** 结局配置 */
export interface EndingConfig {
  /** 唯一标识 */
  id: string
  /** 结局名称 */
  name: string
  /** 结局描述文本 */
  description: string
  /** 结局等级（用于排序和评级） */
  rank: EndingRank
  /** 触发条件（所有条件满足时触发） */
  triggerConditions: EndingCondition[]
  /** 结局CG ID（可选） */
  cgId?: string
  /** 解锁后设置的标志位 */
  endingFlag?: string
}

/** 结局等级 */
export type EndingRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E'

/** 结局触发条件 */
export interface EndingCondition {
  /** 条件类型 */
  type: 'hpZero' | 'sanZero' | 'flagCheck'
  /** 条件说明文字 */
  description: string
  /** 检查的标志位ID（仅 flagCheck 类型使用） */
  flagId?: string
  /** 期望的标志位值（仅 flagCheck 类型使用） */
  expectedValue?: boolean | number | string
}

/** 结局注册表 */
export interface EndingRegistry {
  endings: Record<string, EndingConfig>
}
