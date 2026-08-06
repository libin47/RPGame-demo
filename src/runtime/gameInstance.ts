// src/runtime/gameInstance.ts
// 游戏实例共享状态模块
// 职责：在视图切换（主菜单→游戏、CG→游戏等）之间保持游戏运行状态
// 使用方法：MainMenuView 中 startNewGame → 路由跳转；GameView 中 getGameInstance → 获取状态

import { useGame } from './useGame'
import type { CampsiteBuildingInfo, RollResultInfo } from './useGame'
import { createNewPlayerState } from '@/engine'
import { getRegistry } from '@/engine'
import { addItem } from '@/engine'
import { PlayerActionType } from '@/engine'
import type { CharacterClass } from '@/types/character'
import type { PlayerState, NewGameConfig } from '@/types/player'
import type { GameMode } from './useGame'
import type { ResourceInteraction, MoveInteraction } from '@/types/scene'
import type { GameMap } from '@/types/map'
import type { EndingConfig } from '@/types/ending'
import type { CraftResult } from '@/engine'
import type { ButtonOption } from '@/types/option'
import type { buildOption } from '@/types/build'

/** 游戏运行时实例的接口定义 */
export interface GameInstance {
  /** 响应式游戏运行时状态 */
  state: {
    readonly mode: GameMode
    readonly player: import('@/types/player').PlayerState
    readonly currentScene: import('@/types/scene').Scene
    readonly currentSubScene: import('@/types/scene').SubScene | null
    readonly sceneDescription: string
    readonly currentDescriptionConfig: import('@/types/scene').SceneDescription | null
    readonly currentEvent: import('@/types/event').GameEvent | null
    readonly currentFrame: import('@/types/event').EventFrame | null
    readonly rollResultInfo: RollResultInfo | null
    readonly currentBattle: import('@/engine').BattleState | null
    readonly frameTextPrefix: string
    readonly sceneTextPrefix: string
    readonly sceneTextAfter: string
    readonly logMessage: string
    readonly currentEnding: EndingConfig | null
    readonly endingReason: string
    readonly currentCG: import('@/engine').CGPlayState | null
    readonly currentTraderId: string | null
    readonly currentBuildingId: string | null
  }
  /** 进入事件 */
  enterEvent: (eventId: string, fromEventEntry?: boolean) => void
  /** 选择事件选项 */
  selectEventOption: (optionId: string) => void
  /** 处理场景交互 */
  handleInteraction: (interactionId: string) => void
  /** 探索周围 */
  handleExplore: (explore: ButtonOption) => void
  /** 建造 */
  handleBuild: () => void
  /** 休息 */
  handleRest: (timeHours: number, option: buildOption | undefined) => void
  /** 资源采集/战斗 */
  handleCollect: (collect: ResourceInteraction) => void
  /** 场景移动 */
  handleSceneMove: (moveAction: MoveInteraction) => void
  /** 获取当前大地图配置 */
  getCurrentMap: () => GameMap | null
  /** 从地图移动到目标场景 */
  moveToMapScene: (sceneId: string) => void
  /** 关闭大地图，返回进入地图前的场景 */
  closeMap: () => void
  /** 获取当前场景中营地建筑基本信息列表 */
  getCampsiteBuildings: () => CampsiteBuildingInfo[]
  /** 进入建筑交互模式 */
  enterBuilding: (buildId: string) => void
  /** 退出建筑交互模式返回场景 */
  exitBuilding: () => void
  /** 设置底部日志消息 */
  setLogMessage: (message: string) => void
  /** 执行建造配方 */
  executeBuildRecipe: (recipeId: string) => CraftResult
  /** 执行建筑升级 */
  executeUpgradeBuild: (buildId: string, targetSubBuildId: string) => CraftResult
  /** 执行拆除建筑 */
  executeDeconstruct: (buildId: string) => CraftResult
  /** 执行制作配方 */
  executeCraftRecipe: (recipeId: string, quantity: number) => CraftResult
  /** 执行烹饪配方 */
  executeCookRecipe: (recipeId: string, deviceLevel?: number) => CraftResult
  /** 修复指定物品实例 */
  repairItem: (instanceId: string) => CraftResult
  /** 将背包物品存入当前仓库 */
  storeItem: (itemId: string, quantity: number) => number
  /** 从当前仓库取出物品到背包 */
  retrieveItem: (instanceId: string, quantity: number) => number
  /** 维修当前建筑 */
  repairBuilding: (buildId: string) => void
  /** 推进CG到下一帧 */
  advanceCG: () => boolean
  /** 结束CG，返回正常场景模式 */
  endCG: () => void
  /** 选择CG选项 */
  selectCGOption: (optionId: string) => void
  /** 退出建造模式 */
  exitBuildMode: () => void
  /** 打开背包 */
  openInventory: () => void
  /** 关闭背包 */
  closeInventory: () => void
  /** 设置场景文本后缀 */
  setSceneTextAfter: (text: string) => void
  /** 替换文本中的占位符 */
  resolveText: (text: string) => string
  /** 推进游戏时间（分钟），自动处理跨天、天气、被动效果等 */
  advanceGameTime: (minutes: number) => void
  /** 执行玩家战斗操作 */
  executeBattleAction: (
    actionType: PlayerActionType,
    skillId?: string,
    itemInstanceId?: string,
  ) => void
  /** 设置玩家当前攻击目标（敌人实例ID，多敌人战斗） */
  setBattleTarget: (enemyInstanceId: string) => void
  /** 触发结局 */
  triggerEnding: (ending: EndingConfig, reason: string) => void
  /** 检查结局条件 */
  checkAndTriggerEnding: () => void
  /** 使用物品 */
  useItem: (instanceId: string) => void
  /** 装备物品 */
  equipItem: (instanceId: string) => void
  /** 卸下装备（按物品ID） */
  unequipItem: (itemId: string) => void
}

/** 全局唯一的游戏运行实例（未开始时为 null） */
let currentInstance: GameInstance | null = null

/**
 * 开始新游戏
 * 根据职业配置创建玩家状态，初始化游戏运行时
 * @param classConfig - 玩家所选职业配置
 * @param playerName - 玩家名称（可选，默认"幸存者"）
 * @returns 游戏运行时实例
 */
export function startNewGame(classConfig: CharacterClass, playerName?: string): GameInstance {
  const registry = getRegistry()

  // 构造新游戏配置（从注册表读取初始值）
  const config: NewGameConfig = {
    classId: classConfig.id,
    playerName: playerName?.trim() || '幸存者',
    initialMapId: registry.getInitialMapId(),
    initialSceneId: registry.getInitialSceneId(),
    initialSubSceneId: registry.getInitialSubSceneId(),
    initialDay: registry.getInitialDay(),
    initialTimeMinutes: registry.getInitialTimeMinutes(),
    initialSeason: registry.getInitialSeason(),
    initialSeasonPhase: registry.getInitialSeasonPhase(),
    initialWeatherId: registry.getInitialWeatherId(),
    initialCorruption: registry.getInitialCorruption(),
  }

  // 创建玩家状态
  const playerState = createNewPlayerState(classConfig, config)

  // 给玩家初始道具：手表（显示时间）和精神检测仪（显示SAN数值）
  addItem(playerState, 'watch', 1)
  addItem(playerState, 'san_meter', 1)

  // 初始化游戏运行时
  const game = useGame(playerState)
  currentInstance = {
    state: game.state,
    enterEvent: game.enterEvent,
    selectEventOption: game.selectEventOption,
    handleInteraction: game.handleInteraction,
    handleExplore: game.handleExplore,
    handleBuild: game.handleBuild,
    handleRest: game.handleRest,
    handleCollect: game.handleCollect,
    handleSceneMove: game.handleSceneMove,
    getCurrentMap: game.getCurrentMap,
    moveToMapScene: game.moveToMapScene,
    closeMap: game.closeMap,
    getCampsiteBuildings: game.getCampsiteBuildings,
    enterBuilding: game.enterBuilding,
    exitBuilding: game.exitBuilding,
    setLogMessage: game.setLogMessage,
    executeBuildRecipe: game.executeBuildRecipe,
    executeUpgradeBuild: game.executeUpgradeBuildMode,
    executeDeconstruct: game.executeDeconstructBuilding,
    executeCraftRecipe: game.executeCraftRecipeMode,
    executeCookRecipe: game.executeCookRecipeMode,
    repairItem: game.repairItem,
    storeItem: game.handleStoreItem,
    retrieveItem: game.handleRetrieveItem,
    repairBuilding: game.handleRepairBuilding,
    advanceCG: game.advanceCG,
    endCG: game.endCG,
    selectCGOption: game.selectCGOption,
    exitBuildMode: game.exitBuildMode,
    openInventory: game.openInventory,
    closeInventory: game.closeInventory,
    setSceneTextAfter: game.setSceneTextAfter,
    resolveText: game.resolveText,
    advanceGameTime: game.advanceGameTime,
    executeBattleAction: game.executeBattleAction,
    setBattleTarget: game.setBattleTarget,
    triggerEnding: game.triggerEnding,
    checkAndTriggerEnding: game.checkAndTriggerEnding,
    useItem: game.handleUseItem,
    equipItem: game.handleEquipItem,
    unequipItem: game.handleUnequipItem,
  }

  return currentInstance
}

/**
 * 获取当前游戏运行实例
 * @returns 游戏实例，若游戏未开始则返回 null
 */
export function getGameInstance(): GameInstance | null {
  return currentInstance
}

/**
 * 从存档恢复游戏实例
 * 根据已保存的玩家状态重新创建游戏运行时
 *
 * @param playerState - 从存档反序列化的玩家状态
 * @returns 游戏运行时实例
 */
export function restoreGame(playerState: PlayerState): GameInstance {
  const game = useGame(playerState)
  currentInstance = {
    state: game.state,
    enterEvent: game.enterEvent,
    selectEventOption: game.selectEventOption,
    handleInteraction: game.handleInteraction,
    handleExplore: game.handleExplore,
    handleBuild: game.handleBuild,
    handleRest: game.handleRest,
    handleCollect: game.handleCollect,
    handleSceneMove: game.handleSceneMove,
    getCurrentMap: game.getCurrentMap,
    moveToMapScene: game.moveToMapScene,
    closeMap: game.closeMap,
    getCampsiteBuildings: game.getCampsiteBuildings,
    enterBuilding: game.enterBuilding,
    exitBuilding: game.exitBuilding,
    setLogMessage: game.setLogMessage,
    executeBuildRecipe: game.executeBuildRecipe,
    executeUpgradeBuild: game.executeUpgradeBuildMode,
    executeDeconstruct: game.executeDeconstructBuilding,
    executeCraftRecipe: game.executeCraftRecipeMode,
    executeCookRecipe: game.executeCookRecipeMode,
    repairItem: game.repairItem,
    storeItem: game.handleStoreItem,
    retrieveItem: game.handleRetrieveItem,
    repairBuilding: game.handleRepairBuilding,
    advanceCG: game.advanceCG,
    endCG: game.endCG,
    selectCGOption: game.selectCGOption,
    exitBuildMode: game.exitBuildMode,
    openInventory: game.openInventory,
    closeInventory: game.closeInventory,
    setSceneTextAfter: game.setSceneTextAfter,
    resolveText: game.resolveText,
    advanceGameTime: game.advanceGameTime,
    executeBattleAction: game.executeBattleAction,
    setBattleTarget: game.setBattleTarget,
    triggerEnding: game.triggerEnding,
    checkAndTriggerEnding: game.checkAndTriggerEnding,
    useItem: game.handleUseItem,
    equipItem: game.handleEquipItem,
    unequipItem: game.handleUnequipItem,
  }
  return currentInstance
}
