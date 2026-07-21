// src/config/cg.ts - CG场景配置
import type {
  CGScene,
  CGFrame,
  CGText,
  CGSprite,
  CGScreenEffect,
  CGOption,
  CGTextVariation,
  CGTextStyle,
} from '@/types/cg'
import type { CGType, CGScreenEffectType, CGTextPosition } from '@/types/cg'
import type {
  CGOptionResult,
  NextFrameResult,
  NextCGResult,
  EnterSceneResult,
  TriggerEventResult,
  TriggerBattleResult,
  EndingResult,
} from '@/types/cg'
import type { EffectResult, Effect, Condition, ConditionTarget } from '@/types/effect'
import {
  EffectType,
  AttributeType,
  AttributeOperation,
  FlagOperation,
  ConditionTargetType,
  ComparisonOperator,
  ItemChangeType,
} from '@/types/effect'

// ============================================================
// 辅助函数：创建条件判断
// ============================================================

// SAN值条件
function sanCondition(min?: number, max?: number): Condition {
  if (min !== undefined && max !== undefined) {
    return {
      target: {
        type: ConditionTargetType.ATTRIBUTE,
        attributeType: AttributeType.SAN,
      },
      operator: ComparisonOperator.BETWEEN,
      value: min,
      value2: max,
    }
  }
  if (min !== undefined) {
    return {
      target: {
        type: ConditionTargetType.ATTRIBUTE,
        attributeType: AttributeType.SAN,
      },
      operator: ComparisonOperator.GREATER_EQUAL,
      value: min,
    }
  }
  return {
    target: {
      type: ConditionTargetType.ATTRIBUTE,
      attributeType: AttributeType.SAN,
    },
    operator: ComparisonOperator.LESS_EQUAL,
    value: max!,
  }
}

// 标志位条件
function flagCondition(flagId: string, value?: string | number | boolean): Condition {
  return {
    target: {
      type: ConditionTargetType.FLAG,
      id: flagId,
    },
    operator: value !== undefined ? ComparisonOperator.EQUAL : ComparisonOperator.EXISTS,
    value: value,
  }
}

// 辅助函数：创建标志位效果
function setFlagEffect(flagId: string, value: number | string | boolean): EffectResult {
  return {
    effect: {
      type: EffectType.FLAG,
      flagId,
      operation: FlagOperation.SET,
      value,
    },
  }
}

// 辅助函数：创建物品效果
function addItemEffect(itemId: string, quantity: number = 1): EffectResult {
  return {
    effect: {
      type: EffectType.ITEM,
      itemId,
      changeType: ItemChangeType.ADD,
      quantity,
    },
  }
}

// 辅助函数：创建属性效果
function addAttributeEffect(attribute: AttributeType, value: number): EffectResult {
  return {
    effect: {
      type: EffectType.ATTRIBUTE,
      attribute,
      operation: AttributeOperation.ADD,
      value,
    },
  }
}

// ============================================================
// CG1: 开局CG - 坠机
// ============================================================

const openingCG: CGScene = {
  id: 'opening_crash',
  name: '开端：坠落',
  notes: '游戏开场CG，飞机坠毁在荒岛',
  cgType: 'opening' as CGType,

  frames: [
    // 帧1：黑屏，引擎声
    {
      id: 'opening_frame_1',
      order: 1,
      texts: [
        {
          content: '一阵剧烈的震动将你从睡梦中惊醒。',
          displayDelay: 1000,
        },
        {
          content: '耳边传来引擎刺耳的尖啸声...',
          displayDelay: 2500,
        },
        {
          content: '你感觉身体在失重，机舱内的灯光忽明忽暗。',
          displayDelay: 4000,
        },
      ],
      screenEffects: [
        {
          type: 'shake' as CGScreenEffectType,
          intensity: 0.3,
          duration: 2000,
          delay: 0,
        },
        {
          type: 'fadeFromBlack' as CGScreenEffectType,
          intensity: 1,
          duration: 1500,
          delay: 0,
        },
      ],
    },

    // 帧2：混乱的机舱
    {
      id: 'opening_frame_2',
      order: 2,
      texts: [
        {
          content: '氧气面罩从头顶弹落，在你眼前晃动。',
          displayDelay: 0,
        },
        {
          content: '乘客们的尖叫声此起彼伏。',
          displayDelay: 1500,
        },
        {
          content: '透过舷窗，你看到一片蔚蓝的海洋正在急速逼近...',
          displayDelay: 3000,
        },
      ],
      backgroundImage: {
        imageId: 'bg_plane_cabin',
        position: { x: 'center', y: 'center' },
      },
      screenEffects: [
        {
          type: 'shake' as CGScreenEffectType,
          intensity: 0.8,
          duration: 5000,
          delay: 0,
        },
        {
          type: 'redTint' as CGScreenEffectType,
          intensity: 0.2,
          duration: 5000,
          delay: 1000,
        },
      ],
    },

    // 帧3：冲击
    {
      id: 'opening_frame_3',
      order: 3,
      texts: [
        {
          content: '轰——！！！',
          style: {
            fontSize: 32,
            fontWeight: 'bold',
            color: '#ff4444',
            textAlign: 'center',
            specialEffect: 'shake',
          },
        },
        {
          content: '巨大的冲击力将你甩向前方。',
          displayDelay: 2000,
        },
        {
          content: '你感觉头部遭受重击，意识开始模糊...',
          displayDelay: 3500,
        },
      ],
      screenEffects: [
        {
          type: 'flash' as CGScreenEffectType,
          intensity: 1,
          duration: 500,
          delay: 0,
        },
        {
          type: 'shake' as CGScreenEffectType,
          intensity: 1,
          duration: 1500,
          delay: 0,
        },
        {
          type: 'fadeToBlack' as CGScreenEffectType,
          intensity: 1,
          duration: 3000,
          delay: 4000,
        },
      ],
    },

    // 帧4：醒来
    {
      id: 'opening_frame_4',
      order: 4,
      texts: [
        {
          content: '......',
        },
        {
          content: '你缓缓睁开眼睛。',
          displayDelay: 2000,
        },
        {
          content: '阳光刺痛着你的双眼，耳边是海浪拍打沙滩的声音。',
          displayDelay: 3500,
        },
        {
          content: '你发现自己躺在沙滩上，不远处是飞机的残骸。',
          displayDelay: 5000,
        },
        {
          content: '你还活着。',
          displayDelay: 6500,
          style: {
            fontWeight: 'bold',
            textAlign: 'center',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_beach_wreck',
        position: { x: 'center', y: 'center' },
      },
      screenEffects: [
        {
          type: 'fadeFromBlack' as CGScreenEffectType,
          intensity: 1,
          duration: 3000,
          delay: 1000,
        },
      ],
      options: [
        {
          text: '检查自己的身体状况',
          result: {
            type: 'nextFrame',
            nextFrameId: 'opening_frame_5_check',
          } as NextFrameResult,
          priority: 1,
        },
        {
          text: '环顾四周',
          result: {
            type: 'nextFrame',
            nextFrameId: 'opening_frame_5_look',
          } as NextFrameResult,
          priority: 2,
        },
      ],
    },

    // 帧5a：检查身体状况
    {
      id: 'opening_frame_5_check',
      order: 5,
      texts: [
        {
          content: '你活动了一下四肢，虽然有些擦伤和淤青，但似乎没有骨折。',
        },
        {
          content: '额头有一道伤口，血液已经凝固。',
        },
        {
          content: '你感觉到轻微的眩晕，可能是脑震荡。',
        },
      ],
      backgroundImage: {
        imageId: 'bg_beach_wreck',
        position: { x: 'center', y: 'center' },
      },
      options: [
        {
          text: '站起来，环顾四周',
          result: {
            type: 'nextFrame',
            nextFrameId: 'opening_frame_6',
          } as NextFrameResult,
        },
      ],
    },

    // 帧5b：环顾四周
    {
      id: 'opening_frame_5_look',
      order: 5,
      texts: [
        {
          content: '你环顾四周。',
        },
        {
          content: '这是一片荒凉的沙滩。飞机的残骸散落在海岸线上，有些还在燃烧。',
        },
        {
          content: '远处是茂密的热带丛林，浓密的树冠遮天蔽日。',
        },
        {
          content: '你看到几个乘客的身影倒在沙滩上，一动不动。',
          style: {
            color: '#999',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_beach_wreck',
        position: { x: 'center', y: 'center' },
      },
      options: [
        {
          text: '检查自己的身体',
          result: {
            type: 'nextFrame',
            nextFrameId: 'opening_frame_6',
          } as NextFrameResult,
        },
      ],
    },

    // 帧6：初识环境
    {
      id: 'opening_frame_6',
      order: 6,
      texts: [
        {
          content: '你意识到，你被困在了这座荒岛上。',
        },
        {
          content: '救援不知何时才会到来。',
          displayDelay: 1500,
        },
        {
          content: '你必须依靠自己，在这片陌生的土地上生存下去。',
          displayDelay: 3000,
          style: {
            fontWeight: 'bold',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_beach_wreck_wide',
        position: { x: 'center', y: 'center' },
      },
      options: [
        {
          text: '开始行动',
          result: {
            type: 'enterScene',
            sceneInfo: {
              sceneId: 'beach_wreck',
              subSceneId: 'crash_site',
            },
            effects: [
              setFlagEffect('opening_completed', true),
              setFlagEffect('day_count', 1),
              addAttributeEffect(AttributeType.HP, -5),
            ],
          } as EnterSceneResult,
        },
      ],
    },
  ],
}

// ============================================================
// CG2: 结局CG - 寂静归零（真结局）
// ============================================================

const trueEndingCG: CGScene = {
  id: 'ending_silent_zero',
  name: '结局：寂静归零',
  notes: '真结局 - 发现真相并彻底解决孢子，自身存活',
  cgType: 'ending' as CGType,
  triggerCondition: flagCondition('ending_path', 'silent_zero'),

  frames: [
    // 帧1：引爆前
    {
      id: 'ending_sz_frame_1',
      order: 1,
      texts: [
        {
          content: '你站在研究基地的中心控制室。',
          displayDelay: 0,
        },
        {
          content: '手指悬在引爆按钮上方。',
          displayDelay: 2000,
        },
        {
          content: '所有的研究资料、所有的真相，此刻都清晰无比。',
          displayDelay: 3500,
        },
      ],
      backgroundImage: {
        imageId: 'bg_research_base_control',
        position: { x: 'center', y: 'center' },
      },
      screenEffects: [
        {
          type: 'fadeFromBlack' as CGScreenEffectType,
          intensity: 1,
          duration: 2000,
          delay: 0,
        },
      ],
    },

    // 帧2：回忆闪回
    {
      id: 'ending_sz_frame_2',
      order: 2,
      texts: [
        {
          content: '这五年来发生的一切在眼前闪过。',
          displayDelay: 0,
        },
        {
          content: 'SCP基金会的收容、岛上的变异生物、那些疯狂的研究员...',
          displayDelay: 1500,
        },
        {
          content: '还有那个雨夜，你在深处看到的东西。',
          displayDelay: 3000,
          style: {
            specialEffect: 'glitch',
          },
          condition: sanCondition(0, 40),
        },
        {
          content: '这座岛上的生命，已经被来自星辰的造物所侵蚀。',
          displayDelay: 4500,
        },
        {
          content: '如果放任不管，终有一天，它会蔓延出去。',
          displayDelay: 6000,
          style: {
            fontWeight: 'bold',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_research_base_control',
        position: { x: 'center', y: 'center' },
      },
      foregroundSprites: [
        {
          imageId: 'fx_memory_flash',
          position: { x: 'center', y: 'center' },
          opacity: 0.3,
          condition: sanCondition(0, 60),
        },
      ],
    },

    // 帧3：决断
    {
      id: 'ending_sz_frame_3',
      order: 3,
      texts: [
        {
          content: '你深吸一口气。',
          displayDelay: 0,
        },
        {
          content: '按下了按钮。',
          displayDelay: 2000,
          style: {
            fontWeight: 'bold',
            fontSize: 20,
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_research_base_control',
        position: { x: 'center', y: 'center' },
      },
      screenEffects: [
        {
          type: 'flash' as CGScreenEffectType,
          intensity: 0.5,
          duration: 300,
          delay: 2200,
        },
      ],
    },

    // 帧4：引爆
    {
      id: 'ending_sz_frame_4',
      order: 4,
      texts: [
        {
          content: '大地开始震动。',
          displayDelay: 500,
        },
        {
          content: '深埋在岛屿下方的孢子母体正在崩塌。',
          displayDelay: 1500,
        },
        {
          content: '你能感受到那股远古的能量在消散——',
          displayDelay: 3000,
          style: {
            specialEffect: 'distortion',
          },
        },
        {
          content: '就像困了亿万年的噩梦终于醒来。',
          displayDelay: 4500,
          style: {
            color: '#88aacc',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_island_collapse',
        position: { x: 'center', y: 'center' },
      },
      screenEffects: [
        {
          type: 'shake' as CGScreenEffectType,
          intensity: 0.9,
          duration: 6000,
          delay: 0,
        },
        {
          type: 'colorGrading' as CGScreenEffectType,
          intensity: 0.7,
          duration: 6000,
          delay: 0,
        },
      ],
    },

    // 帧5：逃亡
    {
      id: 'ending_sz_frame_5',
      order: 5,
      texts: [
        {
          content: '你转身冲向逃生舱。',
          displayDelay: 0,
        },
        {
          content: '身后的设施正在崩塌，混凝土和金属在呻吟。',
          displayDelay: 1500,
        },
        {
          content: '但你心中出奇地平静。',
          displayDelay: 3000,
          style: {
            fontStyle: 'italic',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_collapsing_corridor',
        position: { x: 'center', y: 'center' },
      },
      screenEffects: [
        {
          type: 'shake' as CGScreenEffectType,
          intensity: 0.6,
          duration: 4000,
          delay: 0,
        },
      ],
    },

    // 帧6：海面
    {
      id: 'ending_sz_frame_6',
      order: 6,
      texts: [
        {
          content: '逃生舱浮上海面。',
          displayDelay: 0,
        },
        {
          content: '透过舷窗，你看到那座岛屿正在沉入海中。',
          displayDelay: 2000,
        },
        {
          content: '岛屿中央的光芒逐渐熄灭。',
          displayDelay: 4000,
        },
        {
          content: '五年来第一次，这里的海面如此平静。',
          displayDelay: 6000,
          style: {
            fontStyle: 'italic',
            color: '#aaccff',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_ocean_sunset',
        position: { x: 'center', y: 'center' },
      },
      screenEffects: [
        {
          type: 'fadeFromBlack' as CGScreenEffectType,
          intensity: 1,
          duration: 2000,
          delay: 0,
        },
      ],
    },

    // 帧7：终幕
    {
      id: 'ending_sz_frame_7',
      order: 7,
      texts: [
        {
          content: '太阳从海平面升起。',
          displayDelay: 0,
        },
        {
          content: '你望着初升的太阳，第一次感觉到真正的温暖。',
          displayDelay: 3000,
        },
        {
          content: '那些孢子的低语、变异生物的嘶吼、研究员的疯狂呓语...',
          displayDelay: 5000,
        },
        {
          content: '全部归于寂静。',
          displayDelay: 7000,
          style: {
            fontWeight: 'bold',
            fontSize: 22,
            textAlign: 'center',
          },
        },
        {
          content: '',
          displayDelay: 8500,
        },
        {
          content: '你闭上眼睛。',
          displayDelay: 9500,
        },
        {
          content: '终于可以好好睡一觉了。',
          displayDelay: 11000,
          style: {
            fontStyle: 'italic',
            color: '#cccccc',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_ocean_sunrise',
        position: { x: 'center', y: 'center' },
      },
      screenEffects: [
        {
          type: 'sepia' as CGScreenEffectType,
          intensity: 0.3,
          duration: 12000,
          delay: 0,
        },
        {
          type: 'fadeToWhite' as CGScreenEffectType,
          intensity: 0.8,
          duration: 4000,
          delay: 12000,
        },
      ],
      options: [
        {
          text: '【寂静归零】',
          result: {
            type: 'ending',
            endingId: 'silent_zero',
            effects: [
              setFlagEffect('ending_silent_zero_achieved', true),
              setFlagEffect('all_endings', 'silent_zero_completed'),
            ],
          } as EndingResult,
          style: 'special',
          tooltip: '真结局达成',
        },
      ],
    },
  ],
}

// ============================================================
// CG3: 中盘CG - 邂逅神秘少女
// ============================================================

const mysteriousGirlCG: CGScene = {
  id: 'encounter_mysterious_girl',
  name: '邂逅：林中少女',
  notes: '游戏中期遭遇神秘少女的CG，SAN值影响描述和选项',
  cgType: 'character' as CGType,
  triggerCondition: flagCondition('met_mysterious_girl', false),

  frames: [
    // 帧1：森林中的身影
    {
      id: 'girl_frame_1',
      order: 1,
      texts: [
        {
          content: '你在这片密林中跋涉了整整一个下午。',
          displayDelay: 0,
        },
        {
          content: '阳光透过层层叠叠的树冠，在地面投下斑驳的光影。',
          displayDelay: 1500,
        },
        {
          content: '突然，前方的灌木丛中闪过一道白色的身影。',
          displayDelay: 3000,
        },
        // 高SAN：正常的描述
        {
          content: '那似乎是一个穿着白色连衣裙的少女，在树影间轻盈地移动。',
          displayDelay: 4000,
          condition: sanCondition(61, 100),
        },
        // 中SAN：开始有些诡异
        {
          content: '那是一个白色的人形轮廓...它的移动方式有些不对劲。',
          displayDelay: 4000,
          condition: sanCondition(41, 60),
          style: {
            specialEffect: 'glitch',
          },
        },
        // 低SAN：完全非人
        {
          content: '白色的肢体在树影间蠕动，那不是人类该有的关节。',
          displayDelay: 4000,
          condition: sanCondition(0, 40),
          style: {
            specialEffect: 'distortion',
            color: '#660000',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_dense_forest',
        position: { x: 'center', y: 'center' },
      },
      foregroundSprites: [
        {
          imageId: 'sprite_white_figure_far',
          position: { x: '70%', y: '40%' },
          opacity: 0.6,
          size: { width: '15%', height: 'auto' },
          condition: sanCondition(41, 100),
        },
        {
          imageId: 'sprite_white_creature_far',
          position: { x: '70%', y: '40%' },
          opacity: 0.4,
          size: { width: '20%', height: 'auto' },
          condition: sanCondition(0, 40),
        },
      ],
    },

    // 帧2：第一次对视
    {
      id: 'girl_frame_2',
      order: 2,
      texts: [
        {
          content: '那个身影停了下来。',
          displayDelay: 0,
        },
        {
          content: '它——她，转过身来。',
          displayDelay: 1500,
        },
        // 高SAN
        {
          content: '你看到一张美丽而略带忧郁的脸庞。她的眼睛是深邃的蓝色，像是藏着无尽的故事。',
          displayDelay: 3000,
          condition: sanCondition(61, 100),
        },
        // 中SAN
        {
          content: '那张脸很漂亮，但她的眼睛...为什么瞳孔是竖着的？而且她看起来太过苍白了。',
          displayDelay: 3000,
          condition: sanCondition(41, 60),
          style: {
            color: '#888888',
          },
        },
        // 低SAN
        {
          content: '那张脸上有太多的眼睛。每一个都在看你。每一个都在微笑。',
          displayDelay: 3000,
          condition: sanCondition(0, 40),
          style: {
            specialEffect: 'distortion',
            color: '#440000',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_dense_forest',
        position: { x: 'center', y: 'center' },
      },
      foregroundSprites: [
        {
          imageId: 'portrait_girl_normal',
          position: { x: 'center', y: 'center' },
          opacity: 0.8,
          size: { width: '40%', height: 'auto' },
          condition: sanCondition(61, 100),
        },
        {
          imageId: 'portrait_girl_strange',
          position: { x: 'center', y: 'center' },
          opacity: 0.7,
          size: { width: '40%', height: 'auto' },
          condition: sanCondition(41, 60),
        },
        {
          imageId: 'portrait_girl_horror',
          position: { x: 'center', y: 'center' },
          opacity: 0.5,
          size: { width: '50%', height: 'auto' },
          condition: sanCondition(0, 40),
        },
      ],
    },

    // 帧3：对话
    {
      id: 'girl_frame_3',
      order: 3,
      texts: [
        {
          content: '"你...能看见我？"',
          displayDelay: 500,
        },
        {
          content: '她的声音很轻，像是风吹过树叶。',
          displayDelay: 2000,
          condition: sanCondition(41, 100),
        },
        {
          content: '声音从四面八方传来，重叠成回音。',
          displayDelay: 2000,
          condition: sanCondition(0, 40),
          style: {
            specialEffect: 'glitch',
          },
        },
        {
          content: '"你身上...还没有被污染。"',
          displayDelay: 4000,
        },
        {
          content: '她向前迈了一步。',
          displayDelay: 6000,
        },
        {
          content: '"我叫艾莉娅。这座岛...是我的家。"',
          displayDelay: 7500,
        },
      ],
      backgroundImage: {
        imageId: 'bg_dense_forest',
        position: { x: 'center', y: 'center' },
      },
      foregroundSprites: [
        {
          imageId: 'portrait_eliya_normal',
          position: { x: 'center', y: 'center' },
          opacity: 0.9,
          size: { width: '35%', height: 'auto' },
          condition: sanCondition(41, 100),
        },
        {
          imageId: 'portrait_eliya_horror',
          position: { x: 'center', y: 'center' },
          opacity: 0.6,
          size: { width: '45%', height: 'auto' },
          condition: sanCondition(0, 40),
        },
      ],
      options: [
        {
          text: '"你好，艾莉娅。我是飞机失事的幸存者。"',
          description: '友善地回应',
          result: {
            type: 'nextFrame',
            nextFrameId: 'girl_frame_4_friendly',
          } as NextFrameResult,
          priority: 1,
          availableCondition: sanCondition(41, 100),
        },
        {
          text: '"...你是谁？离我远点。"',
          description: '警惕地后退',
          result: {
            type: 'nextFrame',
            nextFrameId: 'girl_frame_4_hostile',
          } as NextFrameResult,
          priority: 2,
          style: 'danger',
        },
        {
          text: '"你...到底是什么东西？"',
          description: '质问对方',
          result: {
            type: 'nextFrame',
            nextFrameId: 'girl_frame_4_question',
          } as NextFrameResult,
          priority: 3,
          availableCondition: sanCondition(0, 60),
          style: 'danger',
        },
        {
          text: '...沉默',
          description: '不说话，只是看着她',
          result: {
            type: 'nextFrame',
            nextFrameId: 'girl_frame_4_silence',
          } as NextFrameResult,
          priority: 4,
        },
      ],
    },

    // 帧4a：友善回应
    {
      id: 'girl_frame_4_friendly',
      order: 4,
      texts: [
        {
          content: '艾莉娅的眼睛微微亮了起来。',
          displayDelay: 0,
        },
        {
          content: '"幸存者...已经很久没有幸存者来到这里了。"',
          displayDelay: 1500,
        },
        {
          content: '她的脸上浮现出一丝悲伤。',
          displayDelay: 3000,
        },
        {
          content: '"你不该来这里的。但既然来了...也许你能改变些什么。"',
          displayDelay: 4000,
        },
        {
          content: '"跟我来吧，我知道一个安全的地方。"',
          displayDelay: 5500,
        },
        {
          content: '她向你伸出了手。',
          displayDelay: 6500,
          style: {
            fontWeight: 'bold',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_dense_forest',
        position: { x: 'center', y: 'center' },
      },
      foregroundSprites: [
        {
          imageId: 'portrait_eliya_hand',
          position: { x: 'center', y: '60%' },
          opacity: 0.9,
          size: { width: '40%', height: 'auto' },
        },
      ],
      options: [
        {
          text: '握住她的手',
          result: {
            type: 'enterScene',
            sceneInfo: {
              sceneId: 'deep_forest',
              subSceneId: 'eliya_hideout',
            },
            effects: [
              setFlagEffect('met_mysterious_girl', true),
              setFlagEffect('eliya_trust', 1),
              setFlagEffect('eliya_recruited', true),
            ],
          } as EnterSceneResult,
          style: 'special',
        },
        {
          text: '"等等，我凭什么相信你？"',
          result: {
            type: 'nextFrame',
            nextFrameId: 'girl_frame_5_trust',
          } as NextFrameResult,
        },
      ],
    },

    // 帧4b：敌对回应
    {
      id: 'girl_frame_4_hostile',
      order: 4,
      texts: [
        {
          content: '艾莉娅停下了脚步。',
          displayDelay: 0,
        },
        {
          content: '她的表情没有变化，但你能感觉到一股寒意。',
          displayDelay: 1500,
        },
        {
          content: '"...我理解你的警惕。这座岛上确实有很多不该被信任的东西。"',
          displayDelay: 3000,
        },
        {
          content: '她缓缓后退了一步。',
          displayDelay: 4500,
        },
        {
          content: '"但我不是你的敌人。希望下次见面时，你能明白这一点。"',
          displayDelay: 5500,
        },
        {
          content: '她的身影开始融入树影之中。',
          displayDelay: 7000,
          style: {
            color: '#888888',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_dense_forest',
        position: { x: 'center', y: 'center' },
      },
      foregroundSprites: [
        {
          imageId: 'portrait_eliya_sad',
          position: { x: 'center', y: 'center' },
          opacity: 0.7,
          size: { width: '35%', height: 'auto' },
        },
      ],
      screenEffects: [
        {
          type: 'blur' as CGScreenEffectType,
          intensity: 0.3,
          duration: 2000,
          delay: 6000,
        },
      ],
      options: [
        {
          text: '"等等！"',
          result: {
            type: 'nextFrame',
            nextFrameId: 'girl_frame_5_wait',
          } as NextFrameResult,
        },
        {
          text: '让她离开',
          result: {
            type: 'enterScene',
            sceneInfo: {
              sceneId: 'deep_forest',
            },
            effects: [setFlagEffect('met_mysterious_girl', true), setFlagEffect('eliya_trust', -1)],
          } as EnterSceneResult,
          style: 'default',
        },
      ],
    },

    // 帧4c：质问
    {
      id: 'girl_frame_4_question',
      order: 4,
      texts: [
        {
          content: '沉默。',
          displayDelay: 0,
        },
        {
          content: '她直直地看着你，嘴角浮起一丝...微笑？',
          displayDelay: 1500,
          condition: sanCondition(21, 60),
        },
        {
          content: '所有的眼睛同时眯了起来。',
          displayDelay: 1500,
          condition: sanCondition(0, 40),
          style: {
            specialEffect: 'distortion',
            color: '#660000',
          },
        },
        {
          content: '"...我是什么？"',
          displayDelay: 3000,
        },
        {
          content: '"这是一个好问题。"',
          displayDelay: 4000,
        },
        {
          content: '"但我更想知道...你是什么？"',
          displayDelay: 5500,
          style: {
            fontStyle: 'italic',
          },
        },
        {
          content: '"一个未被污染的灵魂，在这座岛上，才是最奇怪的东西。"',
          displayDelay: 7000,
        },
      ],
      backgroundImage: {
        imageId: 'bg_dense_forest_dark',
        position: { x: 'center', y: 'center' },
      },
      screenEffects: [
        {
          type: 'colorGrading' as CGScreenEffectType,
          intensity: 0.5,
          duration: 8000,
          delay: 0,
        },
      ],
      options: [
        {
          text: '"...说下去。"',
          result: {
            type: 'enterScene',
            sceneInfo: {
              sceneId: 'deep_forest',
              subSceneId: 'eliya_hideout',
            },
            effects: [
              setFlagEffect('met_mysterious_girl', true),
              setFlagEffect('eliya_trust', 0),
              setFlagEffect('eliya_mysterious_dialogue', true),
              addAttributeEffect(AttributeType.SAN, -5),
            ],
          } as EnterSceneResult,
          style: 'hidden',
        },
      ],
    },

    // 帧4d：沉默
    {
      id: 'girl_frame_4_silence',
      order: 4,
      texts: [
        {
          content: '沉默在你们之间蔓延。',
          displayDelay: 0,
        },
        {
          content: '艾莉娅静静地看着你，似乎在等待什么。',
          displayDelay: 2000,
        },
        {
          content: '周围的森林出奇地安静。没有鸟叫，没有虫鸣。',
          displayDelay: 4000,
        },
        {
          content: '仿佛整座岛都在屏息。',
          displayDelay: 5500,
        },
        {
          content: '终于，她先开口了：',
          displayDelay: 7000,
        },
        {
          content: '"你不说话，是因为害怕...还是因为已经猜到了什么？"',
          displayDelay: 8000,
          style: {
            fontStyle: 'italic',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_dense_forest',
        position: { x: 'center', y: 'center' },
      },
      options: [
        {
          text: '"我不知道该说什么。"',
          result: {
            type: 'enterScene',
            sceneInfo: {
              sceneId: 'deep_forest',
              subSceneId: 'eliya_hideout',
            },
            effects: [
              setFlagEffect('met_mysterious_girl', true),
              setFlagEffect('eliya_trust', 0),
              setFlagEffect('eliya_silence_encounter', true),
            ],
          } as EnterSceneResult,
        },
      ],
    },

    // 帧5：信任问题（从4a分支）
    {
      id: 'girl_frame_5_trust',
      order: 5,
      texts: [
        {
          content: '艾莉娅收回了手。',
          displayDelay: 0,
        },
        {
          content: '她并没有生气的样子。',
          displayDelay: 1000,
        },
        {
          content: '"你很谨慎。这很好。在这座岛上，不够谨慎的人都已经..."',
          displayDelay: 2500,
        },
        {
          content: '她顿了顿。',
          displayDelay: 4000,
        },
        {
          content: '"已经不再是人了。"',
          displayDelay: 5000,
          style: {
            color: '#666666',
          },
        },
        {
          content: '"但如果你改变了主意，在这片森林的深处，你会找到我的。"',
          displayDelay: 6500,
        },
        {
          content: '她留下了一个小小的包裹，转身消失在树林中。',
          displayDelay: 8000,
        },
      ],
      backgroundImage: {
        imageId: 'bg_dense_forest',
        position: { x: 'center', y: 'center' },
      },
      foregroundSprites: [
        {
          imageId: 'item_mysterious_package',
          position: { x: 'center', y: '70%' },
          opacity: 0.8,
          size: { width: '10%', height: 'auto' },
        },
      ],
      options: [
        {
          text: '拾起包裹',
          result: {
            type: 'enterScene',
            sceneInfo: {
              sceneId: 'deep_forest',
            },
            effects: [
              addItemEffect('eliya_gift', 1),
              setFlagEffect('met_mysterious_girl', true),
              setFlagEffect('eliya_trust', 0),
              setFlagEffect('received_eliya_gift', true),
            ],
          } as EnterSceneResult,
          style: 'special',
        },
      ],
    },

    // 帧5：等等（从4b分支）
    {
      id: 'girl_frame_5_wait',
      order: 5,
      texts: [
        {
          content: '她停了下来。',
          displayDelay: 0,
        },
        {
          content: '但没有转身。',
          displayDelay: 1000,
        },
        {
          content: '"...你想说什么？"',
          displayDelay: 2500,
        },
        {
          content: '她的声音比之前更轻了。',
          displayDelay: 4000,
        },
      ],
      backgroundImage: {
        imageId: 'bg_dense_forest',
        position: { x: 'center', y: 'center' },
      },
      foregroundSprites: [
        {
          imageId: 'portrait_eliya_back',
          position: { x: 'center', y: 'center' },
          opacity: 0.7,
          size: { width: '30%', height: 'auto' },
        },
      ],
      options: [
        {
          text: '"...抱歉。我有些紧张。"',
          result: {
            type: 'enterScene',
            sceneInfo: {
              sceneId: 'deep_forest',
              subSceneId: 'eliya_hideout',
            },
            effects: [
              setFlagEffect('met_mysterious_girl', true),
              setFlagEffect('eliya_trust', 0),
              setFlagEffect('eliya_apologized', true),
            ],
          } as EnterSceneResult,
        },
      ],
    },
  ],
}

// ============================================================
// 导出所有CG配置
// ============================================================

export const CGScenes: Record<string, CGScene> = {
  [openingCG.id]: openingCG,
  [trueEndingCG.id]: trueEndingCG,
  [mysteriousGirlCG.id]: mysteriousGirlCG,
}

// 默认导出
export default CGScenes
