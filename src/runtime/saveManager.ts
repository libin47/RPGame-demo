// src/runtime/saveManager.ts
// 存档管理：将玩家状态序列化到 localStorage，支持手动存档/读档

import type { PlayerState } from '@/types/player'

/** localStorage 存档键名前缀 */
const SAVE_KEY_PREFIX = 'eroded_island_save_'

/** 存档元数据键名 */
const SAVE_META_KEY = SAVE_KEY_PREFIX + '_meta'

/** 存档信息 */
export interface SaveMeta {
  /** 存档槽位索引 */
  slot: number
  /** 玩家名称 */
  playerName: string
  /** 保存时的游戏天数 */
  day: number
  /** 保存时的游戏时间（分钟） */
  timeMinutes: number
  /** 保存时间戳 */
  savedAt: number
  /** 存活天数 */
  totalDaysSurvived: number
}

/**
 * 保存游戏状态到指定槽位
 *
 * @param player - 玩家状态快照
 * @param slot - 存档槽位（0-2）
 * @returns 是否保存成功
 */
export function saveGame(player: PlayerState, slot: number): boolean {
  try {
    const key = SAVE_KEY_PREFIX + slot
    const data = JSON.stringify(player)
    localStorage.setItem(key, data)

    // 更新元数据
    const meta: SaveMeta = {
      slot,
      playerName: player.name,
      day: player.progress.day,
      timeMinutes: player.progress.timeMinutes,
      savedAt: Date.now(),
      totalDaysSurvived: player.progress.totalDaysSurvived,
    }

    updateSaveMeta(slot, meta)
    return true
  } catch (e) {
    console.error('保存失败:', e)
    return false
  }
}

/**
 * 从指定槽位加载游戏状态
 *
 * @param slot - 存档槽位（0-2）
 * @returns 玩家状态对象，无存档时返回 null
 */
export function loadGame(slot: number): PlayerState | null {
  try {
    const key = SAVE_KEY_PREFIX + slot
    const data = localStorage.getItem(key)
    if (!data) return null

    const player = JSON.parse(data) as PlayerState
    return player
  } catch (e) {
    console.error('读档失败:', e)
    return null
  }
}

/**
 * 删除指定槽位的存档
 */
export function deleteSave(slot: number): void {
  const key = SAVE_KEY_PREFIX + slot
  localStorage.removeItem(key)
  removeSaveMeta(slot)
}

/**
 * 检查指定槽位是否有存档
 */
export function hasSave(slot: number): boolean {
  const key = SAVE_KEY_PREFIX + slot
  return localStorage.getItem(key) !== null
}

/**
 * 获取所有存档槽位的元数据
 */
export function getAllSaveMeta(): (SaveMeta | null)[] {
  const metas: (SaveMeta | null)[] = [null, null, null]

  try {
    const raw = localStorage.getItem(SAVE_META_KEY)
    if (raw) {
      const allMetas = JSON.parse(raw) as Record<number, SaveMeta>
      for (const [slotStr, meta] of Object.entries(allMetas)) {
        const slot = Number(slotStr)
        if (slot >= 0 && slot < 3) {
          metas[slot] = meta
        }
      }
    }
  } catch {
    // 元数据损坏，忽略
  }

  return metas
}

/**
 * 更新存档元数据
 */
function updateSaveMeta(slot: number, meta: SaveMeta): void {
  try {
    const raw = localStorage.getItem(SAVE_META_KEY)
    const allMetas: Record<number, SaveMeta> = raw ? JSON.parse(raw) : {}
    allMetas[slot] = meta
    localStorage.setItem(SAVE_META_KEY, JSON.stringify(allMetas))
  } catch {
    // 忽略
  }
}

/**
 * 移除存档元数据
 */
function removeSaveMeta(slot: number): void {
  try {
    const raw = localStorage.getItem(SAVE_META_KEY)
    if (raw) {
      const allMetas = JSON.parse(raw)
      delete allMetas[slot]
      localStorage.setItem(SAVE_META_KEY, JSON.stringify(allMetas))
    }
  } catch {
    // 忽略
  }
}
