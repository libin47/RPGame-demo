// eventConfig/潮汐洞穴.ts
// 潮汐洞穴场景相关事件

import type { GameEvent } from '@/types/event'
import { ConditionTargetType, ComparisonOperator, AttributeType } from '@/types/effect'
import { nextFrame, endEvent, addItem, setFlag, attr, triggerEvent } from './shared'

// ============================================================
// 事件：调查骸骨
// ============================================================

export const event_beach_潮汐洞穴_骸骨: GameEvent = {
  id: 'event_beach_潮汐洞穴_骸骨',
  name: '调查骸骨',
  frames: [
    {
      id: 'event_beach_潮汐洞穴_骸骨_1',
      text: '你走近那具被钟乳石包裹的骸骨。\n\n钟乳石从洞顶垂下，经过不知多少年，已经把这具骸骨和岩壁融为一体。骸骨保持着坐姿，背靠岩壁，双腿伸直，一只手臂搭在膝盖上，另一只手指向洞穴深处某个方向。\n\n他的衣服早已腐朽，只剩下几片褪色的布料碎片嵌在钟乳石中。但脖子上挂着一块金属铭牌，被细链拴着，在发光藻类的冷光下反射出黯淡的银光。\n\n铭牌上刻着一个名字和一串日期。日期是六年前。\n\n六年前，这个人坐在这里，背靠岩壁，指向某个方向。他临死前想告诉别人什么。',
      seenFlag: 'flag_潮汐洞穴_骸骨已调查',
      onEnterEffects: [
        addItem('金属铭牌', 1, '你取下铭牌，链子一碰就断了。'),
        setFlag('flag_潮汐洞穴_骸骨已调查'),
      ],
      options: [
        {
          id: '顺着手指方向查看',
          name: '顺着他手指的方向看去',
          results: nextFrame(
            'event_beach_潮汐洞穴_骸骨_指向',
            '你抬起头，顺着骸骨手指的方向望向洞穴深处。',
          ),
        },
        {
          id: '离开',
          name: '离开',
          results: endEvent('你对着骸骨点了点头，退回到洞穴中央。'),
        },
      ],
    },
    {
      id: 'event_beach_潮汐洞穴_骸骨_指向',
      text: '骸骨指向的方向，是石池对面一处被阴影覆盖的岩壁。你之前没注意到——那里有一个被钙化物包裹的方形物体，半埋在碎石堆里，表面覆盖着和钟乳石一样的灰白色钙壳。\n\n一个箱子。\n\n他是想让人找到它。',
      options: [
        {
          id: '去查看箱子',
          name: '去查看箱子',
          results: triggerEvent('event_beach_潮汐洞穴_防水箱', '你绕过石池，走向那个箱子。'),
        },
        {
          id: '先记下位置',
          name: '先记下位置',
          results: endEvent('你记住了箱子的位置。等准备好了工具再来。'),
        },
      ],
    },
  ],
}

// ============================================================
// 事件：撬开防水箱
// ============================================================

export const event_beach_潮汐洞穴_防水箱: GameEvent = {
  id: 'event_beach_潮汐洞穴_防水箱',
  name: '撬开防水箱',
  frames: [
    {
      id: 'event_beach_潮汐洞穴_防水箱_1',
      text: '你蹲在石池边，清理掉箱子表面的碎石和钙化物。这是一个军绿色的防水箱，塑料外壳，边角加固了橡胶密封条。箱子被钙壳牢牢封住，锁扣已经锈死。\n\n你试着用手掰开——纹丝不动。需要用工具撬开钙化层。',
      options: [
        {
          id: '用工具撬开',
          name: '用工具撬开',
          displayCondition: {
            condition: {
              target: {
                type: ConditionTargetType.ITEM,
                id: '多功能战术刀',
              },
              operator: ComparisonOperator.GREATER_EQUAL,
              value: 1,
            },
          },
          results: nextFrame(
            'event_beach_潮汐洞穴_防水箱_撬开',
            '你拿出多功能刀，把刀刃插进箱盖与箱体的缝隙，用力一撬。',
          ),
        },
        {
          id: '强行掰开',
          name: '强行掰开',
          rollResult: {
            attribute: '力量',
            dc: 14,
            successResult: nextFrame(
              'event_beach_潮汐洞穴_防水箱_撬开',
              '你咬紧牙关，用尽全力一掰。钙壳发出一声脆响，裂开了。',
            ),
            failResult: nextFrame(
              'event_beach_潮汐洞穴_防水箱_无法打开',
              '你掰得手指发白，箱子纹丝不动。钙壳比你想象的更硬。',
            ),
          },
        },
        {
          id: '先回去找工具',
          name: '先回去找工具',
          results: endEvent('你需要一把结实的小刀来撬开钙化层。'),
        },
      ],
    },
    {
      id: 'event_beach_潮汐洞穴_防水箱_无法打开',
      text: '钙壳纹丝不动。你需要更趁手的工具——一把结实的小刀应该够了。',
      options: [
        {
          id: '先回去',
          name: '先回去',
          results: endEvent('你把箱子放回原处。下次带工具来。'),
        },
      ],
    },
    {
      id: 'event_beach_潮汐洞穴_防水箱_撬开',
      text: '钙壳发出一声脆响，裂开了。你掀开箱盖，密封条仍然紧贴着箱体边缘，被拉开时发出一声低沉的啵声。\n\n箱子里的东西保存得相当完好——橡胶密封条挡住了潮气，钙壳隔绝了空气。\n\n最上面是一张折叠起来的防水纸，展开后是一幅手绘的岛屿地图。铅笔线条有些模糊了，但轮廓还辨认得出来。地图上标注了海滩的位置，在荒野区域打了几个问号，有一个位置被圈了出来，旁边潦草地写着两个字："水源？"\n\n地图下面是一把匕首。刀刃上有一层薄锈，但刃口仍然锋利。牛皮刀柄被压出了手指的凹痕——这把刀被人用了很久。\n\n箱子最底层是一小块用油纸包裹的火石和火镰。\n\n六年前那个人把这些东西封在这里，然后坐在岩壁下，指向这个箱子的位置。他不知道谁会来。但他在等。',
      seenFlag: 'flag_潮汐洞穴_箱子已开启',
      onEnterEffects: [
        addItem('手绘地图草稿', 1, '你小心地把地图折好。'),
        addItem('生锈的匕首', 1, '你拿起匕首，试了试手感。'),
        addItem('火石', 1, '你收起火石和火镰。'),
        setFlag('flag_潮汐洞穴_箱子已开启'),
      ],
      options: [
        {
          id: '收起东西离开',
          name: '收起东西',
          results: endEvent(
            '你把匕首插在腰间，地图折好放进口袋。六年前那个人的遗愿，你已经替他完成了。',
          ),
        },
      ],
    },
  ],
  isRepeatable: false,
}
