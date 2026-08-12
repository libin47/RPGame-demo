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

// ============================================================
// 骰子表达式
// 支持 NdM 骰子与加减常数，如 "1d6"、"2d4+3"、"3d8-2"、"1d4+2d6+1"
// 运算仅限加减和 d 骰子运算。
// ============================================================

/**
 * 骰子表达式中的一项
 * 每项要么是一个骰子组（如 2d6，带符号），要么是一个纯常数（如 +3/-2）。
 */
export interface DiceTerm {
  /** 骰子数量（0 表示纯常数项） */
  diceCount: number
  /** 骰子面数 */
  diceSides: number
  /** 该项符号（+1 / -1） */
  sign: number
  /** 常数项数值（绝对值，仅纯常数项时有效） */
  constant: number
}

/**
 * 解析骰子表达式为有序项列表
 * 表达式仅允许数字、d/D、+、- 与空格。
 *
 * @param expr - 骰子表达式，如 "2d4+3"
 * @returns 解析出的项列表
 * @throws 表达式格式非法时抛出错误
 */
export function parseDiceExpression(expr: string): DiceTerm[] {
  const cleaned = expr.replace(/\s+/g, '')
  if (cleaned.length === 0 || !/^[0-9dD+\-]+$/.test(cleaned)) {
    throw new Error(`无效的骰子表达式: "${expr}"`)
  }

  const terms: DiceTerm[] = []
  let index = 0
  let sign = 1

  while (index < cleaned.length) {
    const ch = cleaned[index]!
    if (ch === '+' || ch === '-') {
      sign = ch === '-' ? -1 : 1
      index++
      continue
    }
    // 解析数字部分
    const numStart = index
    while (index < cleaned.length && /[0-9]/.test(cleaned[index]!)) index++
    if (numStart === index) {
      throw new Error(`无效的骰子表达式: "${expr}"`)
    }
    const numText = cleaned.slice(numStart, index)
    const value = parseInt(numText, 10)

    // 后面跟 d/D 则为骰子组
    const nextCh = cleaned[index]
    if (nextCh === 'd' || nextCh === 'D') {
      index++
      const sidesStart = index
      while (index < cleaned.length && /[0-9]/.test(cleaned[index]!)) index++
      if (sidesStart === index) {
        throw new Error(`无效的骰子表达式: "${expr}"`)
      }
      const sides = parseInt(cleaned.slice(sidesStart, index), 10)
      if (value < 0 || sides <= 0) {
        throw new Error(`无效的骰子表达式: "${expr}"`)
      }
      terms.push({ diceCount: value, diceSides: sides, sign, constant: 0 })
    } else {
      // 纯常数项
      terms.push({ diceCount: 0, diceSides: 0, sign, constant: value })
    }
  }

  if (terms.length === 0) {
    throw new Error(`无效的骰子表达式: "${expr}"`)
  }
  return terms
}

/**
 * 求骰子表达式的值（随机投掷）
 * 每个骰子组在 [1, sides] 内独立投掷后求和，再乘以符号。
 *
 * @param expr - 骰子表达式
 * @returns 投掷结果
 */
export function rollDiceExpression(expr: string): number {
  const terms = parseDiceExpression(expr)
  let total = 0
  for (const term of terms) {
    if (term.diceCount > 0) {
      let sum = 0
      for (let i = 0; i < term.diceCount; i++) {
        sum += randomInt(1, term.diceSides)
      }
      total += term.sign * sum
    } else {
      total += term.sign * term.constant
    }
  }
  return total
}

/**
 * 求骰子表达式的最大值（每个骰子取最大面值）
 *
 * @param expr - 骰子表达式
 * @returns 最大值
 */
export function maxDiceExpression(expr: string): number {
  const terms = parseDiceExpression(expr)
  let total = 0
  for (const term of terms) {
    if (term.diceCount > 0) {
      total += term.sign * term.diceCount * term.diceSides
    } else {
      total += term.sign * term.constant
    }
  }
  return total
}

/**
 * 求骰子表达式的最小值（每个骰子取1）
 *
 * @param expr - 骰子表达式
 * @returns 最小值
 */
export function minDiceExpression(expr: string): number {
  const terms = parseDiceExpression(expr)
  let total = 0
  for (const term of terms) {
    if (term.diceCount > 0) {
      total += term.sign * term.diceCount * 1
    } else {
      total += term.sign * term.constant
    }
  }
  return total
}
