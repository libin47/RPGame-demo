// src/engine/ending.ts
// 结局判定引擎：根据玩家状态检查是否满足结局条件

import type { PlayerState } from '@/types/player'
import type { EndingConfig } from '@/types/ending'
import { getRegistry } from './registry'

/** 结局检查结果 */
export interface EndingCheckResult {
  /** 是否触发结局 */
  triggered: boolean
  /** 触发的结局配置 */
  ending?: EndingConfig
  /** 触发原因 */
  reason?: string
}

/**
 * 检查玩家是否满足任一结局条件
 * 优先级：按 rank 排序（S > A > B > C > D > E），高优先级先检查
 *
 * @param player - 当前玩家状态
 * @returns 检查结果
 */
export function checkEnding(player: PlayerState): EndingCheckResult {
  const registry = getRegistry()
  const allEndings = registry.getAllEndings()

  // 按等级排序（S > A > B > C > D > E）
  const rankOrder: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4, E: 5 }
  const sortedEndings = [...allEndings].sort(
    (a, b) => (rankOrder[a.rank] ?? 99) - (rankOrder[b.rank] ?? 99),
  )

  for (const ending of sortedEndings) {
    // 如果已经解锁过该结局则跳过（每个结局只触发一次）
    if (player.progress.unlockedEndingIds.includes(ending.id)) {
      continue
    }

    const matchResult = checkEndingConditions(player, ending)
    if (matchResult.matched) {
      // 解锁结局
      player.progress.unlockedEndingIds.push(ending.id)
      player.progress.isGameCompleted = true

      // 设置结局标志位
      if (ending.endingFlag) {
        player.flags[ending.endingFlag] = true
      }

      return {
        triggered: true,
        ending,
        reason: matchResult.reason,
      }
    }
  }

  return { triggered: false }
}

/**
 * 检查单个结局的所有条件是否满足
 */
function checkEndingConditions(
  player: PlayerState,
  ending: EndingConfig,
): { matched: boolean; reason?: string } {
  const conditions = ending.triggerConditions

  // hp归零判定
  const hpCondition = conditions.find((c) => c.type === 'hpZero')
  if (hpCondition && player.survival.hp <= 0) {
    return { matched: true, reason: hpCondition.description }
  }

  // san归零判定
  const sanCondition = conditions.find((c) => c.type === 'sanZero')
  if (sanCondition && player.survival.san <= 0) {
    return { matched: true, reason: sanCondition.description }
  }

  // 标志位判定
  for (const cond of conditions) {
    if (cond.type === 'flagCheck') {
      const playerValue = player.flags[cond.flagId ?? '']
      const expected = cond.expectedValue
      // 如果未设置 expectedValue，只要标志位存在且为 true 即满足
      if (expected === undefined) {
        if (playerValue === true) {
          return { matched: true, reason: cond.description }
        }
      } else if (playerValue === expected) {
        return { matched: true, reason: cond.description }
      }
    }
  }

  return { matched: false }
}
