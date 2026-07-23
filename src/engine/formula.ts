// src/engine/formula.ts
// 公式库：游戏中各类数值计算的纯函数集合
// 所有公式遵循 README.md 中的策划书描述

import type { PlayerState } from '@/types/player'
import type { Enemy } from '@/types/enemy'

// ============================================================
// 生存属性公式
// ============================================================

/**
 * 计算生命值上限
 * 公式：体质 × 10
 */
export function calcMaxHp(constitution: number): number {
  return constitution * 10
}

/**
 * 计算饱食度上限
 * 公式：100 × 饱食度上限系数
 */
export function calcMaxSatiety(upperLimitCoefficient: number): number {
  return 100 * upperLimitCoefficient
}

/**
 * 计算体力值上限
 * 公式：100 + 体力修正值
 */
export function calcMaxStamina(staminaRecoveryFix: number): number {
  return 100 + staminaRecoveryFix
}

/**
 * 计算 SAN 值上限
 * 公式：100 + SAN 修正指数
 */
export function calcMaxSan(sanModifier: number): number {
  return Math.max(1, 100 + sanModifier)
}

/**
 * 计算最大负重
 * 公式：力量 × 5 + 负重修正
 */
export function calcMaxCarryWeight(strength: number, carryWeightModifier: number): number {
  return strength * 5 + carryWeightModifier
}

/**
 * 计算负重率
 * 公式：当前负重 / 最大负重
 */
export function calcCarryWeightRate(currentWeight: number, maxWeight: number): number {
  if (maxWeight <= 0) return 1
  return currentWeight / maxWeight
}

// ============================================================
// 基础属性成长公式
// ============================================================

/**
 * 计算升级所需经验
 * 公式：当前等级 × 100
 */
export function calcLevelUpExp(currentLevel: number): number {
  return currentLevel * 100
}

// ============================================================
// 被动效果公式（按分钟计算）
// ============================================================

/**
 * 计算饱食度自然损失
 * 公式：(5 × 损失系数) × (elapsedMinutes / 60)
 */
export function calcSatietyLoss(lossCoefficient: number, elapsedMinutes: number): number {
  return 5 * lossCoefficient * (elapsedMinutes / 60)
}

/**
 * 计算生命值自然恢复
 * 公式：(体质 × 0.1 × 恢复速率系数) × (elapsedMinutes / 60)
 */
export function calcNaturalHpRecovery(
  constitution: number,
  recoveryCoefficient: number,
  elapsedMinutes: number,
): number {
  return constitution * 0.1 * recoveryCoefficient * (elapsedMinutes / 60)
}

/**
 * 计算体力值自然恢复
 * 公式：(10 × 恢复系数 + 恢复修正) × (elapsedMinutes / 60)
 */
export function calcStaminaRecovery(
  recoveryCoefficient: number,
  recoveryFix: number,
  elapsedMinutes: number,
): number {
  return (10 * recoveryCoefficient + recoveryFix) * (elapsedMinutes / 60)
}

/**
 * 计算饥饿 HP 损失
 * 公式：5% × 最大生命值 × (elapsedMinutes / 60)
 */
export function calcStarvationHpDamage(maxHp: number, elapsedMinutes: number): number {
  return 0.05 * maxHp * (elapsedMinutes / 60)
}

/**
 * 计算饥饿 SAN 损失
 * 公式：1 × (elapsedMinutes / 60)
 */
export function calcStarvationSanDamage(elapsedMinutes: number): number {
  return 1 * (elapsedMinutes / 60)
}

/**
 * 计算温度 HP 损失（寒冷/炎热）
 * 公式：5% × 最大生命值 × (elapsedMinutes / 60)
 */
export function calcTempHpDamage(maxHp: number, elapsedMinutes: number): number {
  return 0.05 * maxHp * (elapsedMinutes / 60)
}

/**
 * 计算极端温度 HP 损失（严寒/酷热）
 * 公式：10% × 最大生命值 × (elapsedMinutes / 60)
 */
export function calcExtremeTempHpDamage(maxHp: number, elapsedMinutes: number): number {
  return 0.1 * maxHp * (elapsedMinutes / 60)
}

/**
 * 计算温度 SAN 损失
 * 公式：1 × (elapsedMinutes / 60)
 */
export function calcTempSanLoss(elapsedMinutes: number): number {
  return 1 * (elapsedMinutes / 60)
}

// ============================================================
// 战斗公式
// ============================================================

/**
 * 计算出手顺序值
 * 值越高越先出手
 * 公式：敏捷 + 随机浮动(0~敏捷×0.1)
 */
export function calcTurnOrder(agility: number): number {
  return agility + Math.random() * agility * 0.1
}

/**
 * 计算玩家基础攻击伤害
 * 适用于普攻
 *
 * @param playerStrength - 玩家力量
 * @param weaponDamage - 武器基础伤害（无武器时为 0）
 * @param proficiencyBonus - 武器熟练度加成（每级 +2 伤害）
 * @returns 基础伤害
 */
export function calcPlayerBaseDamage(
  playerStrength: number,
  weaponDamage: number,
  proficiencyBonus: number,
): number {
  return Math.max(1, playerStrength * 0.5 + weaponDamage + proficiencyBonus)
}

/**
 * 计算命中判定
 *
 * @param attackerAgility - 攻击者敏捷
 * @param proficiencyBonus - 武器熟练度命中加成
 * @param accuracyModifier - 技能命中修正
 * @param defenderAgility - 防御者敏捷
 * @returns 是否命中
 */
export function calcHitChance(
  attackerAgility: number,
  proficiencyBonus: number,
  accuracyModifier: number,
  defenderAgility: number,
): number {
  const baseHit = 0.8 // 基础命中率 80%
  const agilityFactor = (attackerAgility - defenderAgility) * 0.005 // 敏捷差每差 1 点 ±0.5%
  const proficiencyFactor = proficiencyBonus * 0.03 // 熟练度每级 +3%
  return Math.min(
    0.95,
    Math.max(0.2, baseHit + agilityFactor + proficiencyFactor + accuracyModifier),
  )
}

/**
 * 计算暴击判定
 *
 * @param proficiencyBonus - 武器熟练度暴击加成
 * @param critChanceModifier - 技能暴击率修正
 * @returns 是否暴击
 */
export function calcCriticalChance(proficiencyBonus: number, critChanceModifier: number): number {
  const baseCrit = 0.05 // 基础暴击率 5%
  const proficiencyFactor = proficiencyBonus * 0.02 // 熟练度每级 +2%
  return Math.min(0.5, baseCrit + proficiencyFactor + critChanceModifier)
}

/**
 * 计算暴击倍率
 *
 * @param proficiencyBonus - 武器熟练度暴击倍率加成
 * @param critMultiplierModifier - 技能暴击倍率修正
 * @returns 暴击倍率
 */
export function calcCriticalMultiplier(
  proficiencyBonus: number,
  critMultiplierModifier: number,
): number {
  const baseMultiplier = 1.5 // 基础暴击倍率 1.5x
  const proficiencyFactor = proficiencyBonus * 0.1 // 熟练度每级 +0.1
  return baseMultiplier + proficiencyFactor + critMultiplierModifier
}

/**
 * 计算玩家攻击最终伤害
 *
 * @param baseDamage - 基础伤害
 * @param isCritical - 是否暴击
 * @param criticalMultiplier - 暴击倍率
 * @param targetDefense - 目标对应防御值
 * @param damageVariance - 伤害浮动（0-1，默认 0.1）
 * @returns 最终伤害（向上取整）
 */
export function calcFinalDamage(
  baseDamage: number,
  isCritical: boolean,
  criticalMultiplier: number,
  targetDefense: number,
  damageVariance: number = 0.1,
): number {
  // 防御减伤（每点防御减少 0.5% 伤害，上限 75%）
  const damageReduction = Math.min(0.75, targetDefense * 0.005)
  const defenseMultiplier = 1 - damageReduction

  // 伤害浮动
  const variance = 1 + (Math.random() * 2 - 1) * damageVariance

  let damage = baseDamage * defenseMultiplier * variance
  if (isCritical) {
    damage *= criticalMultiplier
  }

  return Math.max(1, Math.ceil(damage))
}

/**
 * 计算敌人攻击最终伤害
 *
 * @param enemyStrength - 敌人力量
 * @param skillBaseDamage - 技能基础伤害
 * @param strengthScaling - 力量加成系数
 * @param targetDefense - 玩家对应防御值
 * @param damageVariance - 伤害浮动
 * @returns 最终伤害（向上取整）
 */
export function calcEnemyFinalDamage(
  enemyStrength: number,
  skillBaseDamage: number,
  strengthScaling: number,
  targetDefense: number,
  damageVariance: number = 0.1,
): number {
  // 防御减伤
  const damageReduction = Math.min(0.75, targetDefense * 0.005)
  const defenseMultiplier = 1 - damageReduction

  // 伤害浮动
  const variance = 1 + (Math.random() * 2 - 1) * damageVariance

  const damage = (skillBaseDamage + enemyStrength * strengthScaling) * defenseMultiplier * variance
  return Math.max(1, Math.ceil(damage))
}

/**
 * 计算敌人技能命中
 *
 * @param enemyAgility - 敌人敏捷
 * @param accuracyModifier - 技能命中修正
 * @param playerAgility - 玩家敏捷
 * @returns 是否命中
 */
export function calcEnemyHitChance(
  enemyAgility: number,
  accuracyModifier: number,
  playerAgility: number,
): number {
  const baseHit = 0.75
  const agilityFactor = (enemyAgility - playerAgility) * 0.005
  return Math.min(0.95, Math.max(0.2, baseHit + agilityFactor + accuracyModifier))
}

/**
 * 计算逃跑成功率
 * 公式：玩家敏捷 / (玩家敏捷 + 敌人敏捷)
 * 初见时获得两倍概率
 *
 * @param playerAgility - 玩家敏捷
 * @param enemyAgility - 敌人敏捷
 * @param isFirstEncounter - 是否为初次遭遇
 * @param escapeDifficultyModifier - 逃跑难度修正系数
 * @returns 逃跑成功率（0-1）
 */
export function calcEscapeChance(
  playerAgility: number,
  enemyAgility: number,
  isFirstEncounter: boolean,
  escapeDifficultyModifier: number,
): number {
  const denominator = playerAgility + enemyAgility * escapeDifficultyModifier
  if (denominator <= 0) return 1

  let chance = playerAgility / denominator
  if (isFirstEncounter) {
    chance = Math.min(1, chance * 2)
  }
  return chance
}

/**
 * 计算观察/分析成功率
 * 公式：玩家智力 / (玩家智力 + 50)
 *
 * @param playerIntelligence - 玩家智力
 * @returns 成功率（0-1）
 */
export function calcObserveChance(playerIntelligence: number): number {
  return playerIntelligence / (playerIntelligence + 50)
}

// ============================================================
// 防守减伤
// ============================================================

/**
 * 计算防守状态下受到的伤害
 * 防守时减免 50% 伤害
 */
export function calcDefenseDamageReduction(originalDamage: number): number {
  return Math.floor(originalDamage * 0.5)
}

// ============================================================
// 互动消耗公式
// ============================================================

/**
 * 计算实际体力消耗
 * 公式：基础消耗 × 体力消耗系数
 */
export function calcStaminaCost(baseCost: number, consumptionCoefficient: number): number {
  return Math.max(0, Math.round(baseCost * consumptionCoefficient))
}

// ============================================================
// 敌人腐化度缩放
// ============================================================

/**
 * 按腐化度计算敌人的缩放属性
 *
 * @param enemy - 原始敌人配置
 * @param corruption - 当前腐化度
 * @returns 缩放后的属性
 */
export function scaleEnemyByCorruption(
  enemy: Enemy,
  corruption: number,
): {
  hp: number
  strength: number
  agility: number
  defenses: Record<string, number>
} {
  if (!enemy.corruptionScaling) {
    return {
      hp: enemy.hp,
      strength: enemy.strength,
      agility: enemy.agility,
      defenses: { ...enemy.defenses },
    }
  }

  const scaling = enemy.corruptionScaling
  const factor = 1 + (corruption * scaling.hpPerCorruption) / 100

  return {
    hp: Math.floor(enemy.hp * factor),
    strength: Math.floor(enemy.strength * factor),
    agility: Math.floor(enemy.agility * factor),
    defenses: { ...enemy.defenses },
  }
}
