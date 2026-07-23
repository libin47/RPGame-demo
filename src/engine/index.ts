// src/engine/index.ts

export { initRegistry, getRegistry } from './registry'
export { createNewPlayerState } from './player'
export { getEffectResolver } from './effect'
export { advanceTime, calculateTemperature } from './world'

// 随机工具
export {
  randomInt,
  randomFloat,
  chance,
  weightedSelect,
  randomPick,
  randomPickN,
  shuffle,
  randomQuantity,
} from './dice'

// 公式库
export * from './formula'

// 事件系统
export {
  evaluateCondition,
  findFirstVisibleFrame,
  getVisibleOptions,
  isOptionAvailable,
  canTriggerEvent,
  resolveTextVariation,
} from './event'

// 探索逻辑
export {
  selectSceneDescription,
  getVisibleEventEntries,
  getResolvedDescriptionText,
  markDescriptionSeen,
  checkAutoTrigger,
  getTimeOfDay,
} from './exploration'

// 背包系统
export {
  addItem,
  removeItem,
  getItemCount,
  hasItem,
  equipItem,
  unequipSlot,
  unequipAll,
  recalculateCarryWeight,
  getCarryWeightRate,
  isOverloaded,
  useConsumable,
  getItemsByCategory,
} from './inventory'

// 状态系统
export {
  applyStatus,
  removeStatus,
  hasStatus,
  getStatusStackCount,
  updateStatusTimers,
  updateStatusTurns,
  triggerStatusEffects,
  calculateStatusModifiers,
  removeBattleEndStatuses,
  removeRestStatuses,
} from './status'

// 战斗系统
export {
  createBattle,
  startBattle,
  executePlayerAction,
  settleBattle,
  BattlePhase,
  BattleResult,
  PlayerActionType,
} from './combat'
export type { BattleState, BattleEnemy } from './combat'

// 配方系统（制作/烹饪/建造/修复）
export {
  canCraftRecipe,
  executeCraft,
  executeCook,
  calculateCookQuality,
  executeBuild,
  executeRepair,
  getCraftableRecipes,
  getRepairableItems,
} from './crafting'
export type { CraftResult } from './crafting'

// 结局系统
export { checkEnding } from './ending'
export type { EndingCheckResult } from './ending'

// 交易系统
export {
  getVisibleGoods,
  calculateBuyPrice,
  calculateSellPrice,
  buyFromTrader,
  sellToTrader,
} from './trade'
export type { TradeResult } from './trade'

// CG系统
export { canTriggerCG, startCG, nextCGFrame } from './cg'
export type { CGPlayState } from './cg'
