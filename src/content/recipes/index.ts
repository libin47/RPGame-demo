import type { RecipeDef } from '@/types/content'

export const recipes: RecipeDef[] = [
  {
    id: 'spear',
    name: '简易长矛',
    resultItemId: 'spear',
    materials: [
      { itemId: 'wood', count: 2 },
      { itemId: 'scrap_metal', count: 1 },
      { itemId: 'rope', count: 1 },
    ],
    timeCost: 40,
    skillReq: { skill: 'craft', level: 0 },
  },
  {
    id: 'camp_kit',
    name: '露营工具',
    resultItemId: 'camp_kit',
    materials: [
      { itemId: 'wood', count: 2 },
      { itemId: 'rope', count: 1 },
      { itemId: 'cloth', count: 1 },
    ],
    timeCost: 30,
  },
  {
    id: 'bandage',
    name: '绷带',
    resultItemId: 'bandage',
    resultCount: 2,
    materials: [{ itemId: 'cloth', count: 1 }],
    timeCost: 10,
  },
  {
    id: 'warm_cloak',
    name: '兽皮披风',
    resultItemId: 'warm_cloak',
    materials: [
      { itemId: 'mutant_hide', count: 1 },
      { itemId: 'rope', count: 1 },
    ],
    timeCost: 50,
    skillReq: { skill: 'craft', level: 1 },
  },
]
