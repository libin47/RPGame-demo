import type { GameAction, ActionResult, NarrativeEvent } from '@/types/actions'
import type { ContentRegistry } from '@/types/content'
import type {
  BaseState,
  CombatState,
  FlagsState,
  InventoryState,
  PlayerState,
  UiState,
  WorldState,
} from '@/types/state'
import { evalWhen, resolveSanText } from '../conditions'
import { applyEffects, finishCombatLoot, type EffectContext } from '../effects'
import { applySurvivalForMinutes, equipmentWarmth, rest } from '../survival'
import { advanceMinutes } from '../time'
import { availableExits, computeTravelMinutes, unlockLocation } from '../map'
import { canCraft, consumeMaterials, addItem, grantSkillXp } from '../crafting'
import { defaultPlayerSkills, playerAttack, tryFlee } from '../combat'
import { moveDungeon, exitDungeon, getCell } from '../dungeon'
import { maybeUncontrolledAction } from '../san'
import { checkEndings } from '../endings'
import { writeSave } from '../save/serialize'

export interface GameContext {
  player: PlayerState
  world: WorldState
  inventory: InventoryState
  base: BaseState
  flags: FlagsState
  combat: CombatState
  ui: UiState
  content: ContentRegistry
}

function effectCtx(ctx: GameContext): EffectContext {
  const warmth = equipmentWarmth(ctx.player.equipment, ctx.player.accessories, (id) => {
    return ctx.content.items[id]?.warmth ?? 0
  })
  let weaponDamage = 3
  const hand = ctx.player.equipment.hands
  if (hand) weaponDamage = ctx.content.items[hand]?.damage ?? weaponDamage
  return { ...ctx, warmthBonus: warmth, weaponDamage }
}

function pushEvents(ui: UiState, events: NarrativeEvent[]): void {
  for (const e of events) {
    if (e.kind === 'text') ui.narrativeLines.push(e.text)
    if (e.kind === 'toast') ui.toasts.push(e.text)
    if (e.kind === 'unlock') ui.unlockNotices.push(e.name)
  }
}

function condCtx(ctx: GameContext) {
  return {
    player: ctx.player,
    world: ctx.world,
    inventory: ctx.inventory,
    flags: ctx.flags,
    content: ctx.content,
  }
}

function locationDescription(ctx: GameContext): string {
  const loc = ctx.content.locations[ctx.world.locationId]
  if (!loc) return '未知之地。'
  return resolveSanText(loc.description, ctx.player.survival.san)
}

function updateNarrative(ctx: GameContext, resultLines: string[], tickTexts: string[]): void {
  const lines: string[] = [...resultLines]
  if (tickTexts.length > 0) {
    lines.push(...tickTexts)
  }
  lines.push(locationDescription(ctx))
  ctx.ui.narrativeLines = lines
}

export function executeAction(ctx: GameContext, action: GameAction): ActionResult {
  const events: NarrativeEvent[] = []
  const ectx = effectCtx(ctx)

  const uncontrolled = maybeUncontrolledAction(ctx.player)
  if (uncontrolled && action.type !== 'confirmCombatResult' && action.type !== 'advanceCutscene') {
    ctx.ui.narrativeLines.push(uncontrolled)
  }

  switch (action.type) {
    case 'advanceCutscene': {
      const dialogue = ctx.ui.dialogueId ? ctx.content.dialogues[ctx.ui.dialogueId] : undefined
      if (!dialogue || !ctx.ui.dialogueNodeId) {
        ctx.ui.mode = 'normal'
        return { ok: true, events }
      }
      const node = dialogue.nodes.find((n) => n.id === ctx.ui.dialogueNodeId)
      if (!node) {
        ctx.ui.mode = 'normal'
        return { ok: true, events }
      }
      if (node.choices?.length) {
        return { ok: true, events }
      }
      if (node.effects) {
        const ev = applyEffects(node.effects, ectx)
        events.push(...ev)
        pushEvents(ctx.ui, ev)
      }
      if (node.next) {
        ctx.ui.dialogueNodeId = node.next
        const nextNode = dialogue.nodes.find((n) => n.id === node.next)
        if (nextNode) {
          if (ctx.ui.cutsceneAppend) {
            ctx.ui.narrativeLines.push(nextNode.text)
          } else {
            ctx.ui.narrativeLines = [nextNode.text]
          }
        }
      } else {
        ctx.ui.dialogueId = null
        ctx.ui.dialogueNodeId = null
        ctx.ui.mode = 'normal'
        ctx.ui.narrativeLines = [locationDescription(ctx)]
        events.push({ kind: 'mode', mode: 'normal' })
      }
      return { ok: true, events }
    }

    case 'chooseDialogue': {
      const dialogue = ctx.ui.dialogueId ? ctx.content.dialogues[ctx.ui.dialogueId] : undefined
      if (!dialogue || !ctx.ui.dialogueNodeId) return { ok: false, reason: '无对话', events }
      const node = dialogue.nodes.find((n) => n.id === ctx.ui.dialogueNodeId)
      const choice = node?.choices?.[action.choiceIndex]
      if (!choice) return { ok: false, reason: '无效选项', events }
      if (!evalWhen(choice.when, condCtx(ctx))) {
        return { ok: false, reason: '无法选择', events }
      }
      const ev = applyEffects(choice.effects, ectx)
      events.push(...ev)
      pushEvents(ctx.ui, ev)
      if (choice.end || !choice.next) {
        ctx.ui.dialogueId = null
        ctx.ui.dialogueNodeId = null
        ctx.ui.mode = ctx.world.inDungeon ? 'dungeon' : 'normal'
        ctx.ui.narrativeLines = [locationDescription(ctx)]
      } else {
        ctx.ui.dialogueNodeId = choice.next
        const nextNode = dialogue.nodes.find((n) => n.id === choice.next)
        if (nextNode) ctx.ui.narrativeLines = [nextNode.text]
        if (dialogue.cutscene) ctx.ui.mode = 'cutscene'
        else ctx.ui.mode = 'dialogue'
      }
      return { ok: true, events }
    }

    case 'examine': {
      const loc = ctx.content.locations[ctx.world.locationId]
      const target = loc?.interactables?.find((i) => i.id === action.targetId)
      if (!target) return { ok: false, reason: '没什么特别的。', events }
      if (!evalWhen(target.when, condCtx(ctx))) {
        return { ok: false, reason: '现在无法查看。', events }
      }
      if (target.onceFlag && ctx.flags.flags[target.onceFlag]) {
        updateNarrative(ctx, ['你已经仔细查看过了。'], [])
        return { ok: true, events }
      }
      const text = target.text
        ? resolveSanText(target.text, ctx.player.survival.san)
        : target.textKey
          ? resolveSanText(
              ctx.content.texts[target.textKey]?.text ?? { default: '……' },
              ctx.player.survival.san,
            )
          : '……'
      advanceMinutes(ctx.world, 5)
      const tick = applySurvivalForMinutes(ctx.player, ctx.world, 5, ectx.warmthBonus)
      updateNarrative(ctx, [text], tick.texts)
      const ev = applyEffects(target.effects, ectx)
      events.push(...ev)
      pushEvents(ctx.ui, ev)
      if (target.onceFlag) ctx.flags.flags[target.onceFlag] = true
      if (tick.dead) events.push({ kind: 'ending', endingId: 'death' })
      return { ok: true, events }
    }

    case 'locationAction': {
      const loc = ctx.content.locations[ctx.world.locationId]
      const act = loc?.actions.find((a) => a.id === action.actionId)
      if (!act) return { ok: false, reason: '无法执行', events }
      if (!evalWhen(act.when, condCtx(ctx))) {
        return { ok: false, reason: '条件不足', events }
      }
      if (act.timeCost) {
        advanceMinutes(ctx.world, act.timeCost)
        const tick = applySurvivalForMinutes(ctx.player, ctx.world, act.timeCost, ectx.warmthBonus)
        for (const t of tick.texts) {
          events.push({ kind: 'text', text: t })
          ctx.ui.narrativeLines.push(t)
        }
        if (tick.dead) events.push({ kind: 'ending', endingId: 'death' })
      }
      const builtEffects = [...(act.effects ?? [])]
      if (act.type === 'enterDungeon' && act.dungeonId) {
        builtEffects.push({ type: 'enterDungeon', dungeonId: act.dungeonId })
      }
      if (act.type === 'startCombat' && act.enemyId) {
        builtEffects.push({ type: 'startCombat', enemyId: act.enemyId })
      }
      if (act.type === 'startDialogue' && act.dialogueId) {
        builtEffects.push({ type: 'startDialogue', dialogueId: act.dialogueId })
      }
      if (act.type === 'explore') {
        return executeAction(ctx, { type: 'explore' })
      }
      if (act.type === 'openCraft') {
        ctx.ui.mode = 'craft'
        return { ok: true, events }
      }
      if (act.type === 'openMap') {
        return executeAction(ctx, { type: 'openMap' })
      }
      if (act.type === 'camp') {
        return executeAction(ctx, { type: 'camp' })
      }
      if (act.type === 'sleep') {
        return executeAction(ctx, { type: 'sleep' })
      }
      if (act.type === 'custom') {
        if (act.customType === 'search_food') {
          ctx.flags.flags['food_searched'] = true
          ctx.player.survival.stamina = Math.max(0, ctx.player.survival.stamina - 10)
          const rand = Math.random()
          if (rand < 0.5) {
            addItem(ctx.inventory, 'latiao', 1, ctx.content)
            ctx.ui.narrativeLines.push('你找到了一包辣条！')
          } else if (rand < 0.7) {
            addItem(ctx.inventory, 'instant_noodles', 1, ctx.content)
            ctx.ui.narrativeLines.push('你找到了一包方便面！')
          } else {
            ctx.ui.narrativeLines.push('你什么都没找到。')
          }
          return { ok: true, events }
        }
        if (act.customType === 'search_weapon') {
          ctx.flags.flags['weapon_searched'] = true
          const rand = Math.random()
          if (rand < 0.5) {
            addItem(ctx.inventory, 'spear', 1, ctx.content)
            ctx.ui.narrativeLines.push('你找到了一根长矛！')
          } else {
            addItem(ctx.inventory, 'baseball_bat', 1, ctx.content)
            ctx.ui.narrativeLines.push('你找到了一根棒球棒！')
          }
          return { ok: true, events }
        }
        if (act.customType === 'search_survivor') {
          ctx.flags.flags['survivor_searched'] = true
          const rand = Math.random()
          if (rand < 0.5) {
            ctx.player.survival.san -= 1
            ctx.ui.narrativeLines.push('你被一颗人头吓了一跳，SAN-1。')
          } else {
            ctx.player.survival.hp = Math.max(1, ctx.player.survival.hp - 1)
            ctx.ui.narrativeLines.push('你摔了个跟头，HP-1。')
          }
          return { ok: true, events }
        }
        if (act.customType === 'search_watch') {
          ctx.flags.flags['watch_found'] = true
          addItem(ctx.inventory, 'watch', 1, ctx.content)
          ctx.ui.narrativeLines.push('你找到了一块手表！')
          return { ok: true, events }
        }
        if (act.customType === 'search_san_monitor') {
          ctx.flags.flags['san_monitor_found'] = true
          addItem(ctx.inventory, 'san_monitor', 1, ctx.content)
          ctx.ui.narrativeLines.push('你找到了一台SAN显示仪！')
          return { ok: true, events }
        }
        if (act.customType === 'search_clothes') {
          ctx.flags.flags['clothes_found'] = true
          addItem(ctx.inventory, 'protective_suit', 1, ctx.content)
          ctx.ui.narrativeLines.push('你找到了一套防护服！')
          return { ok: true, events }
        }
        if (act.customType === 'search_backpack') {
          ctx.flags.flags['backpack_found'] = true
          addItem(ctx.inventory, 'backpack', 1, ctx.content)
          ctx.ui.narrativeLines.push('你找到了一个背包！')
          return { ok: true, events }
        }
        if (act.customType === 'search_map') {
          ctx.flags.flags['map_found'] = true
          addItem(ctx.inventory, 'tattered_map', 1, ctx.content)
          ctx.ui.narrativeLines.push('你找到了一张残破地图！')
          ctx.flags.flags['jungle_unlocked'] = true
          unlockLocation(ctx.world, 'jungle_edge')
          events.push({ kind: 'unlock', locationId: 'jungle_edge', name: '丛林边缘' })
          ctx.ui.unlockNotices.push('丛林边缘')
          return { ok: true, events }
        }
      }
      const ev = applyEffects(builtEffects, ectx)
      events.push(...ev)
      pushEvents(ctx.ui, ev)
      return { ok: true, events }
    }

    case 'openMap': {
      if (ctx.world.inDungeon) return { ok: false, reason: '地牢中无法打开大地图。', events }
      ctx.ui.previousMode = ctx.ui.mode
      ctx.ui.mode = 'map'
      return { ok: true, events }
    }

    case 'closeMap': {
      ctx.ui.mode = 'normal'
      return { ok: true, events }
    }

    case 'travel': {
      if (ctx.world.inDungeon) return { ok: false, reason: '请先离开地牢。', events }
      const exits = availableExits(ctx.content, ctx.world, ctx.flags)
      const exit = exits.find((e) => e.to === action.locationId)
      if (!exit?.unlocked) return { ok: false, reason: '尚未知晓该地点。', events }
      const loc = ctx.content.locations[ctx.world.locationId]
      const def = loc?.exits.find((e) => e.to === action.locationId)
      const minutes = computeTravelMinutes(
        def?.travelMinutes ?? 30,
        ctx.player.attrs.agility,
        ctx.world.minuteOfDay,
      )
      advanceMinutes(ctx.world, minutes)
      const tick = applySurvivalForMinutes(ctx.player, ctx.world, minutes, ectx.warmthBonus)
      ctx.world.locationId = action.locationId
      unlockLocation(ctx.world, action.locationId)
      ctx.ui.mode = 'normal'
      ctx.ui.narrativeLines = [
        `你花了约 ${minutes} 分钟抵达${exit.name}。`,
        locationDescription(ctx),
        ...tick.texts,
      ]
      if (tick.dead) events.push({ kind: 'ending', endingId: 'death' })
      grantSkillXp(ctx.player, 'run', 1)
      return { ok: true, events }
    }

    case 'explore': {
      const minutes = 30
      advanceMinutes(ctx.world, minutes)
      const tick = applySurvivalForMinutes(ctx.player, ctx.world, minutes, ectx.warmthBonus)
      grantSkillXp(ctx.player, 'scout', 1)
      const lines = []
      const loc = ctx.content.locations[ctx.world.locationId]

      if (ctx.world.locationId === 'beach') {
        const rand = Math.random()
        if (!ctx.flags.flags['wreck_found'] && rand < 0.2) {
          ctx.flags.flags['wreck_found'] = true
          unlockLocation(ctx.world, 'wreck')
          lines.push('你发现了飞机残骸，点击进入查看。')
          events.push({ kind: 'unlock', locationId: 'wreck', name: '飞机残骸' })
          ctx.ui.unlockNotices.push('飞机残骸')
        } else if (!ctx.flags.flags['crab_found'] && rand < 0.4) {
          ctx.flags.flags['crab_found'] = true
          lines.push('散步时，你发现了一只螃蟹。')
        } else if (!ctx.flags.flags['sea_folk_found'] && rand < 0.55) {
          ctx.flags.flags['sea_folk_found'] = true
          ctx.player.survival.san -= 3
          lines.push('散步时，你发现了一个海民。')
        } else if (!ctx.flags.flags['cave_found'] && rand < 0.7) {
          ctx.flags.flags['cave_found'] = true
          lines.push('散步时，你发现了一个洞穴入口。')
        } else if (rand < 0.85) {
          lines.push('你在沙滩上散步，没有发现什么特别的东西。')
        } else {
          ctx.player.survival.hp = Math.max(1, ctx.player.survival.hp - 1)
          lines.push('你摔了个跟头，HP-1。')
        }
      } else if (ctx.world.locationId === 'wreck') {
        if (!ctx.flags.flags['found_scrap']) {
          ctx.flags.flags['found_scrap'] = true
          addItem(ctx.inventory, 'scrap_metal', 2, ctx.content)
          lines.push('你在座椅下翻出了一些金属碎片。')
        } else {
          lines.push('你在飞机残骸周围探索了一番，没有新发现。')
        }
      } else if (ctx.world.locationId === 'jungle_edge') {
        if (!ctx.flags.flags['met_mutant']) {
          lines.push('灌木丛后有什么东西在动……')
          const ev = applyEffects([{ type: 'startCombat', enemyId: 'mutant_dog' }], ectx)
          events.push(...ev)
          pushEvents(ctx.ui, ev)
          ctx.flags.flags['met_mutant'] = true
          return { ok: true, events }
        } else {
          lines.push('你在丛林边缘探索了一番，没有新发现。')
        }
      } else {
        lines.push('你在附近探索了一番，没有新发现。')
      }

      updateNarrative(ctx, lines, tick.texts)
      for (const t of tick.texts) events.push({ kind: 'text', text: t })
      if (tick.dead) events.push({ kind: 'ending', endingId: 'death' })
      return { ok: true, events }
    }

    case 'openMenu': {
      ctx.ui.menu = action.menu
      return { ok: true, events }
    }

    case 'closeMenu': {
      ctx.ui.menu = null
      return { ok: true, events }
    }

    case 'openCraft': {
      ctx.ui.mode = 'craft'
      return { ok: true, events }
    }

    case 'closeCraft': {
      ctx.ui.mode = ctx.world.inDungeon ? 'dungeon' : 'normal'
      return { ok: true, events }
    }

    case 'craft': {
      const recipe = ctx.content.recipes[action.recipeId]
      if (!recipe) return { ok: false, reason: '未知配方', events }
      const hasWb = (id: string) =>
        ctx.base.bases.some(
          (b) =>
            (b.locationId === ctx.world.locationId || b.temporary) &&
            b.buildings.some((x) => x.buildingType === id),
        )
      const check = canCraft(recipe, condCtx(ctx), hasWb)
      if (!check.ok) return { ok: false, reason: check.reason, events }
      consumeMaterials(ctx.inventory, recipe)
      advanceMinutes(ctx.world, recipe.timeCost)
      applySurvivalForMinutes(ctx.player, ctx.world, recipe.timeCost, ectx.warmthBonus)
      addItem(ctx.inventory, recipe.resultItemId, recipe.resultCount ?? 1, ctx.content)
      grantSkillXp(ctx.player, 'craft', 2)
      const name = ctx.content.items[recipe.resultItemId]?.name ?? recipe.resultItemId
      ctx.ui.narrativeLines.push(`你制作了 ${name}。`)
      return { ok: true, events }
    }

    case 'combatSkill': {
      if (!ctx.combat.active) return { ok: false, reason: '不在战斗中', events }
      const skills = defaultPlayerSkills()
      const skill = skills.find((s) => s.id === action.skillId)
      if (!skill) return { ok: false, reason: '未知技能', events }
      const result = playerAttack(ctx.combat, ctx.player, skill, ectx.weaponDamage)
      ctx.combat.log.push(...result.texts)
      ctx.ui.narrativeLines = [...ctx.combat.log].slice(-8)
      if (result.finished) {
        if (ctx.player.survival.hp <= 0) {
          events.push({ kind: 'ending', endingId: 'death' })
        } else if (!result.texts.some((t) => t.includes('逃离'))) {
          finishCombatLoot(ectx)
          grantSkillXp(ctx.player, skill.skill, 3)
          for (const enemyId of ctx.combat.deadEnemies) {
            ctx.flags.flags[`killed_${enemyId}`] = true
          }
        }
        ctx.ui.mode = 'combat_result'
        events.push({ kind: 'mode', mode: 'combat_result' })
        const ending = checkEndings(ctx.content, condCtx(ctx))
        if (ending) events.push({ kind: 'ending', endingId: ending.id })
      }
      return { ok: true, events }
    }

    case 'combatFlee': {
      if (!ctx.combat.active) return { ok: false, reason: '不在战斗中', events }
      const result = tryFlee(ctx.combat, ctx.player)
      ctx.combat.log.push(...result.texts)
      ctx.ui.narrativeLines = [...ctx.combat.log].slice(-8)
      if (result.finished) {
        if (ctx.player.survival.hp <= 0) {
          events.push({ kind: 'ending', endingId: 'death' })
        }
        ctx.ui.mode = 'combat_result'
        events.push({ kind: 'mode', mode: 'combat_result' })
      }
      return { ok: true, events }
    }

    case 'confirmCombatResult': {
      ctx.combat.active = false
      ctx.ui.mode = ctx.world.inDungeon ? 'dungeon' : 'normal'
      ctx.ui.narrativeLines = [locationDescription(ctx)]
      if (ctx.combat.resultText) {
        ctx.ui.narrativeLines.unshift(ctx.combat.resultText)
      }
      if (ctx.combat.loot.length) {
        const names = ctx.combat.loot
          .map((l) => `${ctx.content.items[l.itemId]?.name ?? l.itemId} x${l.count}`)
          .join('、')
        ctx.ui.narrativeLines.push(`战利品：${names}`)
      }
      ctx.combat.loot = []
      ctx.combat.log = []
      ctx.combat.deadEnemies = []
      return { ok: true, events }
    }

    case 'dungeonMove': {
      const result = moveDungeon(ctx.content, ctx.world, action.dir)
      if (!result.ok) return { ok: false, reason: result.reason, events }
      advanceMinutes(ctx.world, 5)
      applySurvivalForMinutes(ctx.player, ctx.world, 5, ectx.warmthBonus)
      if (result.cell) {
        ctx.ui.narrativeLines = [result.cell.description]
        if (result.cell.onceFlag && !ctx.flags.flags[result.cell.onceFlag] && result.cell.events) {
          ctx.flags.flags[result.cell.onceFlag] = true
          const ev = applyEffects(result.cell.events, ectx)
          events.push(...ev)
          pushEvents(ctx.ui, ev)
        }
      }
      return { ok: true, events }
    }

    case 'dungeonExplore': {
      advanceMinutes(ctx.world, 10)
      const tick = applySurvivalForMinutes(ctx.player, ctx.world, 10, ectx.warmthBonus)
      const cell = ctx.world.dungeonId
        ? getCell(ctx.content, ctx.world.dungeonId, ctx.world.dungeonX, ctx.world.dungeonY)
        : undefined

      const exploreLines: string[] = []

      if (ctx.world.dungeonId === 'beach_cave') {
        if (ctx.world.dungeonY === 0) {
          const rand = Math.random()
          if (rand < 0.5) {
            addItem(ctx.inventory, 'ration', 1, ctx.content)
            exploreLines.push('你在洞穴中发现了一些食物！')
          } else {
            exploreLines.push('你在洞穴中发现了一个变异生物！')
            const ev = applyEffects([{ type: 'startCombat', enemyId: 'mutant_crab' }], ectx)
            events.push(...ev)
            pushEvents(ctx.ui, ev)
          }
        } else if (ctx.world.dungeonY === -1) {
          addItem(ctx.inventory, 'ration', 1, ctx.content)
          exploreLines.push('你在洞穴中发现了一些食物！')
        } else if (ctx.world.dungeonY === -2) {
          exploreLines.push('一群变异猴子向你袭来！')
          const ev = applyEffects([{ type: 'startCombat', enemyId: 'monkey' }], ectx)
          events.push(...ev)
          pushEvents(ctx.ui, ev)
        }
      } else {
        exploreLines.push('你在洞穴中探索了一番，没有新发现。')
      }

      ctx.ui.narrativeLines = [...exploreLines]
      updateNarrative(ctx, ctx.ui.narrativeLines, tick.texts)
      for (const t of tick.texts) events.push({ kind: 'text', text: t })
      if (tick.dead) events.push({ kind: 'ending', endingId: 'death' })
      return { ok: true, events }
    }

    case 'exitDungeon': {
      const cell = ctx.world.dungeonId
        ? getCell(ctx.content, ctx.world.dungeonId, ctx.world.dungeonX, ctx.world.dungeonY)
        : undefined
      // Allow exit from start cell or any cell with no restriction for demo
      void cell
      exitDungeon(ctx.content, ctx.world)
      ctx.ui.mode = 'normal'
      ctx.ui.narrativeLines = ['你离开了洞窟。', locationDescription(ctx)]
      return { ok: true, events }
    }

    case 'camp': {
      if (ctx.world.inDungeon) return { ok: false, reason: '地牢中无法扎营。', events }
      if (!removeOrNeed(ctx, 'camp_kit', 1)) {
        return { ok: false, reason: '需要露营工具。', events }
      }
      const id = `camp_${ctx.world.locationId}_${Date.now()}`
      ctx.base.bases.push({
        id,
        locationId: ctx.world.locationId,
        temporary: true,
        daysLeft: 3,
        buildings: [{ id: `${id}_bed`, buildingType: 'bedroll', hp: 10 }],
        storage: [],
        buried: false,
      })
      advanceMinutes(ctx.world, 20)
      const tick = applySurvivalForMinutes(ctx.player, ctx.world, 20, ectx.warmthBonus)
      updateNarrative(ctx, ['你就地扎起了临时营地。数天后营地会消失。'], tick.texts)
      if (tick.dead) events.push({ kind: 'ending', endingId: 'death' })
      return { ok: true, events }
    }

    case 'buryCamp': {
      const camp = ctx.base.bases.find(
        (b) => b.temporary && b.locationId === ctx.world.locationId && !b.buried,
      )
      if (!camp) return { ok: false, reason: '此处没有可埋藏的临时营地。', events }
      advanceMinutes(ctx.world, 40)
      const tick = applySurvivalForMinutes(ctx.player, ctx.world, 40, ectx.warmthBonus)
      camp.buried = true
      camp.daysLeft = (camp.daysLeft ?? 3) + 4
      updateNarrative(ctx, ['你花时间设置了埋藏点，营地更不容易被发现。'], tick.texts)
      if (tick.dead) events.push({ kind: 'ending', endingId: 'death' })
      return { ok: true, events }
    }

    case 'sleep': {
      const hasBed =
        ctx.base.bases.some(
          (b) =>
            b.locationId === ctx.world.locationId &&
            b.buildings.some((x) => x.buildingType === 'bed' || x.buildingType === 'bedroll'),
        ) || ctx.flags.flags['can_sleep_here']
      if (!hasBed && !ctx.world.inDungeon) {
        // Allow rough sleep with heavy penalties
        const r = rest(ctx.player, ctx.world, 6, ectx.warmthBonus - 10)
        ctx.player.survival.san = Math.max(0, ctx.player.survival.san - 5)
        updateNarrative(ctx, [...r.texts, '没有床铺，睡眠质量很差。'], [])
        tickCamps(ctx)
        if (r.dead) events.push({ kind: 'ending', endingId: 'death' })
        return { ok: true, events }
      }
      if (ctx.world.inDungeon) {
        return { ok: false, reason: '地牢中不宜久眠。', events }
      }
      const r = rest(ctx.player, ctx.world, 8, ectx.warmthBonus)
      updateNarrative(ctx, r.texts, [])
      tickCamps(ctx)
      if (r.dead) events.push({ kind: 'ending', endingId: 'death' })
      return { ok: true, events }
    }

    case 'useItem': {
      const def = ctx.content.items[action.itemId]
      if (!def?.usable) return { ok: false, reason: '无法使用', events }
      if (!ctx.inventory.slots.some((s) => s.itemId === action.itemId)) {
        return { ok: false, reason: '没有该物品', events }
      }
      removeItemSafe(ctx, action.itemId, 1)
      const ev = applyEffects(def.useEffects, ectx)
      events.push(...ev)
      pushEvents(ctx.ui, ev)
      updateNarrative(ctx, [`你使用了${def.name}。`], [])
      return { ok: true, events }
    }

    case 'equipItem': {
      const def = ctx.content.items[action.itemId]
      if (!def?.equipSlot) return { ok: false, reason: '无法装备', events }
      if (def.equipSlot === 'accessory') {
        const idx = ctx.player.accessories.findIndex((a) => !a)
        if (idx < 0) return { ok: false, reason: '饰品栏已满', events }
        removeItemSafe(ctx, action.itemId, 1)
        ctx.player.accessories[idx] = action.itemId
      } else {
        const prev = ctx.player.equipment[def.equipSlot]
        if (prev) addItem(ctx.inventory, prev, 1, ctx.content)
        removeItemSafe(ctx, action.itemId, 1)
        ctx.player.equipment[def.equipSlot] = action.itemId
      }
      updateNarrative(ctx, [`装备了${def.name}。`], [])
      return { ok: true, events }
    }

    case 'unequip': {
      const slot = action.slot as keyof typeof ctx.player.equipment
      if (slot === ('accessory' as string)) return { ok: false, reason: '请指定饰品', events }
      const itemId = ctx.player.equipment[slot]
      if (!itemId) return { ok: false, reason: '该槽位为空', events }
      addItem(ctx.inventory, itemId, 1, ctx.content)
      ctx.player.equipment[slot] = null
      return { ok: true, events }
    }

    case 'dismissToast': {
      ctx.ui.toasts.shift()
      return { ok: true, events }
    }

    case 'dismissUnlock': {
      ctx.ui.unlockNotices.shift()
      return { ok: true, events }
    }

    case 'save': {
      if (ctx.world.inDungeon) {
        return { ok: false, reason: '地牢中无法保存。', events }
      }
      const serialize = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))
      writeSave(action.slot, {
        player: serialize(ctx.player),
        world: serialize(ctx.world),
        inventory: serialize(ctx.inventory),
        base: serialize(ctx.base),
        flags: serialize(ctx.flags),
        combat: serialize({
          ...ctx.combat,
          active: false,
          player: null,
          enemy: null,
          log: [],
          loot: [],
        }),
      })
      events.push({ kind: 'toast', text: `已保存至槽位 ${action.slot}` })
      ctx.ui.toasts.push(`已保存至槽位 ${action.slot}`)
      return { ok: true, events }
    }

    case 'returnTitle': {
      return { ok: true, events }
    }

    default:
      return { ok: false, reason: '未知动作', events }
  }
}

function removeOrNeed(ctx: GameContext, itemId: string, count: number): boolean {
  const slot = ctx.inventory.slots.find((s) => s.itemId === itemId)
  if (!slot || slot.count < count) return false
  slot.count -= count
  if (slot.count <= 0) ctx.inventory.slots = ctx.inventory.slots.filter((s) => s !== slot)
  return true
}

function removeItemSafe(ctx: GameContext, itemId: string, count: number): void {
  removeOrNeed(ctx, itemId, count)
}

function tickCamps(ctx: GameContext): void {
  for (const b of ctx.base.bases) {
    if (b.temporary && b.daysLeft != null) {
      b.daysLeft -= 1
    }
  }
  ctx.base.bases = ctx.base.bases.filter((b) => !b.temporary || (b.daysLeft ?? 0) > 0)
}

export function getCurrentDialogueChoices(ctx: GameContext) {
  const dialogue = ctx.ui.dialogueId ? ctx.content.dialogues[ctx.ui.dialogueId] : undefined
  if (!dialogue || !ctx.ui.dialogueNodeId) return []
  const node = dialogue.nodes.find((n) => n.id === ctx.ui.dialogueNodeId)
  if (!node?.choices) return []
  return node.choices
    .map((c, index) => ({ ...c, index }))
    .filter((c) => evalWhen(c.when, condCtx(ctx)))
}

export function getVisibleLocationActions(ctx: GameContext) {
  const loc = ctx.content.locations[ctx.world.locationId]
  if (!loc) return []
  return loc.actions.filter((a) => evalWhen(a.when, condCtx(ctx)))
}
