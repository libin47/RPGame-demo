// sceneConfig/beach.ts
// 坠机海滩（母场景）

import { ComparisonOperator, ConditionTargetType } from '@/types'
import type { Scene } from '../../types/scene'
import { exploreButton, enterSubSceneMove, moveButton } from './shared'
import { wanderingMerchant } from '../traders'
export const 退潮时间 = {
  condition: {
    target: { type: ConditionTargetType.TIME },
    operator: ComparisonOperator.BETWEEN,
    value: 0,
    value2: 60 * 8,
  },
}

const beach: Scene = {
  id: 'beach',
  name: '坠机海滩',
  descriptions: [
    {
      id: 'beach_1',
      priority: 10,
      text: '你在一阵剧痛中醒来。\n\n嘴里有沙子的味道，粗粝的，带着盐。你侧过头吐了一口，沙粒黏在嘴唇上。\n天空是一片过曝的灰白色。你眯起眼，过了几秒才适应光线。\n\n耳边的声音很乱——海浪拍打沙滩的低沉轰鸣、远处什么东西在燃烧的噼啪声、还有风穿过某种金属裂隙时发出的尖细啸音。\n你试着动了一下手指。它们蜷在湿沙里，麻木的，但还能动。然后是胳膊、肩膀、脊椎——你逐节确认了一遍。左肋有一块钝痛，可能是撞击留下的。应该没有骨折。你撑起身体。\n手掌陷入沙中，海水漫上来，没过你的手腕。冰凉的。\n\n你跪在沙滩上，抬起头。',
      isOneTime: true,
      seenFlag: 'beach_1',
    },
    {
      id: 'beach_2',
      priority: 9,
      text: '{beach_2_event_1}散落在整条海岸线上。扭曲的银白色金属碎片、烧焦的座椅垫、一只不知属于谁的鞋，孤零零地躺在潮水够不到的地方。远处的机翼断成两截，其中半截斜插在沙滩上，像一块被遗忘的墓碑。\n\n海是平静的。蓝色深到近乎黑色。\n\n地平线空无一物。没有船，没有灯塔，没有任何人造建筑的轮廓。\n\n你跪在那里，看着面前这座陌生的岛屿。\n\n然后你站起来。',
      isOneTime: true,
      seenFlag: 'flag_beach_2',
      displayCondition: { hideFlag: ['beach_2'] },
      eventFlag: 'beach_2',
      eventEntries: [
        {
          key: 'beach_2_event_1',
          displayText: '飞机残骸',
          eventId: 'event_beach_飞机残骸',
        },
      ],
    },
    {
      id: 'beach_2_normal',
      priority: 8,
      text: '{beach_2_event_1}散落在整条海岸线上。扭曲的银白色金属碎片、烧焦的座椅垫、一只不知属于谁的鞋，孤零零地躺在潮水够不到的地方。远处的机翼断成两截，其中半截斜插在沙滩上，像一块被遗忘的墓碑。\n\n海是平静的。蓝色深到近乎黑色。\n\n地平线空无一物。没有船，没有灯塔，没有任何人造建筑的轮廓。\n\n你站在海滩，海风轻抚，仿佛呜咽。\n\n你回忆起飞机失事的瞬间，机舱里充满着哭泣与哭喊，而现在——在那多久之后呢，你不确定，但现在这里如此寂静，只有海浪为你们声声吊唁。',
      isOneTime: false,
      displayCondition: { hideFlag: ['beach_2'] },
      eventFlag: 'beach_2',
      eventEntries: [
        {
          key: 'beach_2_event_1',
          displayText: '飞机残骸',
          eventId: 'event_beach_飞机残骸',
        },
      ],
    },
    {
      id: 'beach_2_normal_2 ',
      priority: 8,
      text: '{beach_2_event_1}散落在整条海岸线上。扭曲的银白色金属碎片、烧焦的座椅垫、一只不知属于谁的鞋，孤零零地躺在潮水够不到的地方。远处的机翼断成两截，其中半截斜插在沙滩上，像一块被遗忘的墓碑。\n\n你觉得自己应该去残骸里面看看，或许有其他和你一样好运的旅客，也或许没有。',
      isOneTime: false,
      displayCondition: { hideFlag: ['beach_2'] },
      eventFlag: 'beach_2',
      eventEntries: [
        {
          key: 'beach_2_event_1',
          displayText: '飞机残骸',
          eventId: 'event_beach_飞机残骸',
        },
      ],
    },
    {
      id: 'beach_营地',
      priority: 7,
      text: '飞机的残骸散落在海岸线上，半截机翼斜插在沙滩上，像是一块被遗忘的墓碑。\n\n这是一个“天然”的庇护所，你需要在那里建立一个营地。\n\n点击【移动】，选择【机翼营地】前往子场景。',

      isOneTime: false,
      displayCondition: { hideFlag: ['flag_抵达机翼营地'] },
    },

    {
      id: 'beach_螃蟹',
      priority: 3,
      text: '沙滩延展至目光所及的尽头，海风仿佛永不止息地吹拂着。\n\n你沿着沙滩搜索，在一处礁石附近，你发现了一些{beach_event}在徘徊，目测其码有三十公分大，这是你迄今为止见过最大的螃蟹。一只螃蟹站立不动，似乎是在警惕的看着你，是幻觉吗？\n\n直觉告诉你应该离这些不详的螃蟹远一些，但咕噜噜的肚子却在诉说着另一个想法。',
      eventEntries: [
        {
          key: 'beach_event',
          displayText: '大螃蟹',
          eventId: 'event_beach_大螃蟹',
        },
      ],
      isOneTime: false,
      displayCondition: { hideFlag: ['flag_beach_螃蟹'] },
      eventFlag: 'flag_beach_螃蟹',
    },
    {
      id: 'beach_潮汐洞穴',
      priority: 4,
      text: '退潮了。在涨潮时海水覆盖的区域，你看到前方有一个小小的洞穴。\n\n可以前往【潮汐洞穴】了！',
      isOneTime: true,
      seenFlag: 'flag_beach_潮汐洞穴',
      displayCondition: 退潮时间,
    },
    {
      id: 'beach_海岸哨岩',
      priority: 3,
      text: '你沿着海岸探索。\n\n你一边寻找一遍眺望海平线上，希望可以发现路过船只的身影。\n而一片阴影引起了你的注意，可惜并非来自大海，而是在海滩的不远处，几块突起的巨石组成了一块哨岩，或许你可以过去看看。\n\n可以前往【海岸哨岩】了！',
      isOneTime: true,
      seenFlag: 'flag_beach_海岸哨岩',
    },
    {
      id: 'beach_椰树林',
      priority: 3,
      text: '往岛深处走了不远，沙滩逐渐被椰树覆盖。\n\n在前方不远处，椰树已经密密麻麻成了一片林子。\n你不禁松了口气——有椰子树，吃喝应该暂时不成问题了。\n\n可以前往【椰树林】了！',
      isOneTime: true,
      seenFlag: 'flag_beach_椰树林',
    },
    {
      id: 'beach_礁石区',
      priority: 3,
      text: '你沿着海滩探索。\n你注意到在坠机地的不远处的一片海滩上满是礁石，或许可以过去看看。\n\n可以前往【礁石区】了！',
      isOneTime: true,
      seenFlag: 'flag_beach_礁石区',
    },
    {
      id: 'beach_潮汐线',
      priority: 3,
      // 补全了文本中的事件入口
      text: '海水起起伏伏，潮水把各种东西冲上岸边。\n\n这些是来自{beach_sea}。',
      isOneTime: false,
      eventEntries: [
        {
          key: 'beach_sea',
          displayText: '大海的馈赠',
          eventId: 'event_beach_大海的馈赠',
        },
      ],
    },
    {
      id: 'beach_5',
      priority: 3,
      text: '美丽的海滩。',
      isOneTime: false,
    },
    {
      id: 'beach_6',
      priority: 3,
      text: '你想起了很久前在马尔代夫度过的那个夏天。\n\n那时你二十一岁，在你一生的黄金时代。\n你有好多奢望。你想爱，想吃，还想在一瞬间变成天上半明半暗的云。\n后来你才知道，生活就是个缓慢受锤的过程，人一天天老下去，奢望也一天天消失，最后变得像挨了锤的牛一样。',
      isOneTime: false,
    },
    {
      id: 'beach_7',
      priority: 3,
      text: '你想起了年少时看到的墙上的海报——海报上的景色或许还不如现在的海滩。\n\n只是物是人非。',
      isOneTime: false,
    },
    {
      id: 'beach_8',
      priority: 3,
      text: '目之所及，大海不见尽头。\n\n你应该不会想靠游泳游回大陆的，对吧？',
      isOneTime: false,
    },
  ],
  temperatureModifier: 0,
  collects: [
    {
      id: 'beach_螃蟹',
      name: '狩猎',
      description: '狩猎大螃蟹，可以获得蟹肉。',
      descriptionTitle: '狩猎大螃蟹',
      displayCondition: { flag: ['flag_beach_螃蟹'] },
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
      flag: 'flag_beach_椰树林',
      subSceneId: 'beach_椰树林',
    }),
    enterSubSceneMove({
      id: 'beach_前往礁石区',
      description: '礁石与',
      descriptionTitle: '礁石区',
      flag: 'flag_beach_礁石区',
      subSceneId: 'beach_礁石区',
    }),
    enterSubSceneMove({
      id: 'beach_前往海岸哨岩',
      description: '海岸哨岩',
      descriptionTitle: '海岸哨岩',
      flag: 'flag_beach_海岸哨岩',
      subSceneId: 'beach_海岸哨岩',
    }),
    enterSubSceneMove({
      id: 'beach_前往潮汐洞穴',
      description: '潮汐洞穴',
      descriptionTitle: '潮汐洞穴',
      flag: 'flag_beach_潮汐洞穴',
      subSceneId: 'beach_潮汐洞穴',
      availableCondition: 退潮时间,
      unavailableTooltip: '你得等退潮了才能去。',
    }),

    enterSubSceneMove({
      id: 'beach_前往机翼营地',
      name: '前往',
      description: '机翼营地',
      descriptionTitle: '机翼营地',
      flag: 'beach_飞机残骸_搜索幸存者',
      subSceneId: 'beach_机翼营地',
    }),
    moveButton,
  ],
  // characters: [
  //   {
  //     id: 'beach_船长',
  //     name: '对话',
  //     description: '独眼的女船长坐在崖头，沉默地抽着烟。',
  //     descriptionTitle: '船长',
  //     tradeConfig: wanderingMerchant,
  //     dialogConfig: [
  //       {
  //         dialogEventId: 'event_beach_船长',
  //       },
  //     ],
  //     enemyConfig: {
  //       enemy: [
  //         {
  //           enemyId: '大螃蟹',
  //           quantity: 2,
  //         },
  //       ],
  //       failEventId: 'event_beach_船长',
  //     },
  //   },
  // ],
  explore: exploreButton,
  isDungeon: false,
  subSceneIds: [
    'beach_飞机残骸',
    'beach_机翼营地',
    'beach_椰树林',
    'beach_礁石区',
    'beach_海岸哨岩',
    'beach_潮汐洞穴',
  ],
  backgroundImage: 'beach1.png',
}

export default beach
