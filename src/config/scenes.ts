// ============================================================
// 此文件由 XLSX 转换器自动生成，请勿手动修改
// 生成时间: 2026-07-24 22:49:51
// ============================================================

import {
  AttributeType,
  ComparisonOperator,
  ConditionTargetType,
  LogicOperator,
} from '@/types/effect'
import type { Scene, SubScene, SceneRegistry } from '../types/scene'
import { InteractionType, Direction, FunctionType } from '../types/scene'
import { OptionCostType, type OptionCost, type ButtonOption } from '../types/option'

const exploreButton: ButtonOption = {
  id: 'explore',
  name: '探索',
  description: '探索环境，说不定能发现点儿新东西呢',
  costTime: 30,
  costEnergy: 10,
}

const buildButton: ButtonOption = {
  id: 'build',
  name: '建造',
  description: '建造建筑',
  costTime: 0,
  costEnergy: 0,
}
// ============================================================
// 海滩
// ============================================================

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
      hideFlag: ['beach_2'],
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
      hideFlag: ['beach_抵达机翼营地'],
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
      hideFlag: ['beach_螃蟹'],
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
      displayFlag: ['beach_螃蟹'],
      costTime: 30,
      costEnergy: 10,
      paramId: 'beach_螃蟹',
      resourceType: 'enemy',
      enemyConfig: [
        {
          enemyId: '大螃蟹',
          quantity: 2,
        },
      ],
    },
  ],
  moves: [
    {
      id: 'beach_前往沙滩',
      name: '前往',
      description: '或许能找到一些物品',
      descriptionTitle: '飞机残骸',
      costTime: 10,
      costEnergy: 10,
      displayFlag: ['beach_飞机残骸_搜索幸存者'],
      moveType: 'enterSubScene',
      subSceneId: 'beach_飞机残骸',
    },
    {
      id: 'beach_前往椰树林',
      name: '前往',
      description: '椰子与椰木',
      descriptionTitle: '椰树林',
      costTime: 10,
      costEnergy: 10,
      displayFlag: ['beach_椰树林'],
      moveType: 'enterSubScene',
      subSceneId: 'beach_椰树林',
    },
    {
      id: 'beach_前往礁石区',
      name: '前往',
      description: '礁石与',
      descriptionTitle: '礁石区',
      costTime: 10,
      costEnergy: 10,
      displayFlag: ['beach_礁石区'],
      moveType: 'enterSubScene',
      subSceneId: 'beach_礁石区',
    },
    {
      id: 'beach_返回机翼营地',
      name: '返回',
      description: '机翼营地',
      descriptionTitle: '机翼营地',
      costTime: 10,
      costEnergy: 10,
      displayFlag: ['beach_飞机残骸_搜索幸存者'],
      moveType: 'enterSubScene',
      subSceneId: 'beach_机翼营地',
    },
    {
      id: 'beach_移动',
      name: '移动',
      moveType: 'move',
    },
  ],
  explore: exploreButton,
  interactions: [],
  isDungeon: false,
  subSceneIds: ['beach_飞机残骸', 'beach_机翼营地', 'beach_椰树林', 'beach_礁石区'],
}

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
          displayFlag: [
            'beach_飞机残骸_搜索座椅',
            'beach_飞机残骸_搜索行李架',
            'beach_飞机残骸_搜索头等舱',
            'beach_飞机残骸_搜索夹缝',
          ],
          hideFlag: ['beach_飞机残骸_搜索幸存者'],
        },
        {
          content:
            '你翻遍了机舱。\n\n依然没有看到任何幸存者、或者尸体。但是残留的片片血迹竟让你有种莫名安心。\n\n你透过舷窗望向窗外。\n\n半截机翼斜插在沙中，形成了一个天然的遮蔽。\n\n你可以在那里建造一个简单的避难所。你需要休息。',
          displayFlag: ['beach_飞机残骸_搜索幸存者'],
        },
      ],
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_飞机残骸_normal',
      priority: 10,
      text: '残骸散落半个沙滩。\n\n硝烟已经散去，你也许可以在废墟中找到点儿有用的东西。',
      displayFlag: ['beach_抵达机翼营地'],
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  temperatureModifier: 0,
  explore: {
    id: 'explore',
    name: '探索',
    description: '探索环境，说不定能发现点儿新东西呢',
    costTime: 30,
    costEnergy: 10,
    displayFlag: ['beach_抵达机翼营地'],
  },
  moves: [
    {
      id: 'beach_飞机残骸_返回沙滩',
      name: '回到沙滩',
      description: '坠机海滩',
      descriptionTitle: '坠机海滩',
      costTime: 10,
      costEnergy: 10,
      displayFlag: ['beach_飞机残骸_搜索幸存者'],
      moveType: 'exitSubScene',
    },
  ],
  collects: [
    {
      id: 'beach_飞机残骸_残骸',
      name: '残骸',
      description: '搜索残骸',
      descriptionTitle: '搜索残骸',
      displayFlag: ['beach_抵达机翼营地'],
      costTime: 10,
      costEnergy: 10,
      resourceType: 'item',
      paramId: 'beach_飞机残骸_残骸',
      itemConfig: [
        {
          itemId: '金属残片',
          quantity: 2,
        },
      ],
    },
  ],
  interactions: [
    {
      id: 'beach_飞机残骸_搜索座椅',
      name: '搜索座椅',
      description: '搜索座椅',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_搜索座椅',
      },
      costTime: 10,
      costEnergy: 10,
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索座椅',
    },
    {
      id: 'beach_飞机残骸_搜索行李架',
      name: '搜索行李架',
      description: '搜索行李架',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_搜索行李架',
      },
      costTime: 10,
      costEnergy: 10,
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索行李架',
    },
    {
      id: 'beach_飞机残骸_搜索夹缝',
      name: '搜索夹缝',
      description: '搜索夹缝',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_搜索夹缝',
      },
      costTime: 10,
      costEnergy: 10,
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索夹缝',
    },
    {
      id: 'beach_飞机残骸_搜索头等舱',
      name: '搜索头等舱',
      description: '搜索头等舱',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_搜索头等舱',
      },
      costTime: 10,
      costEnergy: 10,
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索头等舱',
    },
    {
      id: 'beach_飞机残骸_驾驶舱',
      name: '驾驶舱',
      description: '驾驶舱',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_驾驶舱',
      },
      costTime: 10,
      costEnergy: 10,
      displayFlag: ['beach_抵达机翼营地'],
      isOneTime: false,
    },

    {
      id: 'beach_飞机残骸_搜索幸存者',
      name: '搜索幸存者',
      interactionType: InteractionType.EXPLORE,
      costTime: 10,
      costEnergy: 10,
      displayFlag: [
        'beach_飞机残骸_搜索座椅',
        'beach_飞机残骸_搜索行李架',
        'beach_飞机残骸_搜索头等舱',
        'beach_飞机残骸_搜索夹缝',
      ],
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索幸存者',
    },
  ],
  isDungeon: false,
}
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
          displayFlag: ['event_机翼营地_铺地'],
        },
      ],
      isAutoTrigger: false,
      isOneTime: true,
      seenFlag: 'beach_抵达机翼营地',
    },
    {
      id: 'beach_机翼营地_2',
      priority: 1,
      text: '半截机翼插在地上，是一个“天然”的庇护所。',
      textVariations: [
        {
          content: '半截机翼插在地上，是一个“天然”的庇护所。',
        },
        {
          content: '地上铺着一层防水布，算是勉强有一个栖身之所了。',
          displayFlag: ['event_机翼营地_铺地'],
        },
        {
          content: '地上铺着一层防水布，算是勉强有一个栖身之所了。',
          condition: {
            target: {
              type: ConditionTargetType.PARAM,
              id: 'beach_椰子',
            },
            operator: ComparisonOperator.EQUAL,
            value: 0,
          },
        },
      ],
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  temperatureModifier: 0,
  moves: [
    {
      id: 'beach_机翼营地_前往沙滩',
      name: '前往沙滩',
      description: '前往沙滩',
      descriptionTitle: '坠机海滩',
      costTime: 10,
      costEnergy: 10,
      moveType: 'exitSubScene',
    },
  ],
  interactions: [
    {
      id: 'beach_机翼营地_搭建营地',
      name: '搭建营地',
      description: '搭建营地',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_机翼营地_搭建营地',
      },
      isOneTime: false,
      hideFlag: ['event_机翼营地_铺地'],
    },
  ],
  build: buildButton,
  isDungeon: false,
}
const beach_椰树林: SubScene = {
  id: 'beach_椰树林',
  name: '椰树林',
  parentSceneId: 'beach',
  descriptions: [
    {
      id: 'beach_椰树林_深入_1',
      priority: 9,
      text: '你拨开垂落的棕榈叶，走进了这片椰树林。阳光穿过叶片的缝隙洒下斑驳的光影，地上铺满了枯黄的落叶和几个熟透落地的椰子。海风穿过树林，椰叶沙沙作响。\n\n你正要往前走，头顶传来一声尖利的叫声。你抬头——几只{beach_ysl_event_1}正蹲在高处的椰树上，尾巴悬空，眼睛直勾勾地盯着你。\n\n你停下脚步，它们也停下叫声。你往前走一步，领头的那只发出了更响亮的警告声。\n\n它们不想让你过去。\n\n在搞清楚之前，你不能采摘和砍伐。',
      isAutoTrigger: false,
      isOneTime: false,
      hideFlag: ['beach_椰树林_追踪猴群'],
      eventEntries: [
        {
          key: 'beach_ysl_event_1',
          displayText: '灰褐色的猴子',
          eventId: 'event_beach_椰树林_灰褐色的猴子',
        },
      ],
    },

    {
      id: 'beach_椰树林_深入_2',
      priority: 8,
      text: '猴群走远了，但你还记得{beach_ysl_event_2}\n\n你现在可以采摘和砍伐了。',
      isAutoTrigger: false,
      isOneTime: false,
      eventEntries: [
        {
          key: 'beach_ysl_event_2',
          displayText: '离去的方向',
          eventId: 'event_beach_椰树林_追踪猴群',
        },
      ],
    },
    {
      id: 'beach_椰树林_1 ',
      priority: 1,
      text: '长满了椰树。',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_椰树林_2 ',
      priority: 1,
      text: '椰树。。',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_椰树林_3 ',
      priority: 1,
      text: '太好啦，有椰子！',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_椰树林_4 ',
      priority: 1,
      text: '椰✌……',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_椰树林_5 ',
      priority: 1,
      text: '望椰止渴。',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_椰树林_6 ',
      priority: 1,
      text: '长满了椰树，但是不要砍伐过度哦~',
      isAutoTrigger: false,
      isOneTime: false,
    },
    {
      id: 'beach_椰树林_0 ',
      priority: 5,
      text: '椰树都被你砍完了，SAD。\n\n等几天说不定还会长出来。',
      isAutoTrigger: false,
      isOneTime: false,
      displayCondition: {
        target: {
          type: ConditionTargetType.PARAM,
          id: 'beach_椰子',
        },
        operator: ComparisonOperator.EQUAL,
        value: 0,
      },
    },
  ],
  temperatureModifier: 0,
  explore: exploreButton,
  moves: [
    {
      id: 'beach_椰树林_前往沙滩',
      name: '前往沙滩',
      description: '前往沙滩',
      descriptionTitle: '坠机海滩',
      costTime: 10,
      costEnergy: 10,
      moveType: 'exitSubScene',
    },
  ],
  collects: [
    {
      id: 'beach_椰树林_搜索椰子',
      name: '椰子',
      description: '爬上树去摘椰子，要是有个长杆就好了。',
      descriptionTitle: '摘椰子',
      displayFlag: ['beach_椰树林_追踪猴群'],
      displayCondition: {
        target: {
          type: ConditionTargetType.ITEM,
          id: '木竿',
        },
        operator: ComparisonOperator.LESS,
        value: 1,
      },
      costTime: 20,
      costEnergy: 20,
      resourceType: 'item',
      paramId: 'beach_椰子',
      itemConfig: [
        {
          itemId: '椰子',
          quantity: 2,
        },
        {
          itemId: '椰子',
          quantity: 1,
          probability: 0.5,
        },
      ],
      text: '你奋力爬上椰子树，要是有个长杆，你就可以直接打椰子了，而不是这么费力的爬上爬下。',
    },
    {
      id: 'beach_椰树林_打椰子',
      name: '椰子',
      description: '用长杆打椰子。',
      descriptionTitle: '打椰子',
      displayFlag: ['beach_椰树林_追踪猴群'],
      displayCondition: {
        target: {
          type: ConditionTargetType.ITEM,
          id: '木竿',
        },
        operator: ComparisonOperator.GREATER_EQUAL,
        value: 1,
      },
      costTime: 10,
      costEnergy: 10,
      resourceType: 'item',
      paramId: 'beach_椰子',
      itemConfig: [
        {
          itemId: '椰子',
          quantity: 1,
        },
        {
          itemId: '椰子',
          quantity: 3,
          probability: 0.5,
        },
      ],
      text: '你抬头举起木竿打下椰子。',
    },
    {
      id: 'beach_椰树林_砍伐',
      name: '砍伐',
      description: '砍椰子树，有概率获得椰子',
      descriptionTitle: '砍椰子树',
      displayFlag: ['beach_椰树林_追踪猴群'],
      costTime: 10,
      costEnergy: 10,
      availableCondition: {
        target: {
          type: ConditionTargetType.ITEM,
          id: '石斧',
        },
        operator: ComparisonOperator.GREATER_EQUAL,
        value: 1,
      },
      unavailableTooltip: '你需要一个斧子才能砍伐椰子树。',
      resourceType: 'item',
      paramId: 'beach_椰子树',
      itemConfig: [
        {
          itemId: '椰子',
          quantity: 1,
        },
        {
          itemId: '木头',
          quantity: 3,
        },
        {
          itemId: '木头',
          quantity: 1,
          probability: 0.5,
        },
      ],
    },
  ],
  isDungeon: false,
}
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
    {
      id: 'beach_礁石区_前往沙滩',
      name: '前往沙滩',
      description: '前往沙滩',
      descriptionTitle: '坠机海滩',
      costTime: 10,
      costEnergy: 10,
      moveType: 'exitSubScene',
    },
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
      itemConfig: [
        {
          itemId: '贝壳',
          quantity: 2,
        },
      ],
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
      itemConfig: [
        {
          itemId: '燧石',
          quantity: 2,
        },
      ],
    },
  ],
  isDungeon: false,
}

// ============================================================
// 大地图测试场景（用于大地图移动测试）
// ============================================================

const forest: Scene = {
  id: 'forest',
  name: '森林',
  descriptions: [
    {
      id: 'forest_1',
      priority: 10,
      text: '你走进森林。光线从层层叠叠的树冠缝隙间漏下来，在地面上投下斑驳的光影。\n空气中弥漫着潮湿的泥土和腐殖质的味道。远处有鸟鸣，也有细碎的不明声响。\n这里暂时是安全的，但你总觉得有什么在暗处注视着你。',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  moves: [
    {
      id: 'forest_移动',
      name: '移动',
      moveType: 'move',
    },
  ],
  temperatureModifier: -2,
  explore: exploreButton,
  interactions: [],
  isDungeon: false,
}

const mountain: Scene = {
  id: 'mountain',
  name: '山区',
  descriptions: [
    {
      id: 'mountain_1',
      priority: 10,
      text: '山路陡峭，碎石在脚下滚动。\n风很大，吹得你几乎站不稳。从这里可以俯瞰整座岛的轮廓——一片被蓝海包围的绿色陆地。\n岩缝里或许藏着有用的东西。',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  moves: [
    {
      id: 'mountain_移动',
      name: '移动',
      moveType: 'move',
    },
  ],
  temperatureModifier: -5,
  explore: exploreButton,
  interactions: [],
  isDungeon: false,
}

const ruins: Scene = {
  id: 'ruins',
  name: '遗迹',
  descriptions: [
    {
      id: 'ruins_1',
      priority: 10,
      text: '残破的石柱歪斜地立在荒草之中，像某种古老文明的墓碑。\n墙壁上刻着看不懂的符号，在夕阳下泛着暗红的光。\n这里的空气很安静——安静得不太正常。',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  moves: [
    {
      id: 'ruins_移动',
      name: '移动',
      moveType: 'move',
    },
  ],
  temperatureModifier: 0,
  explore: exploreButton,
  interactions: [],
  isDungeon: false,
}

// ============================================================
// 场景注册表
// ============================================================

export const sceneRegistry: SceneRegistry = {
  scenes: {
    beach,
    forest,
    mountain,
    ruins,
  },
  subScenes: {
    beach_飞机残骸,
    beach_机翼营地,
    beach_椰树林,
    beach_礁石区,
  },
  initialSceneId: 'beach',
}
