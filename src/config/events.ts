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
            quantity: 50,
          },
          probability: 1,
        },
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '石头',
            changeType: ItemChangeType.ADD,
            quantity: 50,
          },
          probability: 1,
        },
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '金属碎片',
            changeType: ItemChangeType.ADD,
            quantity: 50,
          },
          probability: 1,
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

// 椰树林
// ============================================================
// 椰树林 - 猴群事件链
// ============================================================

// 第一阶段：发现猴群（已有框架，补充选项结果）
const event_beach_椰树林_灰褐色的猴子: GameEvent = {
  id: 'event_beach_椰树林_灰褐色的猴子',
  name: '灰褐色的猴子',
  frames: [
    {
      id: 'event_beach_椰树林_灰褐色的猴子_1',
      order: 1,
      text: '你拨开垂落的棕榈叶，走进了这片椰树林。阳光穿过叶片的缝隙洒下斑驳的光影，地上铺满了枯黄的落叶和几个熟透落地的椰子。海风穿过树林，椰叶沙沙作响。\n\n你正要往前走，头顶传来一声尖利的叫声。你抬头——几只灰褐色的猴子正蹲在高处的椰树上，尾巴悬空，眼睛直勾勾地盯着你。\n\n你停下脚步，它们也停下叫声。你往前走一步，领头的那只发出了更响亮的警告声。\n\n它们不想让你过去。',
      options: [
        {
          id: '观察猴群',
          name: '观察猴群',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_灰褐色的猴子_观察成功',
              weight: 1,
              condition: {
                target: {
                  type: ConditionTargetType.ATTRIBUTE,
                  attributeType: AttributeType.INTELLIGENCE,
                },
                operator: ComparisonOperator.GREATER_EQUAL,
                value: 6,
              },
              text: '你仔细观察着这群猴子的一举一动。',
            },
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_灰褐色的猴子_观察普通',
              weight: 1,
              text: '你抬头打量着这些猴子。',
            },
          ],
          isOneTime: false,
        },
        {
          id: '试图靠近',
          name: '试图靠近',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_灰褐色的猴子_靠近',
              weight: 1,
              text: '你无视了猴群的警告，继续往前走。',
            },
          ],
          isOneTime: false,
        },
        {
          id: '暂时退后',
          name: '暂时退后',
          results: [
            {
              type: 'endEvent',
              exitText: '你退出了椰树林。下次再来时，那些猴子应该还在那里。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 观察成功帧（高智力）
    {
      id: 'event_beach_椰树林_灰褐色的猴子_观察成功',
      order: 2,
      text: '猴群大约有七八只，领头的那只体型最大，蹲在最高的一棵椰树上。它的毛发比其他猴子更深，接近灰黑色，肩膀上有几道不太对劲的隆起——不是毛发，是某种硬质的东西，从皮肤下顶出来。\n\n你注意到一个细节：所有猴子都待在树冠上，没有一只靠近地面。即使是那只领头的，在示威时也只是在树枝间来回跳跃。它们盯着地面的眼神和盯着你的眼神不一样。前者是恐惧，后者是警惕。\n\n地面上有什么让它们害怕的东西。\n\n而你现在正站在地面上。 这个认知让你不安。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.SAN,
            operation: AttributeOperation.SUBTRACT,
            value: 3,
          },
          probability: 1.0,
          description: '这个认知让你感到不安。',
        },
      ],
      options: [
        {
          id: '试图靠近',
          name: '继续深入',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_灰褐色的猴子_靠近',
              weight: 1,
              text: '你决定继续往前走。猴群尖叫着向树林深处退去。',
            },
          ],
          isOneTime: false,
        },
        {
          id: '暂时退后',
          name: '暂时退后',
          results: [
            {
              type: 'endEvent',
              exitText: '你决定先退回去。这个发现值得好好想想。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 观察普通帧（低智力）
    {
      id: 'event_beach_椰树林_灰褐色的猴子_观察普通',
      order: 2,
      text: '你看到大约七八只猴子分散在几棵椰树上，毛色灰褐，个头比普通猴子大一圈。领头的体型最大，蹲在最高的树上俯视着你。\n\n它们看起来不好惹。',
      options: [
        {
          id: '试图靠近',
          name: '试图靠近',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_灰褐色的猴子_靠近',
              weight: 1,
              text: '你决定继续往前走。',
            },
          ],
          isOneTime: false,
        },
        {
          id: '暂时退后',
          name: '暂时退后',
          results: [
            {
              type: 'endEvent',
              exitText: '你退出了椰树林。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 靠近帧
    {
      id: 'event_beach_椰树林_灰褐色的猴子_靠近',
      order: 3,
      text: '猴群发出了集体尖叫，刺耳的声音在椰树林中回荡。领头的那只摘下一颗椰子，高高举起——\n\n它朝你砸了过来。',
      options: [
        {
          id: '闪避椰子',
          name: '闪避',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_灰褐色的猴子_闪避成功',
              weight: 1,
              condition: {
                target: {
                  type: ConditionTargetType.ATTRIBUTE,
                  attributeType: AttributeType.AGILITY,
                },
                operator: ComparisonOperator.GREATER_EQUAL,
                value: 6,
              },
              text: '你侧身一闪。',
            },
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_灰褐色的猴子_被砸中',
              weight: 1,
              text: '你来不及反应。',
            },
          ],
          isOneTime: false,
        },
        {
          id: '继续靠近',
          name: '硬扛',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_灰褐色的猴子_被砸中',
              weight: 1,
              text: '你不躲不闪，继续往前走。椰子正中你的肩膀。',
            },
          ],
          isOneTime: false,
        },
        {
          id: '后退',
          name: '后退',
          results: [
            {
              type: 'endEvent',
              exitText: '你后退几步，猴群的叫声渐渐平息。它们没有追上来——至少这次没有。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 闪避成功帧
    {
      id: 'event_beach_椰树林_灰褐色的猴子_闪避成功',
      order: 4,
      text: '椰子擦过你的耳边砸在身后的沙地上，发出一声闷响。\n\n猴群静了一秒。那只领头的发出了更低沉的叫声——不是示威，像是某种命令。然后整群猴子向树林深处退去，在树冠之间快速移动，消失在密叶之后。\n\n它们退去的方向，椰树变得更密，光线也更暗。那里似乎有一条被踩出来的小路。\n\n你没有立刻追上去。但你知道，那条路通向某个地方。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.FLAG,
            flagId: 'beach_椰树林_追踪猴群',
            operation: 'set',
            value: true,
          },
          probability: 1.0,
        },
      ],
      options: [
        {
          id: '继续追',
          name: '追上去',
          results: [
            {
              type: 'triggerEvent',
              eventId: 'event_beach_椰树林_追踪猴群',
              weight: 1,
            },
          ],
          isOneTime: false,
        },
        {
          id: '先回去',
          name: '先回去准备',
          results: [
            {
              type: 'endEvent',
              exitText: '你记住了猴群退去的方向。下次来的时候，可以顺着这条路追上去。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 被砸中帧
    {
      id: 'event_beach_椰树林_灰褐色的猴子_被砸中',
      order: 4,
      text: '椰子重重地砸在你的肩膀上。冲击力让你踉跄了一步，肩膀火辣辣地疼。\n\n猴群发出了刺耳的叫声——听起来几乎像是在嘲笑。但它们也在后退，一边叫一边向树林深处移动。\n\n领头的那只最后一个离开，它盯着你看了一会儿，然后转身消失在树冠中。\n\n你揉着肩膀。至少它们让开了路。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.HP,
            operation: AttributeOperation.SUBTRACT,
            value: 5,
          },
          probability: 1.0,
          description: '椰子砸伤了你。',
        },
        {
          effect: {
            type: EffectType.FLAG,
            flagId: 'beach_椰树林_追踪猴群',
            operation: 'set',
            value: true,
          },
          probability: 1.0,
        },
      ],
      options: [
        {
          id: '继续追',
          name: '追上去',
          results: [
            {
              type: 'triggerEvent',
              eventId: 'event_beach_椰树林_追踪猴群',
              weight: 1,
            },
          ],
          isOneTime: false,
        },
        {
          id: '先回去',
          name: '先回去处理伤口',
          results: [
            {
              type: 'endEvent',
              exitText: '肩膀还在疼。你决定先回去处理一下伤口。',
            },
          ],
          isOneTime: false,
        },
      ],
    },
  ],
  eventType: EventType.NORMAL,
  isRepeatable: true,
}

// ============================================================
// 第二阶段：追踪猴群
// ============================================================

const event_beach_椰树林_追踪猴群: GameEvent = {
  id: 'event_beach_椰树林_追踪猴群',
  name: '追踪猴群',
  frames: [
    {
      id: 'event_beach_椰树林_追踪猴群_1',
      order: 1,
      text: '你沿着猴群退去的方向走进了椰树林深处。这里的树更密，树冠几乎遮住了全部天空，只有零星的光点洒在地上。猴子的叫声在前方忽远忽近，像是在引导你，又像是在警告你。\n\n地面上散落着被啃过的椰子壳，比外面更多。有些椰子壳被砸得很碎，碎片散落一地。你蹲下来检查——碎壳边缘有齿痕，不是被摔碎的。这些齿痕很大，不是猴子的牙齿能留下的。\n\n你抬头看向前方的几棵椰树。猴群蹲在高处，不再叫了，只是看着你。\n\n你顺着它们的目光看向正前方——那里有一棵被藤蔓缠绕的枯树。枯树后面，隐约可以看到一片更开阔的地方。',
      options: [
        {
          id: '检查椰壳',
          name: '仔细检查椰子壳',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_追踪猴群_检查椰壳',
              weight: 1,
              text: '你捡起一片碎裂的椰壳仔细端详。',
            },
          ],
          isOneTime: true,
          usedFlag: 'event_beach_椰树林_追踪猴群_checked_shells',
        },
        {
          id: '观察猴群',
          name: '观察猴群的行为',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_追踪猴群_观察猴群',
              weight: 1,
              text: '你再次把目光投向树冠上的猴群。',
            },
          ],
          isOneTime: true,
          usedFlag: 'event_beach_椰树林_追踪猴群_observed_monkeys',
        },
        {
          id: '继续深入',
          name: '继续深入',
          results: [
            {
              type: 'triggerEvent',
              eventId: 'event_beach_椰树林_猴王的领地',
              weight: 1,
            },
          ],
          isOneTime: false,
        },
        {
          id: '回去',
          name: '先回去',
          results: [
            {
              type: 'endEvent',
              exitText: '你记住了这条路。下次可以直接过来。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 检查椰壳
    {
      id: 'event_beach_椰树林_追踪猴群_检查椰壳',
      order: 2,
      text: '椰子壳的边缘分布着几道又深又宽的齿痕，间距不规则，排列方式不像是啃咬——更像是某种东西用牙齿咬住椰子，然后用力一甩，把整个椰子撕开。\n\n一只猴子做不出这种事。而猴群从来不接近地面。那些齿痕几乎都在靠近地面的椰壳上。\n\n地面上有东西。某种让猴子怕得不敢下树的东西。\n\n你把手里的椰壳碎片丢开，站起来。前方不远处，那棵枯树的根部有一道被碾压过的痕迹——灌木被压扁，泥土被翻起，痕迹很新。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '知识碎片_猴群的恐惧',
            changeType: ItemChangeType.ADD,
            quantity: 1,
          },
          probability: 1.0,
          description: '获得知识碎片：猴群的恐惧来源',
        },
      ],
      options: [
        {
          id: '继续深入',
          name: '继续深入',
          results: [
            {
              type: 'triggerEvent',
              eventId: 'event_beach_椰树林_猴王的领地',
              weight: 1,
            },
          ],
          isOneTime: false,
        },
        {
          id: '回去',
          name: '先回去',
          results: [
            {
              type: 'endEvent',
              exitText: '你需要为接下来可能遇到的东西做好准备。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 观察猴群行为
    {
      id: 'event_beach_椰树林_追踪猴群_观察猴群',
      order: 2,
      text: '猴群蹲在树冠上，一动不动。它们的视线不是集中在你身上——是分散的，扫视着地面，扫视着你周围的灌木丛。一只小猴子试图爬下树干，被一只成年母猴一把抓住后颈拽了回去。\n\n它们怕的不是你。\n\n它们怕的是你脚下的地面，怕的是那些低矮灌木丛中可能藏着的东西。你突然意识到自己正站在一片开阔的沙地上，周围没有任何遮挡。如果地面上有什么东西，你就是最明显的目标。\n\n这个念头让你后背发凉。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.SAN,
            operation: AttributeOperation.SUBTRACT,
            value: 5,
          },
          probability: 1.0,
          description: '你感到一阵莫名的恐惧。',
        },
      ],
      options: [
        {
          id: '继续深入',
          name: '硬着头皮继续走',
          results: [
            {
              type: 'triggerEvent',
              eventId: 'event_beach_椰树林_猴王的领地',
              weight: 1,
            },
          ],
          isOneTime: false,
        },
        {
          id: '回去',
          name: '退回去',
          results: [
            {
              type: 'endEvent',
              exitText: '你快步退出了这片区域。恐惧不是懦弱——恐惧是生存本能。',
            },
          ],
          isOneTime: false,
        },
      ],
    },
  ],
  eventType: EventType.NORMAL,
  isRepeatable: false,
}

// ============================================================
// 第三阶段：猴王的领地
// ============================================================

const event_beach_椰树林_猴王的领地: GameEvent = {
  id: 'event_beach_椰树林_猴王的领地',
  name: '猴王的领地',
  frames: [
    {
      id: 'event_beach_椰树林_猴王的领地_1',
      order: 1,
      text: '枯树藤蔓之后，是一片比其他区域都空旷的圆形空地。空地中央倒着一棵被连根拔起的巨椰树，树干已经被什么东西撕成了碎片，散落一地。树根翻起的土坑中积着雨水，水面上漂着一层细密的灰色绒毛。\n\n空气中有一股腥味——不是海水和腐烂海藻那种腥，是更重的、更接近铁锈的腥。地面上有暗色的痕迹，干了很久，但还没完全被沙土吸收。\n\n一声低沉的吼叫从前方传来。\n\n它蹲在那棵倒下的树干上——体型是其他猴子的两倍大，肩膀上覆盖着不该属于猴类的硬质甲片，沿着脊椎一直延伸到尾尖。它的眼睛不是猴子的棕色，是暗红色的，瞳孔在昏暗的光线中收缩成一条竖缝。\n\n它盯着你。嘴里的牙齿和普通猴子不同——更尖，更长，每一颗都像是被刻意磨过的刀片。\n\n地面上那些齿痕，那些被撕碎的树干，那些暗色的干涸痕迹——都是它留下的。它不是怕地面的东西。它就是地面上最可怕的东西。',
      options: [
        {
          id: '准备战斗',
          name: '准备战斗',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_猴王的领地_战斗选项',
              weight: 1,
              text: '猴王从树干上站了起来。它的体型在站立之后更加惊人——肩高几乎到你胸口。',
            },
          ],
          isOneTime: false,
        },
        {
          id: '尝试后退',
          name: '慢慢后退',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_猴王的领地_无法后退',
              weight: 1,
              text: '你缓缓后退了一步。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 无法后退帧
    {
      id: 'event_beach_椰树林_猴王的领地_无法后退',
      order: 2,
      text: '猴王低吼一声，从树干上跃下。它的落地几乎没有声音——以它的体型来说，这不应该。\n\n它没有直接攻击。它绕着空地边缘缓步移动，挡住了你所有的退路。它的尾巴在身后缓慢摆动，尾巴末端的骨刺在空气中划过，发出细微的破空声。\n\n它不想让你离开。',
      options: [
        {
          id: '准备战斗',
          name: '准备战斗',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_猴王的领地_战斗选项',
              weight: 1,
              text: '你拔出武器，正面面对它。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 战斗选项帧
    {
      id: 'event_beach_椰树林_猴王的领地_战斗选项',
      order: 3,
      text: '猴王发出一声低沉的吼叫，四肢着地，肩胛上的甲片根根竖起，发出骨骼摩擦的咔咔声。它的尾巴高高扬起，末端的骨刺笔直地指向你。\n\n你怎么应对？',
      options: [
        {
          id: '正面迎战',
          name: '正面迎战',
          results: [
            {
              type: 'triggerBattle',
              enemyId: ['变异猴王'],
              victoryFrameId: 'event_beach_椰树林_猴王的领地_胜利',
              defeatFrameId: 'event_beach_椰树林_猴王的领地_失败',
              escapeFrameId: 'event_beach_椰树林_猴王的领地_逃跑',
              canEscape: true,
              firstEncounterBonus: true,
            },
          ],
          isOneTime: false,
        },
        {
          id: '使用火把',
          name: '点燃火把（需要火把）',
          availableCondition: {
            target: {
              type: ConditionTargetType.ITEM,
              id: '火把',
            },
            operator: ComparisonOperator.GREATER_EQUAL,
            value: 1,
          },
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_猴王的领地_火把威慑',
              weight: 1,
              text: '你迅速点燃了火把。橘红色的火焰在昏暗的树林中亮起，照亮了猴王的身影。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 火把威慑帧
    {
      id: 'event_beach_椰树林_猴王的领地_火把威慑',
      order: 4,
      text: '火焰燃起的一瞬间，猴王的动作停住了。它的瞳孔急剧收缩，肩膀上的甲片颤抖了一下——你看到了，那些甲片上有一道道旧伤，边缘翻卷，颜色焦黑。\n\n不是抓伤，不是咬伤。是烧伤。它被火烧过。\n\n猴王发出一声与你之前听到的完全不同的叫声——更尖锐，带着明显的恐惧。它后退了几步，但目光仍然锁在你身上，喉咙里滚着低沉的咆哮。\n\n它怕火。但它的领地在它身后。它不会轻易让开。',
      options: [
        {
          id: '挥舞火把逼近',
          name: '挥舞火把逼近',
          results: [
            {
              type: 'nextFrame',
              targetFrameId: 'event_beach_椰树林_猴王的领地_火把战斗',
              weight: 1,
              text: '你高举火把，一步步向它走去。火焰在空气中呼呼作响。',
            },
          ],
          isOneTime: false,
        },
        {
          id: '正面迎战',
          name: '趁它恐惧时攻击',
          results: [
            {
              type: 'triggerBattle',
              enemyId: ['变异猴王'],
              victoryFrameId: 'event_beach_椰树林_猴王的领地_胜利',
              defeatFrameId: 'event_beach_椰树林_猴王的领地_失败',
              escapeFrameId: 'event_beach_椰树林_猴王的领地_逃跑',
              canEscape: true,
              firstEncounterBonus: true,
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 火把战斗帧
    {
      id: 'event_beach_椰树林_猴王的领地_火把战斗',
      order: 5,
      text: '猴王退缩了。它一步步后退，直到背靠那棵被撕碎的巨椰树。然后它发出了一声混杂着恐惧和愤怒的咆哮，猛地向你扑来——但它的动作因为恐惧而变得鲁莽。火焰让它失去了冷静。\n\n你从未见过这样好的机会。',
      options: [
        {
          id: '迎战',
          name: '迎战',
          results: [
            {
              type: 'triggerBattle',
              enemyId: ['变异猴王'],
              victoryFrameId: 'event_beach_椰树林_猴王的领地_胜利',
              defeatFrameId: 'event_beach_椰树林_猴王的领地_失败',
              escapeFrameId: 'event_beach_椰树林_猴王的领地_逃跑',
              canEscape: true,
              firstEncounterBonus: true,
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 胜利帧
    {
      id: 'event_beach_椰树林_猴王的领地_胜利',
      order: 6,
      text: '猴王发出一声长啸，拖着受伤的身体向密林深处逃去。它的血液滴在沙地上，颜色不是红色——是暗褐色的，里面混合着某种发光的微小颗粒。孢子。它的身体里渗着孢子。\n\n猴群在树冠上静默了片刻。然后它们发出了与之前完全不同的叫声——不是警告，不是恐惧。那声音更轻快，更短促，像是某种古老的、发自本能的欢呼。\n\n一只小猴子从树上爬了下来。它的爪子小心翼翼地触碰地面，先是前爪，然后是后爪。它站在了地面上。\n\n这是你第一次看到这些猴子踏足地面。\n\n小猴子看了你几秒，然后从地上捡起一颗最完整的椰子，滚到了你的脚边。它转身跟着猴群消失在树林深处。\n\n树冠上传来沙沙的声响，渐渐远去。你低头看了看脚边的椰子，又看了看猴王逃窜的方向——那个方向，树林逐渐稀疏，露出了一片开阔的天空。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.FLAG,
            flagId: 'monkey_king_defeated',
            operation: 'set',
            value: true,
          },
          probability: 1.0,
        },
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '椰子',
            changeType: ItemChangeType.ADD,
            quantity: 3,
          },
          probability: 1.0,
          description: '猴子们留下了几颗完好的椰子。',
        },
        {
          effect: {
            type: EffectType.ITEM,
            itemId: '变异猴王甲片',
            changeType: ItemChangeType.ADD,
            quantity: 2,
          },
          probability: 0.7,
          description: '地面上散落着几片从猴王身上脱落的甲片。',
        },
      ],
      options: [
        {
          id: '查看出口',
          name: '走向那片开阔地',
          results: [
            {
              type: 'triggerEvent',
              eventId: 'event_beach_椰树林_发现荒野',
              weight: 1,
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 失败帧
    {
      id: 'event_beach_椰树林_猴王的领地_失败',
      order: 6,
      text: '猴王的尾巴狠狠抽在你的胸口，你倒飞出去，重重摔在地上。肋骨传来剧烈的疼痛，视线开始模糊。\n\n猴王没有追击。它站在你面前不远处，发出了一声低沉悠长的吼叫，然后缓缓退回了枯树旁。它没有杀你——也许它觉得你构不成威胁了，也许它只是在守护它的领地，并不需要你的命。\n\n你挣扎着爬起来，捂着胸口，一步一步退出了空地。猴群在树冠上沉默地看着你。\n\n等你恢复了，还可以再来。但现在——你需要先活下来。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.HP,
            operation: AttributeOperation.SUBTRACT,
            value: 15,
          },
          probability: 1.0,
          description: '你受了重伤。',
        },
      ],
      options: [
        {
          id: '撤退',
          name: '撤退',
          results: [
            {
              type: 'endEvent',
              exitText: '你捂着胸口退出了椰树林深处。伤口需要处理，但你还活着。',
            },
          ],
          isOneTime: false,
        },
      ],
    },

    // 逃跑帧
    {
      id: 'event_beach_椰树林_猴王的领地_逃跑',
      order: 6,
      text: '你抓住一个空档，转身狂奔。猴王在身后发出一声怒吼，但没有追上来——它太大了，密林深处不是它的优势地形。\n\n你跑出很远才停下来，弯着腰喘气。猴群在远处的树冠上此起彼伏地叫着，叫声渐渐远去。\n\n你还活着。下次再来的时候，你需要更好的准备。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.STAMINA,
            operation: AttributeOperation.SUBTRACT,
            value: 20,
          },
          probability: 1.0,
          description: '你跑得上气不接下气。',
        },
      ],
      options: [
        {
          id: '回去',
          name: '回去',
          results: [
            {
              type: 'endEvent',
              exitText: '你退回了椰树林外围。猴王的领地还在深处等着你。',
            },
          ],
          isOneTime: false,
        },
      ],
    },
  ],
  eventType: EventType.BATTLE,
  isRepeatable: false,
  triggeredFlag: 'monkey_king_defeated',
}

// ============================================================
// 第四阶段：发现荒野
// ============================================================

const event_beach_椰树林_发现荒野: GameEvent = {
  id: 'event_beach_椰树林_发现荒野',
  name: '发现荒野',
  frames: [
    {
      id: 'event_beach_椰树林_发现荒野_1',
      order: 1,
      text: '你穿过最后几棵椰树，脚下的沙地逐渐变成了坚硬的泥土和碎石。空气变得干燥，海风的咸味被一种更干燥、更开阔的气息取代——那是枯草、尘土和阳光暴晒下的岩石混合的味道。\n\n你回头看了一眼身后。\n\n椰树林安安静静地立在午后的阳光里，猴群已经不知去向。海滩那边传来隐约的海浪声，已经被距离拉得很远。\n\n你在海滩活了下来。现在，你要面对这座岛真正的样子。\n\n你转过身，面向那片延伸到天际线的荒野。不远处，几只灰褐色的身影在树冠边缘一闪而过，然后消失在更深的丛林里。\n\n猴群离开了椰树林。它们不用再害怕地面了。\n\n——你也是。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.FLAG,
            flagId: 'wilderness_unlocked',
            operation: 'set',
            value: true,
          },
          probability: 1.0,
        },
        {
          effect: {
            type: EffectType.FLAG,
            flagId: '椰树林_猴群已离开',
            operation: 'set',
            value: true,
          },
          probability: 1.0,
        },
        {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.SAN,
            operation: AttributeOperation.ADD,
            value: 5,
          },
          probability: 1.0,
          description: '活着离开海滩，这本身就是一个胜利。',
        },
      ],
      options: [
        {
          id: '进入荒野',
          name: '进入荒野',
          results: [
            {
              type: 'switchScene',
              sceneId: 'wilderness',
              enterText: '你踏入了荒野。',
            },
          ],
          isOneTime: false,
        },
        {
          id: '先回海滩',
          name: '先回海滩准备',
          results: [
            {
              type: 'endEvent',
              exitText:
                '你最后看了一眼那片开阔的荒野，然后转身走回椰树林。下次再来的时候，这条路已经通了。',
            },
          ],
          isOneTime: false,
        },
      ],
    },
  ],
  eventType: EventType.NORMAL,
  isRepeatable: false,
}

// ============================================================
// 事件注册表
// ============================================================

export const eventRegistry: EventRegistry = {
  events: {
    event_beach_飞机残骸: event_beach_飞机残骸,
    event_beach_大螃蟹: event_beach_大螃蟹,
    event_beach_大海的馈赠: event_beach_大海的馈赠,

    event_飞机残骸_搜索座椅: event_飞机残骸_搜索座椅,
    event_飞机残骸_搜索夹缝: event_飞机残骸_搜索夹缝,
    event_飞机残骸_搜索行李架: event_飞机残骸_搜索行李架,
    event_飞机残骸_搜索头等舱: event_飞机残骸_搜索头等舱,
    event_飞机残骸_驾驶舱: event_飞机残骸_驾驶舱,
    event_飞机残骸_搜索残骸: event_飞机残骸_搜索残骸,

    event_机翼营地_搭建营地: event_机翼营地_搭建营地,

    event_beach_椰树林_发现荒野: event_beach_椰树林_发现荒野,
    event_beach_椰树林_追踪猴群: event_beach_椰树林_追踪猴群,
    event_beach_椰树林_猴王的领地: event_beach_椰树林_猴王的领地,
    event_beach_椰树林_灰褐色的猴子: event_beach_椰树林_灰褐色的猴子,
  },
}
