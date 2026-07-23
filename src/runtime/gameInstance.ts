// src/runtime/gameInstance.ts
// 游戏实例共享状态模块
// 职责：在视图切换（主菜单→游戏、CG→游戏等）之间保持游戏运行状态
// 使用方法：MainMenuView 中 startNewGame → 路由跳转；GameView 中 getGameInstance → 获取状态

import { useGame } from './useGame'
import { createNewPlayerState } from '@/engine'
import { getRegistry } from '@/engine'
import { addItem } from '@/engine'
import { PlayerActionType } from '@/engine'
import type { CharacterClass } from '@/types/character'
import type { PlayerState, NewGameConfig } from '@/types/player'
import type { GameMode } from './useGame'
import type { SceneInteraction } from '@/types/scene'
import type { EndingConfig } from '@/types/ending'

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
    readonly currentBattle: import('@/engine').BattleState | null
    readonly frameTextPrefix: string
    readonly logMessage: string
    readonly currentEnding: EndingConfig | null
    readonly endingReason: string
    readonly currentCG: import('@/engine').CGPlayState | null
    readonly currentTraderId: string | null
  }
  /** 进入事件 */
  enterEvent: (eventId: string, fromEventEntry?: boolean) => void
  /** 选择事件选项 */
  selectEventOption: (optionId: string) => void
  /** 处理场景交互 */
  handleInteraction: (interactionId: string) => void
  /** 获取当前场景的交互按钮列表 */
  getCurrentInteractions: () => SceneInteraction[]
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
    getCurrentInteractions: game.getCurrentInteractions,
    resolveText: game.resolveText,
    advanceGameTime: game.advanceGameTime,
    executeBattleAction: game.executeBattleAction,
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
    getCurrentInteractions: game.getCurrentInteractions,
    resolveText: game.resolveText,
    advanceGameTime: game.advanceGameTime,
    executeBattleAction: game.executeBattleAction,
    triggerEnding: game.triggerEnding,
    checkAndTriggerEnding: game.checkAndTriggerEnding,
    useItem: game.handleUseItem,
    equipItem: game.handleEquipItem,
    unequipItem: game.handleUnequipItem,
  }
  return currentInstance
}
