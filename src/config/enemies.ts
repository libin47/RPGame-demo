// config/enemies.ts
import {
  AttributeOperation,
  AttributeType,
  ComparisonOperator,
  ConditionTargetType,
  EffectType,
  LogicOperator,
} from '@/types/effect'
import type { Enemy, EnemyRegistry } from '../types/enemy'
import { EnemyType } from '../types/enemy'

const 大螃蟹: Enemy = {
  id: '大螃蟹',
  name: '大螃蟹',
  description: '一只体型巨大的螃蟹，甲壳上长满了不规则的尖刺，螯钳异常发达',
  imageId: 'enemy_mutated_crab',
  enemyType: EnemyType.MUTATED,
  hp: 40,
  strength: 60,
  agility: 30,
  // 减免比例（0~1，1=完全免疫）；键为伤害类型ID
  defenses: {
    slash: 0.4,
    blunt: 0.2,
    ranged: 0.1,
    poison: 0,
    fire: 0,
  },
  skills: [
    {
      id: 'crab_claw_slash',
      name: '螯钳挥击',
      description: '用巨大的螯钳猛烈挥击',
      priority: 1,
      weight: 70,
      damageTypeId: 'slash',
      stats: {
        baseDamage: '2d8+6',
        scalingAttribute: 'strength',
        accuracyModifier: 0,
        criticalModifier: 10,
        narrativeTexts: {
          hit: ['大螃蟹挥动巨螯，重重砸在你身上，造成{damage}点伤害'],
          miss: ['大螃蟹的螯钳挥过，被你闪身躲开'],
          critHit: ['大螃蟹的巨螯撕裂空气砸中你，造成{damage}点暴击伤害！'],
          critMiss: ['大螃蟹致命的一击竟被你惊险避开！'],
        },
      },
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
        baseDamage: '1d6+2',
        scalingAttribute: 'strength',
        accuracyModifier: 10,
        criticalModifier: 5,
        onHitEffects: [
          {
            effect: {
              type: EffectType.STATUS,
              statusId: 'poisoned',
              apply: true,
              duration: 15,
            },
            probability: 0.4,
            description: '有概率使玩家中毒',
          },
        ],
        narrativeTexts: {
          hit: ['大螃蟹向你喷射出一股绿色毒沫，造成{damage}点伤害'],
          miss: ['毒沫从你身边飞过，没有喷中'],
          critHit: ['毒沫正中你的脸，造成{damage}点暴击伤害！'],
          critMiss: ['你偏头躲过了致命的毒沫喷射！'],
        },
      },
      cooldown: 3,
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
      triggerText: '大螃蟹受到重创，变得更加狂暴',
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
      itemId: '蟹肉',
      probability: 1,
      minQuantity: 1,
      maxQuantity: 3,
    },
  ],
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

const 变异猴王: Enemy = {
  id: '变异猴王',
  name: '变异猴王',
  description: '一只体型巨大的猴王，体色异常，有不规则的尖刺，爪钳异常发达',
  imageId: 'enemy_mutated_monkey_king',
  enemyType: EnemyType.MUTATED,
  hp: 200,
  strength: 75,
  agility: 30,
  // 减免比例（0~1，1=完全免疫）；键为伤害类型ID
  defenses: {
    slash: 0.4,
    blunt: 0.5,
    ranged: 0.3,
    poison: 0,
    fire: -1,
  },
  skills: [
    {
      id: 'crab_claw_slash',
      name: '螯钳挥击',
      description: '用巨大的螯钳猛烈挥击',
      priority: 1,
      weight: 70,
      damageTypeId: 'slash',
      stats: {
        baseDamage: '3d8+8',
        scalingAttribute: 'strength',
        accuracyModifier: 0,
        criticalModifier: 10,
        narrativeTexts: {
          hit: ['变异猴王挥动巨螯，重重砸在你身上，造成{damage}点伤害'],
          miss: ['变异猴王的螯钳挥过，被你闪身躲开'],
          critHit: ['变异猴王的巨螯撕裂空气砸中你，造成{damage}点暴击伤害！'],
          critMiss: ['变异猴王致命的一击竟被你惊险避开！'],
        },
      },
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
        baseDamage: '1d8+3',
        scalingAttribute: 'strength',
        accuracyModifier: 10,
        criticalModifier: 5,
        onHitEffects: [
          {
            effect: {
              type: EffectType.STATUS,
              statusId: 'poisoned',
              apply: true,
              duration: 15,
            },
            probability: 0.4,
            description: '有概率使玩家中毒',
          },
        ],
        narrativeTexts: {
          hit: ['变异猴王向你喷射出一股绿色毒沫，造成{damage}点伤害'],
          miss: ['毒沫从你身边飞过，没有喷中'],
          critHit: ['毒沫正中你的脸，造成{damage}点暴击伤害！'],
          critMiss: ['你偏头躲过了致命的毒沫喷射！'],
        },
      },
      cooldown: 3,
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
      triggerText: '变异猴王受到重创，变得更加狂暴',
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
      itemId: '蟹肉',
      probability: 1,
      minQuantity: 1,
      maxQuantity: 3,
    },
  ],
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
  strength: 50,
  agility: 70,
  // 减免比例（0~1，1=完全免疫）；键为伤害类型ID
  defenses: {
    slash: 0.1,
    blunt: 0,
    ranged: 0.2,
    poison: 0.5,
    fire: 0,
  },
  skills: [
    {
      id: 'shadow_claw',
      name: '暗影之爪',
      description: '用无形的利爪撕裂现实',
      priority: 1,
      weight: 60,
      damageTypeId: 'slash',
      stats: {
        baseDamage: '1d8+4',
        scalingAttribute: 'agility',
        accuracyModifier: 5,
        criticalModifier: 10,
        narrativeTexts: {
          hit: ['暗影中伸出一只利爪，向你抓来，造成{damage}点伤害'],
          miss: ['利爪从你身边掠过，抓了个空'],
          critHit: ['暗影利爪狠狠撕开你的身体，造成{damage}点暴击伤害！'],
          critMiss: ['你堪堪避开了暗影中致命的利爪！'],
        },
      },
    },
    {
      id: 'madness_whisper',
      name: '疯狂低语',
      description: '发出令人疯狂的低语',
      priority: 2,
      weight: 40,
      damageTypeId: 'slash',
      useCondition: {
        hpAboveRatio: 0.3,
      },
      maxUses: 2,
      stats: {
        baseDamage: '1d1',
        scalingAttribute: 'strength',
        accuracyModifier: 100,
        criticalModifier: 0,
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
        narrativeTexts: {
          hit: ['梦魇潜行者发出令人头皮发麻的低语，你的理智在动摇'],
          miss: ['低语声在你脑中回响，但你没有受到影响'],
          critHit: ['疯狂的呓语灌入你的脑海，你的理智受到重创！'],
          critMiss: ['低语触及你的意识边缘，被你强行驱散！'],
        },
      },
      cooldown: 4,
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
    大螃蟹: 大螃蟹,
    变异猴王: 变异猴王,
    dream_stalker: dreamStalker,
  },
}
