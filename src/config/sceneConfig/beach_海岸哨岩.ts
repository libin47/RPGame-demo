// sceneConfig/beach_海岸哨岩.ts
// 子场景：海岸哨岩

import { InteractionType, type SubScene } from '../../types/scene'
import { ConditionTargetType, ComparisonOperator } from '../../types/effect'
import { exploreButton, exitSubSceneMove } from './shared'

const beach_海岸哨岩: SubScene = {
  id: 'beach_海岸哨岩',
  name: '海岸哨岩',
  parentSceneId: 'beach',
  descriptions: [
    {
      id: 'beach_海岸哨岩_首次进入',
      priority: 10,
      text: '海滩最东端，一块巨大的火山岩从沙滩上拔地而起，高出海面约十米。岩壁陡峭，表面布满蜂窝状的侵蚀孔洞和干涸的藤壶壳。\n\n抬头看，{beach_rock_event_3}似乎是一片平坦的平台，边缘堆着几块人工垒砌的{beach_rock_event_1}。也许是某种标记，也许只是个古老的瞭望点。\n\n岩壁上有一道天然的裂缝，从底部蜿蜒到顶部。裂缝宽窄不一，最窄处只能塞进半只脚掌。攀上去不是不可能，但需要一点胆量和技巧。',
      isOneTime: false,
      displayCondition: { hideFlag: ['flag_海岸哨岩_已登顶'] },
      eventEntries: [
        {
          key: 'beach_rock_event_1',
          displayText: '堆砌的石块',
          eventId: 'event_beach_海岸哨岩_石堆',
        },
        {
          key: 'beach_rock_event_3',
          displayText: '岩顶',
          eventId: 'event_beach_海岸哨岩_攀爬',
        },
      ],
    },
    {
      id: 'beach_海岸哨岩_已登顶',
      priority: 9,
      text: '你站在海岸哨岩的顶端。海风在这里更猛，吹得衣服猎猎作响。从这里可以俯瞰整条海岸线——坠机海滩的残骸、礁石区的黑色岩群、远处废弃码头的锈蚀起重机，全部尽收眼底。\n\n岩顶中央堆着几块扁平的石头，下面压着原住民留下的{beach_rock_event_2}。',
      isOneTime: false,
      displayCondition: {
        flag: ['flag_海岸哨岩_已登顶'],
        hideFlag: ['flag_海岸哨岩_祭祀痕迹已调查'],
      },
      eventEntries: [
        {
          key: 'beach_rock_event_2',
          displayText: '祭祀痕迹',
          eventId: 'event_beach_海岸哨岩_祭祀痕迹',
        },
      ],
    },
    {
      id: 'beach_海岸哨岩_日常_1',
      priority: 1,
      text: '站在这里看海，心情也跟着开阔起来。',
    },
    {
      id: 'beach_海岸哨岩_日常_2',
      priority: 1,
      text: '海风很大，吹得你有点站不稳。',
    },
    {
      id: 'beach_海岸哨岩_日常_3',
      priority: 1,
      text: '这里视野绝佳，如果有机会来这里看看日落',
    },
  ],
  temperatureModifier: -2,
  explore: exploreButton,
  interactions: [
    {
      id: '日落',
      name: '看日落',
      description: '这里视野绝佳，看太阳慢慢沉向大海，是孤岛上难得的治愈。',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        eventId: 'event_beach_海岸哨岩_日落',
        interactionType: InteractionType.EVENT,
      },
      displayCondition: {
        flag: ['flag_海岸哨岩_已登顶'],
        condition: {
          target: { type: ConditionTargetType.TIME },
          operator: ComparisonOperator.BETWEEN,
          value: 60 * 18,
          value2: 60 * 19,
        },
      },
    },
  ],
  moves: [
    exitSubSceneMove({
      id: 'beach_海岸哨岩_返回海滩',
      description: '爬下哨岩，回到海滩',
      descriptionTitle: '坠机海滩',
    }),
  ],
  isDungeon: false,
}

export default beach_海岸哨岩
