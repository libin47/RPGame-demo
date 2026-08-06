// sceneConfig/beach.ts
// 坠机海滩（母场景）

import type { Scene } from '../../types/scene'
import { exploreButton, enterSubSceneMove, moveButton } from './shared'

const beach: Scene = {
  id: 'beach',
  name: '坠机海滩',
  descriptions: [
    {
      id: 'beach_1',
      priority: 10,
      text: '你在一阵剧痛中醒来。\n\n嘴里有沙子的味道，粗粝的，带着盐。你侧过头吐了一口，沙粒黏在嘴唇上。\n天空是一片过曝的灰白色。你眯起眼，过了几秒才适应光线。\n\n耳边的声音很乱——海浪拍打沙滩的低沉轰鸣、远处什么东西在燃烧的噼啪声、还有风穿过某种金属裂隙时发出的尖细啸音。\n你试着动了一下手指。它们蜷在湿沙里，麻木的，但还能动。然后是胳膊、肩膀、脊椎——你逐节确认了一遍。左肋有一块钝痛，可能是撞击留下的。没有骨折。你撑起身体。\n手掌陷入沙中，海水漫上来，没过你的手腕。冰凉的。\n\n你跪在沙滩上，抬起头。',
      isAutoTrigger: false,
      isOneTime: true,
      seenFlag: 'beach_1',
    },
    {
      id: 'beach_2',
      priority: 9,
      text: '{beach_2_event_1}散落在整条海岸线上。扭曲的银白色金属碎片、烧焦的座椅垫、一只不知属于谁的鞋，孤零零地躺在潮水够不到的地方。远处的机翼断成两截，其中半截斜插在沙滩上，像一块被遗忘的墓碑。\\nn海是平静的。蓝色深到近乎黑色。\n\n地平线空无一物。没有船，没有灯塔，没有任何人造建筑的轮廓。\n\n你跪在那里，看着面前这座陌生的岛屿。\n\n然后你站起来。',
      isAutoTrigger: false,
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
      priority: 8,
      text: '半截机翼斜插在那里，你需要建立一个营地。',

      isAutoTrigger: false,
      isOneTime: false,
      displayCondition: { hideFlag: ['beach_抵达机翼营地'] },
      eventFlag: 'beach_抵达机翼营地',
    },

    {
      id: 'beach_螃蟹',
      priority: 3,
      text: '你在沙滩上发现了一些{beach_event}在徘徊，真的超大只！',
      eventEntries: [
        {
          key: 'beach_event',
          displayText: '大螃蟹',
          eventId: 'event_beach_大螃蟹',
        },
      ],
      isAutoTrigger: false,
      isOneTime: false,
      displayCondition: { hideFlag: ['beach_螃蟹'] },
      eventFlag: 'beach_螃蟹',
    },
    {
      id: 'beach_椰树林',
      priority: 3,
      text: '你沿着海岸漫步，你看到前方有片椰树林。\n\n可以前往【椰树林】了！',
      isAutoTrigger: false,
      isOneTime: true,
      seenFlag: 'beach_椰树林',
    },
    {
      id: 'beach_礁石区',
      priority: 3,
      text: '你沿着海岸漫步，你看到那边满是礁石，或许可以过去看看。\n\n可以前往【礁石区】了！',
      isAutoTrigger: false,
      isOneTime: true,
      seenFlag: 'beach_礁石区',
    },
    {
      id: 'beach_潮汐线',
      priority: 3,
      // 补全了文本中的事件入口
      text: '潮水把各种东西冲上岸边。\n\n你蹲下来翻检这些来自{beach_sea}。',
      isAutoTrigger: false,
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
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_6',
      priority: 3,
      text: '你想起了很久前在马尔代夫度过的那个夏天',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_7',
      priority: 3,
      text: '你想起了年少时看到的墙上的海报——海报上的景色或许还不如现在的海滩。\n\n只是物是人非。',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_8',
      priority: 3,
      text: '目之所及，大海不见尽头。\n\n你应该不会想靠游泳游回大陆的，对吧？',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  temperatureModifier: 5,
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
      id: 'beach_前往沙滩',
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
      id: 'beach_返回机翼营地',
      name: '返回',
      description: '机翼营地',
      descriptionTitle: '机翼营地',
      flag: 'beach_飞机残骸_搜索幸存者',
      subSceneId: 'beach_机翼营地',
    }),
    moveButton,
  ],
  explore: exploreButton,
  interactions: [],
  isDungeon: false,
  subSceneIds: ['beach_飞机残骸', 'beach_机翼营地', 'beach_椰树林', 'beach_礁石区'],
}

export default beach
