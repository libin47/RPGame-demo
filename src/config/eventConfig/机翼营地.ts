// eventConfig/机翼营地.ts
// 机翼营地场景相关事件

import type { GameEvent } from '@/types/event'
import { ConditionTargetType, ComparisonOperator, EffectType, AttributeType } from '@/types/effect'
import { OptionCostType } from '@/types/option'
import { attr, endEvent, nextFrame } from './shared'

// ============================================================
// 搭建营地
// ============================================================

export const event_机翼营地_搭建营地: GameEvent = {
  id: 'event_机翼营地_搭建营地',
  name: '搭建营地',
  frames: [
    {
      id: '搭建营地',
      text: '除了半截机翼什么都没有。\n\n你感觉浑身都疼，你现在找个地方躺下来好好睡一觉。\n\n你看着这片空地，机翼是一个天然的屋顶，但是在休息之前你需要把防水布铺在沙地上——如果你不想被浑身都被水打湿的话。',
      options: [
        {
          id: '搭建营地',
          name: '搭建营地',
          availableCondition: {
            condition: {
              target: {
                type: ConditionTargetType.ITEM,
                id: '防水布',
              },
              operator: ComparisonOperator.GREATER_EQUAL,
              value: 1,
            },
          },
          costs: [
            {
              costType: OptionCostType.ITEM,
              itemId: '防水布',
              value: 1,
              affectedByCoefficient: false,
            },
          ],
          results: nextFrame('铺地', '你将在坠机残骸里找到的防水布铺在沙地了', [
            {
              effect: { type: EffectType.CAMPSITE_MOVE, targetSceneId: 'beach_机翼营地' },
            },
          ]),
          isOneTime: true,
          usedFlag: 'flag_抵达机翼营地',
        },
        {
          id: '取消',
          name: '取消',
          results: endEvent(),
        },
      ],
    },
    {
      id: '铺地',
      text: '看起来算不上舒适，但是其码你有一个地方可以休息了。\n——而这也是你现在急需的。',
      options: [
        {
          id: '休息',
          name: '休息',
          costTime: 800,
          results: nextFrame('醒来'),
        },
      ],
    },
    {
      id: '醒来',
      text: '你躺在防水布上，斜靠着机翼。\n你身下的海沙残留着太阳的温度，海风轻轻吹过。\n你就这样沉沉睡去，浑身的疼痛似乎就这样缓缓消失……\n\n睡了多久呢，你不知道。你睁开眼睛，太阳已经落下又再次升起。\n好了，是时候开始考虑一下现状了。\n\n你就这样莫名其妙地落在了这个荒岛上，而其他旅客下落不明。\n你可以搭建营地准备物资，慢慢考虑或者等待救援出现。\n亦或者可以考虑做一个小木船，虽然在这太平洋中间，你并不觉得一个小船能够穿过汪洋大海。\n而其他旅客的去向也是萦绕在你脑海中难以解开的疑惑，也许他们聚在了某处？或者……你不敢想，但是往岛的中间走走，也许也是一种出路，万一这里并不是无人岛呢。\n\n……但现在的当务之急，是你饿了。',
      options: [
        {
          id: '起身',
          name: '起身',
          results: endEvent(),
        },
      ],
    },
  ],
}
// ============================================================
// 休息
// ============================================================
export const event_机翼营地_休息: GameEvent = {
  id: 'event_机翼营地_休息',
  name: '休息',
  frames: [
    {
      id: '休息',
      text: '你躺在防水布上，斜靠着机翼。\n\n身下的海沙残留着太阳的温度，海风轻轻吹过。',
      options: [
        {
          id: '休息2',
          name: '休息【2】个小时',
          costTime: 120,
          results: endEvent(
            '你休息了2个小时。',
            [attr(AttributeType.HP, 20), attr(AttributeType.STAMINA, 40)],
            true,
          ),
        },
        {
          id: '休息4',
          name: '休息【4】个小时',
          costTime: 240,
          results: endEvent(
            '你休息了4个小时。',
            [attr(AttributeType.HP, 40), attr(AttributeType.STAMINA, 80)],
            true,
          ),
        },
        {
          id: '休息8',
          name: '休息【8】个小时',
          costTime: 480,
          results: endEvent(
            '你休息了8个小时。',
            [attr(AttributeType.HP, 80), attr(AttributeType.STAMINA, 160)],
            true,
          ),
        },
        {
          id: '离开',
          name: '离开',
          results: endEvent(),
        },
      ],
    },
  ],
}

// 查看日记
// ============================================================
export const event_机翼营地_查看日记: GameEvent = {
  id: 'event_机翼营地_查看日记',
  name: '查看日记',
  frames: [
    {
      id: '查看日记',
      text: '你把来到这里发生的事情记在了笔记本里，写写东西让你感觉稍有安宁。',
      options: [
        {
          id: '查看日记',
          name: '查看日记',
          costTime: 120,
          results: { type: 'readDiary' },
        },
        {
          id: '离开',
          name: '离开',
          results: endEvent('你放下日记本。', [], true),
        },
      ],
    },
  ],
}
