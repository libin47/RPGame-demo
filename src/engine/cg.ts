// src/engine/cg.ts
// CG播放引擎：根据事件结果播放CG过场

import type { PlayerState } from '@/types/player'
import type { CGScene, CGFrame } from '@/types/cg'
import { getRegistry } from './registry'
import { evaluateCondition } from './event'

/** CG播放状态 */
export interface CGPlayState {
  /** CG场景配置 */
  scene: CGScene
  /** 当前帧索引 */
  currentFrameIndex: number
  /** 当前帧 */
  currentFrame: CGFrame
  /** 是否播放完成 */
  isFinished: boolean
}

/**
 * 检查CG是否可触发
 */
export function canTriggerCG(cgId: string, player: PlayerState): boolean {
  const registry = getRegistry()
  const cg = registry.getCG(cgId)
  if (!cg) return false

  if (cg.triggerCondition) {
    return evaluateCondition(cg.triggerCondition, player)
  }
  return true
}

/**
 * 创建CG播放状态
 */
export function startCG(cgId: string): CGPlayState | null {
  const registry = getRegistry()
  const cg = registry.getCG(cgId)
  if (!cg || cg.frames.length === 0) return null

  const firstFrame = cg.frames[0]
  if (!firstFrame) return null

  return {
    scene: cg,
    currentFrameIndex: 0,
    currentFrame: firstFrame,
    isFinished: false,
  }
}

/**
 * 推进到CG下一帧
 */
export function nextCGFrame(state: CGPlayState): boolean {
  const nextIndex = state.currentFrameIndex + 1
  if (nextIndex >= state.scene.frames.length) {
    state.isFinished = true
    return false
  }

  const nextFrame = state.scene.frames[nextIndex]
  if (!nextFrame) {
    state.isFinished = true
    return false
  }

  state.currentFrameIndex = nextIndex
  state.currentFrame = nextFrame
  return true
}
