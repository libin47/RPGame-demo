// config/skills.ts
import { AttributeType } from '@/types/effect'
import type {
  SurvivalSkill,
  BattleSkill,
  PassiveSkill,
  SkillRegistry,
} from '../types/skill'
import { BattleSkillTargetType } from '../types/skill'

// ===== 生存技能 =====

const exploration: SurvivalSkill = {
  id: 'exploration',
  name: '探索',
  description: '影响探索场景时发现事件的概率和奖励',
  iconId: 'icon_skill_exploration',
  skillType: 'survival',
  maxLevel: 10,
  expToNextLevel: (currentLevel: number) => currentLevel * 100,
  levelBonus: {
    bonusPerLevel: 0.05,
    specialAbilities: [
      {
        requiredLevel: 5,
        description: '探索时有概率发现隐藏区域',
        effects: [],
      },
      {
        requiredLevel: 10,
        description: '探索消耗体力减半',
        effects: [],
      },
    ],
  },
  relatedInteractionIds: ['explore_beach', 'explore_forest', 'explore_cave'],
  expPerAction: 25,
}

const cooking: SurvivalSkill = {
  id: 'cooking',
  name: '烹饪',
  description: '影响烹饪食物时的品质和效率',
  iconId: 'icon_skill_cooking',
  skillType: 'survival',
  maxLevel: 10,
  expToNextLevel: (currentLevel: number) => currentLevel * 100,
  levelBonus: {
    bonusPerLevel: 0.06,
    specialAbilities: [
      {
        requiredLevel: 3,
        description: '解锁炖汤配方',
        effects: [],
      },
      {
        requiredLevel: 7,
        description: '烹饪有概率产出双份',
        effects: [],
      },
    ],
  },
  relatedInteractionIds: ['cook_at_campfire', 'cook_at_kitchen'],
  expPerAction: 30,
}

const gathering: SurvivalSkill = {
  id: 'gathering',
  name: '采集',
  description: '影响采集植物、果实等资源的效率',
  iconId: 'icon_skill_gathering',
  skillType: 'survival',
  maxLevel: 10,
  expToNextLevel: (currentLevel: number) => currentLevel * 100,
  levelBonus: {
    bonusPerLevel: 0.04,
    specialAbilities: [
      {
        requiredLevel: 5,
        description: '可辨识有毒植物',
        effects: [],
      },
    ],
  },
  relatedInteractionIds: ['gather_herbs', 'gather_berries'],
  expPerAction: 20,
}

// ===== 战斗技能 =====

const basicSlash: BattleSkill = {
  id: 'basic_slash',
  name: '挥砍',
  description: '使用剑进行基础的挥砍攻击',
  iconId: 'icon_skill_basic_slash',
  skillType: 'battle',
  level: 0,
  maxLevel: 10,
  unlockCondition: '武器熟练度: 剑 0',
  weaponRestriction: 'sword',
  damageTypeId: 'slash',
  stats: {
    damageMultiplier: 1.0,
    strengthScaling: 0.8,
    agilityScaling: 0.2,
    intelligenceScaling: 0.0,
    accuracyModifier: 0.0,
    criticalChanceModifier: 0.0,
    criticalMultiplierBonus: 0.0,
  },
  costs: [{ costType: 'stamina', value: 15 }],
  cooldown: 0,
  targetType: BattleSkillTargetType.SINGLE_ENEMY,
  onHitEffects: [],
  useTextTemplate: '你挥动武器，对{target}造成了{damage}点伤害',
  missTextTemplate: '你的攻击落空了',
  isDefaultAttack: true,
}

const powerStrike: BattleSkill = {
  id: 'power_strike',
  name: '强力打击',
  description: '蓄力后释放强力一击，伤害大幅提升但命中略有下降',
  iconId: 'icon_skill_power_strike',
  skillType: 'battle',
  level: 0,
  maxLevel: 10,
  unlockCondition: '武器熟练度: 剑 3',
  weaponRestriction: 'sword',
  damageTypeId: 'slash',
  stats: {
    damageMultiplier: 2.0,
    strengthScaling: 1.2,
    agilityScaling: 0.0,
    intelligenceScaling: 0.0,
    accuracyModifier: -0.15,
    criticalChanceModifier: 0.05,
    criticalMultiplierBonus: 0.5,
  },
  costs: [{ costType: 'stamina', value: 30 }],
  cooldown: 3,
  targetType: BattleSkillTargetType.SINGLE_ENEMY,
  onHitEffects: [],
  useTextTemplate: '你蓄力猛击{target}，造成了{damage}点重创伤害',
  missTextTemplate: '蓄力攻击偏离了目标',
}

const quickShot: BattleSkill = {
  id: 'quick_shot',
  name: '速射',
  description: '快速射出一箭',
  iconId: 'icon_skill_quick_shot',
  skillType: 'battle',
  level: 0,
  maxLevel: 10,
  unlockCondition: '武器熟练度: 弓 0',
  weaponRestriction: 'bow',
  damageTypeId: 'pierce',
  stats: {
    damageMultiplier: 1.0,
    strengthScaling: 0.3,
    agilityScaling: 0.7,
    intelligenceScaling: 0.0,
    accuracyModifier: 0.0,
    criticalChanceModifier: 0.0,
    criticalMultiplierBonus: 0.0,
  },
  costs: [{ costType: 'stamina', value: 12 }],
  cooldown: 0,
  targetType: BattleSkillTargetType.SINGLE_ENEMY,
  onHitEffects: [],
  useTextTemplate: '你迅速射出一箭，命中{target}造成{damage}点伤害',
  missTextTemplate: '箭矢偏离了目标',
  isDefaultAttack: true,
}

const aimedShot: BattleSkill = {
  id: 'aimed_shot',
  name: '瞄准射击',
  description: '仔细瞄准后射击，暴击率大幅提升',
  iconId: 'icon_skill_aimed_shot',
  skillType: 'battle',
  level: 0,
  maxLevel: 10,
  unlockCondition: '武器熟练度: 弓 4',
  weaponRestriction: 'bow',
  damageTypeId: 'pierce',
  stats: {
    damageMultiplier: 1.5,
    strengthScaling: 0.5,
    agilityScaling: 0.8,
    intelligenceScaling: 0.0,
    accuracyModifier: 0.2,
    criticalChanceModifier: 0.25,
    criticalMultiplierBonus: 1.0,
  },
  costs: [{ costType: 'stamina', value: 25 }],
  cooldown: 2,
  targetType: BattleSkillTargetType.SINGLE_ENEMY,
  onHitEffects: [],
  useTextTemplate: '你屏息瞄准，精准命中{target}要害，造成{damage}点伤害',
  missTextTemplate: '瞄准射击未能命中',
}

const thrust: BattleSkill = {
  id: 'thrust',
  name: '突刺',
  description: '使用长矛向前猛刺',
  iconId: 'icon_skill_thrust',
  skillType: 'battle',
  level: 0,
  maxLevel: 10,
  unlockCondition: '武器熟练度: 长矛 0',
  weaponRestriction: 'spear',
  damageTypeId: 'pierce',
  stats: {
    damageMultiplier: 1.0,
    strengthScaling: 0.6,
    agilityScaling: 0.4,
    intelligenceScaling: 0.0,
    accuracyModifier: 0.05,
    criticalChanceModifier: 0.1,
    criticalMultiplierBonus: 0.0,
  },
  costs: [{ costType: 'stamina', value: 18 }],
  cooldown: 0,
  targetType: BattleSkillTargetType.SINGLE_ENEMY,
  onHitEffects: [],
  useTextTemplate: '你猛力突刺，长矛贯穿{target}造成{damage}点伤害',
  missTextTemplate: '突刺未能命中',
  isDefaultAttack: true,
}

const punch: BattleSkill = {
  id: 'punch',
  name: '拳击',
  description: '用拳头攻击敌人',
  iconId: 'icon_skill_punch',
  skillType: 'battle',
  level: 0,
  maxLevel: 10,
  unlockCondition: '武器熟练度: 徒手 0',
  weaponRestriction: 'unarmed',
  damageTypeId: 'blunt',
  stats: {
    damageMultiplier: 1.0,
    strengthScaling: 1.0,
    agilityScaling: 0.0,
    intelligenceScaling: 0.0,
    accuracyModifier: 0.1,
    criticalChanceModifier: 0.05,
    criticalMultiplierBonus: 0.0,
  },
  costs: [{ costType: 'stamina', value: 8 }],
  cooldown: 0,
  targetType: BattleSkillTargetType.SINGLE_ENEMY,
  onHitEffects: [],
  useTextTemplate: '你一拳打在{target}身上，造成{damage}点伤害',
  missTextTemplate: '你的拳头挥空了',
  isDefaultAttack: true,
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
  survivalSkills: {
    exploration,
    cooking,
    gathering,
  },
  battleSkills: {
    basic_slash: basicSlash,
    power_strike: powerStrike,
    quick_shot: quickShot,
    aimed_shot: aimedShot,
    thrust,
    punch,
  },
  passiveSkills: {
    iron_stomach: ironStomach,
    night_vision: nightVision,
    resilient_mind: resilientMind,
  },
}