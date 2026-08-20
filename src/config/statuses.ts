// config/statuses.ts
import { AttributeType, ComparisonOperator, ConditionTargetType, EffectType } from '@/types'
import type { AttStatusConfig, StatusConfig, StatusRegistry } from '../types/status'
import {
  StatusType,
  StatusStackingRule,
  StatusAffectedAttribute,
  StatusVisualEffectType,
} from '../types/status'

const status_寒冷: AttStatusConfig = {
  id: 'status_寒冷',
  name: '寒冷',
  description: {
    tooltip: '环境温度过低，HP将逐渐减少',
    start: ['你感觉一丝寒意穿过衣服盖在了你身上。'],
    end: ['你不再因寒冷而战栗。'],
    triggerText: ['你被冻得瑟瑟发抖。'],
    summary: ['寒冷让你难以忍受。'],
    normalText: ['你感觉温度正从你的体内流逝。'],
  },
  statusType: StatusType.DEBUFF,
  defaultDuration: -1,
  stackingRule: StatusStackingRule.NONE,
  effects: {
    /** 效果的触发周期 ， 单位为分钟和回合*/
    interval: 10,

    /** 属性变动列表 */
    attributeChanges: [
      {
        attribute: StatusAffectedAttribute.HP,
        operation: 'add',
        value: -1,
      },
    ],

    /** 效果触发时的描述文本（战斗日志/状态提示） */
    triggerText: 'HP-{value}',
    // 效果触发-roll，以属性roll，满足难度的成功时方可豁免
    triggerRollAtt: '体质',
    triggerRollLevel: '普通',

    /** 效果是否受层数影响（如每层中毒独立造成伤害） */
    scalesWithStacks: false,
  },
  conditions: {
    condition: {
      target: {
        type: ConditionTargetType.ATTRIBUTE,
        attributeType: AttributeType.WARMTH,
      },
      operator: ComparisonOperator.EQUAL,
      value: 'cold',
    },
  },
  removeOnBattleEnd: false,
  removeOnRest: false,
}
const status_炎热: AttStatusConfig = {
  id: 'status_炎热',
  name: '炎热',
  description: {
    tooltip: '环境温度过高，HP将逐渐减少',
    start: ['你感觉一丝热意穿过衣服盖在了你身上。'],
    end: ['你不再感觉炎热。'],
    triggerText: ['太热了，你实在无法忍受。'],
    summary: ['炎热让你难以忍受。'],
    normalText: ['你感觉汗流不止。'],
  },
  statusType: StatusType.DEBUFF,
  defaultDuration: -1,
  stackingRule: StatusStackingRule.NONE,
  effects: {
    /** 效果的触发周期 ， 单位为分钟和回合*/
    interval: 10,

    /** 属性变动列表 */
    attributeChanges: [
      {
        attribute: StatusAffectedAttribute.HP,
        operation: 'add',
        value: -1,
      },
    ],
    triggerRollAtt: '体质',
    triggerRollLevel: '普通',

    /** 效果是否受层数影响（如每层中毒独立造成伤害） */
    scalesWithStacks: false,
  },
  conditions: {
    condition: {
      target: {
        type: ConditionTargetType.ATTRIBUTE,
        attributeType: AttributeType.WARMTH,
      },
      operator: ComparisonOperator.EQUAL,
      value: 'hot',
    },
  },
  removeOnBattleEnd: false,
  removeOnRest: false,
}
const bleeding: StatusConfig = {
  id: 'bleeding',
  name: '流血',
  description: {
    tooltip: '伤口持续流血，不断损失生命值',
  },
  iconId: 'icon_status_bleeding',
  statusType: StatusType.DEBUFF,
  defaultDuration: 10,
  stackingRule: StatusStackingRule.STACK_REFRESH,
  battleEffects: {
    interval: 1,
    attributeChanges: [
      {
        attribute: StatusAffectedAttribute.HP,
        operation: 'percentMax',
        value: 3,
      },
    ],
    triggerText: '伤口持续流血，你损失了{value}点生命值',
    triggerChance: 1.0,
    scalesWithStacks: true,
  },
  onApplyEffects: [],
  onRemoveEffects: [],
  visualEffects: [
    {
      type: StatusVisualEffectType.SCREEN_BORDER_FLASH,
      intensity: 0.3,
      color: '#e74c3c',
    },
  ],
  removeOnBattleEnd: true,
  removeOnRest: true,
}

const strengthBoost: StatusConfig = {
  id: 'strength_boost',
  name: '力量增强',
  description: {
    tooltip: '力量得到临时增强',
  },
  iconId: 'icon_status_strength',
  statusType: StatusType.BUFF,
  defaultDuration: 30,
  stackingRule: StatusStackingRule.REFRESH,
  modifier: {
    strengthModifier: 5,
  },
  removeOnBattleEnd: false,
  removeOnRest: false,
}

const poisoned: StatusConfig = {
  id: 'poisoned',
  name: '中毒',
  description: {
    tooltip: '毒素侵袭身体，持续损失生命值',
    normalText: ['你感觉呼吸苦难。'],
  },
  iconId: 'icon_status_poison',
  statusType: StatusType.DEBUFF,
  defaultDuration: 30,
  stackingRule: StatusStackingRule.STACK_REFRESH,
  modifier: {
    coefficients: {
      staminaRecoveryCoefficient: -0.3,
    },
  },
  effects: {
    interval: 20,
    attributeChanges: [
      {
        attribute: StatusAffectedAttribute.HP,
        operation: 'add',
        value: -5,
      },
    ],
    triggerText: '毒素侵蚀身体，你损失了{value}点生命值',
    triggerChance: 1.0,
    scalesWithStacks: true,
  },
  battleEffects: {
    interval: 1,
    attributeChanges: [
      {
        attribute: StatusAffectedAttribute.HP,
        operation: 'percentMax',
        value: 5,
      },
    ],
    triggerText: '毒素侵蚀身体，你损失了{value}点生命值',
    triggerChance: 1.0,
    scalesWithStacks: true,
  },
  onApplyEffects: [],
  onRemoveEffects: [],
  visualEffects: [
    {
      type: StatusVisualEffectType.SCREEN_BORDER_FLASH,
      intensity: 0.4,
      color: '#2ecc71',
    },
  ],
  removeOnBattleEnd: false,
  removeOnRest: true,
}

const status_饥饿: AttStatusConfig = {
  id: 'status_饥饿',
  name: '饥饿',
  description: {
    tooltip: '饱食度耗尽，生命与理智将不断流失',
    start: ['饥饿正啃噬着你的胃，你感到无比虚弱。'],
    end: ['饱餐一顿后，饥饿感终于离你而去。'],
    triggerText: ['胃部一阵绞痛，饥饿让你越加虚弱。'],
    summary: ['持续的饥饿正在吞噬你的意志。'],
    normalText: ['你饥肠辘辘，四肢开始发软。'],
  },
  statusType: StatusType.DEBUFF,
  defaultDuration: -1,
  stackingRule: StatusStackingRule.NONE,
  effects: {
    // 每小时结算一次（对应原"饱食度为0时"的被动伤害）
    interval: 60,
    attributeChanges: [
      {
        attribute: StatusAffectedAttribute.HP,
        operation: 'percentMax',
        value: 5,
      },
      {
        attribute: StatusAffectedAttribute.SAN,
        operation: 'add',
        value: -1,
      },
    ],
    triggerChance: 1.0,
    scalesWithStacks: false,
  },
  conditions: {
    condition: {
      target: {
        type: ConditionTargetType.ATTRIBUTE,
        attributeType: AttributeType.SATIETY,
      },
      operator: ComparisonOperator.LESS_EQUAL,
      value: 0,
    },
  },
  removeOnBattleEnd: false,
  removeOnRest: false,
}

const status_超载: AttStatusConfig = {
  id: 'status_超载',
  name: '超载',
  description: {
    tooltip: '负重超过最大负重，行动费力：体力消耗提升、体力恢复降低、饱食度流逝加快',
    start: ['沉重的负担压得你直不起腰，每走一步都异常吃力。'],
    end: ['卸下沉重的货物后，你终于恢复了正常行动。'],
    normalText: ['你背包东西太多了，你感觉不堪重负。'],
  },
  statusType: StatusType.DEBUFF,
  defaultDuration: -1,
  stackingRule: StatusStackingRule.NONE,
  modifier: {
    coefficients: {
      // 加法型增量：体力消耗提升、体力恢复降低、饱食度消耗加快
      staminaConsumptionCoefficient: 1,
      staminaRecoveryCoefficient: -0.5,
      satietyLossCoefficient: 0.7,
    },
  },
  conditions: {
    condition: {
      target: {
        type: ConditionTargetType.CARRY_WEIGHT_RATE,
      },
      // 负重率 > 100% 即超载
      operator: ComparisonOperator.GREATER,
      value: 1,
    },
  },
  removeOnBattleEnd: false,
  removeOnRest: false,
}

const 恐惧: StatusConfig = {
  id: 'fear',
  name: '恐惧',
  description: {
    tooltip: '恐惧，减少力量和敏捷',
    normalText: ['你感觉害怕。'],
  },
  statusType: StatusType.DEBUFF,
  defaultDuration: 30,
  stackingRule: StatusStackingRule.REFRESH,
  modifier: {
    strengthModifier: -5,
    agilityModifier: -5,
  },
  removeOnBattleEnd: false,
  removeOnRest: false,
}

export const statusRegistry: StatusRegistry = {
  statuses: {
    status_寒冷,
    status_炎热,
    status_饥饿,
    status_超载,

    恐惧,
    bleeding,
    strength_boost: strengthBoost,
    poisoned,
  },
}
