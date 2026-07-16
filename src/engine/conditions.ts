import type { ContentRegistry, When } from '@/types/content'
import type { FlagsState, InventoryState, PlayerState, WorldState } from '@/types/state'
import { timePhaseFromMinute } from '@/types/state'

export interface ConditionContext {
  player: PlayerState
  world: WorldState
  inventory: InventoryState
  flags: FlagsState
  content: ContentRegistry
}

export function evalWhen(when: When | undefined, ctx: ConditionContext): boolean {
  if (!when) return true

  if ('flag' in when) {
    return Boolean(ctx.flags.flags[when.flag])
  }
  if ('notFlag' in when) {
    return !ctx.flags.flags[when.notFlag]
  }
  if ('attrGte' in when) {
    const { attr, value } = when.attrGte
    if (attr in ctx.player.survival) {
      return ctx.player.survival[attr as keyof typeof ctx.player.survival] >= value
    }
    return ctx.player.attrs[attr as keyof typeof ctx.player.attrs] >= value
  }
  if ('attrLte' in when) {
    const { attr, value } = when.attrLte
    if (attr in ctx.player.survival) {
      return ctx.player.survival[attr as keyof typeof ctx.player.survival] <= value
    }
    return ctx.player.attrs[attr as keyof typeof ctx.player.attrs] <= value
  }
  if ('skillGte' in when) {
    return (ctx.player.skills[when.skillGte.skill] ?? 0) >= when.skillGte.value
  }
  if ('sanIn' in when) {
    const san = ctx.player.survival.san
    const min = when.sanIn.min ?? 0
    const max = when.sanIn.max ?? 100
    return san >= min && san <= max
  }
  if ('hasItem' in when) {
    const need = when.hasItem.count ?? 1
    const slot = ctx.inventory.slots.find((s) => s.itemId === when.hasItem.itemId)
    return (slot?.count ?? 0) >= need
  }
  if ('timePhase' in when) {
    const phase = timePhaseFromMinute(ctx.world.minuteOfDay)
    const want = when.timePhase
    return Array.isArray(want) ? want.includes(phase) : want === phase
  }
  if ('location' in when) {
    return ctx.world.locationId === when.location
  }
  if ('all' in when) {
    return when.all.every((w) => evalWhen(w, ctx))
  }
  if ('any' in when) {
    return when.any.some((w) => evalWhen(w, ctx))
  }
  return false
}

export function resolveSanText(
  text: { default: string; sanBelow?: { max: number; text: string }[] },
  san: number,
): string {
  if (!text.sanBelow?.length) return text.default
  const sorted = [...text.sanBelow].sort((a, b) => a.max - b.max)
  for (const entry of sorted) {
    if (san <= entry.max) return entry.text
  }
  return text.default
}
