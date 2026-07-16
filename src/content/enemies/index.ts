import type { EnemyDef } from '@/types/content'

export const enemies: EnemyDef[] = [
  {
    id: 'mutant_crab',
    name: '畸变蟹',
    description: '甲壳开裂，露出里面不该存在的牙齿。',
    hp: 28,
    damage: 6,
    armor: 2,
    sanLossOnSight: 3,
    skills: [
      {
        id: 'pinch',
        name: '钳击',
        skill: 'brawl',
        cooldown: 0,
        damageFormula: 'BASE + 4',
      },
    ],
    loot: [
      { itemId: 'cloth', count: 1, chance: 0.8 },
      { itemId: 'scrap_metal', count: 1, chance: 0.4 },
    ],
  },
  {
    id: 'mutant_dog',
    name: '扭曲猎犬',
    description: '多了一排关节的脊背，眼睛太多。',
    hp: 40,
    damage: 10,
    armor: 1,
    sanLossOnSight: 6,
    skills: [
      {
        id: 'bite',
        name: '撕咬',
        skill: 'brawl',
        cooldown: 0,
        damageFormula: 'BASE + 6',
      },
    ],
    loot: [
      { itemId: 'mutant_hide', count: 1, chance: 1 },
      { itemId: 'ration', count: 1, chance: 0.3 },
    ],
  },
  {
    id: 'mutant_chief',
    name: '变异人首领',
    description: '曾经是人。它邀请你加入合唱。',
    hp: 90,
    damage: 14,
    armor: 3,
    sanLossOnSight: 12,
    skills: [
      {
        id: 'sermon',
        name: '低语冲击',
        skill: 'brawl',
        cooldown: 1,
        damageFormula: 'BASE + 10',
      },
    ],
    loot: [{ itemId: 'scrap_metal', count: 3, chance: 1 }],
  },
]
