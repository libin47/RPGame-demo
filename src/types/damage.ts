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
  // 无视防御系数（1为无视防御，0为不无视防御，中间值为部分无视）
  defensePenetration: number
}

// ============================================================
// 伤害类型注册表
// ============================================================

/**
 * 伤害类型注册表
 */
export interface DamageTypeRegistry {
  damageTypes: Record<string, DamageType>
}
