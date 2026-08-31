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
      text: '半截机翼插在地上，形成一个天然的庇护所，遮风、挡雨。\n地上铺着一层防水布，如果你累了，可以在这里{beach_rest_1}，但是不要指望有多舒服。\n\n这里有大把的位置，你可以建造你想要的一切，篝火、床甚至一个小木屋，前提是你有足够的材料和时间。\n\n不过这里海风太大，或许并不适合久居，但这里离海够近，能够更清晰地看到过往的船只——假如有的话。',
      eventEntries: [
        {
          key: 'beach_rest_1',
          displayText: '休息',
          eventId: 'event_机翼营地_休息',
        },
      ],
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
      displayCondition: { hideFlag: ['flag_抵达机翼营地'] },
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
