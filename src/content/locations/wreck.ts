import type { LocationDef } from '@/types/content'

export const wreck: LocationDef = {
  id: 'wreck',
  name: '飞机残骸',
  image: 'wreck',
  description: {
    default: '机翼断折，机腹开裂。焦糊味仍未散尽。你可以在此翻找物资，或继续向内陆走。',
    sanBelow: [
      {
        max: 30,
        text: '黑匣子在自言自语。它说你本来就不该活着下来。',
      },
    ],
  },
  exits: [
    { to: 'beach', travelMinutes: 15, label: '坠毁海滩' },
    { to: 'jungle_edge', travelMinutes: 30, unlockFlag: 'jungle_unlocked', label: '丛林边缘' },
  ],
  actions: [
    {
      id: 'search_food',
      label: '寻找吃的',
      type: 'custom',
      customType: 'search_food',
      timeCost: 10,
      when: { notFlag: 'food_searched' },
    },
    {
      id: 'search_weapon',
      label: '寻找武器',
      type: 'custom',
      customType: 'search_weapon',
      timeCost: 10,
      when: { notFlag: 'weapon_searched' },
    },
    {
      id: 'search_survivor',
      label: '寻找幸存者',
      type: 'custom',
      customType: 'search_survivor',
      timeCost: 15,
      when: { notFlag: 'survivor_searched' },
    },
    {
      id: 'search_watch',
      label: '寻找手表',
      type: 'custom',
      customType: 'search_watch',
      timeCost: 5,
      when: { notFlag: 'watch_found' },
    },
    {
      id: 'search_san_monitor',
      label: '寻找SAN显示仪',
      type: 'custom',
      customType: 'search_san_monitor',
      timeCost: 5,
      when: { notFlag: 'san_monitor_found' },
    },
    {
      id: 'search_clothes',
      label: '寻找衣服',
      type: 'custom',
      customType: 'search_clothes',
      timeCost: 10,
      when: { notFlag: 'clothes_found' },
    },
    {
      id: 'search_backpack',
      label: '寻找背包',
      type: 'custom',
      customType: 'search_backpack',
      timeCost: 5,
      when: { notFlag: 'backpack_found' },
    },
    {
      id: 'search_map',
      label: '寻找地图',
      type: 'custom',
      customType: 'search_map',
      timeCost: 5,
      when: { notFlag: 'map_found' },
    },
    { id: 'move', label: '移动', type: 'openMap' },
  ],
  interactables: [],
}
