import type { ContentRegistry, RecipeDef } from '@/types/content'
import type { InventoryState, PlayerState } from '@/types/state'
import type { ConditionContext } from './conditions'
import { evalWhen } from './conditions'

export function canCraft(
  recipe: RecipeDef,
  ctx: ConditionContext,
  hasWorkbench: (id: string) => boolean,
): { ok: boolean; reason?: string } {
  if (!evalWhen(recipe.when, ctx)) {
    return { ok: false, reason: '尚不满足制作条件。' }
  }
  if (recipe.blueprintFlag && !ctx.flags.flags[recipe.blueprintFlag]) {
    return { ok: false, reason: '尚未掌握该蓝图。' }
  }
  if (recipe.workbenchId && !hasWorkbench(recipe.workbenchId)) {
    return { ok: false, reason: '需要对应的工作台。' }
  }
  if (recipe.intReq && ctx.player.attrs.intelligence < recipe.intReq) {
    return { ok: false, reason: '智力不足。' }
  }
  if (recipe.skillReq) {
    const level = ctx.player.skills[recipe.skillReq.skill] ?? 0
    if (level < recipe.skillReq.level) {
      return { ok: false, reason: '相关技能不足。' }
    }
  }
  for (const mat of recipe.materials) {
    const slot = ctx.inventory.slots.find((s) => s.itemId === mat.itemId)
    if ((slot?.count ?? 0) < mat.count) {
      const name = ctx.content.items[mat.itemId]?.name ?? mat.itemId
      return { ok: false, reason: `材料不足：${name} x${mat.count}` }
    }
  }
  return { ok: true }
}

export function consumeMaterials(inventory: InventoryState, recipe: RecipeDef): void {
  for (const mat of recipe.materials) {
    removeItem(inventory, mat.itemId, mat.count)
  }
}

export function addItem(
  inventory: InventoryState,
  itemId: string,
  count: number,
  content: ContentRegistry,
): boolean {
  const def = content.items[itemId]
  if (!def) return false
  const stackable = def.stackable !== false
  const maxStack = def.maxStack ?? 99

  if (stackable) {
    const existing = inventory.slots.find((s) => s.itemId === itemId)
    if (existing) {
      existing.count = Math.min(maxStack, existing.count + count)
      return true
    }
  }

  const weight = totalWeight(inventory, content) + def.weight * count
  if (weight > inventory.capacity) return false

  inventory.slots.push({ itemId, count })
  return true
}

export function removeItem(inventory: InventoryState, itemId: string, count: number): boolean {
  const slot = inventory.slots.find((s) => s.itemId === itemId)
  if (!slot || slot.count < count) return false
  slot.count -= count
  if (slot.count <= 0) {
    inventory.slots = inventory.slots.filter((s) => s !== slot)
  }
  return true
}

export function totalWeight(inventory: InventoryState, content: ContentRegistry): number {
  return inventory.slots.reduce((sum, s) => {
    const w = content.items[s.itemId]?.weight ?? 0
    return sum + w * s.count
  }, 0)
}

export function listCraftable(
  content: ContentRegistry,
  ctx: ConditionContext,
  hasWorkbench: (id: string) => boolean,
): RecipeDef[] {
  return Object.values(content.recipes).filter((r) => canCraft(r, ctx, hasWorkbench).ok)
}

export function grantSkillXp(player: PlayerState, skill: string, amount: number): void {
  const key = skill as keyof typeof player.skills
  player.skills[key] = (player.skills[key] ?? 0) + amount
}
