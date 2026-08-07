// sceneConfig/beach_飞机残骸.ts
// 子场景：飞机残骸

import type { SubScene } from '../../types/scene'
import { InteractionType } from '../../types/scene'
import { exploreButton, exitSubSceneMove, eventInteraction } from './shared'

const beach_飞机残骸: SubScene = {
  id: 'beach_飞机残骸',
  name: '飞机残骸',
  parentSceneId: 'beach',
  descriptions: [
    {
      id: 'beach_飞机残骸_1',
      priority: 1,
      text: '机舱里面的光线很暗。舷窗被烟熏黑了，只有几束光从机身断裂处的缝隙挤进来，在倾斜的地板上切出细长的光带。空气里有烧焦塑料的味道，还有一股更淡但更刺鼻的气味——航空燃油。好在只是残余。\n\n舱内的一切都是倾斜的。座椅歪向一边，行李架的门有的震开了，有的卡死。过道被杂物堵住大半，你得侧身才能通过。\n\n你从前舱开始搜索。',
      textVariations: [
        {
          content:
            '正在翻找的你，突然意识到一个问题——没有声音、没有其他人、甚至没有任何尸体。\n\n你是唯一的幸存者吗？',
          displayCondition: {
            flag: [
              'beach_飞机残骸_搜索座椅',
              'beach_飞机残骸_搜索行李架',
              'beach_飞机残骸_搜索头等舱',
              'beach_飞机残骸_搜索夹缝',
            ],
            hideFlag: ['beach_飞机残骸_搜索幸存者'],
          },
        },
        {
          content:
            '你翻遍了机舱。\n\n依然没有看到任何幸存者、或者尸体。但是残留的片片血迹竟让你有种莫名安心。\n\n你透过舷窗望向窗外。\n\n半截机翼斜插在沙中，形成了一个天然的遮蔽。\n\n你可以在那里建造一个简单的避难所。你需要休息。',
          displayCondition: { flag: ['beach_飞机残骸_搜索幸存者'] },
        },
      ],
      isOneTime: false,
    },
    {
      id: 'beach_飞机残骸_normal',
      priority: 10,
      text: '残骸散落半个沙滩。\n\n硝烟已经散去，你也许可以在废墟中找到点儿有用的东西。',
      displayCondition: { flag: ['beach_抵达机翼营地'] },
      isOneTime: false,
    },
  ],
  temperatureModifier: 0,
  explore: {
    ...exploreButton,
    displayCondition: { flag: ['beach_抵达机翼营地'] },
  },
  moves: [
    exitSubSceneMove({
      id: 'beach_飞机残骸_返回沙滩',
      name: '回到沙滩',
      description: '坠机海滩',
      descriptionTitle: '坠机海滩',
      flag: 'beach_飞机残骸_搜索幸存者',
    }),
  ],
  collects: [
    {
      id: 'beach_飞机残骸_残骸',
      name: '残骸',
      description: '搜索残骸',
      descriptionTitle: '搜索残骸',
      displayCondition: { flag: ['beach_抵达机翼营地'] },
      costTime: 10,
      costEnergy: 10,
      resourceType: 'item',
      paramId: 'beach_飞机残骸_残骸',
      itemConfig: {
        item: [
          {
            itemId: '金属残片',
            quantity: 2,
          },
        ],
      },
    },
  ],
  interactions: [
    eventInteraction({
      id: 'beach_飞机残骸_搜索座椅',
      eventId: 'event_飞机残骸_搜索座椅',
      isOneTime: true,
    }),
    eventInteraction({
      id: 'beach_飞机残骸_搜索行李架',
      eventId: 'event_飞机残骸_搜索行李架',
      isOneTime: true,
    }),
    eventInteraction({
      id: 'beach_飞机残骸_搜索夹缝',
      eventId: 'event_飞机残骸_搜索夹缝',
      isOneTime: true,
    }),
    eventInteraction({
      id: 'beach_飞机残骸_搜索头等舱',
      eventId: 'event_飞机残骸_搜索头等舱',
      isOneTime: true,
    }),
    eventInteraction({
      id: 'beach_飞机残骸_驾驶舱',
      eventId: 'event_飞机残骸_驾驶舱',
      displayCondition: { flag: ['beach_抵达机翼营地'] },
    }),
    {
      id: 'beach_飞机残骸_搜索幸存者',
      name: '搜索幸存者',
      interactionType: InteractionType.EXPLORE,
      costTime: 10,
      costEnergy: 10,
      displayCondition: {
        flag: [
          'beach_飞机残骸_搜索座椅',
          'beach_飞机残骸_搜索行李架',
          'beach_飞机残骸_搜索头等舱',
          'beach_飞机残骸_搜索夹缝',
        ],
      },
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索幸存者',
    },
  ],
  isDungeon: false,
}

export default beach_飞机残骸
