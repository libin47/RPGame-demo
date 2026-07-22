// config/enemies.ts
import { AttributeOperation, AttributeType, ComparisonOperator, ConditionTargetType, EffectType, LogicOperator } from '@/types/effect'
import type { Enemy, EnemyRegistry } from '../types/enemy'
import {
  EnemyType,
  EnemySkillTargetType,
} from '../types/enemy'
import { FlagOperation } from '@/types/flag'

const mutatedCrab: Enemy = {
  id: 'mutated_crab',
  name: '变异蟹',
  description: '一只体型巨大的螃蟹，甲壳上长满了不规则的尖刺，螯钳异常发达',
  imageId: 'enemy_mutated_crab',
  enemyType: EnemyType.MUTATED,
  hp: 40,
  strength: 12,
  agility: 6,
  defenses: {
    slashDefense: 4,
    bluntDefense: 2,
    rangedDefense: 1,
    poisonDefense: 0,
    fireDefense: 0,
  },
  skills: [
    {
      id: 'crab_claw_slash',
      name: '螯钳挥击',
      description: '用巨大的螯钳猛烈挥击',
      priority: 1,
      weight: 70,
      maxUses: -1,
      damageTypeId: 'slash',
      stats: {
        baseDamage: 8,
        damageVariance: 0.2,
        strengthScaling: 0.8,
        agilityScaling: 0.0,
        accuracyModifier: 0.0,
        criticalChance: 0.1,
        criticalMultiplier: 1.8,
      },
      cooldown: 0,
      targetType: EnemySkillTargetType.SINGLE_PLAYER,
      chargeTime: 0,
      useTextTemplate: '变异蟹挥动巨螯，向你猛击过来',
    },
    {
      id: 'crab_foam_spray',
      name: '毒沫喷射',
      description: '从口中喷出带有腐蚀性的泡沫',
      priority: 2,
      weight: 30,
      useCondition: {
        minTurn: 2,
      },
      maxUses: 3,
      damageTypeId: 'poison',
      stats: {
        baseDamage: 5,
        damageVariance: 0.1,
        strengthScaling: 0.3,
        agilityScaling: 0.0,
        accuracyModifier: 0.1,
        criticalChance: 0.05,
        criticalMultiplier: 1.5,
      },
      cooldown: 3,
      targetType: EnemySkillTargetType.SINGLE_PLAYER,
      chargeTime: 0,
      onHitEffects: [
        {
          effect: {
            type: EffectType.STATUS,
            statusId: 'poisoned',
            apply: true,
            duration: 15,
            durationUnit: 'minute',
          },
          probability: 0.4,
          description: '有概率使玩家中毒',
        },
      ],
      useTextTemplate: '变异蟹向你喷射出一股绿色毒沫',
    },
  ],
  behavior: {
    aggression: 0.6,
    desperationThreshold: 0.3,
    desperationBehavior: {
      type: 'enrage',
      params: {
        damageMultiplier: 1.5,
      },
      triggerText: '变异蟹受到重创，变得更加狂暴',
    },
  },
  corruptionScaling: {
    hpPerCorruption: 0.5,
    damagePerCorruption: 0.3,
  },
  escapeDifficultyModifier: 1.0,
  canNotEscape: false,
  loot: [
    {
      itemId: 'crab_meat',
      probability: 0.8,
      minQuantity: 1,
      maxQuantity: 3,
    },
    {
      itemId: 'chitin_shell',
      probability: 0.4,
      minQuantity: 1,
      maxQuantity: 2,
      affectedByPlayerSkill: {
        skillId: 'gathering',
        bonusPerLevel: 0.05,
        quantityBonusPerLevel: 0.1,
      },
    },
    {
      itemId: 'gold_coin',
      probability: 0.15,
      minQuantity: 1,
      maxQuantity: 5,
    },
  ],
  defeatFlag: 'defeated_first_crab',
  spawnCondition: {
    logic: LogicOperator.AND,
    subConditions: [
      {
        target: { type: ConditionTargetType.CORRUPTION },
        operator: ComparisonOperator.GREATER_EQUAL,
        value: 30,
      },
    ],
  },
  spawnWeight: 50,
  minCorruption: 20,
  maxCorruption: 80,
}

const dreamStalker: Enemy = {
  id: 'dream_stalker',
  name: '梦魇潜行者',
  nameVariations: [
    {
      name: '梦魇潜行者',
      condition: {
        target: { type: ConditionTargetType.SAN_LEVEL },
        operator: ComparisonOperator.LESS_EQUAL,
        value: 60,
      },
    },
    {
      name: '扭曲的暗影',
      condition: {
        target: { type: ConditionTargetType.SAN_LEVEL },
        operator: ComparisonOperator.LESS_EQUAL,
        value: 20,
      },
    },
  ],
  description: '一个模糊的人形轮廓，似乎在现实与梦境的夹缝中不断闪烁',
  imageId: 'enemy_dream_stalker',
  enemyType: EnemyType.DREAM_CREATURE,
  hp: 25,
  strength: 10,
  agility: 14,
  defenses: {
    slashDefense: 1,
    bluntDefense: 0,
    rangedDefense: 2,
    poisonDefense: 5,
    fireDefense: 0,
  },
  skills: [
    {
      id: 'shadow_claw',
      name: '暗影之爪',
      description: '用无形的利爪撕裂现实',
      priority: 1,
      weight: 60,
      maxUses: -1,
      damageTypeId: 'slash',
      stats: {
        baseDamage: 6,
        damageVariance: 0.3,
        strengthScaling: 0.5,
        agilityScaling: 0.5,
        accuracyModifier: 0.15,
        criticalChance: 0.2,
        criticalMultiplier: 2.0,
      },
      cooldown: 0,
      targetType: EnemySkillTargetType.SINGLE_PLAYER,
      chargeTime: 0,
      useTextTemplate: '暗影中伸出一只利爪，向你抓来',
    },
    {
      id: 'madness_whisper',
      name: '疯狂低语',
      description: '发出令人疯狂的低语',
      priority: 2,
      weight: 40,
      useCondition: {
        hpAboveRatio: 0.3,
      },
      maxUses: 2,
      stats: {
        baseDamage: 0,
        damageVariance: 0,
        strengthScaling: 0,
        agilityScaling: 0,
        accuracyModifier: 1.0,
        criticalChance: 0,
        criticalMultiplier: 1,
      },
      cooldown: 4,
      targetType: EnemySkillTargetType.SINGLE_PLAYER,
      chargeTime: 0,
      onHitEffects: [
        {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.SAN,
            operation: AttributeOperation.SUBTRACT,
            value: 10,
          },
          probability: 1.0,
          description: '损失10点SAN值',
        },
      ],
      useTextTemplate: '梦魇潜行者发出令人头皮发麻的低语，你的理智在动摇',
    },
  ],
  behavior: {
    aggression: 0.8,
  },
  escapeDifficultyModifier: 1.5,
  canNotEscape: false,
  loot: [],
  spawnCondition: {
    logic: LogicOperator.AND,
    subConditions: [
      {
        target: { type: ConditionTargetType.SAN_LEVEL },  
        operator: ComparisonOperator.LESS_EQUAL,
        value: 60,
      },
    ],
  },
  spawnWeight: 20,
}

export const enemyRegistry: EnemyRegistry = {
  enemies: {
    mutated_crab: mutatedCrab,
    dream_stalker: dreamStalker,
  },
}