// sceneConfig/beach_礁石区.ts
// 子场景：礁石区

import type { SubScene } from '../../types/scene'
import { exploreButton, exitSubSceneMove } from './shared'

const beach_礁石区: SubScene = {
  id: 'beach_礁石区',
  name: '礁石区',
  parentSceneId: 'beach',
  descriptions: [
    {
      id: 'beach_礁石区_1 ',
      priority: 1,
      text: '黑色的礁石杂乱地堆砌在海岸线上，像某种巨大生物的脊骨。海浪在礁石间穿行，发出沉闷的轰鸣声。石面上布满锋利的藤壶壳，在阳光下泛着微光。\n\n一些礁石围成的浅水坑里，有小鱼和螃蟹的踪影。更深处的岩缝中，似乎附着些贻贝。',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_礁石区_2 ',
      priority: 1,
      text: '黑色的礁石。',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_礁石区_3 ',
      priority: 1,
      text: '好多石头。',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_礁石区_4 ',
      priority: 1,
      text: '黑色的礁石。',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_礁石区_5 ',
      priority: 1,
      text: '礁(jiao)石。',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  temperatureModifier: -2, // 礁石区比较阴凉
  explore: exploreButton,
  moves: [
    exitSubSceneMove({
      id: 'beach_礁石区_前往沙滩',
      description: '前往沙滩',
      descriptionTitle: '坠机海滩',
    }),
  ],
  collects: [
    {
      id: 'beach_礁石区_采集',
      name: '采集',
      description: '在礁石上寻找可以食用的贻贝',
      descriptionTitle: '贻贝',
      costTime: 10,
      costEnergy: 10,
      resourceType: 'item',
      paramId: 'beach_贻贝',
      itemConfig: {
        item: [
          {
            itemId: '贝壳',
            quantity: 2,
          },
        ],
      },
    },
    {
      id: 'beach_礁石区_探索',
      name: '探索',
      description: '看看水坑里有什么',
      descriptionTitle: '潮汐池',
      costTime: 20,
      costEnergy: 20,
      resourceType: 'item',
      paramId: 'beach_潮汐池',
      itemConfig: {
        item: [
          {
            itemId: '燧石',
            quantity: 2,
          },
        ],
      },
    },
  ],
  isDungeon: false,
}

export default beach_礁石区
