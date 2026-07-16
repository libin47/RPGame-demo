import type { Season, Weather } from '@/types/content'
import type { WorldState } from '@/types/state'

const MINUTES_PER_DAY = 24 * 60
const DAYS_PER_SEASON = 30
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

export function advanceMinutes(world: WorldState, minutes: number): {
  daysPassed: number
  crossedDawn: boolean
} {
  let daysPassed = 0
  let crossedDawn = false
  const prevDay = world.day
  const prevMinute = world.minuteOfDay

  world.minuteOfDay += minutes
  while (world.minuteOfDay >= MINUTES_PER_DAY) {
    world.minuteOfDay -= MINUTES_PER_DAY
    world.day += 1
    daysPassed += 1
    tickSeason(world)
    maybeChangeWeather(world)
  }

  // Dawn crossed if we moved past 6:00 within the day or into a new day morning
  if (daysPassed > 0 || (prevMinute < 6 * 60 && world.minuteOfDay >= 6 * 60)) {
    crossedDawn = true
  }
  if (world.day !== prevDay) crossedDawn = true

  return { daysPassed, crossedDawn }
}

function tickSeason(world: WorldState): void {
  const seasonIndex = SEASONS.indexOf(world.season)
  const dayInSeason = ((world.day - 1) % DAYS_PER_SEASON) + 1
  if (dayInSeason === 1 && world.day > 1) {
    const next = (seasonIndex + 1) % SEASONS.length
    world.season = SEASONS[next]!
  }
}

function maybeChangeWeather(world: WorldState): void {
  const roll = Math.random()
  const table: Weather[] =
    world.season === 'summer'
      ? ['clear', 'clear', 'rain', 'storm']
      : world.season === 'winter'
        ? ['fog', 'clear', 'rain', 'storm']
        : ['clear', 'clear', 'rain', 'fog']
  world.weather = table[Math.floor(roll * table.length)] ?? 'clear'
}

export function travelTimeMinutes(baseMinutes: number, agility: number, isNight: boolean): number {
  const agiFactor = Math.max(0.6, 1 - (agility - 10) * 0.02)
  const nightFactor = isNight ? 1.35 : 1
  return Math.max(5, Math.round(baseMinutes * agiFactor * nightFactor))
}
