import type { CharacterDef } from '@/types/content'

export const characters: CharacterDef[] = [
  {
    id: 'doctor',
    name: '医生',
    description: '能配制简易抗生素，医疗相关行动更熟练。',
    bonuses: { intelligence: 2, craft: 1 },
    weaknesses: { strength: -1 },
    traits: ['can_make_antibiotics'],
  },
  {
    id: 'engineer',
    name: '工程师',
    description: '擅长净水器与发电机一类装置的修复与制造。',
    bonuses: { intelligence: 2, craft: 2 },
    weaknesses: { agility: -1 },
    traits: ['advanced_filter', 'fix_generator'],
  },
  {
    id: 'hunter',
    name: '猎人',
    description: '追踪、剥皮与狩猎更强。',
    bonuses: { agility: 2, scout: 2, stealth: 1 },
    weaknesses: { intelligence: -1 },
    traits: ['tracker'],
  },
  {
    id: 'cook',
    name: '厨师',
    description: '烹饪的食物恢复效果更好。',
    bonuses: { constitution: 1, craft: 1 },
    weaknesses: { strength: -1 },
    traits: ['better_food'],
  },
]
