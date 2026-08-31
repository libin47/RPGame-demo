// config/cgs.ts
import { AttributeOperation, EffectType } from '@/types/effect'
import type { CGScene, CGRegistry } from '../types/cg'
import { CGType } from '../types/cg'

const openingCG: CGScene = {
  id: 'opening',
  name: '开场CG',
  notes: '游戏开场，飞机失事的瞬间',
  cgType: CGType.OPENING,
  frames: [
    {
      id: 'opening_01',
      texts: [
        {
          content: '尖叫声、哭喊声，机舱里嘈杂的声音灌满了你的耳朵。',
        },
        {
          content: '飞机正在坠落，你感受的到——',
        },
        {
          content: '这失重的感觉，就像你幼时的梦中一般。',
        },
      ],
    },
    {
      id: 'opening_02',
      texts: [
        {
          content: '你脑中闪过你前半生的记忆，一幕幕。',
        },
        {
          content: '你突然有一种想写点儿什么的欲望……',
        },
        {
          content: '但是，来不及了。',
        },
      ],
    },
    {
      id: 'opening_03',
      texts: [
        {
          content: '轰~~~',
          style: {
            fontSize: 22,
            specialEffect: 'glitch',
          },
        },
      ],
    },
    {
      id: 'opening_04',
      texts: [
        {
          content: '你失去了意识。',
        },
      ],
    },
    {
      id: 'opening_05',
      texts: [
        {
          content: '不知过了多久……',
        },
        {
          content: '海浪和风声唤醒了你。',
        },
      ],
    },
    {
      id: 'opening_06',
      texts: [
        {
          content: '...',
          style: {
            fontSize: 16,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          content: '我还活着。',
          style: {
            fontSize: 20,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
      options: [
        {
          id: 'open_eyes',
          name: '睁开眼睛',
          result: {
            type: 'enterScene',
            sceneInfo: {
              sceneId: 'beach',
            },
          },
        },
      ],
    },
  ],
}
const testCG: CGScene = {
  id: 'opening',
  name: '开场CG',
  notes: '游戏开场，飞机失事的瞬间',
  cgType: CGType.OPENING,
  frames: [
    {
      id: 'opening_01',
      texts: [
        {
          content: '尖叫声、哭喊声',
          style: {
            fontSize: 24,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
      backgroundImage: {
        imageId: 'cg_opening_sky',
        position: { x: 0, y: 0 },
        size: { width: '100%', height: '100%' },
      },
    },
    {
      id: 'opening_02',
      texts: [
        {
          content: '我已经在海上漂了三天。',
          style: {
            fontSize: 20,
            color: '#cccccc',
            textAlign: 'center',
          },
        },
      ],
      backgroundImage: {
        imageId: 'cg_opening_sea',
        position: { x: 0, y: 0 },
        size: { width: '100%', height: '100%' },
      },
    },
    {
      id: 'opening_03',
      texts: [
        {
          content: '燃料耗尽。通讯中断。',
          style: {
            fontSize: 20,
            color: '#cccccc',
            textAlign: 'center',
          },
        },
      ],
      backgroundImage: {
        imageId: 'cg_opening_cockpit',
        position: { x: 0, y: 0 },
        size: { width: '100%', height: '100%' },
      },
    },
    {
      id: 'opening_04',
      texts: [
        {
          content: '然后我看到了一座岛。',
          style: {
            fontSize: 22,
            color: '#ffcc00',
            textAlign: 'center',
          },
        },
        {
          content: '一座不该存在的岛。',
          style: {
            fontSize: 22,
            color: '#ff4444',
            textAlign: 'center',
            specialEffect: 'glitch',
          },
        },
      ],
      backgroundImage: {
        imageId: 'cg_opening_island',
        position: { x: 0, y: 0 },
        size: { width: '100%', height: '100%' },
      },
    },
    {
      id: 'opening_05',
      texts: [
        {
          content: '坠机。',
          style: {
            fontSize: 28,
            color: '#ffffff',
            textAlign: 'center',
            fontWeight: 'bold',
            specialEffect: 'shake',
          },
        },
      ],
    },
    {
      id: 'opening_06',
      texts: [
        {
          content: '...',
          style: {
            fontSize: 16,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          content: '我还活着。',
          style: {
            fontSize: 20,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
      backgroundImage: {
        imageId: 'bg_beach',
        position: { x: 0, y: 0 },
        size: { width: '100%', height: '100%' },
      },
      options: [
        {
          id: 'open_eyes',
          name: '睁开眼睛',
          result: {
            type: 'enterScene',
            sceneInfo: {
              sceneId: 'beach',
            },
            effects: [
              {
                effect: {
                  type: EffectType.FLAG,
                  flagId: 'current_quest_stage',
                  operation: 'set',
                  value: true,
                },
                probability: 1,
              },
            ],
            setFlags: {
              current_quest_stage: 'woke_up_on_beach',
            },
          },
        },
      ],
    },
  ],
}

const endNormalDeadCG: CGScene = {
  id: 'end_normal_dead',
  name: '结束CG-普通死亡',
  notes: '被普通敌人击败的CG。',
  cgType: CGType.OPENING,
  frames: [
    {
      id: 'end_normal_dead_01',
      texts: [
        {
          content: '你重重地倒在了地上。',
        },
        {
          content: '你感受到你的生命正在飞快地流逝。',
        },
      ],
    },
    {
      id: 'end_normal_dead_02',
      texts: [
        {
          content: '这就是结局了吗……',
          style: {
            fontSize: 20,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          content: '就这样……毫无意义的结束……',
          style: {
            fontSize: 20,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          content: '如同一条野狗。',
          style: {
            fontSize: 20,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
      options: [
        {
          id: 'end_normal_dead',
          name: '结局',
          result: {
            type: 'ending',
            endingId: 'death_hp',
          },
        },
      ],
    },
  ],
}

export const cgRegistry: CGRegistry = {
  cgs: {
    opening: openingCG,
    end_normal_dead: endNormalDeadCG,
  },
}
