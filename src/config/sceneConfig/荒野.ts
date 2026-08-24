// sceneConfig/荒野.ts
// 荒野（母场景）

import { ComparisonOperator, ConditionTargetType } from '@/types'
import type { Scene } from '../../types/scene'
import { exploreButton, enterSubSceneMove, moveButton } from './shared'
import { wanderingMerchant } from '../traders'

const wild: Scene = {
  id: 'wild',
  name: '荒野',
  descriptions: [
    {
      id: 'wild_1',
      priority: 10,
      text: '你来到了荒野。\n\n草从随着微风轻轻摇摆，但你能闻到野兽的粪便气息，这并不是一个安宁的乐园。',
      isOneTime: true,
      seenFlag: 'flag_wild_1',
    },
    {
      id: 'wild_normal_1',
      priority: 1,
      text: '荒野，一望无际的草原与偶尔起伏的丘陵。',
    },
    {
      id: 'wild_normal_2',
      priority: 1,
      text: '你想起年少时微机课上看到的windowsxp默认的桌面背景。',
    },
    {
      id: 'wild_find_1',
      priority: 1,
      text: '你翻过一个山丘，你看到在不远处的空地上，数块巨石被摆成一个规律的图形。\n\n这绝非大自然的鬼斧神工。这里有其他人。\n\n你可以前往【荒野-巨石迷阵】了。',
      isOneTime: true,
      seenFlag: 'flag_wild_find_巨石',
    },
    {
      id: 'wild_find_2',
      priority: 1,
      text: '你在荒野上探索时，一串巨大的脚印引起了你的注意。这脚印非人非兽，非要说的话，有点儿像猪蹄的痕迹——，你看到在远处的空地上，数块巨石被摆成一个规律的图形。\n\n这绝非大自然的鬼斧神工。这里有其他人。\n\n你可以前往【荒野-兽径】了。',
      isOneTime: true,
      seenFlag: 'flag_wild_find_兽径',
    },
  ],
  temperatureModifier: 0,
  collects: [
    {
      id: 'beach_螃蟹',
      name: '狩猎',
      description: '狩猎大螃蟹，可以获得蟹肉。',
      descriptionTitle: '狩猎大螃蟹',
      displayCondition: { flag: ['beach_螃蟹'] },
      costTime: 30,
      costEnergy: 10,
      paramId: 'beach_螃蟹',
      resourceType: 'enemy',
      enemyConfig: {
        enemy: [
          {
            enemyId: '大螃蟹',
            quantity: 2,
          },
        ],
      },
    },
  ],
  moves: [
    enterSubSceneMove({
      id: 'beach_前往飞机残骸',
      name: '前往',
      description: '或许能找到一些物品',
      descriptionTitle: '飞机残骸',
      flag: 'beach_飞机残骸_搜索幸存者',
      subSceneId: 'beach_飞机残骸',
    }),
    enterSubSceneMove({
      id: 'beach_前往椰树林',
      description: '椰子与椰木',
      descriptionTitle: '椰树林',
      flag: 'beach_椰树林',
      subSceneId: 'beach_椰树林',
    }),
    enterSubSceneMove({
      id: 'beach_前往礁石区',
      description: '礁石与',
      descriptionTitle: '礁石区',
      flag: 'beach_礁石区',
      subSceneId: 'beach_礁石区',
    }),
    enterSubSceneMove({
      id: 'beach_前往海岸哨岩',
      description: '海岸哨岩',
      descriptionTitle: '海岸哨岩',
      flag: 'beach_海岸哨岩',
      subSceneId: 'beach_海岸哨岩',
    }),
    enterSubSceneMove({
      id: 'beach_前往潮汐洞穴',
      description: '潮汐洞穴',
      descriptionTitle: '潮汐洞穴',
      flag: 'beach_潮汐洞穴',
      subSceneId: 'beach_潮汐洞穴',
      availableCondition: 退潮时间,
      unavailableTooltip: '你得等退潮了才能去。',
    }),

    enterSubSceneMove({
      id: 'beach_返回机翼营地',
      name: '返回',
      description: '机翼营地',
      descriptionTitle: '机翼营地',
      flag: 'beach_飞机残骸_搜索幸存者',
      subSceneId: 'beach_机翼营地',
    }),
    moveButton,
  ],
  characters: [
    {
      id: 'beach_船长',
      name: '对话',
      description: '独眼的女船长坐在崖头，沉默地抽着烟。',
      descriptionTitle: '船长',
      tradeConfig: wanderingMerchant,
      dialogConfig: [
        {
          dialogEventId: 'event_beach_船长',
        },
      ],
      enemyConfig: {
        enemy: [
          {
            enemyId: '大螃蟹',
            quantity: 2,
          },
        ],
        failEventId: 'event_beach_船长',
      },
    },
  ],
  explore: exploreButton,
  isDungeon: false,
  subSceneIds: ['beach_飞机残骸', 'beach_机翼营地', 'beach_椰树林', 'beach_礁石区'],
  backgroundImage: 'beach1.png',
}

export default wild
