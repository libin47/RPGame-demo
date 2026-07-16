import type { LocationDef } from '@/types/content'

export const beach: LocationDef = {
  id: 'beach',
  name: '坠毁海滩',
  image: 'beach',
  canBuildBase: true,
  description: {
    default:
      '焦黑的沙滩上散落着残骸碎片。海风带着咸味与淡淡的甜腥。不远处，[[fuselage|机身残骸]]半埋在沙里。',
    sanBelow: [
      {
        max: 30,
        text: '沙子像在缓慢蠕动。海浪的节奏不对。[[fuselage|那团金属]]在对你眨眼。',
      },
      {
        max: 15,
        text: '沙滩裂开微笑。你听见孢子在耳膜内侧唱歌。[[fuselage|它]]在等你。',
      },
    ],
  },
  exits: [
    { to: 'wreck', travelMinutes: 15, unlockFlag: 'know_wreck', label: '飞机残骸' },
    { to: 'jungle_edge', travelMinutes: 40, unlockFlag: 'know_jungle', label: '丛林边缘' },
  ],
  actions: [
    { id: 'explore', label: '探索', type: 'explore', timeCost: 30 },
    {
      id: 'talk_castaway',
      label: '与漂流者对话',
      type: 'startDialogue',
      dialogueId: 'castaway',
      when: { flag: 'intro_done' },
    },
    {
      id: 'enter_cave',
      label: '进入洞窟',
      type: 'enterDungeon',
      dungeonId: 'beach_cave',
      when: { flag: 'cave_found' },
    },
    { id: 'move', label: '移动', type: 'openMap' },
    { id: 'craft', label: '制作', type: 'openCraft' },
    { id: 'camp', label: '扎营', type: 'camp' },
    { id: 'sleep', label: '睡觉', type: 'sleep' },
    {
      id: 'fight_tutorial',
      label: '警戒（异响）',
      type: 'startCombat',
      enemyId: 'mutant_crab',
      when: { notFlag: 'tutorial_fight_done' },
    },
  ],
  interactables: [
    {
      id: 'fuselage',
      label: '机身残骸',
      type: 'examine',
      text: {
        default:
          '机舱门歪开着。里面有半包压缩饼干和一瓶勉强还能喝的水。你把它们塞进了口袋。',
        sanBelow: [
          {
            max: 25,
            text: '座椅上坐着没有脸的乘务员。她把饼干递给你，手指长得不像人。',
          },
        ],
      },
      onceFlag: 'looted_fuselage',
      effects: [
        { type: 'addItem', itemId: 'ration', count: 1 },
        { type: 'addItem', itemId: 'water_bottle', count: 1 },
        { type: 'setFlag', flag: 'know_wreck' },
        { type: 'unlockLocation', locationId: 'wreck' },
        { type: 'modSan', delta: -2 },
      ],
    },
  ],
}
