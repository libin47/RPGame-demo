// config/damageTypes.ts
import type { DamageType, DamageTypeRegistry } from '../types/damage'

const slash: DamageType = {
  id: 'slash',
  name: '斩击',
  description: '由刀剑等锐利武器造成的切割伤害',
  iconId: 'icon_damage_slash',
  textColor: '#e74c3c',
  defensePenetration: 0.1,
}

const pierce: DamageType = {
  id: 'pierce',
  name: '穿刺',
  description: '由弓箭、长矛等尖锐武器造成的穿透伤害',
  iconId: 'icon_damage_pierce',
  textColor: '#e67e22',
  defensePenetration: 0.2,
}

const blunt: DamageType = {
  id: 'blunt',
  name: '钝击',
  description: '由锤、棍棒等钝器造成的冲击伤害',
  iconId: 'icon_damage_blunt',
  textColor: '#95a5a6',
  defensePenetration: 0.0,
}

const ranged: DamageType = {
  id: 'ranged',
  name: '远程',
  description: '由远程武器造成的远程伤害',
  iconId: 'icon_damage_ranged',
  textColor: '#5feaf4ff',
  defensePenetration: 0.0,
}

const poison: DamageType = {
  id: 'poison',
  name: '毒素',
  description: '由毒液、毒气等造成的毒性伤害',
  iconId: 'icon_damage_poison',
  textColor: '#2ecc71',
  defensePenetration: 0.5,
}
const fire: DamageType = {
  id: 'fire',
  name: '火焰',
  description: '由火焰等造成的火焰伤害',
  iconId: 'icon_damage_fire',
  textColor: '#f39c25',
  defensePenetration: 0.5,
}
const realDamage: DamageType = {
  id: 'realDamage',
  name: '真实伤害',
  description: '由不可描述的力量造成的伤害，无法被防御忽略',
  iconId: 'icon_damage_real',
  textColor: '#04ff00ff',
  defensePenetration: 1,
}

export const damageTypeRegistry: DamageTypeRegistry = {
  damageTypes: {
    slash,
    pierce,
    blunt,
    ranged,
    poison,
    fire,
    realDamage,
  },
}
