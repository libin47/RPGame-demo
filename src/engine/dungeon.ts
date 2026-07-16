import type { ContentRegistry, DungeonCell } from '@/types/content'
import type { WorldState } from '@/types/state'

const DIR_DELTA: Record<'n' | 's' | 'e' | 'w', { x: number; y: number }> = {
  n: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  e: { x: 1, y: 0 },
  w: { x: -1, y: 0 },
}

export function getCell(
  content: ContentRegistry,
  dungeonId: string,
  x: number,
  y: number,
): DungeonCell | undefined {
  const dungeon = content.dungeons[dungeonId]
  return dungeon?.cells.find((c) => c.x === x && c.y === y)
}

export function canMove(
  content: ContentRegistry,
  world: WorldState,
  dir: 'n' | 's' | 'e' | 'w',
): boolean {
  if (!world.inDungeon || !world.dungeonId) return false
  const cell = getCell(content, world.dungeonId, world.dungeonX, world.dungeonY)
  if (!cell?.exits.includes(dir)) return false
  const delta = DIR_DELTA[dir]
  const next = getCell(content, world.dungeonId, world.dungeonX + delta.x, world.dungeonY + delta.y)
  return Boolean(next)
}

export function moveDungeon(
  content: ContentRegistry,
  world: WorldState,
  dir: 'n' | 's' | 'e' | 'w',
): { ok: boolean; cell?: DungeonCell; reason?: string } {
  if (!canMove(content, world, dir)) {
    return { ok: false, reason: '那边过不去。' }
  }
  const delta = DIR_DELTA[dir]
  world.dungeonX += delta.x
  world.dungeonY += delta.y
  const cell = getCell(content, world.dungeonId!, world.dungeonX, world.dungeonY)
  return { ok: true, cell }
}

export function enterDungeon(
  content: ContentRegistry,
  world: WorldState,
  dungeonId: string,
  x?: number,
  y?: number,
): { ok: boolean; reason?: string; description?: string } {
  const dungeon = content.dungeons[dungeonId]
  if (!dungeon) return { ok: false, reason: '未知地牢。' }
  world.inDungeon = true
  world.dungeonId = dungeonId
  world.dungeonX = x ?? dungeon.start.x
  world.dungeonY = y ?? dungeon.start.y
  const cell = getCell(content, dungeonId, world.dungeonX, world.dungeonY)
  return { ok: true, description: cell?.description ?? dungeon.name }
}

export function exitDungeon(content: ContentRegistry, world: WorldState): string {
  const dungeon = world.dungeonId ? content.dungeons[world.dungeonId] : undefined
  const loc = dungeon?.exitLocationId ?? world.locationId
  world.inDungeon = false
  world.dungeonId = null
  world.dungeonX = 0
  world.dungeonY = 0
  world.locationId = loc
  return loc
}
