import type { ContentRegistry, LocationDef } from '@/types/content'
import type { FlagsState, WorldState } from '@/types/state'
import { timePhaseFromMinute } from '@/types/state'
import { travelTimeMinutes } from './time'

export function isLocationUnlocked(
  locationId: string,
  world: WorldState,
  flags: FlagsState,
  loc: LocationDef | undefined,
  fromId: string,
): boolean {
  if (world.unlockedLocations.includes(locationId)) return true
  if (!loc) return false
  const exit = loc.exits.find((e) => e.to === locationId)
  // Check from current location's exits
  void fromId
  if (exit?.unlockFlag && flags.flags[exit.unlockFlag]) return true
  return false
}

export function availableExits(
  content: ContentRegistry,
  world: WorldState,
  flags: FlagsState,
): { to: string; name: string; travelMinutes: number; unlocked: boolean; label?: string }[] {
  const loc = content.locations[world.locationId]
  if (!loc) return []

  return loc.exits.map((exit) => {
    const dest = content.locations[exit.to]
    const unlocked =
      world.unlockedLocations.includes(exit.to) ||
      (!exit.unlockFlag && !exit.when) ||
      (exit.unlockFlag ? Boolean(flags.flags[exit.unlockFlag]) : false) ||
      world.unlockedLocations.includes(exit.to)

    const reallyUnlocked =
      world.unlockedLocations.includes(exit.to) ||
      (exit.unlockFlag ? Boolean(flags.flags[exit.unlockFlag]) : !exit.unlockFlag)

    const phase = timePhaseFromMinute(world.minuteOfDay)
    const minutes = travelTimeMinutes(exit.travelMinutes, 10, phase === 'night')

    return {
      to: exit.to,
      name: dest?.name ?? exit.to,
      travelMinutes: minutes,
      unlocked: reallyUnlocked,
      label: exit.label,
    }
  })
}

export function unlockLocation(world: WorldState, locationId: string): boolean {
  if (world.unlockedLocations.includes(locationId)) return false
  world.unlockedLocations.push(locationId)
  return true
}

export function computeTravelMinutes(
  baseMinutes: number,
  agility: number,
  minuteOfDay: number,
): number {
  const phase = timePhaseFromMinute(minuteOfDay)
  return travelTimeMinutes(baseMinutes, agility, phase === 'night')
}
