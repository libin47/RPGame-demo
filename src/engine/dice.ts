// src/engine/dice.ts
// 随机工具：加权随机选择、概率判定、范围随机

/**
 * 在 [min, max] 范围内生成随机整数（包含两端）
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 在 [min, max) 范围内生成随机浮点数
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * 概率判定
 * @param probability - 成功概率（0-1），1 必定成功，0 必定失败
 * @returns 是否判定成功
 */
export function chance(probability: number): boolean {
  return Math.random() < probability
}

/**
 * 加权随机选择
 * 从 items 中按 weights 权重随机选取一项。
 * 权重越高，选中概率越大。
 *
 * @param items - 候选项列表
 * @param weights - 对应的权重列表（长度必须与 items 一致）
 * @returns 选中的项，若 items 为空则返回 undefined
 */
export function weightedSelect<T>(items: T[], weights: number[]): T | undefined {
  if (items.length === 0) return undefined
  if (items.length !== weights.length) {
    throw new Error(
      `weightedSelect: items 长度 (${items.length}) 与 weights 长度 (${weights.length}) 不匹配`,
    )
  }

  const totalWeight = weights.reduce((sum, w) => sum + Math.max(0, w), 0)
  if (totalWeight <= 0) return undefined

  const roll = Math.random() * totalWeight
  let cumulative = 0

  for (let i = 0; i < items.length; i++) {
    cumulative += Math.max(0, weights[i]!)
    if (roll < cumulative) {
      return items[i]
    }
  }

  // 兜底返回最后一项（浮点误差）
  return items[items.length - 1]
}

/**
 * 从数组中随机选取一项
 */
export function randomPick<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

/**
 * 从数组中随机选取不重复的 n 项
 */
export function randomPickN<T>(items: T[], n: number): T[] {
  if (n >= items.length) return [...items]
  const shuffled = [...items].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

/**
 * 对数组进行 Fisher-Yates 洗牌
 */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]!
    result[i] = result[j]!
    result[j] = temp
  }
  return result
}

/**
 * 生成道具数量的随机值
 * 在 [min, max] 范围内随机，可受幸运值修正
 *
 * @param min - 最小数量
 * @param min - 最大数量
 * @param luckModifier - 幸运修正（每点增加 5% 最大数量上限）
 * @returns 随机数量
 */
export function randomQuantity(min: number, max: number, luckModifier: number = 0): number {
  let effectiveMax = max
  if (luckModifier > 0) {
    effectiveMax = Math.round(max * (1 + luckModifier * 0.05))
  }
  return randomInt(min, effectiveMax)
}
