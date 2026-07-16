import type { EndingDef } from '@/types/content'

export const endings: EndingDef[] = [
  {
    id: 'hero',
    name: '英雄',
    description: '你引爆孢子核心并活着见证岛屿归于寂静。人们会记得你的名字——如果还有人能离开的话。',
    when: {
      all: [{ flag: 'spores_destroyed' }, { flag: 'survived_detonation' }, { attrGte: { attr: 'hp', value: 1 } }],
    },
    priority: 100,
  },
  {
    id: 'silence',
    name: '寂静归零',
    description: '孢子被彻底清除。岛沉默了。你是否还在，已经不重要。',
    when: { flag: 'spores_destroyed' },
    priority: 90,
  },
  {
    id: 'rescue',
    name: '信号救援',
    description: '修复后的信号塔唤来了船只。你被带离这座只进不出的岛——至少，表面上如此。',
    when: { flag: 'tower_repaired' },
    priority: 80,
  },
  {
    id: 'merge',
    name: '融入',
    description: '低理智中你打倒了变异人首领，并听见岛屿承认你为自己的一部分。',
    when: {
      all: [{ flag: 'killed_mutant_chief' }, { sanIn: { max: 25 } }, { flag: 'sought_merge' }],
    },
    priority: 70,
  },
  {
    id: 'truth',
    name: '真相',
    description: '你发现了孢子与基金会封岛的真相。知识本身就是一种离开。',
    when: { all: [{ flag: 'know_truth' }, { flag: 'chose_truth_ending' }] },
    priority: 60,
  },
  {
    id: 'death',
    name: '死亡',
    description: '生命归零。潮水会抹平你的脚印，孢子会记得你的味道。',
    when: { attrLte: { attr: 'hp', value: 0 } },
    priority: 0,
  },
]
