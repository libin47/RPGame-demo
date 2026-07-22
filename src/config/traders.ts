// config/traders.ts
import { LogicOperator, ConditionTargetType, ComparisonOperator } from '@/types'
import type { TraderConfig, TradeRegistry } from '../types/trade'

const wanderingMerchant: TraderConfig = {
  id: 'wandering_merchant',
  name: '流浪商人',
  description: '一个穿着破旧斗篷的神秘商人，似乎能在岛上的任何地方出现',
  portraitImageId: 'portrait_merchant',
  sellPriceMultiplier: 1.5,
  buyPriceMultiplier: 0.4,
  goods: [
    {
      itemId: 'bandage',
      stock: 5,
      restockIntervalMinutes: 1440,
      restockAmount: 5,
    },
    {
      itemId: 'strength_potion',
      stock: 1,
      restockIntervalMinutes: 4320,
      restockAmount: 1,
    },
    {
      itemId: 'iron_scrap',
      stock: 10,
      restockIntervalMinutes: 2880,
      restockAmount: 10,
    },
    {
      itemId: 'cloth_scrap',
      stock: 15,
      restockIntervalMinutes: 2880,
      restockAmount: 15,
    },
  ],
  priceModifiers: [
    {
      condition: {
        logic: LogicOperator.AND,
        subConditions: [
          {
            target: { type: ConditionTargetType.FLAG, id: 'merchant_friendship' },
            operator: ComparisonOperator.GREATER_EQUAL,
            value: 3,
          },
        ],
      },
      sellPriceMultiplierModifier: -0.2,
      buyPriceMultiplierModifier: 0.1,
      description: '好感度高，价格优惠',
    },
  ],
}

export const tradeRegistry: TradeRegistry = {
  traders: {
    wandering_merchant: wanderingMerchant,
  },
}