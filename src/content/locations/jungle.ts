import type { LocationDef } from '@/types/content'

export const jungleEdge: LocationDef = {
  id: 'jungle_edge',
  name: '丛林边缘',
  image: 'jungle',
  canBuildBase: true,
  description: {
    default:
      '棕榈与藤蔓交织成墙。深处传来不属于鸟类的鸣叫。一条隐约的小径通向更高处。',
    sanBelow: [
      {
        max: 35,
        text: '树叶上写满你的名字。风一吹，字就换一种拼法。',
      },
      {
        max: 15,
        text: '你已经是丛林的一部分了。离开？那是对根须的背叛。',
      },
    ],
  },
  exits: [
    { to: 'beach', travelMinutes: 40, label: '坠毁海滩' },
    { to: 'wreck', travelMinutes: 25, label: '飞机残骸' },
    { to: 'signal_ridge', travelMinutes: 60, unlockFlag: 'know_signal', label: '信号岭' },
  ],
  actions: [
    { id: 'explore', label: '探索', type: 'explore', timeCost: 30 },
    { id: 'move', label: '移动', type: 'openMap' },
    { id: 'craft', label: '制作', type: 'openCraft' },
    {
      id: 'hunt',
      label: '狩猎',
      type: 'startCombat',
      enemyId: 'mutant_dog',
      when: { notFlag: 'jungle_hunt_done' },
    },
    {
      id: 'find_signal',
      label: '攀高观察',
      type: 'custom',
      timeCost: 45,
      when: { notFlag: 'know_signal' },
      effects: [
        { type: 'setFlag', flag: 'know_signal' },
        { type: 'unlockLocation', locationId: 'signal_ridge' },
        { type: 'grantXp', skill: 'climb', amount: 2 },
        { type: 'narrative', text: '山脊最高处有一座锈蚀的信号塔剪影。' },
        { type: 'toast', text: '新地点解锁：信号岭' },
      ],
    },
    {
      id: 'low_san_merge',
      label: '走向低语',
      type: 'custom',
      when: { sanIn: { max: 20 } },
      effects: [
        { type: 'setFlag', flag: 'sought_merge' },
        { type: 'startCombat', enemyId: 'mutant_chief' },
      ],
    },
    { id: 'camp', label: '扎营', type: 'camp' },
    { id: 'sleep', label: '睡觉', type: 'sleep' },
  ],
}

export const signalRidge: LocationDef = {
  id: 'signal_ridge',
  name: '信号岭',
  image: 'ridge',
  description: {
    default:
      '岛屿中心最高处，旧研究基地的信号塔歪斜矗立。天线断了一截，但主机舱仍密封。',
    sanBelow: [
      {
        max: 25,
        text: '塔在呼吸。每一次风过，它都把你的心跳校准成孢子的频率。',
      },
    ],
  },
  exits: [{ to: 'jungle_edge', travelMinutes: 60, label: '丛林边缘' }],
  actions: [
    { id: 'move', label: '移动', type: 'openMap' },
    {
      id: 'repair_tower',
      label: '修复信号塔',
      type: 'custom',
      timeCost: 120,
      when: {
        all: [{ hasItem: { itemId: 'scrap_metal', count: 3 } }, { skillGte: { skill: 'craft', value: 2 } }],
      },
      effects: [
        { type: 'removeItem', itemId: 'scrap_metal', count: 3 },
        { type: 'setFlag', flag: 'tower_repaired' },
        { type: 'narrative', text: '信号发出去了。远方或许有人听见。' },
        { type: 'checkEnding' },
      ],
    },
    {
      id: 'detonate',
      label: '引爆孢子核心（需真相）',
      type: 'custom',
      timeCost: 60,
      when: { all: [{ flag: 'know_truth' }, { hasItem: { itemId: 'charges', count: 1 } }] },
      effects: [
        { type: 'setFlag', flag: 'spores_destroyed' },
        { type: 'setFlag', flag: 'survived_detonation' },
        { type: 'narrative', text: '岛安静了。真正的安静。' },
        { type: 'checkEnding' },
      ],
    },
    {
      id: 'read_logs',
      label: '阅读研究日志',
      type: 'custom',
      timeCost: 30,
      when: { notFlag: 'know_truth' },
      effects: [
        { type: 'setFlag', flag: 'know_truth' },
        { type: 'modSan', delta: -15 },
        { type: 'addItem', itemId: 'charges', count: 1 },
        {
          type: 'narrative',
          text: '日志揭示了远古孢子与基金会封岛的真相。你带上了实验性炸药。',
        },
      ],
    },
    { id: 'craft', label: '制作', type: 'openCraft' },
  ],
}
