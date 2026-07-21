// config/weapons.ts - 武器类型配置实例

import type { WeaponType, WeaponTypeRegistry } from '../types/weapon'

const weaponTypes: Record<string, WeaponType> = {
  // ============================================================
  // 近战武器
  // ============================================================
  sword: {
    id: 'sword',
    name: '剑',
    description: '平衡的近战武器，攻守兼备，适合初学者和熟练者 alike',
    iconId: 'icon_wp_sword',
    primaryDamageTypeId: 'slash',
    isRanged: false,
    isTwoHandedByDefault: false,
    defaultStats: {
      baseDamage: 12,
      damageVariance: 0.15,
      attackRange: 1,
      accuracyModifier: 0.1,
      criticalChanceModifier: 0.05,
      criticalMultiplier: 2.0,
      attackSpeed: 1.0,
      staminaCostPerAttack: 12,
    },
    skillUnlocks: {
      0: ['basic_attack'],
      3: ['power_strike'],
      6: ['whirlwind'],
    },
    proficiencyGrowth: {
      expPerHit: 10,
      expPerCriticalHit: 25,
      expPerKill: 50,
    },
  },

  axe: {
    id: 'axe',
    name: '斧',
    description: '沉重的劈砍武器，伤害高但速度慢，也能用于砍伐树木',
    iconId: 'icon_wp_axe',
    primaryDamageTypeId: 'slash',
    isRanged: false,
    isTwoHandedByDefault: true,
    defaultStats: {
      baseDamage: 18,
      damageVariance: 0.25,
      attackRange: 1,
      accuracyModifier: -0.05,
      criticalChanceModifier: 0.1,
      criticalMultiplier: 2.5,
      attackSpeed: 0.7,
      staminaCostPerAttack: 20,
    },
    skillUnlocks: {
      0: ['basic_attack'],
      3: ['cleave'],
      7: ['berserker_rage'],
    },
    proficiencyGrowth: {
      expPerHit: 12,
      expPerCriticalHit: 30,
      expPerKill: 60,
    },
  },

  spear: {
    id: 'spear',
    name: '长矛',
    description: '长柄穿刺武器，攻击距离远，可在安全距离外攻击敌人',
    iconId: 'icon_wp_spear',
    primaryDamageTypeId: 'pierce',
    isRanged: false,
    isTwoHandedByDefault: true,
    defaultStats: {
      baseDamage: 14,
      damageVariance: 0.1,
      attackRange: 2,
      accuracyModifier: 0.05,
      criticalChanceModifier: 0.08,
      criticalMultiplier: 2.0,
      attackSpeed: 0.85,
      staminaCostPerAttack: 15,
    },
    skillUnlocks: {
      0: ['basic_attack'],
      4: ['aimed_shot'],
    },
    proficiencyGrowth: {
      expPerHit: 10,
      expPerCriticalHit: 20,
      expPerKill: 45,
    },
  },

  dagger: {
    id: 'dagger',
    name: '匕首',
    description: '轻巧灵活的短兵器，伤害低但攻速极快，适合偷袭和副手装备',
    iconId: 'icon_wp_dagger',
    primaryDamageTypeId: 'pierce',
    isRanged: false,
    isTwoHandedByDefault: false,
    defaultStats: {
      baseDamage: 8,
      damageVariance: 0.1,
      attackRange: 1,
      accuracyModifier: 0.2,
      criticalChanceModifier: 0.15,
      criticalMultiplier: 3.0,
      attackSpeed: 1.5,
      staminaCostPerAttack: 8,
    },
    skillUnlocks: {
      0: ['basic_attack'],
    },
    proficiencyGrowth: {
      expPerHit: 8,
      expPerCriticalHit: 35,
      expPerKill: 40,
    },
  },

  hammer: {
    id: 'hammer',
    name: '锤',
    description: '重型钝击武器，能有效击穿护甲，对变异生物有奇效',
    iconId: 'icon_wp_hammer',
    primaryDamageTypeId: 'blunt',
    isRanged: false,
    isTwoHandedByDefault: true,
    defaultStats: {
      baseDamage: 20,
      damageVariance: 0.2,
      attackRange: 1,
      accuracyModifier: -0.1,
      criticalChanceModifier: 0.05,
      criticalMultiplier: 2.0,
      attackSpeed: 0.6,
      staminaCostPerAttack: 25,
    },
    skillUnlocks: {
      0: ['basic_attack'],
      5: ['shield_bash'],
    },
    proficiencyGrowth: {
      expPerHit: 15,
      expPerCriticalHit: 25,
      expPerKill: 55,
    },
  },

  // ============================================================
  // 远程武器
  // ============================================================
  bow: {
    id: 'bow',
    name: '弓',
    description: '远程穿刺武器，可在远处攻击，但需要消耗箭矢',
    iconId: 'icon_wp_bow',
    primaryDamageTypeId: 'pierce',
    isRanged: true,
    isTwoHandedByDefault: true,
    defaultStats: {
      baseDamage: 10,
      damageVariance: 0.15,
      attackRange: 4,
      accuracyModifier: 0.0,
      criticalChanceModifier: 0.1,
      criticalMultiplier: 2.0,
      attackSpeed: 0.8,
      staminaCostPerAttack: 10,
    },
    skillUnlocks: {
      0: ['basic_attack'],
      3: ['aimed_shot'],
      6: ['multi_shot'],
    },
    proficiencyGrowth: {
      expPerHit: 10,
      expPerCriticalHit: 30,
      expPerKill: 50,
    },
  },

  crossbow: {
    id: 'crossbow',
    name: '弩',
    description: '机械远程武器，伤害高且精准，但装填慢，需要消耗弩箭',
    iconId: 'icon_wp_crossbow',
    primaryDamageTypeId: 'pierce',
    isRanged: true,
    isTwoHandedByDefault: true,
    defaultStats: {
      baseDamage: 22,
      damageVariance: 0.1,
      attackRange: 4,
      accuracyModifier: 0.2,
      criticalChanceModifier: 0.15,
      criticalMultiplier: 2.5,
      attackSpeed: 0.4,
      staminaCostPerAttack: 8,
    },
    skillUnlocks: {
      0: ['basic_attack'],
      4: ['aimed_shot'],
    },
    proficiencyGrowth: {
      expPerHit: 15,
      expPerCriticalHit: 35,
      expPerKill: 55,
    },
  },

  // ============================================================
  // 徒手与特殊
  // ============================================================
  fist: {
    id: 'fist',
    name: '徒手',
    description: '没有任何武器时的最后手段，伤害低但无需消耗体力以外的资源',
    iconId: 'icon_wp_fist',
    primaryDamageTypeId: 'blunt',
    isRanged: false,
    isTwoHandedByDefault: false,
    defaultStats: {
      baseDamage: 5,
      damageVariance: 0.2,
      attackRange: 1,
      accuracyModifier: 0.1,
      criticalChanceModifier: 0.02,
      criticalMultiplier: 1.5,
      attackSpeed: 1.2,
      staminaCostPerAttack: 5,
    },
    skillUnlocks: {
      0: ['basic_attack'],
      2: ['kick'],
    },
    proficiencyGrowth: {
      expPerHit: 5,
      expPerCriticalHit: 10,
      expPerKill: 20,
    },
  },

  shield: {
    id: 'shield',
    name: '盾',
    description: '防御装备，可格挡攻击并解锁防御技能',
    iconId: 'icon_wp_shield',
    primaryDamageTypeId: 'blunt',
    isRanged: false,
    isTwoHandedByDefault: false,
    defaultStats: {
      baseDamage: 6,
      damageVariance: 0.1,
      attackRange: 1,
      accuracyModifier: 0.0,
      criticalChanceModifier: 0.0,
      criticalMultiplier: 1.5,
      attackSpeed: 0.9,
      staminaCostPerAttack: 10,
    },
    skillUnlocks: {
      0: ['basic_attack'],
      3: ['shield_bash'],
      6: ['guard_stance'],
    },
    proficiencyGrowth: {
      expPerHit: 8,
      expPerCriticalHit: 15,
      expPerKill: 30,
    },
  },
}

export const weaponTypeRegistry: WeaponTypeRegistry = {
  weaponTypes,
}