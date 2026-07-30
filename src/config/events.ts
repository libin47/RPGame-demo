// ============================================================
// 此文件由事件转换器自动生成，请勿手动修改
// 生成时间: 2026-07-24 22:36:51
// ============================================================

import type { GameEvent, EventRegistry } from '../types/event'
import { EventType } from '../types/event'
import {
  EffectType,
  AttributeType,
  AttributeOperation,
  ItemChangeType,
  GainExpTarget,
  LogicOperator,
  ConditionTargetType,
  ComparisonOperator,
} from '../types/effect'
import { RecipeType } from '@/types/recipe'
import { OptionCostType } from '@/types/option'

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
          name: '从裂口进入',
          results: [
            {
              type: 'switchScene',
              sceneId: 'beach',
              subSceneId: 'beach_飞机残骸',
              enterText: '你从裂口钻进机舱。',
            },
          ],

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
          name: '座椅下方',
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

          isOneTime: true,
          usedFlag: 'event_beach_飞机残骸_2_options_1',
        },
        {
          id: '头顶的行李架',
          name: '头顶的行李架',
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

          isOneTime: true,
          usedFlag: 'event_beach_飞机残骸_2_options_2',
        },
        {
          id: '座椅夹缝',
          name: '座椅夹缝',
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

          isOneTime: true,
          usedFlag: 'event_beach_飞机残骸_2_options_3',
        },
        {
          id: '座椅夹缝',
          name: '座椅夹缝',
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

          isOneTime: true,
          usedFlag: 'event_beach_飞机残骸_2_options_3',
        },
        {
          id: '头等舱',
          name: '头等舱',
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

          isOneTime: true,
          usedFlag: 'event_beach_飞机残骸_2_options_4',
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
          name: '离开残骸',
          results: [
            {
              type: 'endEvent',
              exitText: '你离开了飞机残骸，回到了海滩上',
            },
          ],
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
          name: '离开残骸',
          results: [
            {
              type: 'endEvent',
              exitText: '你离开了飞机残骸，回到了海滩上',
            },
          ],
        },
      ],
    },
  ],
  eventType: EventType.NORMAL,
}

// 飞机残骸
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
          name: '继续',
          results: [
            {
              type: 'endEvent',
              exitText: '你继续搜索了',
            },
          ],

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
          name: '继续',
          results: [
            {
              type: 'endEvent',
            },
          ],

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
          name: '继续',
          results: [
            {
              type: 'endEvent',
            },
          ],

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
            quantity: 1,
          },
          probability: 1.0,
          description: '获得矿泉水',
        },
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '止痛药',
            changeType: ItemChangeType.ADD,
            quantity: 2,
          },
          probability: 1.0,
          description: '获得止痛药*2',
        },
      ],
      options: [
        {
          id: '继续',
          name: '继续',
          results: [
            {
              type: 'endEvent',
            },
          ],

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
          name: '离开',
          results: [
            {
              type: 'endEvent',
            },
          ],

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
          name: '尝试踢门',
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

          isOneTime: false,
        },
        {
          id: '离开',
          name: '离开',
          results: [
            {
              type: 'endEvent',
            },
          ],

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
            quantity: 10,
          },
          probability: 1.0,
          description: '获得绷带*10',
        },
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '消毒酒精',
            changeType: ItemChangeType.ADD,
            quantity: 5,
          },
          probability: 1.0,
          description: '获得消毒酒精*5',
        },
        {
          effect: {
            type: EffectType.FLAG,
            flagId: 'event_飞机残骸_进入驾驶舱',
            operation: 'set',
            value: true,
          },
          probability: 1.0,
        },
      ],
      options: [
        {
          id: '离开',
          name: '离开',
          results: [
            {
              type: 'endEvent',
            },
          ],

          isOneTime: false,
        },
      ],
    },
  ],
  eventType: EventType.NORMAL,
}

const event_飞机残骸_搜索残骸: GameEvent = {
  id: 'event_飞机残骸_搜索残骸',
  name: '机残骸_搜索残骸',
  frames: [
    {
      id: 'event_飞机残骸_搜索残骸_1',
      order: 1,
      text: '你想寻找什么呢？',
      options: [
        {
          id: '金属残片',
          name: '金属残片',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_飞机残骸_搜索残骸_金属残片',
              weight: 1,
            },
            {
              type: 'nextFrame',
              targetFrameId: 'event_飞机残骸_搜索残骸_1',
              weight: 0.1,
              text: '你忙活了许久，但是一无所获。\n\n而时间正在流逝。',
            },
          ],

          isOneTime: false,
        },
        {
          id: '布料',
          name: '布料',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_飞机残骸_搜索残骸_布料',
              weight: 1,
            },
            {
              type: 'nextFrame',
              targetFrameId: 'event_飞机残骸_搜索残骸_1',
              weight: 1,
              text: '你忙活了许久，但是一无所获。\n\n而时间正在流逝。',
            },
          ],

          isOneTime: false,
        },
        {
          id: '药品',
          name: '药品',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_飞机残骸_搜索残骸_药品',
              weight: 0.1,
            },
            {
              type: 'nextFrame',
              targetFrameId: 'event_飞机残骸_搜索残骸_1',
              weight: 1,
              text: '你忙活了许久，但是一无所获。\n\n而时间正在流逝。',
            },
          ],

          isOneTime: false,
        },
      ],
    },

    {
      id: 'event_飞机残骸_搜索残骸_金属残片',
      order: 2,
      text: '你捡到不少金属残片。\n\n钛合金，高贵的航空金属，如今如垃圾一般随处散落在沙滩上。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '金属碎片',
            changeType: ItemChangeType.ADD,
            quantity: 3,
          },
          probability: 1.0,
          description: '获得金属碎片*3',
        },
      ],
      options: [
        {
          id: '离去',
          name: '离去',
          results: [
            {
              type: 'endEvent',
            },
          ],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_飞机残骸_搜索残骸_布料',
      order: 2,
      text: '你捡到不少布料。\n\n具体来说——你把这些没了主人的衣物撕成了布料，有的还沾着血渍。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '布料',
            changeType: ItemChangeType.ADD,
            quantity: 5,
          },
          probability: 1.0,
          description: '获得布料*5',
        },
      ],
      options: [
        {
          id: '离去',
          name: '离去',
          results: [
            {
              type: 'endEvent',
            },
          ],

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
      options: [
        {
          id: '铺地',
          name: '铺地(需要防水布)',
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
              costType: OptionCostType.ITEM,
              itemId: '防水布',
              value: 1,
              affectedByCoefficient: false,
            },
          ],
          results: [
            {
              type: 'endEvent',
              exitText: '你将防水布铺在沙地了，你可以在这里休息了。',
            },
          ],

          isOneTime: true,
          usedFlag: 'event_机翼营地_铺地',
        },
        {
          id: '离开',
          name: '离开',
          results: [
            {
              type: 'endEvent',
            },
          ],

          isOneTime: false,
        },
      ],
    },
  ],
  eventType: EventType.NORMAL,
}

// 椰树林
const event_椰树林_摘椰子: GameEvent = {
  id: 'event_椰树林_摘椰子',
  name: '摘椰子',
  frames: [
    {
      id: 'event_椰树林_摘椰子_1',
      order: 1,
      text: '椰子高高在上，你想怎么摘呢？',
      textVariations: [
        {
          content: '椰子在看着你？',
          displayFlag: ['beach_抵达机翼营地'],
        },
      ],
      options: [
        {
          id: '爬上去',
          name: '爬上去',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_椰树林_摘椰子_爬上去成功',
              weight: 5,
              condition: {
                target: {
                  type: ConditionTargetType.ATTRIBUTE,
                  attributeType: AttributeType.AGILITY,
                },
                operator: ComparisonOperator.GREATER,
                value: 20,
              },
            },

            {
              type: 'nextFrame',
              targetFrameId: 'event_椰树林_摘椰子_爬上去成功',
              weight: 2,
              condition: {
                target: {
                  type: ConditionTargetType.ATTRIBUTE,
                  attributeType: AttributeType.AGILITY,
                },
                operator: ComparisonOperator.GREATER,
                value: 10,
              },
            },

            {
              type: 'nextFrame',
              targetFrameId: 'event_椰树林_摘椰子_爬上去失败',
              weight: 1,
            },
          ],

          isOneTime: false,
        },

        {
          id: '用木竿打',
          name: '用木竿打',
          availableCondition: {
            target: {
              type: ConditionTargetType.ITEM,
              id: '木竿',
            },
            operator: ComparisonOperator.GREATER_EQUAL,
            value: 1,
          },
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_椰树林_摘椰子_木竿',
              weight: 1,
            },
          ],

          isOneTime: false,
        },
        {
          id: '离开',
          name: '离开',
          results: [
            {
              type: 'endEvent',
            },
          ],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_椰树林_摘椰子_爬上去成功',
      order: 2,
      text: '你仰头望向树冠。\n\n你选了一棵不算太高的。\n\n你双臂环抱树干，脚掌抵住树根，开始往上攀。\n\n你摘了两个椰子，丢在树下。',
      options: [
        {
          id: '收获椰子',
          name: '收获椰子',

          results: [
            {
              type: 'endEvent',
              effects: [
                {
                  effect: {
                    type: EffectType.ITEM,
                    itemId: '椰子',
                    changeType: ItemChangeType.ADD,
                    quantity: 2,
                  },
                  probability: 1.0,
                  description: '获得椰子*2',
                },
              ],
            },
          ],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_椰树林_摘椰子_爬上去失败',
      order: 2,
      text: '你仰头望向树冠。\n\n你选了一棵不算太高的。\n\n你双臂环抱树干，脚掌抵住树根，开始往上攀。\n\n然后你掉了下来。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.HP,
            operation: AttributeOperation.SUBTRACT,
            value: 15,
          },
          probability: 1.0,
          description: '你因跌落而受伤。',
        },
      ],
      options: [
        {
          id: '离去',
          name: '不甘离去',

          results: [
            {
              type: 'endEvent',
            },
          ],

          isOneTime: false,
        },
      ],
    },

    {
      id: 'event_椰树林_摘椰子_木竿',
      order: 2,
      text: '你仰头望向树冠。\n\n你选了一棵不算太高的。\n\n你用木竿击打。\n\n一个椰子掉在了树下。',
      options: [
        {
          id: '捡起椰子',
          name: '捡起椰子',

          results: [
            {
              type: 'endEvent',
              effects: [
                {
                  effect: {
                    type: EffectType.ITEM,
                    itemId: '椰子',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                  probability: 1.0,
                  description: '获得椰子*1',
                },
              ],
            },
          ],

          isOneTime: false,
        },
      ],
    },
  ],
  eventType: EventType.NORMAL,
}

const event_椰树林_砍树: GameEvent = {
  id: 'event_椰树林_砍树',
  name: '砍椰子树',
  frames: [
    {
      id: 'event_椰树林_砍树_2',
      order: 2,
      text: '椰子树耸立于此\n\n但你两手空空无能为力。\n\n你需要斧头才能砍。',

      options: [
        {
          id: '无能离去',
          name: '无能离去',
          results: [
            {
              type: 'endEvent',
            },
          ],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_椰树林_砍树_1',
      order: 1,
      text: '椰子树耸立于此\n\n而你手持利斧。',
      // displayCondition: {
      //   target: {
      //     type: ConditionTargetType.ITEM,
      //     id: '斧头',
      //   },
      //   operator: ComparisonOperator.GREATER_EQUAL,
      //   value: 1,
      // },

      options: [
        {
          id: '砍伐',
          name: '砍伐',

          results: [
            {
              type: 'nextFrame',
              weight: 5,
              effects: [
                {
                  effect: {
                    type: EffectType.ITEM,
                    itemId: '木头',
                    changeType: ItemChangeType.ADD,
                    quantity: 2,
                  },
                  probability: 1.0,
                  description: '获得木头*2',
                },
                {
                  effect: {
                    type: EffectType.ITEM,
                    itemId: '石头',
                    changeType: ItemChangeType.ADD,
                    quantity: 10,
                  },
                  probability: 1.0,
                  description: '获得石头*10',
                },
                {
                  effect: {
                    type: EffectType.ITEM,
                    itemId: '椰子',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                  probability: 1.0,
                  description: '获得椰子*1',
                },
              ],
              targetFrameId: 'event_椰树林_砍树_小成功',
            },
            {
              type: 'nextFrame',
              weight: 1,
              effects: [
                {
                  effect: {
                    type: EffectType.ITEM,
                    itemId: '木头',
                    changeType: ItemChangeType.ADD,
                    quantity: 5,
                  },
                  probability: 1.0,
                  description: '获得木头*5',
                },
                {
                  effect: {
                    type: EffectType.ITEM,
                    itemId: '椰子',
                    changeType: ItemChangeType.ADD,
                    quantity: 1,
                  },
                  probability: 1.0,
                  description: '获得椰子*3',
                },
              ],
              targetFrameId: 'event_椰树林_砍树_大成功',
            },
          ],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_椰树林_砍树_大成功',
      order: 3,
      text: '你的斧头舞的虎虎生风。\n\n椰树摧枯拉朽。\n\n大成功！',
      options: [
        {
          id: '收获颇丰',
          name: '收获颇丰',

          results: [
            {
              type: 'endEvent',
            },
          ],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_椰树林_砍树_小成功',
      order: 3,
      text: '你砍了一会儿，就有些累了。\n\n但还算有些收获。',
      options: [
        {
          id: '收获离去',
          name: '收获离去',

          results: [
            {
              type: 'endEvent',
            },
          ],

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
          name: '战斗',
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
        },
        {
          id: 'flee_crab',
          name: '离开',
          description: '离开',
          costs: [
            {
              costType: OptionCostType.STAMINA,
              value: 10,
            },
          ],
          results: [
            {
              type: 'endEvent',
              exitText: '你决定不去打扰它们。',
            },
          ],
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
          name: '分解蟹肉',
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
          name: '返回海滩',
          results: [
            {
              type: 'endEvent',
              exitText: '你安全回到了海滩上',
            },
          ],
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
          name: '...',
          results: [
            {
              type: 'endEvent',
            },
          ],
        },
      ],
    },
  ],
  eventType: EventType.BATTLE,
  isRepeatable: true,
}
// ============================================================
// 海滩：大海的馈赠 (翻找冲上岸的杂物)
// ============================================================
const event_beach_大海的馈赠: GameEvent = {
  id: 'event_beach_大海的馈赠',
  name: '大海的馈赠',
  frames: [
    {
      id: 'event_beach_大海的馈赠_1',
      order: 1,
      text: '潮水线像一条模糊的边界，把大海的垃圾和宝藏一并吐在沙滩上。海藻、漂流木、塑料瓶，还有一些看不出原貌的东西。\n\n你弯下腰，仔细翻找。',
      options: [
        {
          id: '寻找漂浮物',
          name: '寻找可用物资',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_大海的馈赠_成功',
              weight: 7,
              text: '你找到了一些有用的东西。',
            },
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_大海的馈赠_失败',
              weight: 3,
              text: '但这次，只是一堆无用的垃圾。',
            },
          ],

          isOneTime: false,
        },
        {
          id: '离开',
          name: '不找了',
          results: [{ type: 'endEvent' }],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_beach_大海的馈赠_成功',
      order: 2,
      text: '你的运气不错。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '木头',
            changeType: ItemChangeType.ADD,
            quantity: 10,
          },
          probability: 0.8,
          description: '获得10个木头',
        },
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '绳子',
            changeType: ItemChangeType.ADD,
            quantity: 1,
          },
          probability: 0.4,
          description: '获得一截绳子',
        },
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '金属碎片',
            changeType: ItemChangeType.ADD,
            quantity: 1,
          },
          probability: 0.3,
          description: '获得金属碎片',
        },
      ],
      options: [
        {
          id: '收好离开',
          name: '收好东西',
          results: [{ type: 'endEvent' }],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_beach_大海的馈赠_失败',
      order: 2,
      text: '你扒拉了半天，只有湿漉漉的海草和碎成渣的泡沫塑料。看来今天大海很吝啬。',
      options: [
        {
          id: '失望离开',
          name: '离开',
          results: [{ type: 'endEvent' }],

          isOneTime: false,
        },
      ],
    },
  ],
  eventType: EventType.NORMAL,
}

// ============================================================
// 礁石区：采集贻贝 (危险的采集)
// ============================================================
const event_礁石区_采集: GameEvent = {
  id: 'event_礁石区_采集',
  name: '采集贻贝',
  frames: [
    {
      id: 'event_礁石区_采集_1',
      order: 1,
      text: '贻贝牢牢附着在被海浪反复冲刷的礁石上。要取下来，你就必须靠近湿滑的边缘。一个浪头打来，冰冷的海水溅了你一身。',
      options: [
        {
          id: '小心采集',
          name: '小心地采集',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_礁石区_采集_成功',
              weight: 8,
              condition: {
                target: {
                  type: ConditionTargetType.ATTRIBUTE,
                  attributeType: AttributeType.AGILITY,
                },
                operator: ComparisonOperator.GREATER,
                value: 10,
              },
            },
            {
              type: 'nextFrame',
              targetFrameId: 'event_礁石区_采集_失败',
              weight: 2,
              text: '脚下一滑，你的手按在了锋利的藤壶壳上。',
            },
          ],

          isOneTime: false,
        },
        {
          id: '冒险采集',
          name: '尽可能多拿',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_礁石区_采集_大成功',
              weight: 5,
              condition: {
                target: {
                  type: ConditionTargetType.ATTRIBUTE,
                  attributeType: AttributeType.AGILITY,
                },
                operator: ComparisonOperator.GREATER,
                value: 20,
              },
            },
            {
              type: 'nextFrame',
              targetFrameId: 'event_礁石区_采集_失败',
              weight: 5,
              text: '你贪婪地想一次多拿几个，一个浪头打来，你失去了平衡。',
            },
          ],

          isOneTime: false,
        },
        {
          id: '离开',
          name: '离开',
          results: [{ type: 'endEvent' }],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_礁石区_采集_成功',
      order: 2,
      text: '你稳稳地站在礁石上，用随身的工具撬下了一大捧肥美的贻贝。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '贻贝',
            changeType: ItemChangeType.ADD,
            quantity: 3,
          },
          probability: 1.0,
          description: '获得贻贝*3',
        },
      ],
      options: [
        {
          id: '收好离开',
          name: '收好离开',
          results: [{ type: 'endEvent' }],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_礁石区_采集_大成功',
      order: 2,
      text: '你动作迅速，赶在下一个大浪打来之前，把这一片礁石上的贻贝搜刮了个干净。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '贻贝',
            changeType: ItemChangeType.ADD,
            quantity: 6,
          },
          probability: 1.0,
          description: '获得贻贝*6',
        },
      ],
      options: [
        {
          id: '满载而归',
          name: '满载而归',
          results: [{ type: 'endEvent' }],

          isOneTime: false,
        },
      ],
    },
    {
      id: 'event_礁石区_采集_失败',
      order: 2,
      text: '锋利的藤壶划破了你的手掌和膝盖，海水浸入伤口，带来一阵刺痛。贻贝没采到几个，自己倒先挂了彩。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.HP,
            operation: AttributeOperation.SUBTRACT,
            value: 10,
          },
          probability: 1.0,
          description: '受伤了',
        },
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '贻贝',
            changeType: ItemChangeType.ADD,
            quantity: 1,
          },
          probability: 1.0,
          description: '获得贻贝*1',
        },
      ],
      options: [
        {
          id: '忍痛离开',
          name: '忍痛离开',
          results: [{ type: 'endEvent' }],

          isOneTime: false,
        },
      ],
    },
  ],
  eventType: EventType.NORMAL,
}

// ============================================================
// 礁石区：探索潮汐池 (一个小型的资源点)
// ============================================================
const event_礁石区_潮汐池: GameEvent = {
  id: 'event_礁石区_潮汐池',
  name: '探索潮汐池',
  frames: [
    {
      id: 'event_礁石区_潮汐池_1',
      order: 1,
      text: '礁石围成的浅水坑里，小魚在清澈的海水中游弋。寄居蟹拖着笨重的壳在水底爬行。\n\n你发现了一些有用的东西。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '小螃蟹',
            changeType: ItemChangeType.ADD,
            quantity: 2,
          },
          probability: 0.8,
          description: '抓到小螃蟹',
        },
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '漂亮贝壳',
            changeType: ItemChangeType.ADD,
            quantity: 1,
          },
          probability: 0.5,
          description: '捡到一个漂亮贝壳',
        },
      ],
      options: [
        {
          id: '离开',
          name: '离开潮汐池',
          results: [{ type: 'endEvent' }],

          isOneTime: false,
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
    event_beach_大螃蟹: event_beach_大螃蟹,
    event_beach_大海的馈赠: event_beach_大海的馈赠,

    // 礁石区事件
    event_礁石区_采集: event_礁石区_采集,
    event_礁石区_潮汐池: event_礁石区_潮汐池,

    event_飞机残骸_搜索座椅: event_飞机残骸_搜索座椅,
    event_飞机残骸_搜索夹缝: event_飞机残骸_搜索夹缝,
    event_飞机残骸_搜索行李架: event_飞机残骸_搜索行李架,
    event_飞机残骸_搜索头等舱: event_飞机残骸_搜索头等舱,
    event_飞机残骸_驾驶舱: event_飞机残骸_驾驶舱,
    event_飞机残骸_搜索残骸: event_飞机残骸_搜索残骸,

    event_机翼营地_搭建营地: event_机翼营地_搭建营地,

    event_椰树林_摘椰子: event_椰树林_摘椰子,
    event_椰树林_砍树: event_椰树林_砍树,
  },
}
