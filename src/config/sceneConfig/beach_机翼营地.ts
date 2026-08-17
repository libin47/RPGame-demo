// sceneConfig/beach_机翼营地.ts
// 子场景：机翼营地（候选营地：isCampsite 标记此位置可作为营地，
// 玩家完成"搭建营地"事件后，通过 campsiteSceneId 才成为唯一营地并渲染营地 UI）

import type { SubScene } from '../../types/scene'
import { ConditionTargetType, ComparisonOperator } from '../../types/effect'
import { buildButton, exitSubSceneMove } from './shared'

const beach_机翼营地: SubScene = {
  id: 'beach_机翼营地',
  name: '机翼营地',
  parentSceneId: 'beach',
  isCampsite: true,
  buildingList: ['营火', '木墙', '工作台', '储物箱'],
  buildingInit: [],
  descriptions: [
    {
      id: 'beach_机翼营地_1',
      priority: 2,
      text: '地上铺着一层防水布，算是勉强有一个栖身之所了。\n\n但是海风太大，或许这里并不适合旧居。',
      displayCondition: { flag: ['flag_抵达机翼营地'] },
      isOneTime: false,
    },
    {
      id: 'beach_机翼营地_2',
      priority: 1,
      text: '半截机翼插在地上，是一个"天然"的{event_beach_jy_1}。',
      eventEntries: [
        {
          key: 'event_beach_jy_1',
          displayText: '庇护所',
          eventId: 'event_机翼营地_搭建营地',
        },
      ],
      isOneTime: false,
    },
  ],
  temperatureModifier: 0,
  moves: [
    exitSubSceneMove({
      id: 'beach_机翼营地_前往沙滩',
      description: '前往沙滩',
      descriptionTitle: '坠机海滩',
    }),
  ],
  build: {
    id: 'build',
    name: '建造',
    description: '建造建筑',
    costTime: 0,
    costEnergy: 0,
    displayCondition: { flag: ['flag_抵达机翼营地'] },
  },
  isDungeon: false,
}

export default beach_机翼营地
