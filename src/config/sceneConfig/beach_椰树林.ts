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
      text: '你拨开垂落的棕榈叶，走进了这片椰树林。阳光穿过叶片的缝隙洒下斑驳的光影，地上铺满了枯黄的落叶和几个熟透落地的椰子。海风穿过树林，椰叶沙沙作响。\n\n你正要往前走，头顶传来一声尖利的叫声。你抬头——几只{beach_ysl_event_1}正蹲在高处的椰树上，尾巴悬空，眼睛直勾勾地盯着你。\n\n你停下脚步，它们也停下叫声。你往前走一步，领头的那只发出了更响亮的警告声。\n\n它们不想让你过去。\n\n在搞清楚之前，你不能采摘和砍伐。',
      isAutoTrigger: false,
      isOneTime: false,
      displayCondition: { hideFlag: ['beach_椰树林_追踪猴群'] },
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
      displayCondition: { hideFlag: ['event_beach_椰树林_猴王的领地'] },
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
      text: '你可以采摘和砍伐了。\n\n你知道{beach_ysl_event_3}就在椰林深处。',
      isAutoTrigger: false,
      isOneTime: false,
      displayCondition: { hideFlag: ['event_beach_椰树林_猴王的领地_胜利'] },
      eventEntries: [
        {
          key: 'beach_ysl_event_3',
          displayText: '猴王的领地',
          eventId: 'event_beach_椰树林_猴王的领地',
        },
      ],
    },
    {
      id: 'beach_椰树林_8',
      priority: 1,
      text: '你现在就是这里的新猴王！。',
    },
    {
      id: 'beach_椰树林_1 ',
      priority: 1,
      text: '长满了椰树。',
    },
    {
      id: 'beach_椰树林_2 ',
      priority: 1,
      text: '椰树。。',
    },
    {
      id: 'beach_椰树林_3 ',
      priority: 1,
      text: '太好啦，有椰子！',
    },
    {
      id: 'beach_椰树林_4 ',
      priority: 1,
      text: '椰✌……',
    },
    {
      id: 'beach_椰树林_5 ',
      priority: 1,
      text: '望椰止渴。',
    },
    {
      id: 'beach_椰树林_6 ',
      priority: 1,
      text: '长满了椰树，但是不要砍伐过度哦~',
    },
    {
      id: 'beach_椰树林_0 ',
      priority: 5,
      text: '椰树都被你砍完了，SAD。\n\n等几天说不定还会长出来。',
      isAutoTrigger: false,
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
  temperatureModifier: 0,
  explore: exploreButton,
  moves: [
    exitSubSceneMove({
      id: 'beach_椰树林_前往沙滩',
      description: '前往沙滩',
      descriptionTitle: '坠机海滩',
    }),
  ],
  collects: [
    {
      id: 'beach_椰树林_搜索椰子',
      name: '椰子',
      description: '爬上树去摘椰子，要是有个长杆就好了。',
      descriptionTitle: '摘椰子',
      displayCondition: {
        flag: ['beach_椰树林_追踪猴群'],
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
      text: '你奋力爬上椰子树，要是有个长杆，你就可以直接打椰子了，而不是这么费力的爬上爬下。',
    },
    {
      id: 'beach_椰树林_打椰子',
      name: '椰子',
      description: '用长杆打椰子。',
      descriptionTitle: '打椰子',
      displayCondition: {
        flag: ['beach_椰树林_追踪猴群'],
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
      text: '你抬头举起木竿打下椰子。',
    },
    {
      id: 'beach_椰树林_砍伐',
      name: '砍伐',
      description: '砍椰子树，有概率获得椰子',
      descriptionTitle: '砍椰子树',
      displayCondition: { flag: ['beach_椰树林_追踪猴群'] },
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
      unavailableTooltip: '你需要一个斧子才能砍伐椰子树。',
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
