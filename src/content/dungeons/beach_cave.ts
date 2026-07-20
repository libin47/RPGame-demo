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
      description: '洞穴入口。潮湿的石壁上长着苍白苔藓。可向北深入，或离开洞窟。',
      exits: ['n'],
      onceFlag: 'cave_entrance',
    },
    {
      x: 0,
      y: -1,
      description: '洞穴-北1：甬道继续向北延伸，地面上散落着一些发光的苔藓。',
      exits: ['n', 's'],
      onceFlag: 'cave_north1',
    },
    {
      x: 0,
      y: -2,
      description: '洞穴-北2：深处传来吱吱的叫声，一群变异猴子正在啃食什么。',
      exits: ['s'],
      onceFlag: 'cave_north2',
      events: [
        { type: 'modSan', delta: -5 },
        { type: 'startCombat', enemyId: 'monkey' },
      ],
    },
  ],
}
