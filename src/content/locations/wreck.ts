import type { LocationDef } from '@/types/content'

export const wreck: LocationDef = {
  id: 'wreck',
  name: '飞机残骸',
  image: 'wreck',
  description: {
    default:
      '机翼断折，机腹开裂。焦糊味仍未散尽。你可以在此翻找物资，或继续向内陆走。',
    sanBelow: [
      {
        max: 30,
        text: '黑匣子在自言自语。它说你本来就不该活着下来。',
      },
    ],
  },
  exits: [
    { to: 'beach', travelMinutes: 15, label: '坠毁海滩' },
    { to: 'jungle_edge', travelMinutes: 25, unlockFlag: 'know_jungle', label: '丛林边缘' },
  ],
  actions: [
    { id: 'explore', label: '探索', type: 'explore', timeCost: 30 },
    { id: 'move', label: '移动', type: 'openMap' },
    { id: 'craft', label: '制作', type: 'openCraft' },
    {
      id: 'read_map',
      label: '查看残破地图',
      type: 'custom',
      timeCost: 10,
      when: { notFlag: 'know_jungle' },
      effects: [
        { type: 'setFlag', flag: 'know_jungle' },
        { type: 'unlockLocation', locationId: 'jungle_edge' },
        { type: 'narrative', text: '地图上标出了丛林边缘的一条小路。' },
        { type: 'toast', text: '新地点解锁：丛林边缘' },
      ],
    },
    { id: 'camp', label: '扎营', type: 'camp' },
    { id: 'sleep', label: '睡觉', type: 'sleep' },
  ],
  interactables: [
    {
      id: 'toolbox',
      label: '工具箱',
      type: 'examine',
      text: { default: '你找到一把能凑合用的小刀和一些绳索。' },
      onceFlag: 'looted_toolbox',
      effects: [
        { type: 'addItem', itemId: 'knife', count: 1 },
        { type: 'addItem', itemId: 'rope', count: 1 },
        { type: 'addItem', itemId: 'wood', count: 3 },
      ],
    },
  ],
}
