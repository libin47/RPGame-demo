// src/engine/campsite.ts
// 营地建立/搬家逻辑：唯一营地由 player.progress.campsiteSceneId 记录

import type { PlayerState } from '@/types/player'
import { getRegistry } from './registry'
import { evaluateConditions } from './event'
import { addItem } from './inventory'

export interface CampsiteMoveResult {
  success: boolean
  message: string
  /** 迁移到新营地的建筑数量 */
  migratedCount?: number
  /** 自动拆除的建筑数量 */
  demolishedCount?: number
}

/**
 * 建立/迁移营地
 *
 * - targetSceneId 对应的子场景必须是候选营地（isCampsite）且 campsiteCondition 满足
 * - 首次建立（campsiteSceneId 为 null）：直接设定唯一营地
 * - 搬家（已有营地且不同）：新营地 buildingList 允许的建筑迁移（含等级、储物箱），
 *   不允许的建筑按拆除配置自动折合材料返还，并清空旧营地的营地数据
 *
 * @param player - 玩家状态（会被直接修改）
 * @param targetSceneId - 目标营地子场景ID
 */
export function executeMoveCampsite(
  player: PlayerState,
  targetSceneId: string,
): CampsiteMoveResult {
  const registry = getRegistry()

  // 校验目标位置
  const targetScene = registry.getSubScene(targetSceneId)
  if (!targetScene) return { success: false, message: '目标位置不存在' }
  if (!targetScene.isCampsite) return { success: false, message: '目标位置无法作为营地' }
  if (
    targetScene.campsiteCondition &&
    !evaluateConditions(targetScene.campsiteCondition, player)
  ) {
    return { success: false, message: '目标位置的条件尚未满足，无法搬入' }
  }

  const oldSceneId = player.progress.campsiteSceneId
  let migratedCount = 0
  let demolishedCount = 0

  // 搬家：迁移允许的建筑，拆除不允许的
  if (oldSceneId && oldSceneId !== targetSceneId) {
    const allowed = new Set(targetScene.buildingList ?? [])
    const oldBuilds = player.progress.campBuildings[oldSceneId] ?? []
    const newBuilds: string[] = []

    for (const bldId of oldBuilds) {
      if (allowed.has(bldId)) {
        // 迁移建筑（含等级与储物箱）
        newBuilds.push(bldId)
        const oldLevel = player.progress.campBuildingLevels[oldSceneId]?.[bldId]
        if (oldLevel) {
          player.progress.campBuildingLevels[targetSceneId] ??= {}
          player.progress.campBuildingLevels[targetSceneId][bldId] = oldLevel
        }
        const oldStorage = player.progress.campStorage[oldSceneId]?.[bldId]
        if (oldStorage) {
          player.progress.campStorage[targetSceneId] ??= {}
          player.progress.campStorage[targetSceneId][bldId] = oldStorage
        }
        migratedCount++
      } else {
        // 自动拆除：按拆除配置折合材料返还（不校验/扣除拆除成本）
        const build = registry.getBuilding(bldId)
        const currentSubId =
          player.progress.campBuildingLevels[oldSceneId]?.[bldId] ?? build?.defaultBuild
        const currentSub = build?.subBuild.find((s) => s.buildId === currentSubId)
        if (currentSub?.deconstructionReturnItems) {
          for (const item of currentSub.deconstructionReturnItems) {
            addItem(player, item.itemId, item.quantity)
          }
        }
        demolishedCount++
      }
    }

    // 清空旧营地记录，写入新营地
    delete player.progress.campBuildings[oldSceneId]
    delete player.progress.campBuildingLevels[oldSceneId]
    delete player.progress.campStorage[oldSceneId]
    player.progress.campBuildings[targetSceneId] = newBuilds
    player.progress.campBuildingLevels[targetSceneId] ??= {}
    player.progress.campStorage[targetSceneId] ??= {}
  }

  // 设定唯一营地
  player.progress.campsiteSceneId = targetSceneId

  return {
    success: true,
    message:
      oldSceneId && oldSceneId !== targetSceneId
        ? `搬家完成，已迁至 ${targetScene.name}`
        : `在 ${targetScene.name} 建立了营地`,
    migratedCount,
    demolishedCount,
  }
}
