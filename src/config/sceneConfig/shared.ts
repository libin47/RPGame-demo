// sceneConfig/shared.ts
// 场景通用按钮与移动/交互工厂
// 仅当配置在多个场景间完全同构时提取为工厂，场景特有内容留在场景文件内联

import type { MoveInteraction, SceneInteraction } from '../../types/scene'
import { InteractionType } from '../../types/scene'
import type { Conditions } from '../../types/effect'
import type { ButtonOption } from '../../types/option'

// ============================================================
// 通用按钮
// ============================================================

/** 通用探索按钮 */
export const exploreButton: ButtonOption = {
  id: 'explore',
  name: '探索',
  description: '探索环境，说不定能发现点儿新东西呢',
  costTime: 30,
  costEnergy: 10,
}

/** 通用建造按钮 */
export const buildButton: ButtonOption = {
  id: 'build',
  name: '建造',
  description: '建造建筑',
  costTime: 0,
  costEnergy: 0,
}

/** 通用"移动"按钮（无目标移动，默认消耗10分钟/10体力） */
export const moveButton: MoveInteraction = {
  id: 'move',
  name: '移动',
  costTime: 10,
  moveType: 'move',
}

// ============================================================
// 移动按钮工厂
// ============================================================

interface EnterSubSceneMoveOptions {
  id: string
  /** 按钮显示名（默认"前往"） */
  name?: string
  /** 按钮描述 */
  description?: string
  /** 目标名称（显示在描述标题） */
  descriptionTitle: string
  /** 目标子场景ID */
  subSceneId: string
  /** 显示条件标志位（满足 flag 时才显示） */
  flag?: string
  /** 显示条件 */
  availableCondition?: Conditions
  /** 未显示时的提示 */
  unavailableTooltip?: string
}

/** 前往子场景移动按钮（默认消耗10分钟/10体力） */
export function enterSubSceneMove(opts: EnterSubSceneMoveOptions): MoveInteraction {
  return {
    id: opts.id,
    name: opts.name ?? '前往',
    description: opts.description ?? opts.descriptionTitle,
    descriptionTitle: opts.descriptionTitle,
    costTime: 10,
    ...(opts.flag ? { displayCondition: { flag: [opts.flag] } } : {}),
    ...(opts.availableCondition ? { availableCondition: opts.availableCondition } : {}),
    ...(opts.unavailableTooltip ? { unavailableTooltip: opts.unavailableTooltip } : {}),
    moveType: 'enterSubScene',
    subSceneId: opts.subSceneId,
  }
}

interface ExitSubSceneMoveOptions {
  id: string
  /** 按钮显示名（默认"前往沙滩"） */
  name?: string
  description?: string
  descriptionTitle?: string
  /** 显示条件标志位（满足 flag 时才显示） */
  flag?: string
}

/** 离开子场景返回母场景的移动按钮（默认消耗10分钟/10体力） */
export function exitSubSceneMove(opts: ExitSubSceneMoveOptions): MoveInteraction {
  return {
    id: opts.id,
    name: opts.name ?? '前往沙滩',
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.descriptionTitle ? { descriptionTitle: opts.descriptionTitle } : {}),
    costTime: 10,
    ...(opts.flag ? { displayCondition: { flag: [opts.flag] } } : {}),
    moveType: 'exitSubScene',
  }
}

// ============================================================
// 交互按钮工厂
// ============================================================

interface EventInteractionOptions {
  id: string
  /** 触发的事件ID */
  eventId: string
  /** 按钮显示名（默认取 id） */
  name?: string
  description?: string
  displayCondition?: Conditions
  /** 是否只能触发一次（默认 false） */
  isOneTime?: boolean
  /** 使用后设置的标志位（默认取 id） */
  usedFlag?: string
}

/** 事件触发型交互按钮（默认消耗10分钟/10体力） */
export function eventInteraction(opts: EventInteractionOptions): SceneInteraction {
  const name = opts.name ?? opts.id
  return {
    id: opts.id,
    name,
    description: opts.description ?? name,
    interactionType: InteractionType.EVENT,
    behaviorParams: {
      interactionType: InteractionType.EVENT,
      eventId: opts.eventId,
    },
    costTime: 10,
    ...(opts.displayCondition ? { displayCondition: opts.displayCondition } : {}),
    ...(opts.isOneTime ? { isOneTime: true, usedFlag: opts.usedFlag ?? opts.id } : {}),
    // 仅传 usedFlag（未设 isOneTime）时也生效
    ...(!opts.isOneTime && opts.usedFlag ? { usedFlag: opts.usedFlag } : {}),
  }
}
