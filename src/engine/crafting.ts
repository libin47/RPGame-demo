// src/engine/crafting.ts
// 配方执行引擎：制作、烹饪、建造、修复的统一逻辑

import type { PlayerState } from '@/types/player'
import type {
  BaseRecipe,
  RequiredMaterial,
  RecipeCost,
  RecipeProduct,
  SkillRequirement,
  AttributeRequirement,
} from '@/types/recipe'
import type { CookRecipe, CookQualityLevel } from '@/types/cook'
import { RecipeCostType } from '@/types/recipe'
import { GainExpTarget } from '@/types/effect'
import type { GainExpEffect } from '@/types/effect'
import { EffectType } from '@/types/effect'
import { getRegistry } from './registry'
import { getEffectResolver } from './effect'
import { removeItem, addItem } from './inventory'

// ============================================================
// 结果类型
// ============================================================

/** 配方执行结果 */
export interface CraftResult {
  /** 是否成功 */
  success: boolean
  /** 结果描述 */
  message: string
  /** 产物列表 */
  products?: Array<{ itemId: string; quantity: number }>
  /** 消耗的材料列表 */
  consumedMaterials?: Array<{ itemId: string; quantity: number }>
  /** 消耗的游戏内分钟数 */
  timeUsed: number
  /** 获得的经验 */
  expGained?: number
}

// ============================================================
// 公共辅助函数
// ============================================================

/**
 * 检查玩家是否满足材料需求
 * @param player - 当前玩家
 * @param materials - 所需材料列表
 * @returns 若满足返回 null，否则返回缺失原因
 */
function checkMaterials(player: PlayerState, materials: RequiredMaterial[]): string | null {
  for (const mat of materials) {
    if (!mat.isConsumed) continue // 非消耗材料只要求存在（如工具）
    const count = player.inventory.reduce((sum, inv) => {
      if (inv.itemId === mat.itemId) {
        // 检查是否已装备（装备中的物品不可用作材料）
        const isEquipped = Object.values(player.equipment).includes(mat.itemId)
        return sum + (isEquipped ? 0 : inv.quantity)
      }
      return sum
    }, 0)
    if (count < mat.quantity) {
      const registry = getRegistry()
      const itemName = registry.getItemName(mat.itemId)
      return `材料不足：需要 ${itemName} ×${mat.quantity}（当前 ${count}）`
    }
  }
  return null
}

/**
 * 检查玩家是否满足技能和属性要求
 */
function checkRequirements(
  player: PlayerState,
  requirements: {
    skillRequirements?: SkillRequirement[]
    attributeRequirements?: AttributeRequirement[]
  },
): string | null {
  // 技能等级要求
  for (const req of requirements.skillRequirements ?? []) {
    const skill = player.skills.survivalSkills[req.skillId]
    const level = skill?.level ?? 0
    if (level < req.minLevel) {
      return `技能等级不足：需要 ${req.skillId} Lv.${req.minLevel}（当前 Lv.${level}）`
    }
  }

  // 基础属性要求
  for (const req of requirements.attributeRequirements ?? []) {
    const attrKey = req.attribute as 'strength' | 'agility' | 'intelligence' | 'constitution'
    const attrValue = player.attributes[attrKey]
    if (attrValue < req.minValue) {
      return `属性不足：需要 ${req.attribute} ${req.minValue}（当前 ${attrValue}）`
    }
  }

  return null
}

/**
 * 检查玩家是否满足配方消耗（体力等）
 * @returns 若满足返回 null，否则返回缺失原因
 */
function checkCosts(player: PlayerState, costs: RecipeCost[]): string | null {
  for (const cost of costs) {
    let actualValue = cost.value
    if (cost.affectedByCoefficient && cost.costType === RecipeCostType.STAMINA) {
      actualValue = Math.round(
        actualValue * player.attributes.coefficients.staminaConsumptionCoefficient,
      )
    }

    switch (cost.costType) {
      case RecipeCostType.STAMINA:
        if (player.survival.stamina < actualValue) {
          return `体力不足：需要 ${actualValue} 点（当前 ${player.survival.stamina}）`
        }
        break
      case RecipeCostType.SATIETY:
        if (player.survival.satiety < actualValue) {
          return `饱食度不足：需要 ${actualValue} 点（当前 ${player.survival.satiety}）`
        }
        break
      case RecipeCostType.SAN:
        if (player.survival.san < actualValue) {
          return `理智不足：需要 ${actualValue} 点（当前 ${player.survival.san}）`
        }
        break
      case RecipeCostType.HP:
        if (player.survival.hp <= actualValue) {
          return `生命值不足：需要 ${actualValue} 点（当前 ${player.survival.hp}）`
        }
        break
    }
  }
  return null
}

/**
 * 从玩家身上扣除配方消耗
 */
function applyCosts(player: PlayerState, costs: RecipeCost[]): void {
  for (const cost of costs) {
    let actualValue = cost.value
    if (cost.affectedByCoefficient && cost.costType === RecipeCostType.STAMINA) {
      actualValue = Math.round(
        actualValue * player.attributes.coefficients.staminaConsumptionCoefficient,
      )
    }

    switch (cost.costType) {
      case RecipeCostType.STAMINA:
        player.survival.stamina = Math.max(0, player.survival.stamina - actualValue)
        break
      case RecipeCostType.SATIETY:
        player.survival.satiety = Math.max(0, player.survival.satiety - actualValue)
        break
      case RecipeCostType.SAN:
        player.survival.san = Math.max(0, player.survival.san - actualValue)
        break
      case RecipeCostType.HP:
        player.survival.hp = Math.max(0, player.survival.hp - actualValue)
        break
    }
  }
}

/**
 * 从背包中扣除材料
 */
function consumeMaterials(player: PlayerState, materials: RequiredMaterial[]): void {
  for (const mat of materials) {
    if (!mat.isConsumed) continue
    removeItem(player, mat.itemId, mat.quantity)
  }
}

/**
 * 产出物品到背包
 */
function produceItems(
  player: PlayerState,
  products: RecipeProduct[],
  quantityMultiplier: number = 1,
): void {
  for (const product of products) {
    const totalQuantity = product.baseQuantity * quantityMultiplier
    if (totalQuantity > 0) {
      addItem(player, product.itemId, totalQuantity)
    }
  }
}

// ============================================================
// 通用配方检查
// ============================================================

/**
 * 检查玩家是否可以执行指定的配方
 * 会检查：配方是否解锁、材料是否充足、技能/属性要求、消耗是否充足
 *
 * @param player - 当前玩家
 * @param recipe - 配方配置
 * @returns 可以执行返回 null，否则返回原因字符串
 */
export function canCraftRecipe(player: PlayerState, recipe: BaseRecipe): string | null {
  // 检查材料
  const materialCheck = checkMaterials(player, recipe.materials)
  if (materialCheck) return materialCheck

  // 检查技能/属性要求
  const requirementCheck = checkRequirements(player, recipe.requirements)
  if (requirementCheck) return requirementCheck

  // 检查消耗
  const costCheck = checkCosts(player, recipe.costs)
  if (costCheck) return costCheck

  return null
}

// ============================================================
// 制作（Craft）
// ============================================================

/**
 * 执行制作配方
 *
 * @param player - 当前玩家（会被直接修改）
 * @param recipeId - 制作配方ID
 * @param quantity - 制作数量（默认1，受批量限制）
 * @returns 执行结果
 */
export function executeCraft(
  player: PlayerState,
  recipeId: string,
  quantity: number = 1,
): CraftResult {
  const registry = getRegistry()
  const recipe = registry.getCraftRecipe(recipeId)

  if (!recipe) {
    return { success: false, message: `制作配方 ${recipeId} 未找到`, timeUsed: 0 }
  }

  // 检查配方是否解锁
  if (!player.unlockedRecipes.craftRecipes.includes(recipeId)) {
    return { success: false, message: `配方 ${recipe.name} 尚未解锁`, timeUsed: 0 }
  }

  // 限制批量数量
  const actualQty = Math.max(
    recipe.minCraftQuantity,
    Math.min(quantity, recipe.maxCraftQuantity === -1 ? 99 : recipe.maxCraftQuantity),
  )

  // 批量检查材料
  const batchMaterials: RequiredMaterial[] = recipe.materials.map((m) => ({
    ...m,
    quantity: m.quantity * actualQty,
  }))
  const batchCosts: RecipeCost[] = recipe.costs.map((c) => ({
    ...c,
    value: c.value * actualQty,
  }))

  const canDo = canCraftRecipe(player, { ...recipe, materials: batchMaterials, costs: batchCosts })
  if (canDo) {
    return { success: false, message: canDo, timeUsed: 0 }
  }

  // 执行消耗
  applyCosts(player, batchCosts)
  consumeMaterials(player, recipe.materials)

  // 计算总耗时
  const totalTime = recipe.requirements.timeMinutes + (actualQty - 1) * recipe.additionalTimePerItem

  // 产出物品
  produceItems(player, recipe.products, actualQty)

  // 获得经验（批量制作每件获得一次）
  let totalExp = 0
  if (recipe.experienceReward) {
    const expPerCraft = recipe.experienceReward.expPerCraft ?? 0
    const firstBonus = recipe.experienceReward.firstTimeBonusExp ?? 0
    totalExp = expPerCraft * actualQty + firstBonus

    if (totalExp > 0) {
      const expEffect: GainExpEffect = {
        type: EffectType.GAIN_EXP,
        target: GainExpTarget.SURVIVAL_SKILL,
        targetId: recipe.experienceReward.skillId,
        amount: totalExp,
      }
      getEffectResolver().executeGainExpEffect(player, expEffect)
    }
  }

  return {
    success: true,
    message: `制作了 ${recipe.name} ×${actualQty}`,
    products: recipe.products.map((p) => ({
      itemId: p.itemId,
      quantity: p.baseQuantity * actualQty,
    })),
    consumedMaterials: recipe.materials.map((m) => ({
      itemId: m.itemId,
      quantity: m.quantity * actualQty,
    })),
    timeUsed: totalTime,
    expGained: totalExp,
  }
}

// ============================================================
// 烹饪（Cook）
// ============================================================

/**
 * 根据玩家技能等级计算烹饪品质
 *
 * @param player - 当前玩家
 * @param recipe - 烹饪配方
 * @returns 选中的品质等级
 */
export function calculateCookQuality(player: PlayerState, recipe: CookRecipe): CookQualityLevel {
  const qualityLevels = recipe.qualityLevels
  if (!qualityLevels || qualityLevels.length === 0) {
    // 无品质配置时返回默认产物
    return {
      level: 1,
      name: recipe.name,
      minSkillLevel: 0,
      weight: 1,
    }
  }

  // 获取玩家烹饪技能等级
  const cookingSkill = player.skills.survivalSkills[recipe.experienceReward.skillId]
  const skillLevel = cookingSkill?.level ?? 0

  // 筛选玩家可达到的品质（技能等级 >= 品质要求）
  const availableLevels = qualityLevels.filter((q) => skillLevel >= q.minSkillLevel)

  if (availableLevels.length === 0) {
    // 技能等级不够任何品质，取最低品质
    return qualityLevels.sort((a, b) => a.level - b.level)[0]!
  }

  // 按权重随机选取
  const totalWeight = availableLevels.reduce((sum, q) => sum + q.weight, 0)
  let roll = Math.random() * totalWeight
  for (const level of availableLevels) {
    roll -= level.weight
    if (roll <= 0) return level
  }

  // 兜底
  return availableLevels[availableLevels.length - 1]!
}

/**
 * 执行烹饪配方
 *
 * @param player - 当前玩家（会被直接修改）
 * @param recipeId - 烹饪配方ID
 * @returns 执行结果
 */
export function executeCook(player: PlayerState, recipeId: string): CraftResult {
  const registry = getRegistry()
  const recipe = registry.getCookRecipe(recipeId)

  if (!recipe) {
    return { success: false, message: `烹饪配方 ${recipeId} 未找到`, timeUsed: 0 }
  }

  // 检查配方是否解锁
  if (!player.unlockedRecipes.cookRecipes.includes(recipeId)) {
    return { success: false, message: `配方 ${recipe.name} 尚未解锁`, timeUsed: 0 }
  }

  // 检查条件
  const canDo = canCraftRecipe(player, recipe as BaseRecipe)
  if (canDo) {
    return { success: false, message: canDo, timeUsed: 0 }
  }

  // 执行消耗（烹饪通常只消耗材料，不消耗体力等）
  applyCosts(player, recipe.costs)
  consumeMaterials(player, recipe.materials)

  // 计算烹饪品质
  const qualityLevel = calculateCookQuality(player, recipe)

  // 根据品质确定产物
  const productItemId = qualityLevel.productItemId ?? recipe.products[0]?.itemId
  if (productItemId) {
    addItem(player, productItemId, 1)
  }

  // 获得烹饪经验
  let totalExp = 0
  if (recipe.experienceReward) {
    totalExp = recipe.experienceReward.expPerCook
    if (qualityLevel.level >= 3) {
      totalExp += recipe.experienceReward.perfectBonusExp
    }

    if (totalExp > 0) {
      const expEffect: GainExpEffect = {
        type: EffectType.GAIN_EXP,
        target: GainExpTarget.SURVIVAL_SKILL,
        targetId: recipe.experienceReward.skillId,
        amount: totalExp,
      }
      getEffectResolver().executeGainExpEffect(player, expEffect)
    }
  }

  const qualityName =
    qualityLevel.level >= 3 ? '（完美）' : qualityLevel.level >= 2 ? '（良好）' : ''

  return {
    success: true,
    message: `烹饪了 ${qualityLevel.name}${qualityName}`,
    products: productItemId ? [{ itemId: productItemId, quantity: 1 }] : [],
    consumedMaterials: recipe.materials.map((m) => ({ itemId: m.itemId, quantity: m.quantity })),
    timeUsed: recipe.cookTimeMinutes,
    expGained: totalExp,
  }
}

// ============================================================
// 建造（Build）
// ============================================================

/**
 * 执行建造配方
 *
 * @param player - 当前玩家（会被直接修改）
 * @param recipeId - 建造配方ID
 * @returns 执行结果
 */
export function executeBuild(player: PlayerState, recipeId: string): CraftResult {
  const registry = getRegistry()
  const recipe = registry.getBuildRecipe(recipeId)

  if (!recipe) {
    return { success: false, message: `建造配方 ${recipeId} 未找到`, timeUsed: 0 }
  }

  // 检查配方是否解锁
  if (!player.unlockedRecipes.buildRecipes.includes(recipeId)) {
    return { success: false, message: `配方 ${recipe.name} 尚未解锁`, timeUsed: 0 }
  }

  // 检查前置建筑（若有则检查是否已建造）
  if (recipe.prerequisiteBuildings && recipe.prerequisiteBuildings.length > 0) {
    // 前置建筑检查逻辑依赖于场景中已建造的建筑列表
    // 当前尚未实现场景建筑追踪，跳过此检查
  }

  // 检查条件
  const canDo = canCraftRecipe(player, recipe as BaseRecipe)
  if (canDo) {
    return { success: false, message: canDo, timeUsed: 0 }
  }

  // 执行消耗
  applyCosts(player, recipe.costs)
  consumeMaterials(player, recipe.materials)

  // 产出建筑产物（若有物品产物则加入背包）
  if (recipe.products && recipe.products.length > 0) {
    produceItems(player, recipe.products)
  }

  // 记录已建造的建筑ID到玩家进度中
  // 当前使用 builtStructures 字段记录，若不存在则惰性初始化
  const builtStructures = (player.progress as { builtStructures?: string[] }).builtStructures
  if (builtStructures) {
    if (!builtStructures.includes(recipe.buildResult.buildingId)) {
      builtStructures.push(recipe.buildResult.buildingId)
    }
  }

  return {
    success: true,
    message: `建造了 ${recipe.buildResult.buildingName}`,
    products: recipe.products.map((p) => ({ itemId: p.itemId, quantity: p.baseQuantity })),
    consumedMaterials: recipe.materials.map((m) => ({ itemId: m.itemId, quantity: m.quantity })),
    timeUsed: recipe.requirements.timeMinutes,
  }
}

// ============================================================
// 修复（Repair）
// ============================================================

/**
 * 获取物品的耐久度上限
 * 从物品配置中读取 durability 字段
 */
function getItemMaxDurability(itemId: string): number {
  const registry = getRegistry()
  const itemConfig = registry.getItem(itemId)
  if (!itemConfig || !('durability' in itemConfig)) return -1
  const durConfig = (itemConfig as { durability?: { maxDurability?: number } }).durability
  return durConfig?.maxDurability ?? -1
}

/**
 * 获取物品的修复材料配置
 */
function getItemRepairMaterials(
  itemId: string,
): Array<{ itemId: string; quantity: number }> | null {
  const registry = getRegistry()
  const itemConfig = registry.getItem(itemId)
  if (!itemConfig || !('repairMaterials' in itemConfig)) return null
  return (
    (itemConfig as { repairMaterials?: Array<{ itemId: string; quantity: number }> })
      .repairMaterials ?? null
  )
}

/**
 * 修复指定物品实例
 *
 * @param player - 当前玩家（会被直接修改）
 * @param instanceId - 要修复的物品实例ID
 * @returns 执行结果
 */
export function executeRepair(player: PlayerState, instanceId: string): CraftResult {
  // 查找背包中的物品
  const invIndex = player.inventory.findIndex((i) => i.instanceId === instanceId)
  if (invIndex === -1) {
    return { success: false, message: '物品未找到', timeUsed: 0 }
  }

  const invItem = player.inventory[invIndex]
  if (!invItem) {
    return { success: false, message: '物品不存在', timeUsed: 0 }
  }

  // 检查物品是否需要修复
  const maxDurability = getItemMaxDurability(invItem.itemId)
  if (maxDurability === -1) {
    return { success: false, message: '该物品无法修复', timeUsed: 0 }
  }

  if (invItem.durability >= maxDurability) {
    return { success: false, message: '物品耐久度已满，无需修复', timeUsed: 0 }
  }

  // 获取修复材料
  const repairMaterials = getItemRepairMaterials(invItem.itemId)
  if (!repairMaterials || repairMaterials.length === 0) {
    return { success: false, message: '该物品无法修复（无修复材料配置）', timeUsed: 0 }
  }

  // 检查材料
  for (const mat of repairMaterials) {
    const count = player.inventory.reduce((sum, item) => {
      if (item.itemId === mat.itemId) {
        const isEquipped = Object.values(player.equipment).includes(mat.itemId)
        return sum + (isEquipped ? 0 : item.quantity)
      }
      return sum
    }, 0)
    if (count < mat.quantity) {
      const registry = getRegistry()
      const itemName = registry.getItemName(mat.itemId)
      return {
        success: false,
        message: `修复材料不足：需要 ${itemName} ×${mat.quantity}（当前 ${count}）`,
        timeUsed: 0,
      }
    }
  }

  // 消耗材料
  for (const mat of repairMaterials) {
    removeItem(player, mat.itemId, mat.quantity)
  }

  // 恢复耐久度
  invItem.durability = maxDurability

  return {
    success: true,
    message: '物品已修复',
    timeUsed: 10, // 修复固定耗时10分钟
  }
}

// ============================================================
// 配方列表查询
// ============================================================

/**
 * 获取所有可制作的配方ID列表
 * 从已解锁的配方中筛选出当前条件满足的
 *
 * @param player - 当前玩家
 * @param unlockedIds - 已解锁的配方ID列表
 * @param type - 配方类型
 * @returns 可制作的配方ID列表
 */
export function getCraftableRecipes(
  player: PlayerState,
  unlockedIds: string[],
  type: 'craft' | 'cook' | 'build',
): string[] {
  const registry = getRegistry()
  const result: string[] = []

  for (const id of unlockedIds) {
    let recipe: BaseRecipe | undefined

    switch (type) {
      case 'craft':
        recipe = registry.getCraftRecipe(id) as BaseRecipe | undefined
        break
      case 'cook':
        recipe = registry.getCookRecipe(id) as BaseRecipe | undefined
        break
      case 'build':
        recipe = registry.getBuildRecipe(id) as BaseRecipe | undefined
        break
    }

    if (recipe && canCraftRecipe(player, recipe) === null) {
      result.push(id)
    }
  }

  return result
}

/**
 * 获取所有可修复的物品实例ID列表
 *
 * @param player - 当前玩家
 * @returns 可修复的物品实例ID列表
 */
export function getRepairableItems(
  player: PlayerState,
): Array<{ instanceId: string; itemId: string; name: string }> {
  const registry = getRegistry()
  const result: Array<{ instanceId: string; itemId: string; name: string }> = []

  for (const invItem of player.inventory) {
    if (!invItem) continue

    // 检查是否有耐久度且在配置中有修复材料
    const maxDur = getItemMaxDurability(invItem.itemId)
    const repairMats = getItemRepairMaterials(invItem.itemId)
    const itemConfig = registry.getItem(invItem.itemId)

    if (maxDur > 0 && repairMats && invItem.durability < maxDur) {
      result.push({
        instanceId: invItem.instanceId,
        itemId: invItem.itemId,
        name: itemConfig?.name ?? invItem.itemId,
      })
    }
  }

  return result
}
