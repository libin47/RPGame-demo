import type { SaveFile } from '@/types/state'
import { SAVE_VERSION } from '@/types/state'

export function migrateSave(raw: unknown): SaveFile | null {
  if (!raw || typeof raw !== 'object') return null
  const file = raw as SaveFile
  if (!file.snapshot || typeof file.version !== 'number') return null

  let version = file.version
  // Future migrations: if (version === 1) { ...; version = 2 }
  if (version > SAVE_VERSION) return null

  return {
    ...file,
    version: SAVE_VERSION,
  }
}
