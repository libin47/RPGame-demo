// sceneConfig/beach_机翼营地.ts
// 子场景：机翼营地（营地）

import type { SubScene } from '../../types/scene'
import { ConditionTargetType, ComparisonOperator } from '../../types/effect'
import { buildButton, exitSubSceneMove, eventInteraction } from './shared'

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
      priority: 10,
      text: '只有半截机翼和沙子，你需要完善它才可以作为营地。',
      textVariations: [
        {
          content:
            '地上铺着一层防水布，算是勉强有一个栖身之所了。\n\n但是海风太大，或许这里并不适合旧居。',
          displayCondition: { flag: ['event_机翼营地_铺地'] },
        },
      ],
      isOneTime: true,
      seenFlag: 'beach_抵达机翼营地',
    },
    {
      id: 'beach_机翼营地_2',
      priority: 1,
      text: '半截机翼插在地上，是一个"天然"的庇护所。',
      textVariations: [
        {
          content: '半截机翼插在地上，是一个"天然"的庇护所。',
        },
        {
          content: '地上铺着一层防水布，算是勉强有一个栖身之所了。',
          displayCondition: { flag: ['event_机翼营地_铺地'] },
        },
        {
          content: '地上铺着一层防水布，算是勉强有一个栖身之所了。',
          displayCondition: {
            condition: {
              target: {
                type: ConditionTargetType.PARAM,
                id: 'beach_椰子',
              },
              operator: ComparisonOperator.EQUAL,
              value: 0,
            },
          },
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
  interactions: [
    eventInteraction({
      id: 'beach_机翼营地_搭建营地',
      eventId: 'event_机翼营地_搭建营地',
      displayCondition: { hideFlag: ['event_机翼营地_铺地'] },
    }),
  ],
  build: buildButton,
  isDungeon: false,
}

export default beach_机翼营地
