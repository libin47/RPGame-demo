// weaponType.ts - 武器类型数据结构

// ============================================================
// 武器类型定义
// ============================================================

/**
 * 武器类型配置
 * 定义一类武器的通用属性，如剑、斧、弓、长矛等。
 * 具体的武器物品（如"铁剑"、"铜剑"）在 item.ts 中配置，
 * 通过 weaponTypeId 关联到此类型。
 */
export interface WeaponType {
  /** 武器类型唯一ID */
  id: string
  /** 武器类型名称（显示用，如"剑"、"弓"） */
  name: string
  /** 武器类型描述 */
  description: string
  /** 武器类型图标资源ID */
  iconId: string

  /** 主要伤害类型ID */
  primaryDamageTypeId: string

  /** 是否为远程武器 */
  isRanged: boolean

  /**
   * 该武器类型的默认属性模板
   * 创建该类型的具体武器物品时，可作为 WeaponStats 的默认值
   */
  defaultStats: WeaponTypeDefaultStats

  /**
   * 技能解锁表
   * 键为武器熟练度等级，值为该等级解锁的战斗技能ID列表
   * 例如：{ 0: ['basic_slash'], 3: ['power_strike'], 7: ['whirlwind'] }
   * 熟练度0的技能在装备武器时即解锁（普攻等基础技能）
   */
  skillUnlocks: Record<number, string[]>

  /**
   * 熟练度成长配置
   * 该武器类型的熟练度经验获取倍率
   */
  proficiencyGrowth: WeaponProficiencyGrowth
}

/**
 * 武器类型默认属性
 */
export interface WeaponTypeDefaultStats {
  /** 基础伤害 */
  baseDamage: number
  /** 伤害浮动范围 */
  damageVariance: number
  /** 攻击距离 */
  attackRange: number
  /** 基础命中修正 */
  accuracyModifier: number
  /** 基础暴击率修正 */
  criticalChanceModifier: number
  /** 暴击倍率 */
  criticalMultiplier: number
  /** 攻击速度 */
  attackSpeed: number
  /** 每次攻击基础消耗体力 */
  staminaCostPerAttack: number
}

/**
 * 武器熟练度成长配置
 */
export interface WeaponProficiencyGrowth {
  /** 使用该类型武器技能攻击命中时获得的熟练度经验 */
  expPerHit: number
  /** 使用该类型武器技能造成暴击时额外获得的经验 */
  expPerCriticalHit: number
  /** 击杀敌人时额外获得的经验 */
  expPerKill: number
}

// ============================================================
// 武器类型注册表
// ============================================================

/**
 * 武器类型注册表
 */
export interface WeaponTypeRegistry {
  weaponTypes: Record<string, WeaponType>
}
