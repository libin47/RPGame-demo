// config/weaponTypes.ts
import type { WeaponType, WeaponTypeRegistry } from '../types/weapon'

const sword: WeaponType = {
  id: 'sword',
  name: '剑',
  description: '平衡的近战武器，攻守兼备',
  iconId: 'icon_weapon_sword',
  primaryDamageTypeId: 'slash',
  isRanged: false,
  defaultStats: {
    baseDamage: 12,
    damageVariance: 0.15,
    attackRange: 1,
    accuracyModifier: 0.05,
    criticalChanceModifier: 0.1,
    criticalMultiplier: 2.0,
    attackSpeed: 1.0,
    staminaCostPerAttack: 15,
  },
  skillUnlocks: {
    0: ['basic_slash'],
    3: ['power_strike'],
    7: ['whirlwind_slash'],
  },
  proficiencyGrowth: {
    expPerHit: 10,
    expPerCriticalHit: 25,
    expPerKill: 50,
  },
}

const bow: WeaponType = {
  id: 'bow',
  name: '弓',
  description: '远程武器，可在安全距离攻击敌人',
  iconId: 'icon_weapon_bow',
  primaryDamageTypeId: 'pierce',
  isRanged: true,
  defaultStats: {
    baseDamage: 10,
    damageVariance: 0.2,
    attackRange: 5,
    accuracyModifier: -0.05,
    criticalChanceModifier: 0.15,
    criticalMultiplier: 2.5,
    attackSpeed: 0.8,
    staminaCostPerAttack: 12,
  },
  skillUnlocks: {
    0: ['quick_shot'],
    4: ['aimed_shot'],
    8: ['arrow_rain'],
  },
  proficiencyGrowth: {
    expPerHit: 12,
    expPerCriticalHit: 30,
    expPerKill: 60,
  },
}

const spear: WeaponType = {
  id: 'spear',
  name: '长矛',
  description: '长柄武器，攻击距离较远',
  iconId: 'icon_weapon_spear',
  primaryDamageTypeId: 'pierce',
  isRanged: false,
  defaultStats: {
    baseDamage: 14,
    damageVariance: 0.2,
    attackRange: 2,
    accuracyModifier: 0.0,
    criticalChanceModifier: 0.08,
    criticalMultiplier: 2.0,
    attackSpeed: 0.7,
    staminaCostPerAttack: 18,
  },
  skillUnlocks: {
    0: ['thrust'],
    3: ['sweep'],
    6: ['impale'],
  },
  proficiencyGrowth: {
    expPerHit: 10,
    expPerCriticalHit: 20,
    expPerKill: 45,
  },
}

const unarmed: WeaponType = {
  id: 'unarmed',
  name: '徒手',
  description: '不使用武器时的徒手攻击',
  iconId: 'icon_weapon_unarmed',
  primaryDamageTypeId: 'blunt',
  isRanged: false,
  defaultStats: {
    baseDamage: 5,
    damageVariance: 0.1,
    attackRange: 1,
    accuracyModifier: 0.1,
    criticalChanceModifier: 0.05,
    criticalMultiplier: 1.5,
    attackSpeed: 1.2,
    staminaCostPerAttack: 8,
  },
  skillUnlocks: {
    0: ['punch'],
    5: ['roundhouse_kick'],
  },
  proficiencyGrowth: {
    expPerHit: 8,
    expPerCriticalHit: 20,
    expPerKill: 40,
  },
}

export const weaponTypeRegistry: WeaponTypeRegistry = {
  weaponTypes: {
    sword,
    bow,
    spear,
    unarmed,
  },
}