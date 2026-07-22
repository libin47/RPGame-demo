// config/cgs.ts
import { AttributeOperation, EffectType } from '@/types/effect'
import type { CGScene, CGRegistry } from '../types/cg'
import { CGType, CGScreenEffectType } from '../types/cg'
import { FlagOperation } from '@/types/flag'

const openingCG: CGScene = {
  id: 'opening',
  name: '开场CG',
  notes: '游戏开场，飞机失事的瞬间',
  cgType: CGType.OPENING,
  frames: [
    {
      id: 'opening_01',
      order: 1,
      texts: [
        {
          content: '第17天。',
          displayDelay: 1000,
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
      screenEffects: [
        {
          type: CGScreenEffectType.FADE_FROM_BLACK,
          intensity: 1,
          duration: 2000,
        },
      ],
    },
    {
      id: 'opening_02',
      order: 2,
      texts: [
        {
          content: '我已经在海上漂了三天。',
          displayDelay: 500,
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
      order: 3,
      texts: [
        {
          content: '燃料耗尽。通讯中断。',
          displayDelay: 500,
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
      order: 4,
      texts: [
        {
          content: '然后我看到了一座岛。',
          displayDelay: 800,
          style: {
            fontSize: 22,
            color: '#ffcc00',
            textAlign: 'center',
          },
        },
        {
          content: '一座不该存在的岛。',
          displayDelay: 2000,
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
      screenEffects: [
        {
          type: CGScreenEffectType.SHAKE,
          intensity: 0.5,
          duration: 3000,
        },
        {
          type: CGScreenEffectType.RED_TINT,
          intensity: 0.3,
          duration: 3000,
        },
      ],
    },
    {
      id: 'opening_05',
      order: 5,
      texts: [
        {
          content: '坠机。',
          displayDelay: 300,
          style: {
            fontSize: 28,
            color: '#ffffff',
            textAlign: 'center',
            fontWeight: 'bold',
            specialEffect: 'shake',
          },
        },
      ],
      screenEffects: [
        {
          type: CGScreenEffectType.SHAKE,
          intensity: 1.0,
          duration: 2000,
        },
        {
          type: CGScreenEffectType.FADE_TO_BLACK,
          intensity: 1.0,
          duration: 1500,
          delay: 2000,
        },
      ],
    },
    {
      id: 'opening_06',
      order: 6,
      texts: [
        {
          content: '...',
          displayDelay: 1000,
          style: {
            fontSize: 16,
            color: '#ffffff',
            textAlign: 'center',
          },
        },
        {
          content: '我还活着。',
          displayDelay: 3000,
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
      screenEffects: [
        {
          type: CGScreenEffectType.FADE_FROM_BLACK,
          intensity: 1.0,
          duration: 3000,
        },
      ],
      options: [
        {
          text: '睁开眼睛',
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
                  operation: FlagOperation.SET,
                  value: 'woke_up_on_beach',
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

export const cgRegistry: CGRegistry = {
  cgs: {
    opening: openingCG,
  },
}