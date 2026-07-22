// config/characters.ts
import type { CharacterClass, CharacterRegistry } from '../types/character'

const survivor: CharacterClass = {
  id: 'survivor',
  name: '幸存者',
  notes: '默认职业，均衡型',
  description: '你是一名普通的乘客，在飞机失事后流落到这座神秘的岛屿。没有特殊技能，但也没有明显的弱点。',
  detailedDescription: '作为普通人，你需要在这座岛上学会一切生存技能。均衡的基础属性让你可以自由选择发展方向。',
  iconId: 'icon_class_survivor',
  difficulty: 2,
  difficultyDescription: '适合新手——均衡的属性让你可以应对各种情况',
  initialAttributes: {
    strength: 10,
    agility: 10,
    intelligence: 10,
    constitution: 10,
  },
  initialEquipment: [],
  initialInventory: [
    {
      itemId: 'cloth_scrap',
      quantity: 2,
    },
  ],
  initialPassiveSkillIds: [],
  initialSurvivalSkillLevels: [
    { skillId: 'exploration', level: 1 },
  ],
  initialWeaponProficiency: [],
  initialCraftRecipeIds: ['craft_bandage'],
  initialCookRecipeIds: ['cook_crab_meat'],
  initialBuildRecipeIds: ['build_wooden_wall'],
  classBonuses: [
    {
      id: 'survivor_adaptability',
      name: '适应力',
      description: '所有经验获取+10%',
      effects: [],
    },
  ],
  initialFlags: {
    current_quest_stage: 'woke_up_on_beach',
    first_time_on_beach: true,
  },
}

const doctor: CharacterClass = {
  id: 'doctor',
  name: '医生',
  notes: '治疗专精职业',
  description: '你是一名随行的医疗人员。你的医学知识在这座岛上可能比任何武器都更有价值。',
  detailedDescription: '医生擅长治疗和药物制作。你初始就掌握了绷带和基础药物的制作方法，并拥有更高的智力属性。但你并不擅长战斗。',
  iconId: 'icon_class_doctor',
  difficulty: 3,
  difficultyDescription: '适合进阶玩家——治疗能力强但战斗能力较弱',
  initialAttributes: {
    strength: 7,
    agility: 8,
    intelligence: 14,
    constitution: 10,
  },
  initialEquipment: [],
  initialInventory: [
    {
      itemId: 'bandage',
      quantity: 3,
    },
    {
      itemId: 'cloth_scrap',
      quantity: 5,
    },
  ],
  initialPassiveSkillIds: ['iron_stomach'],
  initialSurvivalSkillLevels: [
    { skillId: 'exploration', level: 1 },
  ],
  initialWeaponProficiency: [],
  initialCraftRecipeIds: ['craft_bandage'],
  initialCookRecipeIds: ['cook_crab_meat'],
  initialBuildRecipeIds: ['build_campfire', 'build_wooden_wall'],
  classBonuses: [
    {
      id: 'doctor_medical_training',
      name: '医学训练',
      description: '使用药品效果+25%',
      effects: [],
    },
    {
      id: 'doctor_steady_hands',
      name: '稳定的双手',
      description: '制作成功率+10%',
      effects: [],
    },
  ],
  initialFlags: {
    current_quest_stage: 'woke_up_on_beach',
    first_time_on_beach: true,
  },
}

const hunter: CharacterClass = {
  id: 'hunter',
  name: '猎人',
  notes: '战斗专精职业',
  description: '你是一名经验丰富的猎人。追踪猎物对你来说如同本能，而使用弓弩更是得心应手。',
  detailedDescription: '猎人擅长追踪和远程战斗。初始携带简易木弓，并且采集和追踪能力更强。但你的社交能力和智力相对较低。',
  iconId: 'icon_class_hunter',
  difficulty: 2,
  difficultyDescription: '适合新手——初期战斗力强，生存能力高',
  initialAttributes: {
    strength: 10,
    agility: 14,
    intelligence: 7,
    constitution: 12,
  },
  initialEquipment: [
    {
      itemId: 'makeshift_bow',
      slot: 'weapon',
    },
  ],
  initialInventory: [
    {
      itemId: 'cloth_scrap',
      quantity: 1,
    },
  ],
  initialPassiveSkillIds: ['night_vision'],
  initialSurvivalSkillLevels: [
    { skillId: 'exploration', level: 2 },
    { skillId: 'gathering', level: 2 },
  ],
  initialWeaponProficiency: [
    { weaponTypeId: 'bow', level: 1 },
  ],
  initialBattleSkillIds: ['quick_shot'],
  initialCraftRecipeIds: ['craft_bandage'],
  initialCookRecipeIds: ['cook_crab_meat'],
  initialBuildRecipeIds: ['build_campfire'],
  classBonuses: [
    {
      id: 'hunter_tracking',
      name: '追踪本能',
      description: '探索时发现战斗事件的概率降低30%',
      effects: [],
    },
    {
      id: 'hunter_butcher',
      name: '狩猎专家',
      description: '从动物敌人身上获得的战利品+50%',
      effects: [],
    },
  ],
  initialFlags: {
    current_quest_stage: 'woke_up_on_beach',
    first_time_on_beach: true,
  },
}

export const characterRegistry: CharacterRegistry = {
  classes: {
    survivor,
    doctor,
    hunter,
  },
  selectionOrder: ['survivor', 'doctor', 'hunter'],
  defaultClassId: 'survivor',
}