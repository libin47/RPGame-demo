// eventConfig/飞机残骸.ts
// 飞机残骸场景相关事件

import type { GameEvent } from '@/types/event'
import {
  ConditionTargetType,
  ComparisonOperator,
  AttributeType,
  LogicOperator,
} from '@/types/effect'
import { nextFrame, endEvent, switchScene, addItem, setFlag } from './shared'

// ============================================================
// 搜索飞机残骸（入口事件）
// ============================================================

export const event_beach_飞机残骸: GameEvent = {
  id: 'event_beach_飞机残骸',
  name: '搜索飞机残骸',
  frames: [
    {
      id: 'event_beach_飞机残骸_1',
      text: '你沿着海岸线向残骸走去。\n\n沙子在脚下塌陷，每一步都比上一步沉重。左肋的钝痛随着呼吸起伏。你没有停下来。\n\n走近后，残骸的细节变得清晰。\n\n机舱断成了三段。最靠近你的是尾部，尾翼几乎完好，只是方向舵歪向一边。中部是撕裂最严重的地方，金属蒙皮像被巨人用手撕开，参差不齐的边缘反射着刺目的白光。机头扎进了沙滩深处，只能看到驾驶舱破碎的舷窗，玻璃上布满蛛网状的裂纹。\n\n烧焦的气味更浓了。不是燃料，是塑料和布料燃烧后的臭味。你看到座椅的皮革被烧成了焦黑色，里面的海绵翻出来，像某种肿胀的内脏。\n\n风穿过破碎的舷窗，发出一声低沉的呜咽。',
      options: [
        {
          id: 'event_beach_飞机残骸_1_1',
          name: '从裂口进入',
          results: switchScene('beach', {
            subSceneId: 'beach_飞机残骸',
            enterText: '你从裂口钻进机舱。',
          }),
        },
      ],
    },
    {
      id: 'event_beach_飞机残骸_2',
      text: '你从裂口钻进机舱。\n\n机舱里面的光线很暗。舷窗被烟熏黑了，只有几束光从机身断裂处的缝隙挤进来，在倾斜的地板上切出细长的光带。空气里有烧焦塑料的味道，还有一股更淡但更刺鼻的气味——航空燃油。好在只是残余。\n\n舱内的一切都是倾斜的。座椅歪向一边，行李架的门有的震开了，有的卡死。过道被杂物堵住大半，你得侧身才能通过。\n\n你从前舱开始搜索。',
      options: [
        {
          id: '座椅下方',
          name: '座椅下方',
          results: {
            type: 'nextFrame',
            effects: [addItem('薄外套', 1, '获得薄外套')],
            targetFrameId: 'event_beach_飞机残骸_2',
            text: '座椅下方的衣物散落一地，大部分被海水浸过，湿重无用。\n\n你挑了几件干的，主要是袜子，还有一件薄外套。\n\n夜里会用得上。',
          },
          isOneTime: true,
          usedFlag: 'event_beach_飞机残骸_2_options_1',
        },
        {
          id: '头顶的行李架',
          name: '头顶的行李架',
          results: {
            type: 'nextFrame',
            effects: [addItem('镜子', 1, '获得镜子')],
            targetFrameId: 'event_beach_飞机残骸_2',
            text: '头顶的行李架里，一只手提箱卡在角落。\n\n你用力拽出来，拉链已经锈住。撬开后里面是换洗衣物和一个洗漱包。洗漱包里有小剪刀、指甲刀、一面巴掌大的镜子。镜子完好，反射出帅的一批的脸。\n\n你把镜子用衣服包好，放进外套口袋。这东西能生火。',
          },
          isOneTime: true,
          usedFlag: 'event_beach_飞机残骸_2_options_2',
        },
        {
          id: '座椅夹缝',
          name: '座椅夹缝',
          results: {
            type: 'nextFrame',
            effects: [addItem('笔记本', 1, '获得笔记本')],
            setFlags: { notebook: true },
            targetFrameId: 'event_beach_飞机残骸_2',
            text: '座椅夹缝里找到两本杂志和一个带笔的空白笔记本。\n\n 你把笔记本和笔放进外套口袋。',
          },
          isOneTime: true,
          usedFlag: 'event_beach_飞机残骸_2_options_3',
        },
        {
          id: '座椅夹缝',
          name: '座椅夹缝',
          results: {
            type: 'nextFrame',
            effects: [addItem('笔记本', 1, '获得笔记本')],
            setFlags: { notebook: true },
            targetFrameId: 'event_beach_飞机残骸_2',
            text: '座椅夹缝里找到两本杂志和一个带笔的空白笔记本。\n\n 你把笔记本和笔放进外套口袋。',
          },
          isOneTime: true,
          usedFlag: 'event_beach_飞机残骸_2_options_3',
        },
        {
          id: '头等舱',
          name: '头等舱',
          results: nextFrame(
            'event_beach_飞机残骸_3',
            '头等舱的隔帘烧焦了一半。你掀开焦化的布帘，侧身钻了进去。',
          ),
          displayCondition: {
            condition: {
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
          },
          isOneTime: true,
          usedFlag: 'event_beach_飞机残骸_2_options_4',
        },
      ],
    },
    {
      id: 'event_beach_飞机残骸_3',
      text: '你收好了搜刮到的物资。当前最重要的是找个安全的地方度过第一夜。',
      options: [
        {
          id: 'leave_wreckage',
          name: '离开残骸',
          results: endEvent('你离开了飞机残骸，回到了海滩上'),
        },
      ],
    },
    {
      id: 'after_gather',
      text: '你收好了搜刮到的物资。当前最重要的是找个安全的地方度过第一夜。',
      options: [
        {
          id: 'leave_wreckage',
          name: '离开残骸',
          results: endEvent('你离开了飞机残骸，回到了海滩上'),
        },
      ],
    },
  ],
}

// ============================================================
// 搜索座椅 / 行李架 / 夹缝 / 头等舱
// ============================================================

export const event_飞机残骸_搜索座椅: GameEvent = {
  id: 'event_飞机残骸_搜索座椅',
  name: '搜索座椅',
  frames: [
    {
      id: 'event_飞机残骸_搜索座椅',
      text: '座椅下方的衣物散落一地，大部分被海水浸过，湿重无用。\n\n你挑了几件干的，主要是袜子，还有一件薄外套。\n\n夜里会用得上。',
      onEnterEffects: [addItem('薄外套', 1, '获得薄外套')],
      options: [
        {
          id: '继续',
          name: '继续',
          results: endEvent('你继续搜索了'),
        },
      ],
    },
  ],
}

export const event_飞机残骸_搜索行李架: GameEvent = {
  id: 'event_飞机残骸_搜索行李架',
  name: '搜索行李架',
  frames: [
    {
      id: 'event_飞机残骸_搜索行李架',
      text: '头顶的行李架里，一只手提箱卡在角落。\n\n你用力拽出来，拉链已经锈住。撬开后里面是换洗衣物和一个洗漱包。洗漱包里有小剪刀、指甲刀、一面巴掌大的镜子。镜子完好，反射出帅的一批的脸。\n\n你把镜子用衣服包好，放进外套口袋。把装衣服的防水布也收了起来。',
      onEnterEffects: [addItem('镜子', 1, '获得镜子'), addItem('防水布', 1, '获得防水布')],
      options: [
        {
          id: '继续',
          name: '继续',
          results: endEvent(),
        },
      ],
    },
  ],
}

export const event_飞机残骸_搜索夹缝: GameEvent = {
  id: 'event_飞机残骸_搜索夹缝',
  name: '搜索夹缝',
  frames: [
    {
      id: 'event_飞机残骸_搜索夹缝',
      text: '座椅夹缝里找到两本杂志和一个带笔的空白笔记本。\n\n 你把笔记本和笔放进外套口袋。',
      onEnterEffects: [addItem('笔记本', 1, '获得笔记本')],
      options: [
        {
          id: '继续',
          name: '继续',
          results: endEvent(),
        },
      ],
    },
  ],
}

export const event_飞机残骸_搜索头等舱: GameEvent = {
  id: 'event_飞机残骸_搜索头等舱',
  name: '搜索头等舱',
  frames: [
    {
      id: 'event_飞机残骸_搜索头等舱',
      text: '头等舱的隔帘烧焦了一半。\n\n你掀开焦化的布帘，这里损毁更严重。但座位底下的救生包还在——密封铝箔包装，巴掌大小，撕开后是压缩饼干、一小瓶矿泉水、两粒止痛药。\n\n饼干硬得像干泥，包装完好。',
      onEnterEffects: [
        addItem('压缩饼干', 3, '获得压缩饼干*3'),
        addItem('矿泉水', 1, '获得矿泉水'),
        addItem('止痛药', 2, '获得止痛药*2'),
      ],
      options: [
        {
          id: '继续',
          name: '继续',
          results: endEvent(),
        },
      ],
    },
  ],
}

// ============================================================
// 驾驶舱
// ============================================================

export const event_飞机残骸_驾驶舱: GameEvent = {
  id: 'event_飞机残骸_驾驶舱',
  name: '驾驶舱',
  frames: [
    {
      id: 'event_飞机残骸_驾驶舱_已经进入',
      text: '你已经来过这里了——\n\n驾驶舱的仪表盘碎了大半，玻璃碴铺满座椅。副驾驶座椅下有一个铁盒子，标签上写着“应急工具”。里面的东西已经被你扫荡一空。',
      displayCondition: { flag: ['event_飞机残骸_进入驾驶舱'] },
      options: [
        {
          id: '离开',
          name: '离开',
          results: endEvent(),
        },
      ],
    },
    {
      id: 'event_飞机残骸_驾驶舱',
      text: '驾驶舱的门扭曲变形严重，卡在同样变形的门框里，露出小小的门缝通往驾驶舱。\n\n 你觉得你可以试试能不能把门踹开——起码没有人会要求赔偿。',
      options: [
        {
          id: '尝试踹门',
          name: '尝试踢门',
          conditionResult: {
            condition: {
              condition: {
                target: {
                  type: ConditionTargetType.ATTRIBUTE,
                  attributeType: AttributeType.STRENGTH,
                },
                operator: ComparisonOperator.GREATER,
                value: 20,
              },
            },
            successResult: nextFrame('event_飞机残骸_驾驶舱_in'),
            failResult: nextFrame(
              'event_飞机残骸_驾驶舱',
              '舱门纹丝不动——\n\n你当然可以继续尝试，但以目前的情况来看，只是白费体力。',
            ),
          },
        },
        {
          id: '离开',
          name: '离开',
          results: endEvent(),
        },
      ],
    },
    {
      id: 'event_飞机残骸_驾驶舱_in',
      text: '随着你的踹击，驾驶舱的门被踹出一个足以通过人的门缝，你成功地进入了驾驶舱。仪表盘碎了大半，玻璃碴铺满座椅。飞行员的座椅空着，安全带垂在地上，带扣完好。你解开带扣，把整条安全带抽出来——高强度尼龙，能承受几百公斤拉力。比绳子好用。\n\n副驾驶座椅下有一个铁盒子，标签上写着“应急工具”。你打开。信号弹两支，一把多功能战术刀。\n\n最里面是急救箱。白色塑料外壳，红色十字标志。你打开检查。绷带卷、消毒酒精。都封在独立包装里，干燥完好。',
      onEnterEffects: [
        addItem('多功能战术刀', 1, '获得多功能战术刀'),
        addItem('绷带', 10, '获得绷带*10'),
        addItem('消毒酒精', 5, '获得消毒酒精*5'),
        setFlag('event_飞机残骸_进入驾驶舱'),
      ],
      options: [
        {
          id: '离开',
          name: '离开',
          results: endEvent(),
        },
      ],
    },
  ],
}

// ============================================================
// 搜索残骸（采集界面入口事件）
// ============================================================

export const event_飞机残骸_搜索残骸: GameEvent = {
  id: 'event_飞机残骸_搜索残骸',
  name: '机残骸_搜索残骸',
  frames: [
    {
      id: 'event_飞机残骸_搜索残骸_1',
      text: '你想寻找什么呢？',
      options: [
        {
          id: '金属残片',
          name: '金属残片',
          results: nextFrame('event_飞机残骸_搜索残骸_金属残片'),
        },
        {
          id: '布料',
          name: '布料',
          results: nextFrame('event_飞机残骸_搜索残骸_布料'),
        },
        {
          id: '药品',
          name: '药品',
          results: nextFrame('event_飞机残骸_搜索残骸_药品'),
        },
      ],
    },
    {
      id: 'event_飞机残骸_搜索残骸_金属残片',
      text: '你捡到不少金属残片。\n\n钛合金，高贵的航空金属，如今如垃圾一般随处散落在沙滩上。',
      onEnterEffects: [addItem('金属碎片', 3, '获得金属碎片*3')],
      options: [
        {
          id: '离去',
          name: '离去',
          results: endEvent(),
        },
      ],
    },
    {
      id: 'event_飞机残骸_搜索残骸_布料',
      text: '你捡到不少布料。\n\n具体来说——你把这些没了主人的衣物撕成了布料，有的还沾着血渍。',
      onEnterEffects: [addItem('布料', 5, '获得布料*5')],
      options: [
        {
          id: '离去',
          name: '离去',
          results: endEvent(),
        },
      ],
    },
  ],
}
