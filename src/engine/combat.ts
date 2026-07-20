import type { CombatSkillDef, EnemyDef } from '@/types/content'
import type { CombatState, CombatantState, InventorySlot, PlayerState } from '@/types/state'

export function startCombat(
  player: PlayerState,
  enemies: EnemyDef[],
  playerWeaponDamage: number,
): CombatState {
  const playerCombat: CombatantState = {
    id: 'player',
    name: player.name,
    hp: player.survival.hp,
    maxHp: player.survivalMax.hp,
    armor: 0,
    cooldowns: {},
    isPlayer: true,
  }
  const enemyCombat: CombatantState[] = enemies.map((e) => ({
    id: e.id,
    name: e.name,
    hp: e.hp,
    maxHp: e.hp,
    armor: e.armor ?? 0,
    cooldowns: {},
    isPlayer: false,
  }))

  const log = [`遭遇了 ${enemies.map((e) => e.name).join(' 和 ')}！`]
  for (const e of enemies) {
    if (e.sanLossOnSight) {
      log.push(e.description)
    }
  }

  return {
    active: true,
    enemyId: enemies[0]?.id ?? null,
    player: playerCombat,
    enemies: enemyCombat,
    deadEnemies: [],
    turn: 1,
    log,
    loot: [],
    resultText: '',
  }
}

export function evalDamageFormula(
  formula: string,
  stats: { STR: number; AGI: number; LEVEL: number; BASE: number },
): number {
  const expr = formula
    .replace(/STR/g, String(stats.STR))
    .replace(/AGI/g, String(stats.AGI))
    .replace(/LEVEL/g, String(stats.LEVEL))
    .replace(/BASE/g, String(stats.BASE))
  if (!/^[\d+\-*/().\s]+$/.test(expr)) return stats.BASE
  try {
    const value = Function(`"use strict"; return (${expr});`)() as number
    return Math.max(1, Math.round(value))
  } catch {
    return stats.BASE
  }
}

export function playerAttack(
  combat: CombatState,
  player: PlayerState,
  skill: CombatSkillDef,
  baseWeaponDamage: number,
  targetIndex: number = 0,
): { texts: string[]; finished: boolean; fled?: boolean } {
  if (!combat.player) return { texts: ['战斗状态异常。'], finished: true }
  const target = combat.enemies[targetIndex]
  if (!target) return { texts: ['目标不存在。'], finished: false }

  const cd = combat.player.cooldowns[skill.id] ?? 0
  if (cd > 0) {
    return { texts: [`${skill.name} 冷却中（${cd}）。`], finished: false }
  }

  if (skill.staminaCost && player.survival.stamina < skill.staminaCost) {
    return { texts: ['体力不足。'], finished: false }
  }

  const level = player.skills[skill.skill] ?? 1
  let dmg = evalDamageFormula(skill.damageFormula, {
    STR: player.attrs.strength,
    AGI: player.attrs.agility,
    LEVEL: level,
    BASE: baseWeaponDamage,
  })

  const critChance = skill.critChance
    ? evalDamageFormula(skill.critChance, {
        STR: player.attrs.strength,
        AGI: player.attrs.agility,
        LEVEL: level,
        BASE: baseWeaponDamage,
      }) / 100
    : 0
  const isCrit = Math.random() < critChance
  if (isCrit) {
    dmg = Math.round(dmg * (skill.critMultiplier ?? 1.5))
  }

  const mitigated = Math.max(1, dmg - target.armor)
  target.hp -= mitigated
  combat.player.cooldowns[skill.id] = skill.cooldown
  tickCooldowns(combat.player)
  if (skill.staminaCost) {
    player.survival.stamina = Math.max(0, player.survival.stamina - skill.staminaCost)
  }

  const texts = [
    isCrit
      ? `你使用【${skill.name}】暴击 ${target.name}，造成 ${mitigated} 点伤害！`
      : `你使用【${skill.name}】攻击 ${target.name}，造成 ${mitigated} 点伤害。`,
  ]

  if (target.hp <= 0) {
    texts.push(`${target.name} 倒下了。`)
    combat.deadEnemies.push(target.id)
    combat.enemies = combat.enemies.filter((e) => e.id !== target.id)
    console.log(combat.enemies)
    if (combat.enemies.length === 0) {
      combat.active = false
      texts.push(`你击败了所有敌人。`)
      combat.resultText = '你击败了所有敌人。'
      return { texts, finished: true }
    }
  }

  for (const enemy of combat.enemies) {
    tickCooldowns(enemy)
    const enemyDmg = Math.max(1, Math.round(10 + Math.random() * 8) - Math.floor(level / 2))
    combat.player.hp -= enemyDmg
    player.survival.hp = combat.player.hp
    texts.push(`${enemy.name} 反击，你受到 ${enemyDmg} 点伤害。`)
    if (combat.player.hp <= 0) {
      player.survival.hp = 0
      texts.push('你倒下了……')
      combat.active = false
      combat.resultText = '你战败了。'
      return { texts, finished: true }
    }
  }
  combat.turn += 1

  return { texts, finished: false }
}

export function tryFlee(
  combat: CombatState,
  player: PlayerState,
): { texts: string[]; finished: boolean; fled: boolean } {
  const chance = 0.35 + player.attrs.agility * 0.02 + (player.skills.run ?? 0) * 0.03
  if (Math.random() < chance) {
    combat.active = false
    combat.resultText = '你成功逃离了战斗。'
    return { texts: ['你转身逃入丛林。'], finished: true, fled: true }
  }
  const texts = ['逃跑失败！']
  if (combat.enemies.length > 0 && combat.player) {
    const enemy = combat.enemies[0]
    const enemyDmg = Math.max(1, Math.round(8 + Math.random() * 6))
    combat.player.hp -= enemyDmg
    player.survival.hp = combat.player.hp
    texts.push(`${enemy?.name ?? '敌人'} 抓住空档攻击，你受到 ${enemyDmg} 点伤害。`)
    if (combat.player.hp <= 0) {
      combat.active = false
      combat.resultText = '你战败了。'
      return { texts, finished: true, fled: false }
    }
  }
  combat.turn += 1
  return { texts, finished: false, fled: false }
}

function tickCooldowns(c: CombatantState): void {
  for (const key of Object.keys(c.cooldowns)) {
    const v = c.cooldowns[key] ?? 0
    c.cooldowns[key] = Math.max(0, v - 1)
  }
}

export function rollLoot(enemy: EnemyDef): InventorySlot[] {
  const loot: InventorySlot[] = []
  for (const entry of enemy.loot ?? []) {
    const chance = entry.chance ?? 1
    if (Math.random() <= chance) {
      loot.push({ itemId: entry.itemId, count: entry.count })
    }
  }
  return loot
}

export function defaultPlayerSkills(): CombatSkillDef[] {
  return [
    {
      id: 'punch',
      name: '拳击',
      skill: 'unarmed',
      cooldown: 0,
      damageFormula: 'STR + 5 + LEVEL * 2',
      description: '普通近战攻击',
    },
    {
      id: 'heavy',
      name: '全力一击',
      skill: 'brawl',
      cooldown: 2,
      damageFormula: 'STR * 1.2 + 8 + LEVEL',
      description: '高伤害，冷却 2 回合',
    },
    {
      id: 'spear_thrust',
      name: '刺击',
      skill: 'melee',
      cooldown: 0,
      damageFormula: 'STR * BASE * 0.5',
      description: '用矛类武器进行精准刺击',
      weaponType: 'spear',
      critChance: 'AGI / 100',
      critMultiplier: 1.5,
      staminaCost: 1,
    },
    {
      id: 'spear_sweep',
      name: '扫击',
      skill: 'melee',
      cooldown: 2,
      damageFormula: 'STR * BASE * 0.8',
      description: '用矛类武器进行范围横扫',
      weaponType: 'spear',
      unlockLevel: 10,
      critChance: 'AGI / 100',
      critMultiplier: 1.5,
      staminaCost: 10,
    },
    {
      id: 'bat_strike',
      name: '击打',
      skill: 'melee',
      cooldown: 0,
      damageFormula: 'STR * BASE * 0.5',
      description: '用棒类武器进行击打',
      weaponType: 'bat',
      critChance: 'AGI / 100',
      critMultiplier: 1.5,
      staminaCost: 1,
    },
    {
      id: 'bat_smash',
      name: '当头一棒',
      skill: 'melee',
      cooldown: 2,
      damageFormula: 'STR * BASE * 5',
      description: '用棒类武器进行强力重击',
      weaponType: 'bat',
      unlockLevel: 20,
      critChance: 'AGI / 100',
      critMultiplier: 1.5,
      staminaCost: 50,
    },
    {
      id: 'sea_shout',
      name: '海民大喝',
      skill: 'brawl',
      cooldown: 2,
      damageFormula: 'STR * BASE * 0.5 * LEVEL',
      description: '模仿海民的震慑大喝',
      critChance: 'AGI / 100',
      critMultiplier: 1.5,
      staminaCost: 1,
    },
  ]
}
