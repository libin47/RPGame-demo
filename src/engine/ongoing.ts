// src/engine/ongoing.ts
// 进行中（需要时间）配方引擎：开始/停止/收集/时间结算

import type { PlayerState } from '@/types/player'
import type { OngoingJob, OngoingRecipe } from '@/types/ongoing'
import type { RecipeProduct } from '@/types/recipe'
import { getRegistry } from './registry'
import { evaluateConditions } from './event'
import { checkMaterials, consumeMaterials, produceItems } from './crafting'
import { addItem } from './inventory'

/** 读取容器内的任务列表，不存在时初始化为空数组（副作用：写入 player.progress） */
function getJobs(player: PlayerState, containerKey: string): OngoingJob[] {
  player.progress.ongoingJobs[containerKey] = player.progress.ongoingJobs[containerKey] ?? []
  return player.progress.ongoingJobs[containerKey]
}

/**
 * 时间倍率：配方填写了 conditions 时取所有满足条件 value 之和；无 conditions 时为 1。
 * 实际进度增量 = 流逝分钟 × 该倍率。
 */
export function ongoingSpeedFactor(recipe: OngoingRecipe, player: PlayerState): number {
  const conds = recipe.conditions
  if (!conds || conds.length === 0) return 1
  let total = 0
  for (const c of conds) {
    if (evaluateConditions(c.conditions, player)) total += c.value
  }
  return total
}

/** 查找空位下标；无空位返回 -1 */
export function findOngoingSlotIndex(jobs: OngoingJob[], maxSlots: number): number {
  const used = new Set(jobs.map((j) => j.slotIndex))
  for (let i = 0; i < maxSlots; i++) {
    if (!used.has(i)) return i
  }
  return -1
}

/**
 * 消耗材料，在容器的空位上开始一个制作任务
 * @returns 成功返回 null，否则返回原因
 */
export function startOngoingJob(
  player: PlayerState,
  containerKey: string,
  recipeId: string,
  maxSlots: number,
): string | null {
  const recipe = getRegistry().getOngoingRecipe(recipeId)
  if (!recipe) return '配方不存在'
  const jobs = getJobs(player, containerKey)
  const slot = findOngoingSlotIndex(jobs, maxSlots)
  if (slot < 0) return '没有空闲位'
  const err = checkMaterials(player, recipe.materials)
  if (err) return err
  consumeMaterials(player, recipe.materials)
  jobs.push({ slotIndex: slot, recipeId, elapsedMinutes: 0, status: 'crafting' })
  return null
}

/**
 * 停止指定空位的任务，全额退回已消耗的原料（含替代品原样退还）
 */
export function cancelOngoingJob(
  player: PlayerState,
  containerKey: string,
  slotIndex: number,
): void {
  const jobs = getJobs(player, containerKey)
  const job = jobs.find((j) => j.slotIndex === slotIndex)
  if (!job) return
  const recipe = getRegistry().getOngoingRecipe(job.recipeId)
  if (recipe) {
    for (const mat of recipe.materials) {
      if (mat.isConsumed) addItem(player, mat.itemId, mat.quantity)
    }
  }
  player.progress.ongoingJobs[containerKey] = jobs.filter((j) => j.slotIndex !== slotIndex)
}

/**
 * 按品质权重解析完成的产物（无 qualityLevels 时回退配方默认 products）
 */
function resolveOngoingProducts(
  recipe: OngoingRecipe,
  deviceLevel: number,
): RecipeProduct[] | null {
  if (!recipe.qualityLevels || recipe.qualityLevels.length === 0) return null
  const available = recipe.qualityLevels.filter((q) => q.minDeviceLevel <= deviceLevel)
  if (available.length === 0) return recipe.products
  const total = available.reduce((sum, q) => sum + q.weight, 0)
  let r = Math.floor(Math.random() * total)
  for (const q of available) {
    r -= q.weight
    if (r < 0) return q.productItems ?? recipe.products
  }
  return recipe.products
}

/**
 * 收取指定空位已完成的任务，产出品质产物并释放空位
 * @returns 成功返回 null，否则返回原因
 */
export function collectOngoingJob(
  player: PlayerState,
  containerKey: string,
  slotIndex: number,
  deviceLevel: number = 0,
): string | null {
  const jobs = getJobs(player, containerKey)
  const job = jobs.find((j) => j.slotIndex === slotIndex)
  if (!job || job.status !== 'completed') return '该任务尚未完成'
  const recipe = getRegistry().getOngoingRecipe(job.recipeId)
  if (!recipe) return '配方不存在'
  const products = resolveOngoingProducts(recipe, deviceLevel)
  if (products) {
    produceItems(player, products)
  } else {
    produceItems(player, recipe.products)
  }
  player.progress.ongoingJobs[containerKey] = jobs.filter((j) => j.slotIndex !== slotIndex)
  return null
}

/**
 * 时间推进结算：每个进行中的任务按时间倍率累计进度，达到 timeMinutes 标记完成。
 * @returns 本次完成的叙事日志（用于场景主文本）
 */
export function tickOngoingJobs(player: PlayerState, minutes: number): string[] {
  const logs: string[] = []
  const keys = Object.keys(player.progress.ongoingJobs)
  for (const key of keys) {
    const jobs = player.progress.ongoingJobs[key]
    if (!jobs) continue
    for (const job of jobs) {
      if (job.status !== 'crafting') continue
      const recipe = getRegistry().getOngoingRecipe(job.recipeId)
      if (!recipe) continue
      job.elapsedMinutes += minutes * ongoingSpeedFactor(recipe, player)
      if (job.elapsedMinutes >= recipe.requirements.timeMinutes) {
        job.status = 'completed'
        logs.push(`${recipe.name} 完成了，快去收取吧。`)
      }
    }
  }
  return logs
}
