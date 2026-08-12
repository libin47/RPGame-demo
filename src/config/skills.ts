// config/skills.ts
import { AttributeType } from '@/types/effect'
import type { BattleSkill, PassiveSkill, SkillRegistry } from '../types/skill'

// ===== 战斗技能 =====

/** 描述文本公共占位符：{damage} 实际伤害、{target} 目标名、{weapon} 武器名、{name} 技能名 */
const axeSlash: BattleSkill = {
  id: 'axe_slash',
  name: '斧头挥砍',
  description: '使用斧头进行基础的挥砍攻击',
  iconId: 'icon_skill_basic_slash',
  skillType: 'battle',
  unlockCondition: '武器熟练度: 斧 0',
  weaponRestriction: 'axe',
  damageTypeId: 'slash',
  stats: {
    damageMultiplier: 1.2,
    scalingAttribute: AttributeType.STRENGTH,
    accuracyModifier: -5,
    narrativeTexts: {
      hit: [
        '你抡起{weapon}，重重砍在{target}身上，造成{damage}点伤害',
        '斧刃切入{target}的躯体，造成{damage}点伤害',
      ],
      miss: ['斧头带着风声挥过，{target}灵巧地躲开了'],
      critHit: ['你使出全力，{weapon}狠狠劈入{target}要害，造成{damage}点暴击伤害！'],
      critMiss: ['你暴起的致命一击竟被{target}堪堪躲过！'],
    },
  },
  costs: [{ costType: 'stamina', value: 15 }],
}

const basicSlash: BattleSkill = {
  id: 'basic_slash',
  name: '挥砍',
  description: '使用剑进行基础的挥砍攻击',
  iconId: 'icon_skill_basic_slash',
  skillType: 'battle',
  unlockCondition: '武器熟练度: 剑 0',
  weaponRestriction: 'sword',
  damageTypeId: 'slash',
  stats: {
    damageMultiplier: 1,
    scalingAttribute: AttributeType.STRENGTH,
    narrativeTexts: {
      hit: [
        '你挥动{weapon}，对{target}造成了{damage}点伤害',
        '剑光闪过，{target}被划出一道伤口，受到{damage}点伤害',
      ],
      miss: ['你的攻击被{target}躲开了'],
      critHit: ['你的{weapon}精准命中{target}要害，造成{damage}点暴击伤害！'],
      critMiss: ['你瞄准{target}的要害挥出致命一击，却被对方闪开！'],
    },
  },
  costs: [{ costType: 'stamina', value: 15 }],
}

const powerStrike: BattleSkill = {
  id: 'power_strike',
  name: '强力打击',
  description: '蓄力后释放强力一击，伤害大幅提升但命中略有下降',
  iconId: 'icon_skill_power_strike',
  skillType: 'battle',
  unlockCondition: '武器熟练度: 剑 3',
  weaponRestriction: 'sword',
  damageTypeId: 'slash',
  stats: {
    damageMultiplier: 2,
    bonusDamage: 5,
    scalingAttribute: AttributeType.STRENGTH,
    accuracyModifier: -10,
    criticalModifier: 5,
    narrativeTexts: {
      hit: ['你蓄力猛击{target}，造成了{damage}点重创伤害'],
      miss: ['蓄力攻击偏离了目标，你扑了个空'],
      critHit: ['你蓄满全身之力的一击轰在{target}身上，造成{damage}点毁灭性暴击伤害！'],
      critMiss: ['你的全力一击呼啸而过，竟被{target}惊险避开！'],
    },
  },
  costs: [{ costType: 'stamina', value: 30 }],
  cooldown: 3,
}

const quickShot: BattleSkill = {
  id: 'quick_shot',
  name: '速射',
  description: '快速射出一箭',
  iconId: 'icon_skill_quick_shot',
  skillType: 'battle',
  unlockCondition: '武器熟练度: 弓 0',
  weaponRestriction: 'bow',
  damageTypeId: 'pierce',
  stats: {
    damageMultiplier: 1,
    scalingAttribute: AttributeType.AGILITY,
    narrativeTexts: {
      hit: ['你迅速射出一箭，命中{target}造成{damage}点伤害'],
      miss: ['箭矢偏离了目标，钉在了空地上'],
      critHit: ['你的箭矢精准贯入{target}要害，造成{damage}点暴击伤害！'],
      critMiss: ['这一箭本可穿透{target}的咽喉，却被其侧身闪过！'],
    },
  },
  costs: [{ costType: 'stamina', value: 12 }],
}

const aimedShot: BattleSkill = {
  id: 'aimed_shot',
  name: '瞄准射击',
  description: '仔细瞄准后射击，命中与暴击大幅提升',
  iconId: 'icon_skill_aimed_shot',
  skillType: 'battle',
  unlockCondition: '武器熟练度: 弓 4',
  weaponRestriction: 'bow',
  damageTypeId: 'pierce',
  stats: {
    damageMultiplier: 1.5,
    scalingAttribute: AttributeType.AGILITY,
    accuracyModifier: 20,
    criticalModifier: 25,
    narrativeTexts: {
      hit: ['你屏息瞄准，精准命中{target}要害，造成{damage}点伤害'],
      miss: ['瞄准射击未能命中，你只得拉弓再战'],
      critHit: ['你射出致命一箭，深深没入{target}要害，造成{damage}点暴击伤害！'],
      critMiss: ['你精心瞄准的一箭，竟被{target}以不可思议的角度躲过！'],
    },
  },
  costs: [{ costType: 'stamina', value: 25 }],
  cooldown: 2,
}

const thrust: BattleSkill = {
  id: 'thrust',
  name: '突刺',
  description: '使用长矛向前猛刺',
  iconId: 'icon_skill_thrust',
  skillType: 'battle',
  unlockCondition: '武器熟练度: 长矛 0',
  weaponRestriction: 'spear',
  damageTypeId: 'pierce',
  stats: {
    damageMultiplier: 1,
    scalingAttribute: AttributeType.STRENGTH,
    criticalModifier: 10,
    narrativeTexts: {
      hit: ['你猛力突刺，长矛贯穿{target}造成{damage}点伤害'],
      miss: ['突刺未能命中，长矛扎了个空'],
      critHit: ['长矛如毒蛇般刺中{target}要害，造成{damage}点暴击伤害！'],
      critMiss: ['你致命的一刺竟被{target}惊险避开！'],
    },
  },
  costs: [{ costType: 'stamina', value: 18 }],
}

const punch: BattleSkill = {
  id: 'punch',
  name: '拳击',
  description: '用拳头攻击敌人',
  iconId: 'icon_skill_punch',
  skillType: 'battle',
  unlockCondition: '武器熟练度: 徒手 0',
  weaponRestriction: 'unarmed',
  damageTypeId: 'blunt',
  stats: {
    damageMultiplier: 1,
    scalingAttribute: AttributeType.STRENGTH,
    criticalModifier: 5,
    narrativeTexts: {
      hit: ['你一拳打在{target}身上，造成{damage}点伤害'],
      miss: ['你的拳头挥空了'],
      critHit: ['你瞅准时机，一拳重重砸在{target}要害，造成{damage}点暴击伤害！'],
      critMiss: ['你突袭的要害一拳被{target}躲过！'],
    },
  },
  costs: [{ costType: 'stamina', value: 8 }],
}

const basicAttack: BattleSkill = {
  id: 'basic_attack',
  name: '攻击',
  description: '使用当前装备的武器进行普通攻击',
  iconId: 'icon_skill_basic_attack',
  skillType: 'battle',
  unlockCondition: '默认解锁',
  // 不设 attackDistance：攻击距离取当前武器（武器未设置则为1）
  stats: {
    damageMultiplier: 1,
    scalingAttribute: AttributeType.STRENGTH,
    narrativeTexts: {
      hit: [
        '你对{target}发动攻击，造成{damage}点伤害',
        '你挥动{weapon}攻向{target}，造成{damage}点伤害',
      ],
      miss: ['你的攻击被{target}躲开了'],
      critHit: ['你的攻击精准命中{target}要害，造成{damage}点暴击伤害！'],
      critMiss: ['你盯准的致命破绽一击，竟被{target}闪过！'],
    },
  },
  costs: [],
}

// ===== 被动技能 =====

const ironStomach: PassiveSkill = {
  id: 'iron_stomach',
  name: '铁胃',
  description: '食用变质食物时减少50%的负面效果',
  iconId: 'icon_passive_iron_stomach',
  skillType: 'passive',
  effects: [],
  attributeBonuses: [],
  isStackable: false,
}

const nightVision: PassiveSkill = {
  id: 'night_vision',
  name: '夜视',
  description: '在黑暗中视野+2',
  iconId: 'icon_passive_night_vision',
  skillType: 'passive',
  effects: [],
  attributeBonuses: [],
  isStackable: false,
}

const resilientMind: PassiveSkill = {
  id: 'resilient_mind',
  name: '坚韧心智',
  description: 'SAN值损失减少20%',
  iconId: 'icon_passive_resilient_mind',
  skillType: 'passive',
  effects: [],
  attributeBonuses: [
    {
      attribute: AttributeType.SAN,
      value: 0.2,
      modifierType: 'multiply',
    },
  ],
  isStackable: false,
}

export const skillRegistry: SkillRegistry = {
  battleSkills: {
    basic_slash: basicSlash,
    power_strike: powerStrike,
    quick_shot: quickShot,
    aimed_shot: aimedShot,
    thrust,
    punch,
    basic_attack: basicAttack,
    axe_slash: axeSlash,
  },
  passiveSkills: {
    iron_stomach: ironStomach,
    night_vision: nightVision,
    resilient_mind: resilientMind,
  },
}
