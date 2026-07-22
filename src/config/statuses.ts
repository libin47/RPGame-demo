// config/statuses.ts
import type { StatusConfig, StatusRegistry } from '../types/status'
import {
  StatusType,
  StatusStackingRule,
  StatusAffectedAttribute,
  StatusVisualEffectType,
} from '../types/status'

const bleeding: StatusConfig = {
  id: 'bleeding',
  name: '流血',
  description: '伤口持续流血，不断损失生命值',
  iconId: 'icon_status_bleeding',
  statusType: StatusType.DEBUFF,
  defaultDuration: { value: 10, unit: 'minute' },
  stackingRule: StatusStackingRule.STACK_REFRESH,
  effects: [
    {
      interval: 1,
      attributeChanges: [
        {
          attribute: StatusAffectedAttribute.HP,
          operation: 'add',
          value: -3,
        },
      ],
      triggerText: '伤口持续流血，你损失了{value}点生命值',
      triggerChance: 1.0,
      scalesWithStacks: true,
    },
  ],
  onApplyEffects: [],
  onRemoveEffects: [],
  visualEffects: [
    {
      type: StatusVisualEffectType.SCREEN_BORDER_FLASH,
      intensity: 0.3,
      color: '#e74c3c',
    },
  ],
  isDispellable: true,
  exclusiveRemovalText: '使用绷带后流血止住了',
  removeOnBattleEnd: true,
  removeOnRest: true,
}

const strengthBoost: StatusConfig = {
  id: 'strength_boost',
  name: '力量增强',
  description: '力量得到临时增强',
  iconId: 'icon_status_strength',
  statusType: StatusType.BUFF,
  defaultDuration: { value: 30, unit: 'minute' },
  stackingRule: StatusStackingRule.REFRESH,
  effects: [
    {
      interval: 30,
      attributeChanges: [
        {
          attribute: StatusAffectedAttribute.STRENGTH,
          operation: 'add',
          value: 5,
        },
      ],
      triggerChance: 1.0,
      scalesWithStacks: false,
    },
  ],
  onApplyEffects: [],
  onRemoveEffects: [],
  isDispellable: true,
  removeOnBattleEnd: false,
  removeOnRest: false,
}

const poisoned: StatusConfig = {
  id: 'poisoned',
  name: '中毒',
  description: '毒素在体内蔓延，持续损失生命值',
  iconId: 'icon_status_poison',
  statusType: StatusType.DEBUFF,
  defaultDuration: { value: 15, unit: 'minute' },
  stackingRule: StatusStackingRule.STACK_REFRESH,
  effects: [
    {
      interval: 2,
      attributeChanges: [
        {
          attribute: StatusAffectedAttribute.HP,
          operation: 'add',
          value: -5,
        },
        {
          attribute: StatusAffectedAttribute.STAMINA_RECOVERY_COEFFICIENT,
          operation: 'multiply',
          value: -0.3,
        },
      ],
      triggerText: '毒素侵蚀身体，你损失了{value}点生命值',
      triggerChance: 1.0,
      scalesWithStacks: true,
    },
  ],
  onApplyEffects: [],
  onRemoveEffects: [],
  visualEffects: [
    {
      type: StatusVisualEffectType.SCREEN_BORDER_FLASH,
      intensity: 0.4,
      color: '#2ecc71',
    },
  ],
  isDispellable: true,
  removeOnBattleEnd: false,
  removeOnRest: true,
}

export const statusRegistry: StatusRegistry = {
  statuses: {
    bleeding,
    strength_boost: strengthBoost,
    poisoned,
  },
}