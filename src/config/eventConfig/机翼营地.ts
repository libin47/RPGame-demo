// eventConfig/机翼营地.ts
// 机翼营地场景相关事件

import type { GameEvent } from '@/types/event'
import { ConditionTargetType, ComparisonOperator, EffectType, AttributeType } from '@/types/effect'
import { OptionCostType } from '@/types/option'
import { attr, endEvent } from './shared'

// ============================================================
// 搭建营地
// ============================================================

export const event_机翼营地_搭建营地: GameEvent = {
  id: 'event_机翼营地_搭建营地',
  name: '搭建营地',
  frames: [
    {
      id: '搭建营地',
      text: '除了半截机翼什么都没有。\n\n在休息之前你需要把防水布铺在沙地上——如果你不想被浑身都被水打湿的话。',
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
          results: endEvent('你将防水布铺在沙地了，你可以在这里休息了。', [
            {
              effect: { type: EffectType.CAMPSITE_MOVE, targetSceneId: 'beach_机翼营地' },
            },
          ]),
          isOneTime: true,
          usedFlag: 'flag_抵达机翼营地',
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
