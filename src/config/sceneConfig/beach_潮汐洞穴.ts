// sceneConfig/beach_潮汐洞穴.ts
// 子场景：潮汐洞穴

import type { SubScene } from '../../types/scene'
import { ConditionTargetType, ComparisonOperator } from '../../types/effect'
import { exploreButton, exitSubSceneMove } from './shared'

const beach_潮汐洞穴: SubScene = {
  id: 'beach_潮汐洞穴',
  name: '潮汐洞穴',
  parentSceneId: 'beach',
  descriptions: [
    {
      id: 'beach_潮汐洞穴_首次进入',
      priority: 10,
      text: '退潮后，礁石群尽头露出一道低矮的岩缝。你侧身挤进去，里面是一个被海水冲刷得光滑的火山岩洞穴。洞顶不高，你得微微低头才能站稳。\n\n洞壁上附着成片的发光藻类，蓝绿色的冷光把整面岩壁变成了一片星空。光线虽然微弱，但足够你辨认洞内的轮廓。\n\n洞穴深处有一个常年积水的石池，池水随着外海的潮涌缓慢起伏。石池对面，一具{beach_cave_event_1}被钟乳石半包裹着，在冷光中投下模糊的阴影。',
      isOneTime: false,
      displayCondition: { hideFlag: ['flag_潮汐洞穴_骸骨_已调查铭牌'] },
      eventEntries: [
        {
          key: 'beach_cave_event_1',
          displayText: '人类的骸骨',
          eventId: 'event_beach_潮汐洞穴_骸骨',
        },
      ],
    },
    {
      id: 'beach_潮汐洞穴_已调查',
      priority: 9,
      text: '那具骸骨安静地躺在钟乳石包裹中，你已经翻找过了他的遗物。\n\n在他所指的方向，一个{beach_cave_event_2}静静躺在那里。',
      isOneTime: false,
      eventEntries: [
        {
          key: 'beach_cave_event_2',
          displayText: '防水箱',
          eventId: 'event_beach_潮汐洞穴_防水箱',
        },
      ],
      displayCondition: { hideFlag: ['flag_潮汐洞穴_箱子已开启'] },
    },
    {
      id: 'beach_潮汐洞穴_日常_1',
      priority: 1,
      text: '洞穴恢复了宁静，水池周围环绕着一圈发光的藻类，你可以用刀片刮下一些。',
    },
    {
      id: 'beach_潮汐洞穴_日常_1',
      priority: 1,
      text: '洞穴里很安静，只听到水滴从钟乳石尖端落下的声音。',
    },
    {
      id: 'beach_潮汐洞穴_日常_2',
      priority: 1,
      text: '发光藻类在岩壁上铺成一片幽蓝的星河。',
    },
    {
      id: 'beach_潮汐洞穴_日常_3',
      priority: 1,
      text: '石池里的水清澈见底，池底铺着被冲刷得圆润的卵石。',
    },
  ],
  temperatureModifier: -3,
  explore: exploreButton,
  moves: [
    exitSubSceneMove({
      id: 'beach_潮汐洞穴_返回海滩',
      description: '钻出岩缝，回到海滩',
      descriptionTitle: '坠机海滩',
    }),
  ],
  collects: [
    {
      id: 'beach_潮汐洞穴_采集藻类',
      name: '发光藻类',
      description: '洞壁上附着成片的发光藻类，蓝绿色的冷光在手边明灭。刮下来应该能收集不少。',
      descriptionTitle: '刮取发光藻类',
      displayCondition: { flag: ['flag_潮汐洞穴_箱子已开启'] },
      costTime: 15,
      costEnergy: 10,
      resourceType: 'item',
      paramId: 'beach_发光藻类',
      itemConfig: {
        item: [
          {
            itemId: '发光藻类',
            quantity: 1,
          },
        ],
        extend: [
          {
            item: [
              {
                itemId: '发光藻类',
                quantity: 2,
              },
            ],
            probability: 0.3,
            text: '这一片藻类长得特别厚实，你刮下了双倍的量。',
          },
        ],
      },
      text: '你用刀片贴着岩壁小心地刮下了一层藻类。它们在你手心里继续发着光，触感湿滑冰凉。',
    },
  ],
  isDungeon: false,
}

export default beach_潮汐洞穴
