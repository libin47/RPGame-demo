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
import { OptionCostType, type OptionCost } from '../types/option'

// ============================================================
// 条件定义
// ============================================================

const cond_first_time_on_beach = {
  target: {
    type: ConditionTargetType.FLAG,
    id: 'first_time_on_beach',
  },
  operator: ComparisonOperator.EQUAL,
  value: true,
}
const cond_corruption_25 = {
  target: {
    type: ConditionTargetType.CORRUPTION,
  },
  operator: ComparisonOperator.GREATER_EQUAL,
  value: 25,
}
const cond_explored_cave_false = {
  target: {
    type: ConditionTargetType.FLAG,
    id: 'explored_cave',
  },
  operator: ComparisonOperator.EQUAL,
  value: false,
}
const cond_explored_cave_true = {
  target: {
    type: ConditionTargetType.FLAG,
    id: 'explored_cave',
  },
  operator: ComparisonOperator.NOT_EQUAL,
  value: false,
}
const cond_strange_markings = {
  target: {
    type: ConditionTargetType.ATTRIBUTE,
    attributeType: AttributeType.SAN,
  },
  operator: ComparisonOperator.LESS_EQUAL,
  value: 60,
}
const cond_beach_crabs = {
  logic: LogicOperator.AND,
  subConditions: [cond_first_time_on_beach, cond_corruption_25],
}
const cond_cave_first_enter = {
  logic: LogicOperator.AND,
  subConditions: [cond_explored_cave_false],
}
const cond_enter_cave = {
  logic: LogicOperator.AND,
  subConditions: [cond_explored_cave_true],
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
      id: 'beach_2',
      priority: 3,
      text: '潮水把各种东西冲上岸边。\n\n你蹲下来翻检这些来自{大海的馈赠}。',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  temperatureModifier: 5,
  interactions: [
    {
      id: '探索海滩',
      name: '探索海滩',
      interactionType: InteractionType.EXPLORE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 10,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.EXPLORE,
      },
      displayPriority: 10,
      isOneTime: false,
    },
    {
      id: '飞机残骸',
      name: '飞机残骸',
      displayFlag: ['beach_飞机残骸_搜索幸存者'],
      interactionType: InteractionType.ENTER_SUB_SCENE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 10,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.ENTER_SUB_SCENE,
        subSceneId: 'beach_飞机残骸',
      },
      displayPriority: 5,
      isOneTime: false,
    },
    {
      id: '椰树林',
      name: '椰树林',
      displayFlag: ['beach_椰树林'],
      interactionType: InteractionType.ENTER_SUB_SCENE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 10,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.ENTER_SUB_SCENE,
        subSceneId: 'beach_椰树林',
      },
      displayPriority: 4,
      isOneTime: false,
    },
    {
      id: '礁石区',
      name: '礁石区',
      displayFlag: ['beach_礁石区'],
      interactionType: InteractionType.ENTER_SUB_SCENE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 10,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.ENTER_SUB_SCENE,
        subSceneId: 'beach_礁石区',
      },
      displayPriority: 4,
      isOneTime: false,
    },
    {
      id: '机翼营地',
      name: '机翼营地',
      displayFlag: ['beach_飞机残骸_搜索幸存者'],
      interactionType: InteractionType.ENTER_SUB_SCENE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 10,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.ENTER_SUB_SCENE,
        subSceneId: 'beach_机翼营地',
      },
      displayPriority: 1,
      isOneTime: false,
    },
  ],
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
  interactions: [
    {
      id: '搜索座椅',
      name: '搜索座椅',
      description: '搜索座椅',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_搜索座椅',
      },
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 5,
          affectedByCoefficient: false,
        },
      ],
      displayPriority: 10,
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索座椅',
    },
    {
      id: '搜索行李架',
      name: '搜索行李架',
      description: '搜索行李架',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_搜索行李架',
      },
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 5,
          affectedByCoefficient: false,
        },
      ],
      displayPriority: 9,
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索行李架',
    },
    {
      id: '搜索夹缝',
      name: '搜索夹缝',
      description: '搜索夹缝',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_搜索夹缝',
      },
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 5,
          affectedByCoefficient: false,
        },
      ],
      displayPriority: 9,
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索夹缝',
    },
    {
      id: '搜索头等舱',
      name: '搜索头等舱',
      description: '搜索头等舱',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_搜索头等舱',
      },
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 5,
          affectedByCoefficient: false,
        },
      ],
      displayPriority: 9,
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索头等舱',
    },
    {
      id: '驾驶舱',
      name: '驾驶舱',
      description: '驾驶舱',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_驾驶舱',
      },
      displayFlag: ['beach_抵达机翼营地'],
      displayPriority: 9,
      isOneTime: false,
    },
    {
      id: '搜索残骸',
      name: '搜索残骸',
      description: '搜索残骸',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_飞机残骸_搜索残骸',
      },
      displayFlag: ['beach_抵达机翼营地'],
      displayPriority: 10,
      isOneTime: false,
    },

    {
      id: '搜索幸存者',
      name: '搜索幸存者',
      interactionType: InteractionType.EXPLORE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 10,
          affectedByCoefficient: true,
        },
      ],
      displayFlag: [
        'beach_飞机残骸_搜索座椅',
        'beach_飞机残骸_搜索行李架',
        'beach_飞机残骸_搜索头等舱',
        'beach_飞机残骸_搜索夹缝',
      ],
      displayPriority: 10,
      isOneTime: true,
      usedFlag: 'beach_飞机残骸_搜索幸存者',
    },
    {
      id: '返回沙滩',
      name: '返回沙滩',
      description: '返回沙滩',
      interactionType: InteractionType.EXIT_SUB_SCENE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 5,
          affectedByCoefficient: false,
        },
      ],
      displayPriority: 1,
      isOneTime: false,
      displayFlag: ['beach_飞机残骸_搜索幸存者'],
    },
  ],
  isDungeon: false,
}
const beach_机翼营地: SubScene = {
  id: 'beach_机翼营地',
  name: '机翼营地',
  parentSceneId: 'beach',
  isCampsite: true,
  buildingList: ['营火', '木墙'],
  buildingInit: [],
  descriptions: [
    {
      id: 'beach_机翼营地_1',
      priority: 10,
      text: '只有半截机翼和沙子，你需要完善它才可以作为营地。',
      textVariations: [
        {
          content: '地上铺着一层防水布，算是勉强有一个栖身之所了。',
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
      ],
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  temperatureModifier: 0,
  interactions: [
    {
      id: '搭建营地',
      name: '搭建营地',
      description: '搭建营地',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_机翼营地_搭建营地',
      },
      displayPriority: 10,
      isOneTime: false,
      hideFlag: ['event_机翼营地_铺地'],
    },
    {
      id: '休息',
      name: '休息',
      description: '休息',
      displayFlag: ['event_机翼营地_铺地'],
      interactionType: InteractionType.REST,
      behaviorParams: {
        interactionType: InteractionType.REST,
      },
      displayPriority: 2,
      isOneTime: false,
    },
    {
      id: '建造',
      name: '建造',
      description: '建造',
      displayFlag: ['event_机翼营地_铺地'],
      interactionType: InteractionType.FUNCTION,
      behaviorParams: {
        interactionType: InteractionType.FUNCTION,
        functionType: FunctionType.BUILD,
      },
      displayPriority: 2,
      isOneTime: false,
    },
    {
      id: '前往沙滩',
      name: '前往沙滩',
      description: '前往沙滩',
      interactionType: InteractionType.EXIT_SUB_SCENE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 5,
          affectedByCoefficient: false,
        },
      ],
      displayPriority: 1,
      isOneTime: false,
    },
  ],
  isDungeon: false,
}
const beach_椰树林: SubScene = {
  id: 'beach_椰树林',
  name: '椰树林',
  parentSceneId: 'beach',
  descriptions: [
    {
      id: 'beach_椰树林_1 ',
      priority: 1,
      text: '长满了椰树。',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  temperatureModifier: 0,
  interactions: [
    {
      id: '摘椰子',
      name: '摘椰子',
      description: '摘椰子',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_椰树林_摘椰子',
      },
      displayPriority: 10,
      isOneTime: false,
    },
    {
      id: '砍树',
      name: '砍树',
      description: '砍树',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_椰树林_砍树',
      },
      displayPriority: 10,
      isOneTime: false,
    },
    {
      id: '前往沙滩',
      name: '前往沙滩',
      description: '前往沙滩',
      interactionType: InteractionType.EXIT_SUB_SCENE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 5,
          affectedByCoefficient: false,
        },
      ],
      displayPriority: 1,
      isOneTime: false,
    },
  ],
  isDungeon: false,
}
const beach_礁石区: SubScene = {
  id: 'beach_礁石区',
  name: '椰树林',
  parentSceneId: 'beach',
  descriptions: [
    {
      id: 'beach_椰树林_1 ',
      priority: 1,
      text: '长满了椰树。',
      isAutoTrigger: false,
      isOneTime: false,
    },
  ],
  temperatureModifier: 0,
  interactions: [
    {
      id: '摘椰子',
      name: '摘椰子',
      description: '摘椰子',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_椰树林_摘椰子',
      },
      displayPriority: 10,
      isOneTime: false,
    },
    {
      id: '砍树',
      name: '砍树',
      description: '砍树',
      interactionType: InteractionType.EVENT,
      behaviorParams: {
        interactionType: InteractionType.EVENT,
        eventId: 'event_椰树林_砍树',
      },
      displayPriority: 10,
      isOneTime: false,
    },
    {
      id: '前往沙滩',
      name: '前往沙滩',
      description: '前往沙滩',
      interactionType: InteractionType.EXIT_SUB_SCENE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 5,
          affectedByCoefficient: false,
        },
      ],
      displayPriority: 1,
      isOneTime: false,
    },
  ],
  isDungeon: false,
}
// ============================================================
// 森林
// ============================================================

const forest: Scene = {
  id: 'forest',
  name: '森林',
  descriptions: [
    {
      id: 'forest_first',
      priority: 10,
      text: '你踏入了茂密的森林。高大的树木遮蔽了大部分阳光，地面上铺满了落叶。空气中弥漫着泥土和植物的气息。{strange_trees}的树干上似乎有异常的突起。',
      eventEntries: [
        {
          key: 'strange_trees',
          displayText: '变异的树木',
          eventId: 'event_strange_trees',
        },
      ],
      isAutoTrigger: false,
      isOneTime: true,
      seenFlag: 'seen_forest_first',
      viewLimit: 1,
    },
    {
      id: 'forest_normal',
      priority: 5,
      text: '森林中一片静谧，偶尔能听到不知名生物的叫声。你可以看到一些{berry_bushes}在灌木丛中，以及一些{fallen_branches}。',
      eventEntries: [
        {
          key: 'berry_bushes',
          displayText: '浆果灌木',
          eventId: 'event_gather_berries',
        },
        {
          key: 'fallen_branches',
          displayText: '落枝',
          eventId: 'event_gather_wood',
        },
      ],
      isAutoTrigger: false,
      isOneTime: false,
      viewLimit: -1,
    },
  ],
  temperatureModifier: -3,
  interactions: [
    {
      id: '探索森林',
      name: '探索森林',
      interactionType: InteractionType.EXPLORE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 12,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.EXPLORE,
      },
      displayPriority: 10,
      isOneTime: false,
      cooldownMinutes: 0,
    },
    {
      id: '返回海滩',
      name: '返回海滩',
      interactionType: InteractionType.MOVE_TO_SCENE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 25,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.MOVE_TO_SCENE,
        targetSceneId: 'beach',
        targetNodeId: 'node_beach',
        travelTimeMinutes: 30,
        staminaCost: 25,
        pathDescription: '穿过林间小径返回海滩',
      },
      displayPriority: 3,
      isOneTime: false,
      cooldownMinutes: 0,
    },
    {
      id: '休息',
      name: '休息',
      description: '在森林中稍作休息',
      interactionType: InteractionType.REST,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 0,
          affectedByCoefficient: false,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.REST,
      },
      requiresConfirmation: true,
      confirmationText: '确定要在森林中休息1小时吗？',
      displayPriority: 1,
      isOneTime: false,
      cooldownMinutes: 0,
    },
  ],
  isDungeon: false,
}

// ============================================================
// 海滩洞穴 (子场景)
// ============================================================

const beach_cave: SubScene = {
  id: 'beach_cave',
  name: '海滩洞穴',
  descriptions: [
    {
      id: 'cave_first_enter',
      priority: 10,
      displayCondition: cond_cave_first_enter,
      text: '洞穴内部昏暗潮湿，空气中弥漫着霉味。你的眼睛逐渐适应了黑暗，看到洞穴深处似乎有{glowing_moss}在发光。地上散落着一些{journal_fragment_cave}。',
      eventEntries: [
        {
          key: 'glowing_moss',
          displayText: '发光的苔藓',
          eventId: 'event_glowing_moss',
        },
        {
          key: 'journal_fragment_cave',
          displayText: '发黄的纸页',
          eventId: 'event_journal_fragment',
        },
      ],
      isAutoTrigger: false,
      isOneTime: true,
      seenFlag: 'seen_cave_first_enter',
      viewLimit: 1,
    },
    {
      id: 'cave_normal',
      priority: 5,
      text: '洞穴内依然昏暗，{glowing_moss2}提供着微弱的照明。墙壁上有些{strange_markings}。',
      eventEntries: [
        {
          key: 'glowing_moss2',
          displayText: '发光的苔藓',
          eventId: 'event_glowing_moss',
          removeAfterClick: true,
          clickFlag: 'clicked_glowing_moss',
          textAfterClick: '被采过的苔藓',
        },
        {
          key: 'strange_markings',
          displayText: '奇怪的刻痕',
          eventId: 'event_cave_markings',
          displayCondition: cond_strange_markings,
        },
      ],
      isAutoTrigger: false,
      isOneTime: false,
      viewLimit: -1,
    },
  ],
  temperatureModifier: -10,
  interactions: [
    {
      id: '探索洞穴',
      name: '探索洞穴',
      interactionType: InteractionType.EXPLORE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 15,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.EXPLORE,
      },
      displayPriority: 10,
      isOneTime: false,
      cooldownMinutes: 0,
    },
    {
      id: '离开洞穴',
      name: '离开洞穴',
      interactionType: InteractionType.EXIT_SUB_SCENE,
      costs: [
        {
          costType: OptionCostType.STAMINA,
          value: 5,
          affectedByCoefficient: false,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.EXIT_SUB_SCENE,
      },
      displayPriority: 1,
      isOneTime: false,
      cooldownMinutes: 0,
    },
  ],
  isDungeon: false,
  parentSceneId: 'beach',
}

// ============================================================
// 场景注册表
// ============================================================

export const sceneRegistry: SceneRegistry = {
  scenes: {
    beach,
    forest,
  },
  subScenes: {
    beach_cave,
    beach_飞机残骸,
    beach_机翼营地,
    beach_椰树林,
    beach_礁石区,
  },
  initialSceneId: 'beach',
}
