// config/damageTypes.ts - 伤害类型配置实例

import type { DamageType, DamageTypeRegistry } from '../types/damage'

/**
 * 11种伤害类型定义
 */
const damageTypes: Record<string, DamageType> = {
  // ============================================================
  // 物理伤害
  // ============================================================
  slash: {
    id: 'slash',
    name: '劈砍',
    description: '由剑、斧等利器造成的切割伤害，对无甲目标效果显著',
    iconId: 'icon_dmg_slash',
    textColor: '#c0c0c0',
  },
  pierce: {
    id: 'pierce',
    name: '穿刺',
    description: '由弓箭、长矛等尖锐武器造成的贯穿伤害，可穿透部分护甲',
    iconId: 'icon_dmg_pierce',
    textColor: '#e0e0e0',
  },
  blunt: {
    id: 'blunt',
    name: '钝击',
    description: '由锤、棍棒等重物造成的冲击伤害，对重甲目标效果显著',
    iconId: 'icon_dmg_blunt',
    textColor: '#8b7355',
  },

  // ============================================================
  // 元素伤害
  // ============================================================
  fire: {
    id: 'fire',
    name: '火焰',
    description: '由火焰、爆炸等造成的高温伤害，可点燃目标',
    iconId: 'icon_dmg_fire',
    textColor: '#ff6600',
  },
  cold: {
    id: 'cold',
    name: '冰冻',
    description: '由极寒环境或冰霜攻击造成的低温伤害，可减缓目标行动',
    iconId: 'icon_dmg_cold',
    textColor: '#66ccff',
  },
  lightning: {
    id: 'lightning',
    name: '雷电',
    description: '由雷电或电击造成的伤害，对金属装备目标有额外效果',
    iconId: 'icon_dmg_lightning',
    textColor: '#ffff00',
  },
  poison: {
    id: 'poison',
    name: '毒素',
    description: '由毒液、毒气等造成的持续性伤害，会逐渐侵蚀生命',
    iconId: 'icon_dmg_poison',
    textColor: '#66ff66',
  },
  acid: {
    id: 'acid',
    name: '酸蚀',
    description: '由强酸造成的腐蚀伤害，可破坏护甲和武器耐久',
    iconId: 'icon_dmg_acid',
    textColor: '#99ff33',
  },

  // ============================================================
  // 特殊伤害
  // ============================================================
  mental: {
    id: 'mental',
    name: '精神',
    description: '直接冲击理智的伤害，不伤及肉体但会侵蚀心智',
    iconId: 'icon_dmg_mental',
    textColor: '#cc66ff',
  },
  bleed: {
    id: 'bleed',
    name: '流血',
    description: '伤口持续出血造成的持续性伤害，不处理可能致命',
    iconId: 'icon_dmg_bleed',
    textColor: '#ff3333',
  },
  true: {
    id: 'true',
    name: '真实',
    description: '无视所有防御和抗性的纯粹伤害，来自超越理解的力量',
    iconId: 'icon_dmg_true',
    textColor: '#ffffff',
  },
}

export const damageTypeRegistry: DamageTypeRegistry = {
  damageTypes,
}