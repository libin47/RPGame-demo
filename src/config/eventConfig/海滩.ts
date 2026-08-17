// eventConfig/海滩.ts
// 海滩场景相关事件

import type { GameEvent } from '@/types/event'
import { OptionCostType } from '@/types/option'
import { nextFrame, endEvent, triggerBattle, addItem } from './shared'

// ============================================================
// 海滩遇蟹（战斗事件）
// ============================================================

export const event_beach_大螃蟹: GameEvent = {
  id: 'event_beach_大螃蟹',
  name: '海滩遇螃蟹',
  frames: [
    {
      id: 'crab_spotted',
      text: '你靠近了一只落单的大螃蟹，它高举着巨大的螯钳，似乎是在示意你离远点儿。',
      options: [
        {
          id: 'fight_crab',
          name: '战斗',
          results: triggerBattle(['大螃蟹'], {
            victoryFrameId: 'crab_victory',
            defeatFrameId: 'crab_defeat',
            escapeFrameId: 'crab_escaped',
          }),
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
          results: endEvent('你决定不去打扰它们。'),
        },
      ],
    },
    {
      id: 'crab_victory',
      text: '大螃蟹不再动弹。',
      options: [
        {
          id: 'butcher_crab',
          name: '分解蟹肉',
          results: endEvent('你从大螃蟹身上获取了一些有用的材料', [addItem('蟹肉', 1, '蟹肉*1')]),
        },
      ],
    },
    {
      id: 'crab_escaped',
      text: '你抓住机会逃离了战斗。大螃蟹没有追上来。',
      options: [
        {
          id: 'return_beach',
          name: '返回海滩',
          results: endEvent('你安全回到了海滩上'),
        },
      ],
    },
    {
      id: 'crab_defeat',
      text: '变异蟹的巨螯击中了你的要害，你失去了意识...',
      options: [
        {
          id: 'accept_defeat',
          name: '...',
          results: endEvent(),
        },
      ],
    },
  ],
  isRepeatable: true,
}

// ============================================================
// 大海的馈赠（翻找冲上岸的杂物）
// ============================================================

export const event_beach_大海的馈赠: GameEvent = {
  id: 'event_beach_大海的馈赠',
  name: '大海的馈赠',
  frames: [
    {
      id: 'event_beach_大海的馈赠_1',
      text: '潮水线像一条模糊的边界，把大海的垃圾和宝藏一并吐在沙滩上。海藻、漂流木、塑料瓶，还有一些看不出原貌的东西。\n\n你弯下腰，仔细翻找。',
      options: [
        {
          id: '寻找漂浮物',
          name: '寻找可用物资',
          results: nextFrame('event_beach_大海的馈赠_成功', '你找到了一些有用的东西。'),
        },
        {
          id: '离开',
          name: '不找了',
          results: endEvent(),
        },
      ],
    },
    {
      id: 'event_beach_大海的馈赠_成功',
      text: '你的运气不错。',
      onEnterEffects: [
        addItem('木头', 50),
        addItem('石头', 50),
        addItem('金属碎片', 50),
        addItem('金属碎片', 1, '获得金属碎片', 0.3),
      ],
      options: [
        {
          id: '收好离开',
          name: '收好东西',
          results: endEvent(),
        },
      ],
    },
    {
      id: 'event_beach_大海的馈赠_失败',
      text: '你扒拉了半天，只有湿漉漉的海草和碎成渣的泡沫塑料。看来今天大海很吝啬。',
      options: [
        {
          id: '失望离开',
          name: '离开',
          results: endEvent(),
        },
      ],
    },
  ],
}

export const event_beach_船长: GameEvent = {
  id: 'event_beach_船长',
  name: '船长',
  frames: [
    {
      id: 'event_beach_船长_1',
      text: '你靠近了一位独眼的女船长，她沉默地抽着烟。',
      options: [
        {
          id: '对话',
          name: '对话',
          results: endEvent('你和船长对话了。'),
        },
      ],
    },
  ],
}
