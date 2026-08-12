// src/engine/index.ts

export { initRegistry, getRegistry } from './registry'
export { createNewPlayerState } from './player'
export { getEffectResolver, onAttributeChanged, applySanDelta } from './effect'
export type { AttributeChangeRecord, AttributeChangeKey, GrowthAttributeKey } from './effect'
export { advanceTime, calculateTemperature } from './world'
export { findMapRoute, isMapNodeUnlocked } from './map'
export type { MapRouteLeg } from './map'

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
  evaluateConditions,
  findFirstVisibleFrame,
  getVisibleOptions,
  getVisibleVariations,
  isOptionAvailable,
  getOptionResultIcon,
  canTriggerEvent,
  getSanLevel,
} from './event'

// 探索逻辑
export {
  selectSceneDescription,
  getVisibleEventEntries,
  getResolvedDescriptionText,
  markDescriptionSeen,
  markDescriptionEventSeen,
  getScenePassiveEvent,
  getTimeOfDay,
  resolveTextVariation,
} from './exploration'

// 背包系统
export {
  addItem,
  onItemAdded,
  removeItem,
  getItemCount,
  hasItem,
  equipItem,
  equipItemById,
  unequipSlot,
  unequipByItemId,
  unequipAll,
  isEquippedInstance,
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
  selectBattleTarget,
  applyBattleStartStatuses,
  BattlePhase,
  BattleResult,
  PlayerActionType,
  getPlayerBattleSkillDistance,
  canSkillHitAtDistance,
  getPlayerBattleSkills,
  getPlayerSkillCooldown,
  LOG_ROLE_PLAYER,
  LOG_ROLE_ENEMY,
  LOG_CALC_SEP,
  DMG_TOKEN_START,
  DMG_TOKEN_END,
  calcPlayerTotalDefense,
  MIN_BATTLE_DISTANCE,
  MAX_BATTLE_DISTANCE,
} from './combat'
export type { BattleState, BattleEnemy, DamageCalcDetail } from './combat'

// 配方系统（制作/烹饪/建造/修复）
export {
  canCraftRecipe,
  executeCraft,
  executeCook,
  calculateCookQuality,
  executeBuild,
  executeUpgradeBuild,
  executeDeconstruct,
  executeRepair,
  getCraftableRecipes,
  getRepairableItems,
  getItemRepairInfo,
} from './crafting'
export type { CraftResult, ItemSource } from './crafting'

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

// 仓库存储系统
export {
  getStorageItems,
  getStorageUsedSlots,
  getStorageMaxSlots,
  getSubSceneStorageItemCount,
  removeFromSubSceneStorage,
  addToStorage,
  removeFromStorage,
  clearStorage,
} from './storage'

// 场景系统CG系统
export { canTriggerCG, startCG, nextCGFrame, getVisibleCGOptions, jumpToCGFrame } from './cg'
export type { CGPlayState } from './cg'
