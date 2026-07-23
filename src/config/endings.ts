// src/config/endings.ts
// 结局配置数据

import type { EndingConfig, EndingRegistry } from '@/types/ending'

/** 结局配置列表 */
const endingList: EndingConfig[] = [
  {
    id: 'death_hp',
    name: '生命凋零',
    description:
      '你的生命值归零，最终倒在了这片被侵蚀的土地上。身体渐渐被孢子覆盖，意识消散在黑暗中……',
    rank: 'E',
    triggerConditions: [
      {
        type: 'hpZero',
        description: '生命值归零',
      },
    ],
    endingFlag: 'ending_death_hp',
  },
  {
    id: 'death_san',
    name: '理智崩溃',
    description:
      '你的理智完全崩溃，精神被黑暗侵蚀。你不再知道自己是谁，只是漫无目的地游荡在荒芜之中……',
    rank: 'E',
    triggerConditions: [
      {
        type: 'sanZero',
        description: '理智值归零',
      },
    ],
    endingFlag: 'ending_death_san',
  },
  {
    id: 'infection_departure',
    name: '0号病人',
    description:
      '你在被感染的状态下离开了岛屿。没有人知道这场灾难的真正源头，而你带着孢子的秘密消失在了远方……',
    rank: 'C',
    triggerConditions: [
      {
        type: 'flagCheck',
        description: '在感染状态离开',
        flagId: 'is_infected',
        expectedValue: true,
      },
    ],
    endingFlag: 'ending_infect_depart',
  },
  {
    id: 'true_ending',
    name: '英雄',
    description:
      '你发现了真相，并在不牺牲自己的情况下彻底解决了孢子危机。烟雾散去，阳光重新照耀在这片伤痕累累的土地上。你成为了这座岛屿永远的传说。',
    rank: 'S',
    triggerConditions: [
      {
        type: 'flagCheck',
        description: '发现真相且安全引爆',
        flagId: 'truth_discovered',
        expectedValue: true,
      },
    ],
    endingFlag: 'ending_true',
  },
  {
    id: 'silent_ending',
    name: '寂静归零',
    description:
      '你引爆了核心，彻底消灭了孢子。但你也永远留在了这片土地。什么都没有剩下，只剩下一片寂静的荒原。',
    rank: 'A',
    triggerConditions: [
      {
        type: 'flagCheck',
        description: '牺牲自己引爆',
        flagId: 'is_sacrifice',
        expectedValue: true,
      },
    ],
    endingFlag: 'ending_silent',
  },
  {
    id: 'rescue',
    name: '救援',
    description:
      '你修好了信号塔，发出了求救信号。几天后，救援队的直升机出现在天际线上。你终于可以离开这座噩梦般的岛屿了。',
    rank: 'B',
    triggerConditions: [
      {
        type: 'flagCheck',
        description: '修复信号塔',
        flagId: 'signal_tower_repaired',
        expectedValue: true,
      },
    ],
    endingFlag: 'ending_rescue',
  },
  {
    id: 'boat_departure',
    name: '造舟远航',
    description:
      '你造了一艘大船，带上物资驶向了大海。海浪拍打着船身，你回头看向渐远的岛屿，心中百感交集。',
    rank: 'C',
    triggerConditions: [
      {
        type: 'flagCheck',
        description: '造好船只离开',
        flagId: 'boat_built',
        expectedValue: true,
      },
    ],
    endingFlag: 'ending_boat',
  },
  {
    id: 'romantic',
    name: '最后的温暖',
    description:
      '在末日般的景象中，你们相依为命。你保护了她/他到最后，在这片绝望的土地上找到了属于你们的温暖角落。',
    rank: 'B',
    triggerConditions: [
      {
        type: 'flagCheck',
        description: '保护特定NPC解锁浪漫结局',
        flagId: 'romance_unlocked',
        expectedValue: true,
      },
    ],
    endingFlag: 'ending_romance',
  },
  {
    id: 'merge',
    name: '融入',
    description:
      '在低理智状态下，你击败了变异人首领。变异人群体接纳了你，你的身体开始变异，但你找到了新的"家人"。',
    rank: 'D',
    triggerConditions: [
      {
        type: 'flagCheck',
        description: '低SAN下打倒变异人首领',
        flagId: 'mutant_leader_defeated',
        expectedValue: true,
      },
    ],
    endingFlag: 'ending_merge',
  },
]

/** 结局注册表 */
export const endingRegistry: EndingRegistry = {
  endings: Object.fromEntries(endingList.map((e) => [e.id, e])),
}
