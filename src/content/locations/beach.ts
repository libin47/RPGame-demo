import type { LocationDef } from '@/types/content'

export const beach: LocationDef = {
  id: 'beach',
  name: '坠毁海滩',
  image: 'beach',
  canBuildBase: true,
  description: {
    default:
      '焦黑的沙滩上散落着残骸碎片。海风带着咸味与淡淡的甜腥。不远处，[[wreck_link|飞机残骸]]半埋在沙里。',
    sanBelow: [
      {
        max: 30,
        text: '沙子像在缓慢蠕动。海浪的节奏不对。[[wreck_link|那团金属]]在对你眨眼。',
      },
      {
        max: 15,
        text: '沙滩裂开微笑。你听见孢子在耳膜内侧唱歌。[[wreck_link|它]]在等你。',
      },
    ],
  },
  exits: [
    { to: 'wreck', travelMinutes: 15, unlockFlag: 'wreck_found', label: '飞机残骸' },
    { to: 'jungle_edge', travelMinutes: 30, unlockFlag: 'jungle_unlocked', label: '丛林边缘' },
  ],
  actions: [
    { id: 'explore', label: '探索', type: 'explore', timeCost: 30 },
    { id: 'move', label: '移动', type: 'openMap' },
    {
      id: 'enter_wreck',
      label: '飞机残骸',
      type: 'setLocation',
      when: { flag: 'wreck_found' },
      effects: [{ type: 'setLocation', locationId: 'wreck' }],
    },
    {
      id: 'hunt_crab',
      label: '螃蟹',
      type: 'startCombat',
      enemyId: 'mutant_crab',
      when: { flag: 'crab_found' },
    },
    {
      id: 'talk_sea_folk',
      label: '海民',
      type: 'startDialogue',
      dialogueId: 'sea_folk',
      when: { flag: 'sea_folk_found' },
    },
    {
      id: 'enter_cave',
      label: '洞穴',
      type: 'enterDungeon',
      dungeonId: 'beach_cave',
      when: { flag: 'cave_found' },
    },
    {
      id: 'build_camp',
      label: '建造营地',
      type: 'custom',
      timeCost: 60,
      when: {
        all: [
          { notFlag: 'base_built' },
          { hasItem: { itemId: 'wood', count: 5 } },
          { hasItem: { itemId: 'cloth', count: 3 } },
        ],
      },
      effects: [
        { type: 'removeItem', itemId: 'wood', count: 5 },
        { type: 'removeItem', itemId: 'cloth', count: 3 },
        { type: 'setFlag', flag: 'base_built' },
        { type: 'narrative', text: '你用木材和破布搭建了一个简易营地。' },
        { type: 'toast', text: '营地建造完成！' },
      ],
    },
    {
      id: 'enter_base',
      label: '进入营地',
      type: 'custom',
      when: { flag: 'base_built' },
      effects: [
        { type: 'setFlag', flag: 'in_base' },
        { type: 'narrative', text: '你走进了自己搭建的营地。' },
      ],
    },
  ],
  interactables: [
    {
      id: 'wreck_link',
      label: '飞机残骸',
      type: 'examine',
      text: {
        default: '你发现了飞机残骸，点击进入查看。',
      },
      onceFlag: 'wreck_found',
      effects: [
        { type: 'setFlag', flag: 'wreck_found' },
        { type: 'unlockLocation', locationId: 'wreck' },
        { type: 'narrative', text: '你发现了飞机残骸。' },
      ],
    },
    {
      id: 'crab',
      label: '螃蟹',
      type: 'examine',
      text: {
        default: '一只畸变蟹正在沙滩上爬行，看起来很有攻击性。',
      },
      onceFlag: 'crab_found',
      effects: [
        { type: 'setFlag', flag: 'crab_found' },
        { type: 'narrative', text: '你发现了一只畸变蟹。' },
      ],
    },
    {
      id: 'sea_folk',
      label: '海民',
      type: 'examine',
      text: {
        default: '一个半人半鱼的生物站在礁石旁，似乎在等待什么。',
      },
      onceFlag: 'sea_folk_found',
      effects: [
        { type: 'setFlag', flag: 'sea_folk_found' },
        { type: 'modSan', delta: -3 },
        { type: 'narrative', text: '你发现了一个海民。' },
      ],
    },
    {
      id: 'cave',
      label: '洞穴',
      type: 'examine',
      text: {
        default: '礁石后面有一个阴暗的洞窟入口。',
      },
      onceFlag: 'cave_found',
      effects: [
        { type: 'setFlag', flag: 'cave_found' },
        { type: 'narrative', text: '你发现了一个洞窟入口。' },
      ],
    },
  ],
}
