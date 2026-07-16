import type { PlayerState, WorldState } from '@/types/state'
import { timePhaseFromMinute } from '@/types/state'
import { advanceMinutes } from './time'

export interface SurvivalTickResult {
  texts: string[]
  dead: boolean
}

/** Apply survival drain for elapsed minutes. */
export function applySurvivalForMinutes(
  player: PlayerState,
  world: WorldState,
  minutes: number,
  warmthBonus = 0,
): SurvivalTickResult {
  const texts: string[] = []
  const hours = minutes / 60
  const con = player.attrs.constitution

  player.survival.hunger = clamp(
    player.survival.hunger - hours * 4,
    0,
    player.survivalMax.hunger,
  )
  player.survival.thirst = clamp(
    player.survival.thirst - hours * 5,
    0,
    player.survivalMax.thirst,
  )

  const ambient = ambientWarmth(world) + warmthBonus
  const comfortLow = 35
  const comfortHigh = 75
  const target = ambient
  const diff = target - player.survival.warmth
  player.survival.warmth = clamp(player.survival.warmth + diff * 0.15 * hours, 0, 100)

  if (player.survival.hunger <= 0) {
    player.survival.hp -= hours * 3
    texts.push('你饿得眼前发黑，生命在流逝。')
  }
  if (player.survival.thirst <= 0) {
    player.survival.hp -= hours * 4
    texts.push('口渴如焚，身体开始失控。')
  }
  if (player.survival.warmth < comfortLow - 20 || player.survival.warmth > comfortHigh + 20) {
    player.survival.hp -= hours * 2
    texts.push('极端体温正在伤害你。')
  }

  // Slow HP regen when not starving
  if (player.survival.hunger > 20 && player.survival.thirst > 20 && player.survival.hp > 0) {
    const regen = hours * (0.5 + con * 0.05)
    player.survival.hp = clamp(player.survival.hp + regen, 0, player.survivalMax.hp)
  }

  player.survival.hp = clamp(player.survival.hp, 0, player.survivalMax.hp)
  return { texts, dead: player.survival.hp <= 0 }
}

export function rest(
  player: PlayerState,
  world: WorldState,
  hours: number,
  warmthBonus = 0,
): SurvivalTickResult {
  const minutes = hours * 60
  advanceMinutes(world, minutes)
  const phase = timePhaseFromMinute(world.minuteOfDay)
  const nightBonus = phase === 'night' ? 1.5 : 1
  const con = player.attrs.constitution
  const texts: string[] = []

  player.survival.hp = clamp(
    player.survival.hp + hours * (2 + con * 0.3) * nightBonus,
    0,
    player.survivalMax.hp,
  )
  player.survival.san = clamp(
    player.survival.san + hours * 1.5 * nightBonus,
    0,
    player.survivalMax.san,
  )
  player.survival.hunger = clamp(player.survival.hunger - hours * 2, 0, player.survivalMax.hunger)
  player.survival.thirst = clamp(player.survival.thirst - hours * 2.5, 0, player.survivalMax.thirst)

  const ambient = ambientWarmth(world) + warmthBonus
  player.survival.warmth = clamp(
    player.survival.warmth + (ambient - player.survival.warmth) * 0.4,
    0,
    100,
  )

  texts.push(`你休息了约 ${hours} 小时。`)
  return { texts, dead: player.survival.hp <= 0 }
}

function ambientWarmth(world: WorldState): number {
  const seasonBase: Record<string, number> = {
    spring: 55,
    summer: 72,
    autumn: 50,
    winter: 30,
  }
  let w = seasonBase[world.season] ?? 55
  if (world.weather === 'rain') w -= 8
  if (world.weather === 'storm') w -= 15
  if (world.weather === 'fog') w -= 5
  const phase = timePhaseFromMinute(world.minuteOfDay)
  if (phase === 'night') w -= 12
  if (phase === 'dawn' || phase === 'dusk') w -= 4
  return w
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function equipmentWarmth(
  equipment: PlayerState['equipment'],
  accessories: PlayerState['accessories'],
  itemWarmth: (id: string) => number,
): number {
  let total = 0
  for (const id of Object.values(equipment)) {
    if (id) total += itemWarmth(id)
  }
  for (const id of accessories) {
    if (id) total += itemWarmth(id)
  }
  return total
}
