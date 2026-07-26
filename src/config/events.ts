// ============================================================
// 此文件由事件转换器自动生成，请勿手动修改
// 生成时间: 2026-07-24 22:36:51
// ============================================================

import type { GameEvent, EventRegistry } from '../types/event'
import { EventType, EventOptionStyle, EventOptionCostType } from '../types/event'
import {
  EffectType, AttributeType, AttributeOperation, ItemChangeType,
  GainExpTarget, LogicOperator, ConditionTargetType, ComparisonOperator,
} from '../types/effect'
import { FlagOperation } from '@/types/flag'
import { RecipeType } from '@/types/recipe'

// ============================================================
// 搜索飞机残骸
// ============================================================

const event_beach_飞机残骸: GameEvent = {
    id: 'event_beach_飞机残骸',
    name: '搜索飞机残骸',
    frames: [
      {
        id: 'event_beach_飞机残骸_1',
        order: 1,
        text: '你沿着海岸线向残骸走去。\n\n沙子在脚下塌陷，每一步都比上一步沉重。左肋的钝痛随着呼吸起伏。你没有停下来。\n\n走近后，残骸的细节变得清晰。\n\n机舱断成了三段。最靠近你的是尾部，尾翼几乎完好，只是方向舵歪向一边。中部是撕裂最严重的地方，金属蒙皮像被巨人用手撕开，参差不齐的边缘反射着刺目的白光。机头扎进了沙滩深处，只能看到驾驶舱破碎的舷窗，玻璃上布满蛛网状的裂纹。\n\n烧焦的气味更浓了。不是燃料，是塑料和布料燃烧后的臭味。你看到座椅的皮革被烧成了焦黑色，里面的海绵翻出来，像某种肿胀的内脏。\n\n风穿过破碎的舷窗，发出一声低沉的呜咽。',
        options: [
          {
            id: 'event_beach_飞机残骸_1_1',
            text: '从裂口进入',
            results: [
              {
                type: 'switchScene',
                sceneId: 'beach',
                subSceneId: 'beach_飞机残骸',
                enterText: '你从裂口钻进机舱。',
              },
            ],
            displayPriority: 3,
            isOneTime: false,
          },
        ],
      },
      {
        id: 'event_beach_飞机残骸_2',
        order: 2,
        text: '你从裂口钻进机舱。\n\n机舱里面的光线很暗。舷窗被烟熏黑了，只有几束光从机身断裂处的缝隙挤进来，在倾斜的地板上切出细长的光带。空气里有烧焦塑料的味道，还有一股更淡但更刺鼻的气味——航空燃油。好在只是残余。\n\n舱内的一切都是倾斜的。座椅歪向一边，行李架的门有的震开了，有的卡死。过道被杂物堵住大半，你得侧身才能通过。\n\n你从前舱开始搜索。',
        options: [
          {
            id: '座椅下方',
            text: '座椅下方',
            results: [
              {
                type: 'nextFrame',
                effects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '薄外套',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '获得薄外套',
                  },
                ],
                targetFrameId: 'event_beach_飞机残骸_2',
                text: '座椅下方的衣物散落一地，大部分被海水浸过，湿重无用。\n\n你挑了几件干的，主要是袜子，还有一件薄外套。\n\n夜里会用得上。',
              },
            ],
            displayPriority: 3,
            isOneTime: true,
            selectedFlag: 'event_beach_飞机残骸_2_options_1',
          },
          {
            id: '头顶的行李架',
            text: '头顶的行李架',
            results: [
              {
                type: 'nextFrame',
                effects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '镜子',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '获得镜子',
                  },
                ],
                targetFrameId: 'event_beach_飞机残骸_2',
                text: '头顶的行李架里，一只手提箱卡在角落。\n\n你用力拽出来，拉链已经锈住。撬开后里面是换洗衣物和一个洗漱包。洗漱包里有小剪刀、指甲刀、一面巴掌大的镜子。镜子完好，反射出帅的一批的脸。\n\n你把镜子用衣服包好，放进外套口袋。这东西能生火。',
              },
            ],
            displayPriority: 2,
            isOneTime: true,
            selectedFlag: 'event_beach_飞机残骸_2_options_2',
          },
          {
            id: '座椅夹缝',
            text: '座椅夹缝',
            results: [
              {
                type: 'nextFrame',
                effects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '笔记本',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '获得笔记本',
                  },
                ],
                setFlags: {
                  notebook: true,
                },
                targetFrameId: 'event_beach_飞机残骸_2',
                text: '座椅夹缝里找到两本杂志和一个带笔的空白笔记本。\n\n 你把笔记本和笔放进外套口袋。',
              },
            ],
            displayPriority: 1,
            isOneTime: true,
            selectedFlag: 'event_beach_飞机残骸_2_options_3',
          },
          {
            id: '座椅夹缝',
            text: '座椅夹缝',
            results: [
              {
                type: 'nextFrame',
                effects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '笔记本',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '获得笔记本',
                  },
                ],
                setFlags: {
                  notebook: true,
                },
                targetFrameId: 'event_beach_飞机残骸_2',
                text: '座椅夹缝里找到两本杂志和一个带笔的空白笔记本。\n\n 你把笔记本和笔放进外套口袋。',
              },
            ],
            displayPriority: 1,
            isOneTime: true,
            selectedFlag: 'event_beach_飞机残骸_2_options_3',
          },
          {
            id: '头等舱',
            text: '头等舱',
            results: [
              {
                type: 'nextFrame',
                targetFrameId: 'event_beach_飞机残骸_3',
                text: '头等舱的隔帘烧焦了一半。你掀开焦化的布帘，侧身钻了进去。',
              },
            ],
            displayCondition: {
              logic: LogicOperator.AND,
              subConditions: [
                {
                  target: {
                    type: ConditionTargetType.FLAG,
                    id: 'event_beach_飞机残骸_2_options_1',
                  },
                  operator: ComparisonOperator.EQUAL,
                  value: true,
                },
                {
                  target: {
                    type: ConditionTargetType.FLAG,
                    id: 'event_beach_飞机残骸_2_options_2',
                  },
                  operator: ComparisonOperator.EQUAL,
                  value: true,
                },
                {
                  target: {
                    type: ConditionTargetType.FLAG,
                    id: 'event_beach_飞机残骸_2_options_3',
                  },
                  operator: ComparisonOperator.EQUAL,
                  value: true,
                },
              ],
            },
            displayPriority: 1,
            isOneTime: true,
            selectedFlag: 'event_beach_飞机残骸_2_options_4',
          },
        ],
      },
      {
        id: 'event_beach_飞机残骸_3',
        order: 3,
        text: '你收好了搜刮到的物资。当前最重要的是找个安全的地方度过第一夜。',
        options: [
          {
            id: 'leave_wreckage',
            text: '离开残骸',
            results: [
              {
                type: 'endEvent',
                exitText: '你离开了飞机残骸，回到了海滩上',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
      {
        id: 'after_gather',
        order: 2,
        text: '你收好了搜刮到的物资。当前最重要的是找个安全的地方度过第一夜。',
        options: [
          {
            id: 'leave_wreckage',
            text: '离开残骸',
            results: [
              {
                type: 'endEvent',
                exitText: '你离开了飞机残骸，回到了海滩上',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
  }


const event_飞机残骸_搜索座椅: GameEvent = {
    id: 'event_飞机残骸_搜索座椅',
    name: '搜索座椅',
    frames: [
      {
        id: 'event_飞机残骸_搜索座椅',
        order: 1,
        text: '座椅下方的衣物散落一地，大部分被海水浸过，湿重无用。\n\n你挑了几件干的，主要是袜子，还有一件薄外套。\n\n夜里会用得上。',
        onEnterEffects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '薄外套',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '获得薄外套',
                  },
        ],
        options: [
          {
            id: '继续',
            text: '继续',
            results: [
              {
                type: 'endEvent',
                exitText: '你继续搜索了',
              },
            ],
            displayPriority: 5,
            isOneTime: false,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
  }


const event_飞机残骸_搜索行李架: GameEvent = {
    id: 'event_飞机残骸_搜索行李架',
    name: '搜索座椅',
    frames: [
      {
        id: 'event_飞机残骸_搜索行李架',
        order: 1,
        text: '头顶的行李架里，一只手提箱卡在角落。\n\n你用力拽出来，拉链已经锈住。撬开后里面是换洗衣物和一个洗漱包。洗漱包里有小剪刀、指甲刀、一面巴掌大的镜子。镜子完好，反射出帅的一批的脸。\n\n你把镜子用衣服包好，放进外套口袋。把装衣服的防水布也收了起来。',
        onEnterEffects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '镜子',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '获得镜子',
                  },
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '防水布',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '获得防水布',
                  },
        ],
        options: [
          {
            id: '继续',
            text: '继续',
            results: [
              {
                type: 'endEvent'
              },
            ],
            displayPriority: 5,
            isOneTime: false,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
  }


const event_飞机残骸_搜索夹缝: GameEvent = {
    id: 'event_飞机残骸_搜索夹缝',
    name: '搜索夹缝',
    frames: [
      {
        id: 'event_飞机残骸_搜索夹缝',
        order: 1,
        text: '座椅夹缝里找到两本杂志和一个带笔的空白笔记本。\n\n 你把笔记本和笔放进外套口袋。',
        onEnterEffects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '笔记本',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '获得笔记本',
                  },
        ],
        options: [
          {
            id: '继续',
            text: '继续',
            results: [
              {
                type: 'endEvent'
              },
            ],
            displayPriority: 5,
            isOneTime: false,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
  }

const event_飞机残骸_搜索头等舱: GameEvent = {
    id: 'event_飞机残骸_搜索头等舱',
    name: '搜索头等舱',
    frames: [
      {
        id: 'event_飞机残骸_搜索头等舱',
        order: 1,
        text: '头等舱的隔帘烧焦了一半。\n\n你掀开焦化的布帘，这里损毁更严重。但座位底下的救生包还在——密封铝箔包装，巴掌大小，撕开后是压缩饼干、一小瓶矿泉水、两粒止痛药。\n\n饼干硬得像干泥，包装完好。',
        onEnterEffects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '压缩饼干',
                    changeType: ItemChangeType.ADD,
                    quantity: 3,
                  },
                    probability: 1.0,
                    description: '获得压缩饼干*3',
                  },
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '矿泉水',
                    changeType: ItemChangeType.ADD,
                    quantity:1,
                  },
                    probability: 1.0,
                    description: '获得矿泉水',
                  },
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '止痛药',
                    changeType: ItemChangeType.ADD,
                    quantity:2,
                  },
                    probability: 1.0,
                    description: '获得止痛药*2',
                  },
        ],
        options: [
          {
            id: '继续',
            text: '继续',
            results: [
              {
                type: 'endEvent'
              },
            ],
            displayPriority: 5,
            isOneTime: false,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
  }

const event_飞机残骸_驾驶舱: GameEvent = {
    id: 'event_飞机残骸_驾驶舱',
    name: '驾驶舱',
    frames: [
      {
        id: 'event_飞机残骸_驾驶舱_已经进入',
        order: 1,
        text: '你已经来过这里了——\n\n驾驶舱的仪表盘碎了大半，玻璃碴铺满座椅。副驾驶座椅下有一个铁盒子，标签上写着“应急工具”。里面的东西已经被你扫荡一空。',
        displayFlag: ['event_飞机残骸_进入驾驶舱'],
        options: [
          {
            id: '离开',
            text: '离开',
            results: [
              {
                type: 'endEvent',
              },
            ],
            displayPriority: 5,
            isOneTime: false,
          },
        ],
      },
      {
        id: 'event_飞机残骸_驾驶舱',
        order: 2,
        text: '驾驶舱的门扭曲变形严重，卡在同样变形的门框里，露出小小的门缝通往驾驶舱。\n\n 你觉得你可以试试能不能把门踹开——起码没有人会要求赔偿。',
        options: [
          {
            id: '尝试踹门',
            text: '尝试踢门',
            results: [
              {
                type: 'nextFrame',
                targetFrameId: 'event_飞机残骸_驾驶舱_in',
                condition: {
                    target: {
                        type: ConditionTargetType.ATTRIBUTE,
                        attributeType: AttributeType.STRENGTH,
                    },
                    operator: ComparisonOperator.GREATER,
                    value: 20,
                },
              },
              {
                type: 'nextFrame',
                targetFrameId: 'event_飞机残骸_驾驶舱',
                condition: {
                    target: {
                        type: ConditionTargetType.ATTRIBUTE,
                        attributeType: AttributeType.STRENGTH,
                    },
                    operator: ComparisonOperator.LESS,
                    value: 20,
                },
                text: '舱门纹丝不动——\n\n你当然可以继续尝试，但以目前的情况来看，只是白费体力。',
              },
            ],
            displayPriority: 5,
            isOneTime: false,
          },
          {
            id: '离开',
            text: '离开',
            results: [
              {
                type: 'endEvent'
              },
            ],
            displayPriority: 4,
            isOneTime: false,
          },
        ],
      },
      {
        id: 'event_飞机残骸_驾驶舱_in',
        order: 3,
        text: '随着你的踹击，驾驶舱的门被踹出一个足以通过人的门缝，你成功地进入了驾驶舱。仪表盘碎了大半，玻璃碴铺满座椅。飞行员的座椅空着，安全带垂在地上，带扣完好。你解开带扣，把整条安全带抽出来——高强度尼龙，能承受几百公斤拉力。比绳子好用。\n\n副驾驶座椅下有一个铁盒子，标签上写着“应急工具”。你打开。信号弹两支，一把多功能战术刀。\n\n最里面是急救箱。白色塑料外壳，红色十字标志。你打开检查。绷带卷、消毒酒精。都封在独立包装里，干燥完好。',
        onEnterEffects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '多功能战术刀',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '获得多功能战术刀',
                  },
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '绷带',
                    changeType: ItemChangeType.ADD,
                    quantity:10,
                  },
                    probability: 1.0,
                    description: '获得绷带*10',
                  },
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '消毒酒精',
                    changeType: ItemChangeType.ADD,
                    quantity:5,
                  },
                    probability: 1.0,
                    description: '获得消毒酒精*5',
                  },
                  {
                    effect: {
                    type: EffectType.FLAG,
                    flagId: 'event_飞机残骸_进入驾驶舱',
                    operation: FlagOperation.SET,
                    value: true,
                  },
                    probability: 1.0,
                  },
        ],
        options: [
          {
            id: '离开',
            text: '离开',
            results: [
              {
                type: 'endEvent',
              },
            ],
            displayPriority: 5,
            isOneTime: false,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
  }

// 机翼营地
const event_机翼营地_搭建营地: GameEvent = {
    id: 'event_机翼营地_搭建营地',
    name: '搭建营地',
    frames: [
      {
        id: '搭建营地',
        order: 1,
        text: '除了半截机翼什么都没有。',
        textVariations: [
          {
            content: "防水布铺在沙子上，最起码有地方可以躺下来了。",
            /** 显示条件 */
            displayFlag: ['event_机翼营地_铺地']
          },
          {
            content: "篝火燃烧着，有了点儿基地的感觉了。",
            /** 显示条件 */
            displayFlag: ['event_机翼营地_搭建篝火']
          },
          {
            content: "这里勉强可以算是营地了。\n\n你应该先休息休息。",
            /** 显示条件 */
            displayFlag: ['event_机翼营地_搭建篝火', 'event_机翼营地_铺地']
          },
        ],
        options: [
          {
            id: '铺地',
            text: '铺地(需要防水布)',
            availableCondition: {
                target: {
                    type: ConditionTargetType.ITEM,
                    id: '防水布',
                },
                operator: ComparisonOperator.GREATER_EQUAL,
                value: 1,
            },
            costs: [
              {
                costType: EventOptionCostType.ITEM,
                itemId: '防水布',
                value: 1,
              },
            ],
            results: [
              {
                type: 'nextFrame',
                targetFrameId: '搭建营地',
              },
            ],
            displayPriority: 10,
            isOneTime: true,
            selectedFlag: 'event_机翼营地_铺地',
          },
          {
            id: '搭建篝火',
            text: '搭建篝火(需要木头5)',
            availableCondition: {
                target: {
                    type: ConditionTargetType.ITEM,
                    id: '木头',
                },
                operator: ComparisonOperator.GREATER_EQUAL,
                value: 5,
            },
            costs: [
              {
                costType: EventOptionCostType.ITEM,
                itemId: '木头',
                value: 5,
              },
            ],
            results: [
              {
                type: 'nextFrame',
                targetFrameId: '搭建营地',
              },
            ],
            displayPriority: 10,
            isOneTime: true,
            selectedFlag: 'event_机翼营地_搭建篝火',
          },
          {
            id: '离开',
            text: '离开',
            results: [
              {
                type: 'endEvent',
              },
            ],
            displayPriority: 5,
            isOneTime: false,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
  }



// ============================================================
// 海滩遇蟹
// ============================================================

const event_beach_大螃蟹: GameEvent = {
    id: 'event_beach_大螃蟹',
    name: '海滩遇螃蟹',
    frames: [
      {
        id: 'crab_spotted',
        order: 1,
        text: '你靠近了一只落单的大螃蟹，它高举着巨大的螯钳，似乎是在示意你离远点儿。',
        options: [
          {
            id: 'fight_crab',
            text: '战斗',
            results: [
              {
                type: 'triggerBattle',
                enemyId: ['大螃蟹'],
                victoryFrameId: 'crab_victory',
                defeatFrameId: 'crab_defeat',
                escapeFrameId: 'crab_escaped',
                canEscape: true,
                firstEncounterBonus: true,
              },
            ],
            displayPriority: 2,
          },
          {
            id: 'flee_crab',
            text: '离开',
            description: '离开',
            costs: [
              {
                costType: EventOptionCostType.STAMINA,
                value: 10,
              },
            ],
            results: [
              {
                type: 'endEvent',
                exitText: '你决定不去打扰它们。',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
      {
        id: 'crab_victory',
        order: 2,
        text: '大螃蟹不再动弹。',
        options: [
          {
            id: 'butcher_crab',
            text: '分解蟹肉',
            results: [
              {
                type: 'endEvent',
                exitText: '你从大螃蟹身上获取了一些有用的材料',
                effects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: '蟹肉',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '蟹肉*1',
                  },
                ],
              },
            ],
            displayPriority: 1,
          },
        ],
      },
      {
        id: 'crab_escaped',
        order: 2,
        text: '你抓住机会逃离了战斗。大螃蟹没有追上来。',
        options: [
          {
            id: 'return_beach',
            text: '返回海滩',
            results: [
              {
                type: 'endEvent',
                exitText: '你安全回到了海滩上',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
      {
        id: 'crab_defeat',
        order: 2,
        text: '变异蟹的巨螯击中了你的要害，你失去了意识...',
        options: [
          {
            id: 'accept_defeat',
            text: '...',
            results: [
              {
                type: 'endEvent',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
    ],
    eventType: EventType.BATTLE,
    isRepeatable: true,
  }

// ============================================================
// 变异树木
// ============================================================

const eventStrangeTrees: GameEvent = {
    id: 'event_strange_trees',
    name: '变异树木',
    frames: [
      {
        id: 'approach_trees',
        order: 1,
        text: '你走近那些树干上有异常突起的树木。树皮表面覆盖着一种暗紫色的苔藓，散发着微弱的光芒。',
        options: [
          {
            id: 'touch_moss',
            text: '触摸苔藓',
            results: [
              {
                type: 'nextFrame',
                effects: [
                  {
                    effect: {
                    type: EffectType.ATTRIBUTE,
                    attribute: AttributeType.SAN,
                    operation: AttributeOperation.SUBTRACT,
                    value: 5,
                  },
                    probability: 1.0,
                    description: 'SAN-5',
                  },
                ],
                targetFrameId: 'touch_result',
                text: '你伸手触碰了那暗紫色的苔藓。\n触感冰凉而湿润，一种奇异的共鸣感顺着指尖传遍全身。',
              },
            ],
            displayPriority: 2,
          },
          {
            id: 'leave_trees',
            text: '离开',
            results: [
              {
                type: 'endEvent',
                exitText: '你决定不去碰那些可疑的树木',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
      {
        id: 'touch_result',
        order: 2,
        text: '你感到一阵眩晕。那些苔藓在你的注视下似乎在微微蠕动。\n也许这不是什么好兆头。',
        options: [
          {
            id: 'back_away',
            text: '后退离开',
            results: [
              {
                type: 'endEvent',
                exitText: '你快步离开了这片区域，但那股冰凉的感觉仍停留在指尖',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
  }

// ============================================================
// 采集浆果
// ============================================================

const eventGatherBerries: GameEvent = {
    id: 'event_gather_berries',
    name: '采集浆果',
    frames: [
      {
        id: 'gather_start',
        order: 1,
        text: '灌木丛中长满了红色的浆果，看起来可以食用。你要采集一些吗？',
        options: [
          {
            id: 'gather_berries',
            text: '采集浆果',
            costs: [
              {
                costType: EventOptionCostType.STAMINA,
                value: 8,
              },
            ],
            results: [
              {
                type: 'nextFrame',
                effects: [
                  {
                    effect: {
                    type: EffectType.GAIN_EXP,
                    target: GainExpTarget.SURVIVAL_SKILL,
                    targetId: 'gathering',
                    amount: 15,
                  },
                    probability: 1.0,
                    description: '获得采集经验',
                  },
                ],
                targetFrameId: 'gather_result',
              },
            ],
            displayPriority: 1,
          },
          {
            id: 'leave_berries',
            text: '离开',
            results: [
              {
                type: 'endEvent',
                exitText: '你决定不采摘这些浆果',
              },
            ],
            displayPriority: 2,
          },
        ],
      },
      {
        id: 'gather_result',
        order: 2,
        text: '你小心地采摘了一些浆果。',
        onEnterEffects: [
          {
            effect: {
            type: EffectType.ITEM,
            itemId: 'wild_berries',
            changeType: ItemChangeType.ADD,
            quantity: 3,
          },
            probability: 1.0,
            description: '获得浆果',
          },
        ],
        options: [
          {
            id: 'done_gathering',
            text: '继续前进',
            results: [
              {
                type: 'endEvent',
                exitText: '你继续探索森林',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
    isRepeatable: true,
  }

// ============================================================
// 收集落枝
// ============================================================

const eventGatherWood: GameEvent = {
    id: 'event_gather_wood',
    name: '收集落枝',
    frames: [
      {
        id: 'gather_wood_start',
        order: 1,
        text: '地面上散落着不少干枯的树枝，是生火的好材料。',
        options: [
          {
            id: 'collect_wood',
            text: '收集树枝',
            costs: [
              {
                costType: EventOptionCostType.STAMINA,
                value: 5,
              },
            ],
            results: [
              {
                type: 'nextFrame',
                effects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: 'firewood',
                    changeType: ItemChangeType.ADD,
                    quantity: 5,
                  },
                    probability: 1.0,
                    description: '获得木材',
                  },
                ],
                targetFrameId: 'wood_result',
              },
            ],
            displayPriority: 1,
          },
          {
            id: 'ignore_wood',
            text: '忽略',
            results: [
              {
                type: 'endEvent',
                exitText: '你决定不收集这些树枝',
              },
            ],
            displayPriority: 2,
          },
        ],
      },
      {
        id: 'wood_result',
        order: 2,
        text: '你收集了一些干树枝，可以作为引火材料使用。',
        options: [
          {
            id: 'continue_explore',
            text: '继续探索',
            results: [
              {
                type: 'endEvent',
                exitText: '你继续在森林中探索',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
    isRepeatable: true,
  }

// ============================================================
// 发光苔藓
// ============================================================

const eventGlowingMoss: GameEvent = {
    id: 'event_glowing_moss',
    name: '发光苔藓',
    frames: [
      {
        id: 'observe_moss',
        order: 1,
        text: '洞穴墙壁上覆盖着一层发着幽蓝光芒的苔藓，照亮了周围一小片区域。',
        options: [
          {
            id: 'collect_moss',
            text: '采集苔藓',
            results: [
              {
                type: 'nextFrame',
                effects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: 'glowing_moss',
                    changeType: ItemChangeType.ADD,
                    quantity: 2,
                  },
                    probability: 1.0,
                    description: '获得发光苔藓',
                  },
                ],
                targetFrameId: 'moss_collected',
                text: '你小心地刮下了一些发光苔藓，它们在你手中微弱地闪烁着。',
              },
            ],
            displayPriority: 1,
          },
          {
            id: 'leave_moss',
            text: '忽略',
            results: [
              {
                type: 'endEvent',
                exitText: '你决定不去碰那些发光的苔藓',
              },
            ],
            displayPriority: 2,
          },
        ],
      },
      {
        id: 'moss_collected',
        order: 2,
        text: '你获得了少量的发光苔藓。它们也许能在黑暗中提供照明。',
        options: [
          {
            id: 'continue_cave',
            text: '继续探索洞穴',
            results: [
              {
                type: 'endEvent',
                exitText: '你继续在洞穴中探索',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
    isRepeatable: true,
  }

// ============================================================
// 发现研究日志
// ============================================================

const eventJournalFragment: GameEvent = {
    id: 'event_journal_fragment',
    name: '发现研究日志',
    frames: [
      {
        id: 'find_journal',
        order: 1,
        text: '你在洞穴的角落发现了几页发黄的纸，上面密密麻麻地写着字。',
        options: [
          {
            id: 'read_journal',
            text: '阅读日志',
            results: [
              {
                type: 'nextFrame',
                effects: [
                  {
                    effect: {
                    type: EffectType.ITEM,
                    itemId: 'journal_fragment',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                    probability: 1.0,
                    description: '获得日志碎片',
                  },
                  {
                    effect: {
                    type: EffectType.FLAG,
                    flagId: 'found_journal_fragment',
                    operation: FlagOperation.SET,
                    value: true,
                  },
                    probability: 1.0,
                    description: '设置已找到日志碎片',
                  },
                ],
                targetFrameId: 'read_journal_content',
              },
            ],
            displayPriority: 1,
          },
          {
            id: 'ignore_journal',
            text: '不理会',
            results: [
              {
                type: 'endEvent',
                exitText: '你决定不去碰那些可疑的纸张',
              },
            ],
            displayPriority: 2,
          },
        ],
      },
      {
        id: 'read_journal_content',
        order: 2,
        text: '你翻开日志，上面的内容让你不寒而栗。\n日志记载着关于某种孢子的研究，内容令人不安。',
        onEnterEffects: [
          {
            effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.SAN,
            operation: AttributeOperation.SUBTRACT,
            value: 10,
          },
            probability: 1.0,
            description: 'SAN-10',
          },
        ],
        options: [
          {
            id: 'close_journal',
            text: '合上日志',
            results: [
              {
                type: 'endEvent',
                exitText: '你合上了日志，但那些文字仍然在你脑海中回荡',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
    isRepeatable: true,
    triggeredFlag: 'triggered_journal_fragment',
  }

// ============================================================
// 奇怪的刻痕
// ============================================================

const eventCaveMarkings: GameEvent = {
    id: 'event_cave_markings',
    name: '奇怪的刻痕',
    frames: [
      {
        id: 'examine_markings',
        order: 1,
        text: '洞穴墙壁上有一些奇怪的刻痕，看起来不像是自然形成的。\n这些符号排列有序，似乎蕴含着某种意义。',
        options: [
          {
            id: 'study_markings',
            text: '仔细研究',
            results: [
              {
                type: 'nextFrame',
                effects: [
                  {
                    effect: {
                    type: EffectType.ATTRIBUTE,
                    attribute: AttributeType.SAN,
                    operation: AttributeOperation.SUBTRACT,
                    value: 5,
                  },
                    probability: 1.0,
                    description: 'SAN-5',
                  },
                ],
                targetFrameId: 'markings_studied',
                text: '你花了一些时间端详这些刻痕。它们似乎是在描述某种祭祀仪式。\n你的SAN值下降了。',
              },
            ],
            displayPriority: 1,
          },
          {
            id: 'ignore_markings',
            text: '不去理会',
            results: [
              {
                type: 'endEvent',
                exitText: '你决定不去深究这些诡异的符号',
              },
            ],
            displayPriority: 2,
          },
        ],
      },
      {
        id: 'markings_studied',
        order: 2,
        text: '那些符号深深刻在了你的脑海中。你预感这座岛屿的秘密远比你想象的要深。',
        options: [
          {
            id: 'leave_cave_area',
            text: '离开',
            results: [
              {
                type: 'endEvent',
                exitText: '你离开了那片刻有符号的墙壁',
              },
            ],
            displayPriority: 1,
          },
        ],
      },
    ],
    eventType: EventType.NORMAL,
  }

// ============================================================
// 事件注册表
// ============================================================

export const eventRegistry: EventRegistry = {
  events: {
    event_beach_飞机残骸: event_beach_飞机残骸,
    event_飞机残骸_搜索座椅: event_飞机残骸_搜索座椅,
    event_飞机残骸_搜索夹缝: event_飞机残骸_搜索夹缝,
    event_飞机残骸_搜索行李架: event_飞机残骸_搜索行李架,
    event_飞机残骸_搜索头等舱: event_飞机残骸_搜索头等舱,
    event_飞机残骸_驾驶舱: event_飞机残骸_驾驶舱,
    event_机翼营地_搭建营地: event_机翼营地_搭建营地,

    event_beach_大螃蟹: event_beach_大螃蟹,

    event_strange_trees: eventStrangeTrees,
    event_gather_berries: eventGatherBerries,
    event_gather_wood: eventGatherWood,
    event_glowing_moss: eventGlowingMoss,
    event_journal_fragment: eventJournalFragment,
    event_cave_markings: eventCaveMarkings,
  },
}
