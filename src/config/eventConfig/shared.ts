// eventConfig/shared.ts
// 事件配置通用效果/结果工厂
// 将频繁重复的样板结构压缩为单行调用，事件内容（文本、条件、专属配置）仍留在事件文件内联

import { EffectType, AttributeType, AttributeOperation, ItemChangeType } from '@/types/effect'
import type { Effect, EffectResult } from '@/types/effect'
import type { EventOptionResult } from '@/types/event'

// ============================================================
// 效果工厂（返回 EffectResult）
// ============================================================

/** 包装效果：probability 默认 1（省略不写），description 可选 */
function fx(effect: Effect, probability = 1, description?: string): EffectResult {
  return {
    effect,
    ...(probability !== 1 ? { probability } : {}),
    ...(description ? { description } : {}),
  }
}

/** 设置标志位 */
export const setFlag = (flagId: string, value = true, description?: string): EffectResult =>
  fx({ type: EffectType.FLAG, flagId, operation: 'set', value }, 1, description)

/**
 * 属性增减：value 为正数时加，负数时减
 * 例：attr(AttributeType.HP, -5, '椰子砸伤了你')、attr(AttributeType.SAN, 5)
 */
export const attr = (
  attribute: AttributeType,
  value: number,
  description?: string,
  probability = 1,
): EffectResult =>
  fx(
    {
      type: EffectType.ATTRIBUTE,
      attribute,
      operation: value >= 0 ? AttributeOperation.ADD : AttributeOperation.SUBTRACT,
      value: Math.abs(value),
    },
    probability,
    description,
  )

/** 添加物品 */
export const addItem = (
  itemId: string,
  quantity = 1,
  description?: string,
  probability = 1,
): EffectResult =>
  fx(
    { type: EffectType.ITEM, itemId, changeType: ItemChangeType.ADD, quantity },
    probability,
    description,
  )

// ============================================================
// 结果工厂（返回 EventOptionResult）
// ============================================================

/** 跳转到同一事件内的另一帧（text/effects 可选） */
export const nextFrame = (
  targetFrameId: string,
  text?: string,
  effects?: EffectResult[],
): EventOptionResult => ({
  type: 'nextFrame',
  targetFrameId,
  ...(text ? { text } : {}),
  ...(effects && effects.length > 0 ? { effects } : {}),
})

/** 结束事件返回场景（exitText 为返回场景后显示的文字，effects 可选） */
export const endEvent = (
  exitText?: string,
  effects?: EffectResult[],
  refreshScene?: boolean,
): EventOptionResult => ({
  type: 'endEvent',
  refreshScene,
  ...(exitText ? { exitText } : {}),
  ...(effects && effects.length > 0 ? { effects } : {}),
})

/** 触发另一个事件 */
export const triggerEvent = (eventId: string, enterTexts?: string): EventOptionResult => ({
  type: 'triggerEvent',
  eventId,
  ...(enterTexts ? { enterTexts } : {}),
})

/** 触发战斗 */
export const triggerBattle = (
  enemyId: string[],
  frameIds: { victoryFrameId: string; defeatFrameId: string; escapeFrameId: string },
  opts?: {
    canEscape?: boolean
    firstEncounterBonus?: boolean
    /** 战斗开始时为敌人施加的开场状态（对全体敌人生效） */
    buffs?: { statusId: string; durationMinutes: number }[]
  },
): EventOptionResult => ({
  type: 'triggerBattle',
  enemyId,
  victoryFrameId: frameIds.victoryFrameId,
  defeatFrameId: frameIds.defeatFrameId,
  escapeFrameId: frameIds.escapeFrameId,
  canEscape: opts?.canEscape ?? true,
  firstEncounterBonus: opts?.firstEncounterBonus ?? true,
  ...(opts?.buffs ? { buffs: opts.buffs } : {}),
})

/** 切换场景 */
export const switchScene = (
  sceneId: string,
  opts?: { subSceneId?: string; enterText?: string },
): EventOptionResult => ({
  type: 'switchScene',
  sceneId,
  ...opts,
})
