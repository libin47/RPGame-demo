// config/weaponTypes.ts
import type { WeaponType, WeaponTypeRegistry } from '../types/weapon'
// 棍
const stick: WeaponType = {
  id: 'stick',
  name: '棍',
  description: '棍子',
  primaryDamageTypeId: 'slash',
  isRanged: false,
  defaultStats: {
    defaultDamageDice: '1d6',
    attackRange: 1,
    attackSpeed: 1.2,
    staminaCostPerAttack: 10,
  },
  skillUnlocks: {
    0: ['basic_stick'],
  },
  proficiencyGrowth: {
    expPerHit: 12,
    expPerCriticalHit: 25,
    expPerKill: 50,
  },
}
const sword: WeaponType = {
  id: 'sword',
  name: '剑',
  description: '平衡的近战武器，攻守兼备',
  primaryDamageTypeId: 'slash',
  isRanged: false,
  defaultStats: {
    defaultDamageDice: '1d8',
    attackRange: 1,
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
  primaryDamageTypeId: 'pierce',
  isRanged: true,
  defaultStats: {
    defaultDamageDice: '1d8',
    attackRange: 5,
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
  primaryDamageTypeId: 'pierce',
  isRanged: false,
  defaultStats: {
    defaultDamageDice: '1d10',
    attackRange: 2,
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

const axe: WeaponType = {
  id: 'axe',
  name: '斧',
  description: '兼具砍伐与战斗功能的斧类武器，势大力沉',
  primaryDamageTypeId: 'slash',
  isRanged: false,
  defaultStats: {
    defaultDamageDice: '1d10',
    attackRange: 1,
    attackSpeed: 0.8,
    staminaCostPerAttack: 17,
  },
  skillUnlocks: {
    0: ['basic_slash'],
    3: ['power_strike'],
  },
  proficiencyGrowth: {
    expPerHit: 10,
    expPerCriticalHit: 20,
    expPerKill: 45,
  },
}

const knife: WeaponType = {
  id: 'knife',
  name: '短刀',
  description: '轻巧灵活的短刃武器，出手迅捷',
  primaryDamageTypeId: 'slash',
  isRanged: false,
  defaultStats: {
    defaultDamageDice: '1d6',
    attackRange: 1,
    attackSpeed: 1.2,
    staminaCostPerAttack: 10,
  },
  skillUnlocks: {
    0: ['basic_slash'],
    3: ['power_strike'],
  },
  proficiencyGrowth: {
    expPerHit: 12,
    expPerCriticalHit: 25,
    expPerKill: 50,
  },
}

const unarmed: WeaponType = {
  id: 'unarmed',
  name: '徒手',
  description: '不使用武器时的徒手攻击',
  primaryDamageTypeId: 'blunt',
  isRanged: false,
  defaultStats: {
    defaultDamageDice: '1d4',
    attackRange: 1,
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
    stick,
    sword,
    bow,
    spear,
    axe,
    knife,
    unarmed,
  },
}
