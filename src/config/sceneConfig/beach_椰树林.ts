// sceneConfig/beach_椰树林.ts
// 子场景：椰树林

import type { SubScene } from '../../types/scene'
import { ConditionTargetType, ComparisonOperator } from '../../types/effect'
import { exploreButton, exitSubSceneMove } from './shared'

const beach_椰树林: SubScene = {
  id: 'beach_椰树林',
  name: '椰树林',
  parentSceneId: 'beach',
  descriptions: [
    {
      id: 'beach_椰树林_深入_1',
      priority: 9,
      text: '你拨开垂落的棕榈叶，走进椰树林。阳光从叶片缝隙里漏下来，在地上晃出一块块光斑。脚底踩着枯黄的落叶，沙沙响，旁边滚着几个熟透了的椰子。\n\n刚迈出两步，头顶猛地炸开一声尖利的叫唤。你抬头，几只{beach_ysl_event_1}正蹲在高处的椰树上，尾巴缠着枝叶，齐刷刷盯着你。\n\n你不动，它们也不动。你试着往前踏了一步，领头那只立刻发出一声更响的警告。\n\n它们就拦在那儿，没有要让路的意思。\n\n在搞明白这群猴子想干什么之前，你没法在这里安心采摘和砍伐。',
      isOneTime: false,
      displayCondition: { hideFlag: ['flag_椰树林_追踪猴群'] },
      eventEntries: [
        {
          key: 'beach_ysl_event_1',
          displayText: '灰褐色的猴子',
          eventId: 'event_beach_椰树林_灰褐色的猴子',
        },
      ],
    },

    {
      id: 'beach_椰树林_未追踪_击败',
      priority: 9,
      text: '猴王仓促逃离的方向，指向了{beach_ysl_event_3}。\n\n它还会在那里吗？',
      isOneTime: false,
      displayCondition: { flag: ['flag_椰树林_猴王的领地_胜利'], hideFlag: ['map_荒野'] },
      eventEntries: [
        {
          key: 'beach_ysl_event_3',
          displayText: '椰林深处',
          eventId: 'event_beach_椰树林_击败猴王_未追踪',
        },
      ],
    },
    {
      id: 'beach_椰树林_深入_2',
      priority: 8,
      text: '猴群的声音渐渐远了，林子里安静下来。你记下了它们{beach_ysl_event_2}\n\n现在没有猴子盯着了，你可以安心采摘和砍伐。',
      isOneTime: false,
      displayCondition: { hideFlag: ['flag_椰树林_猴王的领地'] },
      eventEntries: [
        {
          key: 'beach_ysl_event_2',
          displayText: '离去的方向',
          eventId: 'event_beach_椰树林_追踪猴群',
        },
      ],
    },

    {
      id: 'beach_椰树林_深入_3',
      priority: 7,
      text: '椰林恢复了日常的平静，你可以随意采摘和砍伐了。\n\n你知道林子深处，{beach_ysl_event_3}还在那里。',
      isOneTime: false,
      displayCondition: { hideFlag: ['flag_椰树林_猴王的领地_胜利'] },
      eventEntries: [
        {
          key: 'beach_ysl_event_3',
          displayText: '猴王的领地',
          eventId: 'event_beach_椰树林_猴王的领地',
        },
      ],
    },
    {
      id: 'beach_椰树林_日常',
      priority: 6,
      text: '椰林恢复了日常的平静，猴王已经不在这里了。\n\n猴子们在枝头飞窜跳跃，偶尔有一只小猴子疑惑的看向你，但很快又回到它自己的世界。',
      isOneTime: true,
      seenFlag: 'flag_seen_椰树林_打败猴王',
      displayCondition: { flag: ['flag_椰树林_猴王的领地_胜利'] },
    },
    {
      id: 'beach_椰树林_8',
      priority: 1,
      text: '你现在就是这里的新猴王！',
    },
    {
      id: 'beach_椰树林_1 ',
      priority: 1,
      text: '椰树一棵挨一棵，高高地戳向天空。',
    },
    {
      id: 'beach_椰树林_2 ',
      priority: 1,
      text: '满眼的椰子树。',
    },
    {
      id: 'beach_椰树林_3 ',
      priority: 1,
      text: '太好了，有椰子！',
    },
    {
      id: 'beach_椰树林_4 ',
      priority: 1,
      text: '椰✌️……',
    },
    {
      id: 'beach_椰树林_5 ',
      priority: 1,
      text: '盯着椰子看，嘴里好像尝到了那股清甜。',
    },
    {
      id: 'beach_椰树林_6 ',
      priority: 1,
      text: '椰树长得很茂盛，砍的时候留点神，别一口气全放倒了。',
    },
    {
      id: 'beach_椰树林_0 ',
      priority: 5,
      text: '地上只剩下一截截矮树桩，椰树全被你砍倒了。\n\n等上几天，说不定还能冒出新的树苗来。',
      isOneTime: false,
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
  // 场景被动事件
  passiveEvents: [
    {
      id: 'event_beach_椰树林_猴王攻击',
      name: '猴王攻击',
      displayCondition: {
        flag: ['flag_椰树林_追踪猴群'],
        hideFlag: ['flag_椰树林_猴王的领地_胜利'],
      },
      isOneTime: false,
      probability: 0.05,
      enterTexts: {
        enter: '你刚来到椰树林。',
        leave: '你正准备离开椰树林。',
        collect: '正当你兴致勃勃地采集资源时。',
      },
    },
  ],
  temperatureModifier: 0,
  explore: exploreButton,
  moves: [
    exitSubSceneMove({
      id: 'beach_椰树林_前往沙滩',
      description: '前往沙滩',
      descriptionTitle: '坠机海滩',
    }),
    {
      id: 'beach_椰树林_前往荒野',
      name: '前往',
      moveType: 'enterScene',
      descriptionTitle: '荒野',
      displayCondition: { flag: ['flag_椰树林_猴王的领地_胜利'] },
      sceneId: 'forest',
      costTime: 20,
    },
  ],
  collects: [
    {
      id: 'beach_椰树林_搜索椰子',
      name: '椰子',
      description: '爬上树去摘椰子，要是有根长杆就省事多了。',
      descriptionTitle: '摘椰子',
      displayCondition: {
        flag: ['flag_椰树林_追踪猴群'],
        condition: {
          target: {
            type: ConditionTargetType.ITEM,
            id: '木竿',
          },
          operator: ComparisonOperator.LESS,
          value: 1,
        },
      },
      costTime: 20,
      costEnergy: 20,
      resourceType: 'item',
      paramId: 'beach_椰子',
      itemConfig: {
        item: [
          {
            itemId: '椰子',
            quantity: 2,
          },
        ],
        extend: [
          {
            item: [
              {
                itemId: '椰子',
                quantity: 3,
              },
            ],
            probability: 0.5,
            text: '你运气不错，这一趟额外多收获了一个椰子。',
          },
        ],
      },
      text: '你手脚并用，费了点劲爬上椰子树。要是有根长杆，站在地上就能把椰子捅下来，根本不用这么爬上爬下。',
    },
    {
      id: 'beach_椰树林_打椰子',
      name: '椰子',
      description: '用长杆打椰子。',
      descriptionTitle: '打椰子',
      displayCondition: {
        flag: ['flag_椰树林_追踪猴群'],
        condition: {
          target: {
            type: ConditionTargetType.ITEM,
            id: '木竿',
          },
          operator: ComparisonOperator.GREATER_EQUAL,
          value: 1,
        },
      },
      costTime: 10,
      costEnergy: 10,
      resourceType: 'item',
      paramId: 'beach_椰子',
      itemConfig: {
        item: [
          {
            itemId: '椰子',
            quantity: 1,
          },
        ],
        extend: [
          {
            item: [
              {
                itemId: '椰子',
                quantity: 4,
              },
            ],
            probability: 0.5,
            text: '长杆舞得又稳又准，一次打下了四个椰子。',
          },
        ],
      },
      text: '你举起木竿，瞄准了椰蒂，利落地一捅。椰子应声落地，在地上砸出个小坑。',
    },
    {
      id: 'beach_椰树林_砍伐',
      name: '砍伐',
      description: '砍椰子树，有概率获得椰子。',
      descriptionTitle: '砍椰子树',
      displayCondition: { flag: ['flag_椰树林_追踪猴群'] },
      costTime: 10,
      costEnergy: 10,
      availableCondition: {
        condition: {
          target: {
            type: ConditionTargetType.ITEM,
            id: '石斧',
          },
          operator: ComparisonOperator.GREATER_EQUAL,
          value: 1,
        },
      },
      unavailableTooltip: '你需要一把斧子才能砍伐椰子树。',
      resourceType: 'item',
      paramId: 'beach_椰子树',
      itemConfig: {
        item: [
          {
            itemId: '椰子',
            quantity: 1,
          },
          {
            itemId: '木头',
            quantity: 3,
          },
        ],
        extend: [
          {
            item: [
              {
                itemId: '椰子',
                quantity: 1,
              },
              {
                itemId: '木头',
                quantity: 4,
              },
            ],
            probability: 0.5,
            text: '这棵椰树格外脆生，额外劈下了一块木头。',
          },
        ],
      },
    },
  ],
  isDungeon: false,
}

export default beach_椰树林
