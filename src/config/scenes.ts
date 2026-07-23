// config/scenes.ts
import {
  AttributeType,
  ComparisonOperator,
  ConditionTargetType,
  LogicOperator,
} from '@/types/effect'
import type { Scene, SubScene, SceneRegistry } from '../types/scene'
import { InteractionType, InteractionCostType, FunctionType, Direction } from '../types/scene'

// ===== 海滩场景 =====

const beach: Scene = {
  id: 'beach',
  name: '海滩',
  notes: '游戏起始场景，玩家从飞机残骸中醒来',
  descriptions: [
    {
      id: 'beach_first_arrival',
      priority: 10,
      isOneTime: true,
      displayCondition: {
        logic: LogicOperator.AND,
        subConditions: [
          {
            target: { type: ConditionTargetType.FLAG, id: 'first_time_on_beach' },
            operator: ComparisonOperator.EQUAL,
            value: true,
          },
        ],
      },
      text: '你从昏迷中醒来，发现自己躺在{plane_wreckage}旁的沙滩上。阳光炙热，海浪拍打着海岸。远处是{forest_edge}，隐约可以看到一些{strange_tracks}通向内陆。',
      eventEntries: [
        {
          key: 'plane_wreckage',
          displayText: '飞机残骸',
          eventId: 'event_plane_wreckage',
          displayCondition: {
            logic: LogicOperator.AND,
            subConditions: [
              {
                target: { type: ConditionTargetType.FLAG, id: 'first_time_on_beach' },
                operator: ComparisonOperator.EQUAL,
                value: true,
              },
            ],
          },
        },
        {
          key: 'forest_edge',
          displayText: '茂密的森林边缘',
          eventId: 'event_forest_edge_first',
          displayCondition: {
            logic: LogicOperator.AND,
            subConditions: [
              {
                target: { type: ConditionTargetType.FLAG, id: 'first_time_on_beach' },
                operator: ComparisonOperator.EQUAL,
                value: true,
              },
            ],
          },
        },
        {
          key: 'strange_tracks',
          displayText: '奇怪的痕迹',
          eventId: 'event_strange_tracks',
          displayCondition: {
            logic: LogicOperator.AND,
            subConditions: [
              {
                target: { type: ConditionTargetType.FLAG, id: 'first_time_on_beach' },
                operator: ComparisonOperator.EQUAL,
                value: true,
              },
            ],
          },
        },
      ],
      isAutoTrigger: false,
      seenFlag: 'seen_beach_first_arrival',
      viewLimit: 1,
    },
    {
      id: 'beach_normal',
      priority: 5,
      text: '你站在海滩上。{plane_wreckage}的残骸依然散落在不远处，海浪不断拍打着沙滩。{cave_entrance}在海岸线的一侧隐约可见。',
      eventEntries: [
        {
          key: 'plane_wreckage',
          displayText: '飞机残骸',
          eventId: 'event_plane_wreckage',
          removeAfterClick: false,
        },
        {
          key: 'cave_entrance',
          displayText: '洞穴入口',
          eventId: 'event_cave_entrance',
          displayCondition: {
            logic: LogicOperator.AND,
            subConditions: [
              {
                target: {
                  type: ConditionTargetType.ATTRIBUTE,
                  attributeType: AttributeType.STRENGTH,
                },
                operator: ComparisonOperator.GREATER_EQUAL,
                value: 2,
              },
            ],
          },
        },
      ],
      isAutoTrigger: false,
      isOneTime: false,
      viewLimit: -1,
    },
    {
      id: 'beach_crabs',
      priority: 3,
      displayCondition: {
        logic: LogicOperator.AND,
        subConditions: [
          {
            target: { type: ConditionTargetType.FLAG, id: 'defeated_first_crab' },
            operator: ComparisonOperator.EQUAL,
            value: false,
          },
          {
            target: { type: ConditionTargetType.CORRUPTION },
            operator: ComparisonOperator.GREATER_EQUAL,
            value: 25,
          },
        ],
      },
      text: '你在沙滩上发现了一些{mutated_crab}在徘徊，它们的甲壳在阳光下泛着诡异的光泽。',
      eventEntries: [
        {
          key: 'mutated_crab',
          displayText: '变异蟹',
          eventId: 'event_beach_crab_encounter',
        },
      ],
      isAutoTrigger: true,
      autoTriggerEventKey: 'mutated_crab',
      autoTriggerProbability: 0.6,
      showDescriptionBeforeAutoTrigger: true,
      autoTriggerDelayMs: 2000,
      isOneTime: false,
      viewLimit: -1,
    },
  ],
  backgroundImage: 'bg_beach',
  temperatureModifier: 5,
  interactions: [
    {
      id: 'explore_beach',
      name: '探索海滩',
      interactionType: InteractionType.EXPLORE,
      hideWhenUnavailable: false,
      costs: [
        {
          costType: InteractionCostType.STAMINA,
          value: 10,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.EXPLORE,
      },
      requiresConfirmation: false,
      displayPriority: 10,
      isOneTime: false,
      cooldownMinutes: 0,
    },
    {
      id: 'enter_cave',
      name: '进入洞穴',
      interactionType: InteractionType.ENTER_SUB_SCENE,
      hideWhenUnavailable: true,
      displayCondition: {
        logic: LogicOperator.AND,
        subConditions: [
          {
            target: { type: ConditionTargetType.FLAG, id: 'explored_cave' },
            operator: ComparisonOperator.NOT_EQUAL,
            value: false,
          },
        ],
      },
      costs: [
        {
          costType: InteractionCostType.STAMINA,
          value: 15,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.ENTER_SUB_SCENE,
        subSceneId: 'beach_cave',
      },
      requiresConfirmation: false,
      displayPriority: 5,
      isOneTime: false,
      cooldownMinutes: 0,
    },
    {
      id: 'move_to_forest',
      name: '前往森林',
      interactionType: InteractionType.MOVE_TO_SCENE,
      hideWhenUnavailable: false,
      costs: [
        {
          costType: InteractionCostType.STAMINA,
          value: 25,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.MOVE_TO_SCENE,
        targetSceneId: 'forest',
        targetNodeId: 'node_forest',
        travelTimeMinutes: 30,
        staminaCost: 25,
        pathDescription: '沿着沙滩向北走，进入森林',
        encounterEventPool: [
          {
            eventId: 'event_forest_path_encounter',
            weight: 30,
          },
          {
            eventId: 'event_merchant_encounter',
            weight: 10,
            condition: {
              logic: LogicOperator.AND,
              subConditions: [
                {
                  target: {
                    type: ConditionTargetType.FLAG,
                    id: 'met_wandering_merchant',
                  },
                  operator: ComparisonOperator.EQUAL,
                  value: false,
                },
              ],
            },
          },
        ],
      },
      requiresConfirmation: false,
      displayPriority: 3,
      isOneTime: false,
      cooldownMinutes: 0,
    },
    {
      id: 'rest_beach',
      name: '休息',
      description: '在海滩上稍作休息',
      interactionType: InteractionType.REST,
      hideWhenUnavailable: false,
      costs: [
        {
          costType: InteractionCostType.STAMINA,
          value: 0,
          affectedByCoefficient: false,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.REST,
      },
      requiresConfirmation: true,
      confirmationText: '确定要在海滩上休息1小时吗？',
      displayPriority: 1,
      isOneTime: false,
      cooldownMinutes: 0,
    },
  ],
  isDungeon: false,
  isSafeZone: false,
  canCamp: true,
  canBuildBase: true,
  bgmId: 'bgm_beach',
}

// ===== 海滩-洞穴子场景 =====

const beachCave: SubScene = {
  id: 'beach_cave',
  name: '海滩洞穴',
  notes: '海滩旁的一个小洞穴，内部昏暗潮湿',
  parentSceneId: 'beach',
  descriptions: [
    {
      id: 'cave_first_enter',
      priority: 10,
      displayCondition: {
        logic: LogicOperator.AND,
        subConditions: [
          {
            target: { type: ConditionTargetType.FLAG, id: 'explored_cave' },
            operator: ComparisonOperator.EQUAL,
            value: false,
          },
        ],
      },
      text: '洞穴内部昏暗潮湿，空气中弥漫着霉味。你的眼睛逐渐适应了黑暗，看到洞穴深处似乎有{glowing_moss}在发光。地上散落着一些{journal_fragment_cave}。',
      eventEntries: [
        {
          key: 'glowing_moss',
          displayText: '发光的苔藓',
          eventId: 'event_glowing_moss',
        },
        {
          key: 'journal_fragment_cave',
          displayText: '发黄的纸页',
          eventId: 'event_journal_fragment',
        },
      ],
      isAutoTrigger: false,
      isOneTime: true,
      seenFlag: 'seen_cave_first_enter',
      viewLimit: 1,
    },
    {
      id: 'cave_normal',
      priority: 5,
      text: '洞穴内依然昏暗，{glowing_moss}提供着微弱的照明。墙壁上有些{strange_markings}。',
      eventEntries: [
        {
          key: 'glowing_moss',
          displayText: '发光的苔藓',
          eventId: 'event_glowing_moss',
          removeAfterClick: true,
        },
        {
          key: 'strange_markings',
          displayText: '奇怪的刻痕',
          eventId: 'event_cave_markings',
          displayCondition: {
            logic: LogicOperator.AND,
            subConditions: [
              {
                target: {
                  type: ConditionTargetType.ATTRIBUTE,
                  attributeType: AttributeType.SAN,
                },
                operator: ComparisonOperator.LESS_EQUAL,
                value: 60,
              },
            ],
          },
        },
      ],
      isAutoTrigger: false,
      isOneTime: false,
      viewLimit: -1,
    },
  ],
  temperatureModifier: -10,
  interactions: [
    {
      id: 'explore_cave',
      name: '探索洞穴',
      interactionType: InteractionType.EXPLORE,
      hideWhenUnavailable: false,
      costs: [
        {
          costType: InteractionCostType.STAMINA,
          value: 15,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.EXPLORE,
      },
      requiresConfirmation: false,
      displayPriority: 10,
      isOneTime: false,
      cooldownMinutes: 0,
    },
    {
      id: 'exit_cave',
      name: '离开洞穴',
      interactionType: InteractionType.EXIT_SUB_SCENE,
      hideWhenUnavailable: false,
      costs: [
        {
          costType: InteractionCostType.STAMINA,
          value: 5,
          affectedByCoefficient: false,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.EXIT_SUB_SCENE,
      },
      requiresConfirmation: false,
      displayPriority: 1,
      isOneTime: false,
      cooldownMinutes: 0,
    },
  ],
  isDungeon: false,
  isSafeZone: false,
  canCamp: true,
}

// ===== 森林场景 =====

const forest: Scene = {
  id: 'forest',
  name: '森林',
  notes: '海滩北方的森林，植被茂密',
  descriptions: [
    {
      id: 'forest_first',
      priority: 10,
      text: '你踏入了茂密的森林。高大的树木遮蔽了大部分阳光，地面上铺满了落叶。空气中弥漫着泥土和植物的气息。{strange_trees}的树干上似乎有异常的突起。',
      eventEntries: [
        {
          key: 'strange_trees',
          displayText: '变异的树木',
          eventId: 'event_strange_trees',
        },
      ],
      isAutoTrigger: false,
      isOneTime: true,
      seenFlag: 'seen_forest_first',
      viewLimit: 1,
    },
    {
      id: 'forest_normal',
      priority: 5,
      text: '森林中一片静谧，偶尔能听到不知名生物的叫声。你可以看到一些{berry_bushes}在灌木丛中，以及一些{fallen_branches}。',
      eventEntries: [
        {
          key: 'berry_bushes',
          displayText: '浆果灌木',
          eventId: 'event_gather_berries',
        },
        {
          key: 'fallen_branches',
          displayText: '落枝',
          eventId: 'event_gather_wood',
        },
      ],
      isAutoTrigger: false,
      isOneTime: false,
      viewLimit: -1,
    },
  ],
  backgroundImage: 'bg_forest',
  temperatureModifier: -3,
  interactions: [
    {
      id: 'explore_forest',
      name: '探索森林',
      interactionType: InteractionType.EXPLORE,
      hideWhenUnavailable: false,
      costs: [
        {
          costType: InteractionCostType.STAMINA,
          value: 12,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.EXPLORE,
      },
      requiresConfirmation: false,
      displayPriority: 10,
      isOneTime: false,
      cooldownMinutes: 0,
    },
    {
      id: 'move_to_beach',
      name: '返回海滩',
      interactionType: InteractionType.MOVE_TO_SCENE,
      hideWhenUnavailable: false,
      costs: [
        {
          costType: InteractionCostType.STAMINA,
          value: 25,
          affectedByCoefficient: true,
        },
      ],
      behaviorParams: {
        interactionType: InteractionType.MOVE_TO_SCENE,
        targetSceneId: 'beach',
        targetNodeId: 'node_beach',
        travelTimeMinutes: 30,
        staminaCost: 25,
        pathDescription: '穿过林间小径返回海滩',
      },
      requiresConfirmation: false,
      displayPriority: 3,
      isOneTime: false,
      cooldownMinutes: 0,
    },
    {
      id: 'rest_forest',
      name: '休息',
      interactionType: InteractionType.REST,
      hideWhenUnavailable: false,
      costs: [],
      behaviorParams: {
        interactionType: InteractionType.REST,
      },
      requiresConfirmation: true,
      confirmationText: '确定要在森林中休息1小时吗？',
      displayPriority: 1,
      isOneTime: false,
      cooldownMinutes: 0,
    },
  ],
  isDungeon: false,
  isSafeZone: false,
  canCamp: true,
  canBuildBase: false,
}

export const sceneRegistry: SceneRegistry = {
  scenes: {
    beach,
    forest,
  },
  subScenes: {
    beach_cave: beachCave,
  },
  initialSceneId: 'beach',
}
