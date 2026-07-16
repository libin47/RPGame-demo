import type { SaveFile, SaveSnapshot } from '@/types/state'
import { SAVE_VERSION } from '@/types/state'
import { migrateSave } from './migrate'

const KEY_PREFIX = 'erosion-island-slot-'

export function saveKey(slot: number): string {
  return `${KEY_PREFIX}${slot}`
}

export function writeSave(slot: number, snapshot: SaveSnapshot): SaveFile {
  const file: SaveFile = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    slot,
    snapshot: structuredClone(snapshot),
  }
  localStorage.setItem(saveKey(slot), JSON.stringify(file))
  return file
}

export function readSave(slot: number): SaveFile | null {
  const raw = localStorage.getItem(saveKey(slot))
  if (!raw) return null
  try {
    return migrateSave(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function listSaveSlots(max = 3): (SaveFile | null)[] {
  return Array.from({ length: max }, (_, i) => readSave(i + 1))
}

export function deleteSave(slot: number): void {
  localStorage.removeItem(saveKey(slot))
}
