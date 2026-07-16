import type { DungeonDef } from '@/types/content'

export const beachCave: DungeonDef = {
  id: 'beach_cave',
  name: '海滩洞窟',
  exitLocationId: 'beach',
  start: { x: 0, y: 0 },
  cells: [
    {
      x: 0,
      y: 0,
      description: '洞口透进一线天光。潮湿的石壁上长着苍白苔藓。可向北深入，或离开洞窟。',
      exits: ['n'],
    },
    {
      x: 0,
      y: -1,
      description: '甬道变窄。你听见滴水声……以及别的节奏。',
      exits: ['n', 's', 'e'],
      onceFlag: 'cave_mid_visited',
      events: [{ type: 'modSan', delta: -3 }, { type: 'narrative', text: '空气里有甜腥的孢子味。' }],
    },
    {
      x: 1,
      y: -1,
      description: '侧室里堆着旧基金会的补给箱残片。',
      exits: ['w'],
      onceFlag: 'cave_loot',
      events: [
        { type: 'addItem', itemId: 'bandage', count: 1 },
        { type: 'addItem', itemId: 'water_bottle', count: 1 },
        { type: 'addItem', itemId: 'scrap_metal', count: 2 },
        { type: 'narrative', text: '你搜刮到一些还能用的物资。' },
      ],
    },
    {
      x: 0,
      y: -2,
      description: '洞窟尽头。岩壁上刻着无法理解的螺旋。有什么东西在暗处挪动。',
      exits: ['s'],
      onceFlag: 'cave_boss',
      events: [
        { type: 'modSan', delta: -8 },
        { type: 'startCombat', enemyId: 'mutant_dog' },
      ],
    },
  ],
}
