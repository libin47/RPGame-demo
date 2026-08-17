// eventConfig/机翼营地.ts
// 机翼营地场景相关事件

import type { GameEvent } from '@/types/event'
import { ConditionTargetType, ComparisonOperator, EffectType } from '@/types/effect'
import { OptionCostType } from '@/types/option'
import { endEvent } from './shared'

// ============================================================
// 搭建营地
// ============================================================

export const event_机翼营地_搭建营地: GameEvent = {
  id: 'event_机翼营地_搭建营地',
  name: '搭建营地',
  frames: [
    {
      id: '搭建营地',
      text: '除了半截机翼什么都没有。',
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
