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
 * 计算加成属性对伤害的修正
 * 公式：(属性值 - 50) / 5，向下取整，允许负数
 */
export function calcAttributeScalingBonus(attributeValue: number): number {
  return Math.floor((attributeValue - 50) / 5)
}

/**
 * 计算伤害经过防御减免后的最终值
 * 公式：最终伤害 = X·(1−d) + X·d·dp
 *   X  = 技能修正后的原始伤害（含暴击取最大值等）
 *   d  = 目标对应类型防御比例（1=完全免疫；>1 时 (1−d) 为负，允许负伤害即回复血量，不封顶）
 *   dp = 伤害类型穿透比例（DamageType.defensePenetration，0~1；1=完全无视防御，如真实伤害）
 * 暴击时调用方传入减半后的防御比例（d/2）即可。
 *
 * @returns 最终伤害（向下取整，可为负数）
 */
export function calcDamageAfterDefense(
  rawDamage: number,
  defensePenetration: number,
  defenseRatio: number,
): number {
  const reducedDamage = rawDamage * (1 - defenseRatio)
  const penetratedDamage = rawDamage * defenseRatio * defensePenetration
  return Math.floor(reducedDamage + penetratedDamage)
}

/**
 * 计算防御实际减免掉的伤害量（用于防具耐久扣除）
 * = X·d·(1−dp)，防御比例截取到 [0, 1]
 * d≤0 时无减免；d≥1 时减免全部可减免部分
 */
export function calcAbsorbedDamage(
  rawDamage: number,
  defensePenetration: number,
  defenseRatio: number,
): number {
  const clampedRatio = Math.max(0, Math.min(1, defenseRatio))
  return rawDamage * clampedRatio * (1 - defensePenetration)
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
