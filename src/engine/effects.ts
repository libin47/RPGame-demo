import type { ContentRegistry, Effect } from '@/types/content'
import type {
  BaseState,
  CombatState,
  FlagsState,
  InventoryState,
  PlayerState,
  UiState,
  WorldState,
} from '@/types/state'
import type { NarrativeEvent } from '@/types/actions'
import { applySan } from './san'
import { advanceMinutes } from './time'
import { applySurvivalForMinutes, rest } from './survival'
import { addItem, grantSkillXp, removeItem } from './crafting'
import { unlockLocation } from './map'
import { enterDungeon, exitDungeon } from './dungeon'
import { rollLoot, startCombat } from './combat'
import { checkEndings } from './endings'

export interface EffectContext {
  player: PlayerState
  world: WorldState
  inventory: InventoryState
  base: BaseState
  flags: FlagsState
  combat: CombatState
  ui: UiState
  content: ContentRegistry
  warmthBonus: number
  weaponDamage: number
}

export function applyEffects(effects: Effect[] | undefined, ctx: EffectContext): NarrativeEvent[] {
  if (!effects?.length) return []
  const events: NarrativeEvent[] = []

  for (const effect of effects) {
    switch (effect.type) {
      case 'setFlag': {
        ctx.flags.flags[effect.flag] = effect.value ?? true
        break
      }
      case 'addItem': {
        const ok = addItem(ctx.inventory, effect.itemId, effect.count ?? 1, ctx.content)
        const name = ctx.content.items[effect.itemId]?.name ?? effect.itemId
        events.push({
          kind: 'text',
          text: ok ? `获得了 ${name} x${effect.count ?? 1}。` : `背包已满，无法获得 ${name}。`,
        })
        break
      }
      case 'removeItem': {
        removeItem(ctx.inventory, effect.itemId, effect.count ?? 1)
        break
      }
      case 'modAttr': {
        if (effect.attr in ctx.player.survival) {
          const key = effect.attr as keyof typeof ctx.player.survival
          const max = ctx.player.survivalMax[key]
          ctx.player.survival[key] = Math.max(
            0,
            Math.min(max, ctx.player.survival[key] + effect.delta),
          )
        } else {
          const key = effect.attr as keyof typeof ctx.player.attrs
          ctx.player.attrs[key] = Math.max(1, ctx.player.attrs[key] + effect.delta)
        }
        break
      }
      case 'modSan': {
        const texts = applySan(ctx.player, effect.delta)
        for (const t of texts) events.push({ kind: 'text', text: t })
        break
      }
      case 'unlockLocation': {
        const newly = unlockLocation(ctx.world, effect.locationId)
        if (newly) {
          const name = ctx.content.locations[effect.locationId]?.name ?? effect.locationId
          events.push({ kind: 'unlock', locationId: effect.locationId, name })
          events.push({ kind: 'toast', text: `新地点解锁：${name}` })
        }
        break
      }
      case 'startCombat': {
        const enemy = ctx.content.enemies[effect.enemyId]
        if (!enemy) break
        Object.assign(ctx.combat, startCombat(ctx.player, [enemy], ctx.weaponDamage))
        if (enemy.sanLossOnSight) {
          applySan(ctx.player, -enemy.sanLossOnSight)
        }
        ctx.ui.mode = 'combat'
        events.push({ kind: 'mode', mode: 'combat' })
        for (const line of ctx.combat.log) events.push({ kind: 'text', text: line })
        break
      }
      case 'startDialogue': {
        const dialogue = ctx.content.dialogues[effect.dialogueId]
        if (!dialogue) break
        ctx.ui.dialogueId = effect.dialogueId
        ctx.ui.dialogueNodeId = effect.nodeId ?? dialogue.start
        ctx.ui.previousMode = ctx.ui.mode
        ctx.ui.mode = dialogue.cutscene ? 'cutscene' : 'dialogue'
        events.push({ kind: 'mode', mode: ctx.ui.mode })
        break
      }
      case 'advanceTime': {
        advanceMinutes(ctx.world, effect.minutes)
        const tick = applySurvivalForMinutes(ctx.player, ctx.world, effect.minutes, ctx.warmthBonus)
        for (const t of tick.texts) events.push({ kind: 'text', text: t })
        if (tick.dead) {
          events.push({ kind: 'ending', endingId: 'death' })
        }
        break
      }
      case 'grantXp': {
        grantSkillXp(ctx.player, effect.skill, effect.amount)
        break
      }
      case 'setLocation': {
        ctx.world.locationId = effect.locationId
        unlockLocation(ctx.world, effect.locationId)
        break
      }
      case 'enterDungeon': {
        const result = enterDungeon(ctx.content, ctx.world, effect.dungeonId, effect.x, effect.y)
        if (result.ok) {
          ctx.ui.mode = 'dungeon'
          if (result.description) events.push({ kind: 'text', text: result.description })
          events.push({ kind: 'mode', mode: 'dungeon' })
        }
        break
      }
      case 'exitDungeon': {
        exitDungeon(ctx.content, ctx.world)
        ctx.ui.mode = 'normal'
        events.push({ kind: 'mode', mode: 'normal' })
        break
      }
      case 'narrative': {
        events.push({ kind: 'text', text: effect.text })
        break
      }
      case 'toast': {
        events.push({ kind: 'toast', text: effect.text })
        break
      }
      case 'checkEnding': {
        const ending = checkEndings(ctx.content, {
          player: ctx.player,
          world: ctx.world,
          inventory: ctx.inventory,
          flags: ctx.flags,
          content: ctx.content,
        })
        if (ending) events.push({ kind: 'ending', endingId: ending.id })
        break
      }
      case 'heal': {
        ctx.player.survival.hp = Math.min(
          ctx.player.survivalMax.hp,
          ctx.player.survival.hp + effect.amount,
        )
        break
      }
      case 'rest': {
        const r = rest(ctx.player, ctx.world, effect.hours, ctx.warmthBonus)
        for (const t of r.texts) events.push({ kind: 'text', text: t })
        if (r.dead) events.push({ kind: 'ending', endingId: 'death' })
        break
      }
      default:
        break
    }
  }

  return events
}

export function finishCombatLoot(ctx: EffectContext): void {
  if (!ctx.combat.deadEnemies.length) return
  ctx.combat.loot = []
  for (const enemyId of ctx.combat.deadEnemies) {
    const enemyDef = ctx.content.enemies[enemyId]
    if (!enemyDef) continue
    const enemyLoot = rollLoot(enemyDef)
    ctx.combat.loot.push(...enemyLoot)
    for (const loot of enemyLoot) {
      addItem(ctx.inventory, loot.itemId, loot.count, ctx.content)
    }
  }
}
