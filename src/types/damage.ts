// damageType.ts - 伤害类型数据结构

// ============================================================
// 伤害类型定义
// ============================================================

/**
 * 伤害类型配置
 */
export interface DamageType {
  /** 伤害类型唯一ID */
  id: string
  /** 伤害类型名称（显示用） */
  name: string
  /** 伤害类型描述 */
  description: string
  /** 伤害类型图标资源ID */
  iconId: string
  /** 伤害类型对应文字颜色（用于战斗日志中显示伤害数值） */
  textColor: string
}

// ============================================================
// 预设伤害类型ID常量
// ============================================================

/** 伤害类型ID常量（便于代码中引用） */
export const DamageTypeId = {
  /** 劈砍（剑、斧等利器） */
  SLASH: 'slash',
  /** 穿刺（弓箭、长矛等） */
  PIERCE: 'pierce',
  /** 钝击（锤、棍棒等） */
  BLUNT: 'blunt',
  /** 火焰 */
  FIRE: 'fire',
  /** 冰冻 */
  COLD: 'cold',
  /** 雷电 */
  LIGHTNING: 'lightning',
  /** 毒素 */
  POISON: 'poison',
  /** 酸蚀 */
  ACID: 'acid',
  /** 精神/理智伤害 */
  MENTAL: 'mental',
  /** 流血（持续伤害类型） */
  BLEED: 'bleed',
  /** 真实伤害（无视防御） */
  TRUE: 'true',
} as const

/** 伤害类型ID类型 */
export type DamageTypeId = (typeof DamageTypeId)[keyof typeof DamageTypeId]

// ============================================================
// 伤害类型注册表
// ============================================================

/**
 * 伤害类型注册表
 */
export interface DamageTypeRegistry {
  damageTypes: Record<string, DamageType>
}