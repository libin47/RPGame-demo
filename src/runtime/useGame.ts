// src/runtime/useGame.ts

import { reactive, readonly } from 'vue'
import type { PlayerState } from '@/types/player'
import type {
  Scene,
  SceneDescription,
  SubScene,
  SceneInteraction,
  InteractionType,
  InteractionBehaviorParams,
  ResourceInteraction,
  MoveInteraction,
} from '@/types/scene'
import type { GameEvent, EventFrame, EventOptionResult } from '@/types/event'
import type { EffectResult } from '@/types/effect'
import type { EndingConfig } from '@/types/ending'
import {
  getRegistry,
  getEffectResolver,
  advanceTime,
  evaluateCondition,
  addItem,
  onItemAdded,
  selectSceneDescription,
  markDescriptionSeen,
  checkAutoTrigger,
  markDescriptionEventSeen,
} from '@/engine'
import { getVisibleOptions, findFirstVisibleFrame } from '@/engine'
import { findMapRoute } from '@/engine'
import {
  createBattle,
  startBattle,
  executePlayerAction,
  settleBattle,
  selectBattleTarget,
} from '@/engine'
import { BattlePhase, BattleResult, PlayerActionType } from '@/engine'
import type { BattleState } from '@/engine'
import { removeRestStatuses } from '@/engine'
import { checkEnding } from '@/engine'
import { startCG } from '@/engine'
import type { CGPlayState } from '@/engine'
import { ItemCategory } from '@/types/item'
import { equipItem as engineEquipItem, unequipSlot, useConsumable } from '@/engine'
import {
  executeBuild,
  executeUpgradeBuild,
  executeDeconstruct,
  executeCraft as engineExecuteCraft,
  executeCook as engineExecuteCook,
  executeRepair as engineExecuteRepair,
} from '@/engine'
import { addToStorage, removeFromStorage, getStorageItems } from '@/engine'
import { getSubSceneStorageItemCount, removeFromSubSceneStorage } from '@/engine'
import { removeItem, getItemCount } from '@/engine'
import { nextCGFrame } from '@/engine'
import type { CraftResult, ItemSource } from '@/engine'
import type { ButtonOption } from '@/types/option'
import type { buildOption } from '@/types/build'
import type { GameMap } from '@/types/map'

/**
 * 游戏界面模式
 */
export type GameMode =
  | 'normal' // 常态界面
  | 'event' // 事件界面
  | 'battle' // 战斗界面
  | 'inventory' // 背包界面
  | 'build' // 建造界面
  | 'building' // 建筑交互界面
  | 'craft' // 制作界面（后续实现）
  | 'map' // 地图界面（后续实现）
  | 'ending' // 结局界面
  | 'cg' // CG过场界面
  | 'trade' // 交易界面

/**
 * 游戏运行时状态
 * 管理当前显示的界面模式、场景、事件等
 */
interface GameRuntimeState {
  /** 当前界面模式 */
  mode: GameMode

  /** 玩家状态 */
  player: PlayerState

  /** 当前场景配置 */
  currentScene: Scene

  /** 当前子场景配置（可能为 null） */
  currentSubScene: SubScene | null

  /** 当前显示的场景描述文本 */
  sceneDescription: string
  /** 当前场景描述配置（包含事件入口定义） */
  currentDescriptionConfig: SceneDescription | null // 新增

  /** 当前事件配置（仅在 mode === 'event' 时有值） */
  currentEvent: GameEvent | null

  /** 当前事件帧（仅在 mode === 'event' 时有值） */
  currentFrame: EventFrame | null

  /** 当前战斗状态（仅在 mode === 'battle' 时有值） */
  currentBattle: BattleState | null

  /** 事件帧文本前缀（上一帧选中的选项结果文本，拼接到当前帧文本前） */
  frameTextPrefix: string

  /** 场景文本前缀（从事件跳转到场景时，显示 exitText/enterText 在场景描述前） */
  sceneTextPrefix: string
  /** 场景文本后缀（从事件返回场景时，显示 exitText/enterText 在场景描述后） */
  sceneTextAfter: string

  /** 游戏日志（底部提示信息） */
  logMessage: string

  /** 当前触发的结局配置（仅在 mode === 'ending' 时有值） */
  currentEnding: EndingConfig | null

  /** 结局触发原因 */
  endingReason: string

  /** 当前CG播放状态（仅在 mode === 'cg' 时有值） */
  currentCG: CGPlayState | null

  /** 当前交易商人ID（仅在 mode === 'trade' 时有值） */
  currentTraderId: string | null

  /** 当前交互的建筑ID（仅在 mode === 'building' 时有值） */
  currentBuildingId: string | null

  /** 战斗中待跳转的帧ID（从 TriggerBattleResult 中存储） */
  pendingBattleFrameIds: {
    victoryFrameId?: string
    defeatFrameId?: string
    escapeFrameId?: string
  } | null

  /** 进入背包前的模式（关闭背包后恢复） */
  previousMode: GameMode
}

/**
 * 营地建筑基本信息（用于场景中显示"营地设施"入口）
 */
export interface CampsiteBuildingInfo {
  buildId: string
  buildName: string
  description: string
  emoji: string
}

/**
 * 创建游戏状态
 * 接收初始 PlayerState，加载初始场景
 */
function createGameState(initialPlayer: PlayerState) {
  const registry = getRegistry()

  const sceneId = initialPlayer.currentLocation.sceneId
  const subSceneId = initialPlayer.currentLocation.subSceneId

  const scene = registry.getScene(sceneId)
  if (!scene) {
    throw new Error(`初始场景 ${sceneId} 未找到`)
  }

  const subScene = subSceneId ? (registry.getSubScene(subSceneId) ?? null) : null

  const currentTarget = subScene || scene
  const selectedDesc = selectSceneDescription(currentTarget, initialPlayer)
  const sceneDescription = selectedDesc ? selectedDesc.text : '（场景描述缺失）'

  const state = reactive<GameRuntimeState>({
    mode: 'normal',
    player: initialPlayer,
    currentScene: scene,
    currentSubScene: subScene,
    sceneDescription,
    currentDescriptionConfig: selectedDesc || null,
    currentEvent: null,
    currentFrame: null,
    currentBattle: null,
    frameTextPrefix: '',
    sceneTextPrefix: '',
    sceneTextAfter: '',
    logMessage: '',
    currentEnding: null,
    endingReason: '',
    currentCG: null,
    currentTraderId: null,
    currentBuildingId: null,
    pendingBattleFrameIds: null,
    previousMode: 'normal',
  })

  // 标记初始描述为已看过
  if (selectedDesc) {
    markDescriptionSeen(selectedDesc, initialPlayer)
  }

  return state
}

// ============================================================
// 组合式函数
// ============================================================

/** 上一个 useGame 实例注册的物品获得监听器注销函数（新实例创建时先注销旧的，避免重复触发） */
let disposeItemAddedListener: (() => void) | null = null

/**
 * 使用游戏状态
 * 在 Vue 组件中通过此函数获取和操作游戏状态
 */
export function useGame(initialPlayer: PlayerState) {
  const state = createGameState(initialPlayer)
  const registry = getRegistry()

  /**
   * 执行一组效果，并将日志输出到底部消息栏
   */
  function executeEffects(effects: EffectResult[] | undefined): void {
    if (!effects || effects.length === 0) return
    const resolver = getEffectResolver()
    const logs = resolver.executeEffectResults(state.player, effects)
    if (logs.length > 0) {
      state.logMessage = logs.filter(Boolean).join('；')
    }
  }

  /**
   * 进入事件
   * 从场景交互按钮或事件入口触发
   *
   * @param eventId - 事件ID
   * @param fromEventEntry - 是否由场景描述中的事件入口点击触发（用于 removeAfterInteraction 判断）
   */
  function enterEvent(eventId: string, fromEventEntry = false): void {
    const event = registry.getEvent(eventId)
    if (!event) {
      state.logMessage = `事件 ${eventId} 未找到`
      return
    }

    // 由场景描述事件入口触发时，检查是否需要标记描述为已使用
    if (fromEventEntry && state.currentDescriptionConfig?.eventFlag) {
      markDescriptionEventSeen(state.currentDescriptionConfig, state.player)
    }

    // 获取第一个可见帧（按 order 顺序，满足 displayFlag 和 displayCondition 的帧）
    const firstFrame = findFirstVisibleFrame(event.frames, state.player)
    if (!firstFrame) {
      state.logMessage = `事件 ${eventId} 没有可见的帧`
      return
    }

    state.mode = 'event'
    state.currentEvent = event
    state.currentFrame = firstFrame
    state.frameTextPrefix = ''
    state.sceneTextPrefix = ''
    state.sceneTextAfter = ''

    // 执行事件级 onEnterEffects
    executeEffects(event.onEnterEffects)
    // 执行首帧 onEnterEffects
    executeEffects(firstFrame.onEnterEffects)
  }

  // ============================================================
  // 事件选项加权选择
  // ============================================================

  /**
   * 从选项的结果列表中按条件过滤 + 权重概率选取一个结果
   * 规则：
   *  1. 根据 condition 过滤出可用结果
   *  2. 如果仅一个满足条件，直接返回（无视权重）
   *  3. 如果多个满足条件，按 weight 比例随机选取
   *
   * @param option - 被选中的选项
   * @param player - 玩家状态
   * @returns 选中的结果
   */
  function pickWeightedResult(
    option: NonNullable<(typeof state)['currentFrame']>['options'][number],
    player: PlayerState,
  ): EventOptionResult {
    const results = option.results

    // 1. 按条件过滤
    const candidates = results.filter((r): r is EventOptionResult =>
      evaluateCondition(r.condition, player),
    )

    // 至少选一个——即使候选列表为空，也直接从原列表中取第一个（兜底）
    if (candidates.length === 0) {
      console.warn(`选项 ${option.id} 的结果全部不符合条件，取第一个`)
      return results[0]!
    }

    // 2. 仅一个候选 → 直接返回
    if (candidates.length === 1) return candidates[0]!

    // 3. 多个候选 → 加权随机
    const totalWeight = candidates.reduce((sum, r) => sum + (r.weight ?? 1), 0)
    let roll = Math.random() * totalWeight
    for (const candidate of candidates) {
      roll -= candidate.weight ?? 1
      if (roll <= 0) return candidate
    }

    // 兜底（浮点精度原因）
    return candidates[candidates.length - 1]!
  }

  /**
   * 处理事件选项选择
   * 根据选项结果执行对应操作
   */
  function selectEventOption(optionId: string): void {
    if (!state.currentFrame) return

    const option = state.currentFrame.options.find((o) => o.id === optionId)
    if (!option) return

    // 选择选项消耗5分钟游戏时间
    advanceGameTime(5)

    const result = pickWeightedResult(option, state.player)
    const resolver = getEffectResolver()

    // 标记选项已选（用于 isOneTime 追踪）
    if (option.usedFlag) {
      state.player.flags[option.usedFlag] = true
      // 打印已选标志位
      console.log(`已选标志位: ${option.usedFlag}`)
      console.log(`已选标志位值: ${state.player.flags[option.usedFlag]}`)
    }

    // 先执行选项的消耗（后续实现）
    // ...

    // 根据选项结果类型执行不同操作
    switch (result.type) {
      case 'nextFrame': {
        // 执行效果
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
            state.logMessage = logs.filter(Boolean).join('；')
          }
        }

        // 设置标志位
        if (result.setFlags) {
          for (const [flagId, value] of Object.entries(result.setFlags)) {
            state.player.flags[flagId] = value
          }
        }

        // 记录选项结果文本，拼接到下一帧文本前
        state.frameTextPrefix = result.text || ''

        // 跳转到目标帧（先从所有帧中查找指定ID，找不到则用条件判断）
        const nextFrame = state.currentEvent?.frames.find((f) => f.id === result.targetFrameId)
        if (nextFrame) {
          state.currentFrame = nextFrame
          // 执行新帧的 onEnterEffects
          executeEffects(nextFrame.onEnterEffects)
        } else if (state.currentEvent) {
          // 用条件选择第一个可见帧
          const visibleFrame = findFirstVisibleFrame(state.currentEvent.frames, state.player)
          if (visibleFrame) {
            state.currentFrame = visibleFrame
            // 执行新帧的 onEnterEffects
            executeEffects(visibleFrame.onEnterEffects)
          } else {
            state.logMessage = `目标帧 ${result.targetFrameId} 未找到`
          }
        }
        break
      }

      case 'endEvent': {
        // 执行效果
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
            state.logMessage = logs.filter(Boolean).join('；')
          }
        }

        // 设置标志位
        if (result.setFlags) {
          for (const [flagId, value] of Object.entries(result.setFlags)) {
            state.player.flags[flagId] = value
          }
        }

        // 结束事件
        state.mode = 'normal'
        state.currentEvent = null
        state.currentFrame = null
        if (result.exitText) {
          setSceneTextAfter(result.exitText)
        }
        console.log(state.sceneTextAfter)
        break
      }

      case 'switchScene': {
        // 执行效果
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
            state.logMessage = logs.filter(Boolean).join('；')
          }
        }

        // 设置标志位
        if (result.setFlags) {
          for (const [flagId, value] of Object.entries(result.setFlags)) {
            state.player.flags[flagId] = value
          }
        }

        // 切换场景
        const newScene = registry.getScene(result.sceneId)
        if (newScene) {
          state.currentScene = newScene
          state.currentSubScene = result.subSceneId
            ? (registry.getSubScene(result.subSceneId) ?? null)
            : null

          const target = state.currentSubScene || state.currentScene
          const selectedDesc = selectSceneDescription(target, state.player)
          state.sceneDescription = selectedDesc ? selectedDesc.text : '（场景描述缺失）'
          state.currentDescriptionConfig = selectedDesc || null
          if (selectedDesc) {
            markDescriptionSeen(selectedDesc, state.player)
          }

          state.player.currentLocation.sceneId = result.sceneId
          state.player.currentLocation.subSceneId = result.subSceneId ?? null
        }

        state.mode = 'normal'
        state.currentEvent = null
        state.currentFrame = null

        if (result.enterText) {
          state.sceneTextPrefix = result.enterText
        }
        break
      }

      case 'triggerEvent': {
        // 执行效果（如果有的话）
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
            state.logMessage = logs.filter(Boolean).join('；')
          }
        }

        // 设置标志位
        if (result.setFlags) {
          for (const [flagId, value] of Object.entries(result.setFlags)) {
            state.player.flags[flagId] = value
          }
        }

        enterEvent(result.eventId)
        break
      }

      case 'triggerBattle': {
        // 存储战斗结果待跳转的帧ID
        state.pendingBattleFrameIds = {
          victoryFrameId: result.victoryFrameId,
          defeatFrameId: result.defeatFrameId,
          escapeFrameId: result.escapeFrameId,
        }

        // 创建并开始战斗
        const battle = createBattle(state.player, result.enemyId)
        state.currentBattle = battle
        state.mode = 'battle'
        startBattle(battle)
        state.logMessage = battle.logs.filter(Boolean).join('；')
        break
      }

      case 'playCG': {
        // 执行效果
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
            state.logMessage = logs.filter(Boolean).join('；')
          }
        }

        // 设置标志位
        if (result.setFlags) {
          for (const [flagId, value] of Object.entries(result.setFlags)) {
            state.player.flags[flagId] = value
          }
        }

        // 播放CG
        const cgPlay = startCG(result.cgId)
        if (cgPlay) {
          state.currentCG = cgPlay
          state.mode = 'cg'
        } else {
          state.logMessage = 'CG未找到'
        }
        break
      }

      case 'openTrade': {
        // 执行效果
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
            state.logMessage = logs.filter(Boolean).join('；')
          }
        }

        // 设置标志位
        if (result.setFlags) {
          for (const [flagId, value] of Object.entries(result.setFlags)) {
            state.player.flags[flagId] = value
          }
        }

        state.currentTraderId = result.traderId
        state.mode = 'trade'
        break
      }
    }
  }
  /**
   * 处理场景交互按钮点击
   */
  function handleInteraction(interactionId: string): void {
    // 从当前场景或子场景中查找交互
    const target = state.currentSubScene || state.currentScene
    if (!target.interactions) return
    const interaction = target.interactions.find((i) => i.id === interactionId)
    if (!interaction) return

    // 根据交互类型执行不同操作
    const interactionType = interaction.interactionType
    const params = interaction.behaviorParams

    switch (interactionType) {
      case 'explore': {
        state.sceneTextAfter = ''
        // 探索：推进10分钟，刷新场景描述
        advanceGameTime(10)
        refreshSceneDescription()
        state.logMessage = '你在周围仔细探索了一番'
        break
      }

      case 'event': {
        if (params?.interactionType === 'event') {
          // 触发事件（消耗少量时间）
          advanceGameTime(5)
          enterEvent(params.eventId)
          break
        }
      }

      case 'enterSubScene': {
        state.sceneTextAfter = ''
        if (params?.interactionType === 'enterSubScene') {
          // 进入子场景（消耗5分钟）
          const subScene = registry.getSubScene(params.subSceneId)
          if (subScene) {
            advanceGameTime(5)
            state.currentSubScene = subScene
            state.player.currentLocation.subSceneId = params.subSceneId
            const selectedDesc = selectSceneDescription(subScene, state.player)
            state.sceneDescription = selectedDesc ? selectedDesc.text : '（场景描述缺失）'
            state.currentDescriptionConfig = selectedDesc || null
            if (selectedDesc) {
              markDescriptionSeen(selectedDesc, state.player)
            }
          }
          break
        }
      }

      case 'exitSubScene': {
        state.sceneTextAfter = ''
        // 离开子场景返回母场景（消耗5分钟）
        advanceGameTime(5)
        state.currentSubScene = null
        state.player.currentLocation.subSceneId = null
        const selectedDesc = selectSceneDescription(state.currentScene, state.player)
        state.sceneDescription = selectedDesc ? selectedDesc.text : '（场景描述缺失）'
        state.currentDescriptionConfig = selectedDesc || null
        if (selectedDesc) {
          markDescriptionSeen(selectedDesc, state.player)
        }
        break
      }

      case 'rest': {
        // 休息：消耗60分钟（1小时），执行被动效果
        advanceGameTime(60)
        state.logMessage = '你休息了一会儿，恢复了一些体力'
        break
      }

      case 'talk': {
        if (params?.interactionType === 'talk') {
          // 对话：消耗10分钟
          advanceGameTime(10)
          enterEvent(params.eventId)
          break
        }
      }

      case 'trade': {
        if (params?.interactionType === 'trade') {
          // 打开交易面板
          state.currentTraderId = params.traderId
          state.mode = 'trade'
          break
        }
      }

      case 'move': {
        state.sceneTextAfter = ''
        if (params?.interactionType === 'move') {
          // 方向移动：消耗10分钟
          advanceGameTime(10)
          state.logMessage = `你向 ${params.direction} 方向移动`
          break
        }
      }

      case 'moveToScene': {
        state.sceneTextAfter = ''
        if (params?.interactionType === 'moveToScene') {
          // 场景间移动：消耗指定的旅行时间
          advanceGameTime(params.travelTimeMinutes || 15)
          const targetScene = registry.getScene(params.targetSceneId)
          if (targetScene) {
            state.currentScene = targetScene
            state.currentSubScene = null
            const selectedDesc = selectSceneDescription(targetScene, state.player)
            state.sceneDescription = selectedDesc ? selectedDesc.text : '（场景描述缺失）'
            state.currentDescriptionConfig = selectedDesc || null
            if (selectedDesc) {
              markDescriptionSeen(selectedDesc, state.player)
            }
            state.player.currentLocation.sceneId = params.targetSceneId
            state.player.currentLocation.subSceneId = null
            state.logMessage = params.pathDescription
          }
          break
        }
      }

      case 'function': {
        if (params?.interactionType === 'function') {
          if (params.functionType === 'build') {
            handleBuild()
          } else {
            state.logMessage = `功能 "${params.functionType}" 尚未实现`
          }
          break
        }
      }

      default:
        state.logMessage = '未知交互类型'
    }

    handleFlag(interaction)
  }

  // ============================================================
  // 建筑相关操作
  // ============================================================

  function handleRest(timeHours: number, option: buildOption | undefined): void {
    // 1. 推进游戏时间
    advanceGameTime(timeHours * 60)

    // 2. 恢复体力（沿用原休息公式：每休息 10 分钟恢复 1 点体力）
    state.player.survival.stamina = Math.min(
      state.player.survival.maxStamina,
      state.player.survival.stamina + Math.round((timeHours * 60) / 10) * (option?.buildLevel || 1),
    )
    // 回复HP
    state.player.survival.hp = Math.min(
      state.player.survival.maxHp,
      state.player.survival.hp + Math.round((timeHours * 60) / 10) * (option?.buildLevel || 1),
    )
    // 回复san
    state.player.survival.san = Math.min(
      state.player.survival.maxSan,
      state.player.survival.san +
        Math.round((timeHours * 60) / 10) * ((option?.buildLevel || 1) - 1),
    )

    // 3. 移除休息时应移除的状态
    removeRestStatuses(state.player)

    // 4、记录日志
    setSceneTextAfter((option?.description || '').replace(/\{time\}/g, timeHours.toString()))
    setLogMessage(`你休息了 ${timeHours} 小时，恢复了一些体力`)

    // 5. 返回场景界面（退出建筑交互模式）
    exitBuilding()
  }

  // ============================================================
  // 新 ScenePanel 事件处理
  // ============================================================

  /**
   * 探索：推进时间、刷新描述
   */
  function handleExplore(explore: ButtonOption): void {
    state.sceneTextAfter = ''
    advanceGameTime(10)
    refreshSceneDescription()
    state.logMessage = '你在周围仔细探索了一番'
    handleFlag(explore)
  }
  /**
   * 建造：推进时间、刷新描述
   */
  function handleBuild(): void {
    refreshSceneDescription()
    state.logMessage = '进入建造模式'
    state.mode = 'build'
  }

  /**
   * 资源采集/战斗
   */
  function handleCollect(collect: ResourceInteraction): void {
    // 检查可用条件
    if (!evaluateCondition(collect.availableCondition, state.player)) {
      setSceneTextAfter(collect.unavailableTooltip || '该操作当前不可用')
      return
    }
    // ── 前置校验 ──
    // 1. 采集点数量是否为0
    if (
      collect.paramId &&
      state.player.params[collect.paramId] != null &&
      state.player.params[collect.paramId]! <= 0
    ) {
      setSceneTextAfter('该资源点已经没有可采集的资源了')
      return
    }
    // 2. 体力是否充足
    const costEnergy = collect.costEnergy ?? 0
    if (costEnergy > 0 && state.player.survival.stamina < costEnergy) {
      setSceneTextAfter('体力不足，无法进行采集')
      return
    }

    // 扣除时间和体力
    advanceGameTime(collect.costTime ?? 10)

    // 显示资源文本（使用 sceneTextAfter 追加到主文字区域下方）
    if (collect.text) {
      setSceneTextAfter(collect.text)
    }

    // 如果是敌人类型 → 进入战斗（按 quantity 展开，同一敌人可出现多个）
    if (collect.resourceType === 'enemy' && collect.enemyConfig && collect.enemyConfig.length > 0) {
      const enemyIds: string[] = []
      for (const e of collect.enemyConfig) {
        // 条件不满足或概率未触发 → 跳过该组
        if (e.condition && !evaluateCondition(e.condition, state.player)) continue
        const prob = e.probability ?? 1
        if (Math.random() >= prob) continue
        const quantity = Math.max(1, Math.floor(e.quantity ?? 1))
        for (let i = 0; i < quantity; i++) {
          enemyIds.push(e.enemyId)
        }
      }

      if (enemyIds.length > 0) {
        const battle = createBattle(state.player, enemyIds)
        startBattle(battle)
        state.currentBattle = battle
        state.mode = 'battle'
      } else {
        state.logMessage = '没有遇到敌人'
      }
    } else if (collect.resourceType === 'item' && collect.itemConfig) {
      // 物品类型 → 直接获得
      for (const itemCfg of collect.itemConfig) {
        const prob = itemCfg.probability ?? 1
        if (Math.random() < prob) {
          const added = addItem(state.player, itemCfg.itemId, itemCfg.quantity)
          if (added > 0) {
            // 场景文本追加由物品获得监听器统一处理，这里只更新底部日志
            state.logMessage = `采集到 ${registry.getItemName(itemCfg.itemId)} ×${added}`
          }
        }
      }
    }

    // 扣除 param（如果有）
    if (collect.paramId && state.player.params[collect.paramId] !== undefined) {
      const current = state.player.params[collect.paramId]
      if (current !== undefined && current > 0) {
        state.player.params[collect.paramId] = Math.max(0, current - 1)
      }
    }
    handleFlag(collect)
  }

  /**
   * 场景移动（enterSubScene / exitSubScene / move）
   */
  function handleSceneMove(moveAction: MoveInteraction): void {
    const moveType = moveAction.moveType ?? 'move'
    state.sceneTextAfter = ''

    // 前置校验：体力是否充足
    const costEnergy = moveAction.costEnergy ?? 0
    if (costEnergy > 0 && state.player.survival.stamina < costEnergy) {
      setSceneTextAfter('体力不足，无法行动')
      return
    }

    if (moveType === 'enterSubScene' && moveAction.subSceneId) {
      advanceGameTime(moveAction.costTime ?? 5)
      const subScene = registry.getSubScene(moveAction.subSceneId)
      if (subScene) {
        state.currentSubScene = subScene
        state.player.currentLocation.subSceneId = moveAction.subSceneId
        const selectedDesc = selectSceneDescription(subScene, state.player)
        state.sceneDescription = selectedDesc ? selectedDesc.text : '（场景描述缺失）'
        state.currentDescriptionConfig = selectedDesc || null
        if (selectedDesc) {
          markDescriptionSeen(selectedDesc, state.player)
        }
      }
    } else if (moveType === 'exitSubScene') {
      advanceGameTime(moveAction.costTime ?? 5)
      state.currentSubScene = null
      state.player.currentLocation.subSceneId = null
      const selectedDesc = selectSceneDescription(state.currentScene, state.player)
      state.sceneDescription = selectedDesc ? selectedDesc.text : '（场景描述缺失）'
      state.currentDescriptionConfig = selectedDesc || null
      if (selectedDesc) {
        markDescriptionSeen(selectedDesc, state.player)
      }
    } else {
      // 普通 move 类型：打开大地图界面（不消耗时间，移动时再结算）
      state.sceneTextAfter = ''
      state.logMessage = ''
      state.mode = 'map'
    }
    handleFlag(moveAction)
  }

  /**
   * 获取当前大地图配置（由 MapPanel 显示）
   */
  function getCurrentMap() {
    const mapId = state.player.currentLocation.mapId || registry.getInitialMapId()
    return registry.getMap(mapId) ?? null
  }

  /**
   * 计算地图移动方案（时间 + 体力）
   * 优先沿地图路径（paths）逐段累计；配置了路径但不可达时返回 null（无法移动）；
   * 未配置路径的地图退回坐标距离公式（兼容旧地图）
   */
  function calculateMoveCost(
    map: GameMap,
    startScene: Scene | null,
    endScene: Scene,
    player: PlayerState,
  ): { minutes: number; staminaCost: number } | null {
    const start = map.nodes.find((n) => n.sceneId === startScene?.id)
    const end = map.nodes.find((n) => n.sceneId === endScene.id)
    if (!start || !end) {
      return null
    }

    // 沿路径行走
    const route = findMapRoute(map, start.id, end.id, player)
    if (route && route.length > 0) {
      return {
        minutes: route.reduce((sum, leg) => sum + leg.travelMinutes, 0),
        staminaCost: route.reduce((sum, leg) => sum + leg.staminaCost, 0),
      }
    }

    // 配置了路径但无可行路线 → 无法移动
    const paths = map.paths ?? []
    if (paths.length > 0) return null

    // 兜底：坐标欧氏距离（像素）作为分钟数
    return {
      minutes: Math.round(
        Math.sqrt(
          (end.position.x - start.position.x) ** 2 + (end.position.y - start.position.y) ** 2,
        ),
      ),
      staminaCost: 0,
    }
  }

  /**
   * 从地图点击节点移动到目标场景
   */
  function moveToMapScene(sceneId: string): void {
    const targetScene = registry.getScene(sceneId)
    if (!targetScene) {
      state.logMessage = `场景 ${sceneId} 不存在`
      state.mode = 'normal'
      return
    }
    // 根据路径/距离计算移动方案（时间 + 体力）
    const currentMap =
      registry.getMap(state.player.currentLocation.mapId || registry.getInitialMapId()) ?? null
    if (!currentMap) {
      state.logMessage = '当前地图不存在'
      state.mode = 'normal'
      return
    }
    const cost = calculateMoveCost(currentMap, state.currentScene, targetScene, state.player)

    // 无可行路径 → 无法移动（仅影响配置了 paths 的地图）
    if (!cost) {
      state.logMessage = `没有通往「${targetScene.name}」的可行路径，无法前往`
      return
    }

    // 体力校验
    if (cost.staminaCost > 0 && state.player.survival.stamina < cost.staminaCost) {
      state.logMessage = `体力不足，无法前往${targetScene.name}（需要 ${cost.staminaCost} 点体力）`
      return
    }

    // 扣除体力并推进时间
    if (cost.staminaCost > 0) {
      state.player.survival.stamina = Math.max(0, state.player.survival.stamina - cost.staminaCost)
    }
    advanceGameTime(cost.minutes)

    // 移动到目标场景
    state.sceneTextAfter = ''
    state.sceneTextPrefix = ''
    state.currentScene = targetScene
    state.currentSubScene = null
    const selectedDesc = selectSceneDescription(targetScene, state.player)
    state.sceneDescription = selectedDesc ? selectedDesc.text : '（场景描述缺失）'
    state.currentDescriptionConfig = selectedDesc || null
    if (selectedDesc) {
      markDescriptionSeen(selectedDesc, state.player)
    }
    state.player.currentLocation.sceneId = sceneId
    state.player.currentLocation.subSceneId = null
    state.mode = 'normal'
  }

  /**
   * 关闭大地图，返回进入地图前的场景
   */
  function closeMap(): void {
    state.sceneTextAfter = ''
    state.mode = 'normal'
  }

  /**
   * 构建营地材料的外部来源（当前子场景的所有仓库）
   * 供建造/升级/制作/烹饪/修复时合并统计与补充消耗
   */
  function getStorageSource(subSceneId?: string): ItemSource | null {
    if (!subSceneId) return null
    return {
      countOf: (itemId) => getSubSceneStorageItemCount(state.player, subSceneId, itemId),
      remove: (itemId, quantity) =>
        removeFromSubSceneStorage(state.player, subSceneId, itemId, quantity),
    }
  }

  /**
   * 执行建造
   */
  function executeBuildRecipe(buildId: string): CraftResult {
    const subSceneId = state.currentSubScene?.id
    const source = getStorageSource(subSceneId)
    const result = executeBuild(state.player, buildId, subSceneId, source ?? undefined)

    if (result.success) {
      if (result.timeUsed > 0) {
        advanceGameTime(result.timeUsed)
      }
      state.logMessage = result.message
    } else {
      state.logMessage = result.message
    }

    return result
  }

  /**
   * 执行建筑升级
   */
  function executeUpgradeBuildMode(buildId: string, targetSubBuildId: string): CraftResult {
    const subSceneId = state.currentSubScene?.id
    if (!subSceneId) {
      state.logMessage = '当前不在营地场景中'
      return { success: false, message: '当前不在营地场景中', timeUsed: 0 }
    }

    const result = executeUpgradeBuild(
      state.player,
      buildId,
      targetSubBuildId,
      subSceneId,
      getStorageSource(subSceneId) ?? undefined,
    )

    if (result.success) {
      if (result.timeUsed > 0) {
        advanceGameTime(result.timeUsed)
      }
      state.logMessage = result.message
    } else {
      state.logMessage = result.message
    }

    return result
  }

  /**
   * 执行拆除建筑
   */
  function executeDeconstructBuilding(buildId: string): CraftResult {
    const subSceneId = state.currentSubScene?.id
    if (!subSceneId) {
      state.logMessage = '当前不在营地场景中'
      return { success: false, message: '当前不在营地场景中', timeUsed: 0 }
    }

    const result = executeDeconstruct(state.player, buildId, subSceneId)

    if (result.success) {
      if (result.timeUsed > 0) {
        advanceGameTime(result.timeUsed)
      }
      state.logMessage = result.message
      // 退出建筑交互模式返回场景
      exitBuilding()
    } else {
      state.logMessage = result.message
    }

    return result
  }

  /**
   * 退出建造模式返回场景
   */
  function exitBuildMode(): void {
    state.mode = 'normal'
  }

  /**
   * 获取当前场景中已有建筑的基本信息列表（建筑名 + 等级）
   * 用于在营地子场景中显示"营地设施"入口
   */
  function getCampsiteBuildings(): CampsiteBuildingInfo[] {
    const subScene = state.currentSubScene
    if (!subScene || !subScene.isCampsite) return []

    const initIds: string[] = subScene.buildingInit ?? []
    const builtIds: string[] = state.player.progress.campBuildings[subScene.id] ?? []
    const allIds = new Set([...initIds, ...builtIds])

    const result: CampsiteBuildingInfo[] = []

    // 建筑 emoji 映射
    const buildingEmojiMap: Record<string, string> = {
      营火: '🔥',
      加固营火: '🔥',
      大型营火: '🔥',
      木墙: '🧱',
      石墙: '🧱',
      金属墙: '🧱',
      工作台: '🔨',
      简易工作台: '🔨',
      高级工作台: '🔨',
      储物箱: '📦',
      大型储物箱: '📦',
      床铺: '🛏️',
      简易床铺: '🛏️',
      舒适床铺: '🛏️',
      篝火: '🔥',
      围栏: '🪵',
      水井: '🪣',
    }

    for (const bldId of allIds) {
      const build = registry.getBuilding(bldId)
      if (!build) continue

      const currentSubId =
        state.player.progress.campBuildingLevels[subScene.id]?.[bldId] ?? build.defaultBuild
      const currentSub = build.subBuild.find((s) => s.buildId === currentSubId)
      if (!currentSub) continue

      result.push({
        buildId: bldId,
        buildName: currentSub.buildName,
        description: currentSub.descriptionConfig.description,
        emoji: buildingEmojiMap[bldId] ?? buildingEmojiMap[currentSub.buildName] ?? '🏗️',
      })
    }

    // 按 buildingList 顺序排序（未在列表中的排在后面）
    if (subScene.buildingList && subScene.buildingList.length > 0) {
      const orderMap = new Map(subScene.buildingList.map((id, i) => [id, i]))
      result.sort((a, b) => {
        const ia = orderMap.get(a.buildId) ?? 999
        const ib = orderMap.get(b.buildId) ?? 999
        return ia - ib
      })
    }

    return result
  }

  /**
   * 进入建筑交互模式
   */
  function enterBuilding(buildId: string): void {
    state.mode = 'building'
    state.currentBuildingId = buildId
    state.logMessage = ''
  }

  /**
   * 退出建筑交互模式返回场景
   */
  function exitBuilding(): void {
    state.mode = 'normal'
    state.currentBuildingId = null
    state.logMessage = ''
  }

  /**
   * 打开背包
   * 记录当前模式，切换为 inventory
   */
  function openInventory(): void {
    state.previousMode = state.mode
    state.mode = 'inventory'
  }

  /**
   * 关闭背包
   * 恢复进入背包前的模式
   */
  function closeInventory(): void {
    state.mode = state.previousMode
    state.logMessage = ''
  }

  /**
   * 设置底部日志消息
   */
  function setLogMessage(message: string): void {
    state.logMessage = message
  }

  // 设置场景文本下部描述
  function setSceneTextAfter(description: string): void {
    if (state.sceneTextAfter) {
      state.sceneTextAfter += '\n'
    }
    state.sceneTextAfter += description
  }

  // 注册物品获得监听：每次获得物品时在场景文本后追加提示
  disposeItemAddedListener?.()
  disposeItemAddedListener = onItemAdded((itemId, quantity) => {
    const itemName = registry.getItemName(itemId)
    console.log(`你获得了【${itemName}】×${quantity}`)
    setSceneTextAfter(`你获得了【${itemName}】×${quantity}`)
  })

  /**
   * 替换文本中的占位符
   * 支持 {player.weapon}、{player.armor}、{env.weatherDesc}、{env.timeOfDayDesc}
   */
  function resolveText(text: string): string {
    let resolved = text

    // 玩家武器名称
    if (state.player.equipment.weapon) {
      resolved = resolved.replace(
        /\{player\.weapon\}/g,
        registry.getItemName(state.player.equipment.weapon),
      )
    } else {
      resolved = resolved.replace(/\{player\.weapon\}/g, '徒手')
    }

    // 玩家护甲名称
    if (state.player.equipment.body) {
      resolved = resolved.replace(
        /\{player\.armor\}/g,
        registry.getItemName(state.player.equipment.body),
      )
    } else {
      resolved = resolved.replace(/\{player\.armor\}/g, '破旧的衣物')
    }

    // 天气描述（简化为天气ID，后续可扩展为详细描述）
    const weatherConfig = registry.getWeather(state.player.progress.weatherId)
    resolved = resolved.replace(
      /\{env\.weatherDesc\}/g,
      weatherConfig ? weatherConfig.description : '未知天气',
    )

    // 时间段描述（根据时间分钟数判断）
    resolved = resolved.replace(
      /\{env\.timeOfDayDesc\}/g,
      getTimeOfDayDescription(state.player.progress.timeMinutes),
    )

    return resolved
  }

  /**
   * 推进游戏时间并刷新场景
   *
   * 调用 engine/world.ts 的 advanceTime 处理时间推进和被动效果，
   * 然后根据天气、季节等变化刷新场景描述。
   * 最后检查是否触发结局（如 hp/san 归零）。
   *
   * @param minutes - 经过的游戏分钟数
   */
  function advanceGameTime(minutes: number): void {
    if (minutes <= 0) return

    // 获取当前场景的温度影响值
    const target = state.currentSubScene || state.currentScene
    const sceneTempModifier = target.temperatureModifier

    // 调用引擎推进时间
    const result = advanceTime(state.player, sceneTempModifier, minutes)

    // 收集被动效果日志
    if (result.logs.length > 0) {
      state.logMessage = result.logs.filter(Boolean).join('；')
    }

    // 天气变化时，重新选取场景描述（因为部分描述可能依赖天气条件）
    if (result.weatherChanged) {
      refreshSceneDescription()
    }

    // 季节变化时，重新选取场景描述
    if (result.seasonChanged) {
      refreshSceneDescription()
    }

    // 时间推进后检查结局条件（hp/san归零等）
    checkAndTriggerEnding()
  }

  /**
   * 在当前事件中按帧ID跳转
   * 查找帧并设置 currentFrame，同时执行帧的 onEnterEffects
   */
  function jumpToEventFrame(frameId: string): void {
    const frame = state.currentEvent?.frames.find((f) => f.id === frameId)
    if (frame) {
      state.currentFrame = frame
      state.frameTextPrefix = ''
      state.mode = 'event'
      executeEffects(frame.onEnterEffects)
    } else {
      state.logMessage = `事件帧 ${frameId} 未找到`
    }
  }

  /**
   * 执行玩家战斗操作
   *
   * @param actionType - 操作类型
   * @param skillId - 技能ID（使用技能时）
   * @param itemInstanceId - 物品实例ID（使用物品时）
   */
  function executeBattleAction(
    actionType: PlayerActionType,
    skillId?: string,
    itemInstanceId?: string,
  ): void {
    if (!state.currentBattle) {
      state.logMessage = '当前没有进行中的战斗'
      return
    }

    const battle = state.currentBattle

    // 玩家点击"结束战斗"：结算胜利奖励并退出战斗
    if (actionType === PlayerActionType.END_BATTLE) {
      settleVictoryAndExit()
      return
    }

    executePlayerAction(state.player, battle, actionType, skillId, itemInstanceId)

    // 检查战斗是否结束
    if (battle.result === BattleResult.VICTORY) {
      // 战斗胜利：保留战斗界面，隐藏操作栏，等待玩家点击"结束战斗"按钮结算奖励并退出
      state.logMessage = battle.logs.filter(Boolean).join('；')
    } else if (battle.result === BattleResult.DEFEAT) {
      // 尝试跳转到战败帧
      const defeatFrameId = state.pendingBattleFrameIds?.defeatFrameId
      if (defeatFrameId && state.currentEvent) {
        jumpToEventFrame(defeatFrameId)
        state.currentBattle = null
        state.pendingBattleFrameIds = null
        state.logMessage = battle.logs.filter(Boolean).join('；')
      } else {
        // 没有战败帧则进入结局判定
        state.currentBattle = null
        state.pendingBattleFrameIds = null
        checkAndTriggerEnding()
        if (state.mode !== 'ending') {
          state.mode = 'normal'
        }
        state.logMessage = battle.logs.filter(Boolean).join('；')
      }
    } else if (battle.result === BattleResult.ESCAPED) {
      // 尝试跳转到逃跑帧
      const escapeFrameId = state.pendingBattleFrameIds?.escapeFrameId
      if (escapeFrameId && state.currentEvent) {
        jumpToEventFrame(escapeFrameId)
      } else {
        state.mode = state.currentEvent ? 'event' : 'normal'
      }

      state.currentBattle = null
      state.pendingBattleFrameIds = null
      state.logMessage = battle.logs.filter(Boolean).join('；')
    } else {
      // 战斗还在继续，显示日志
      state.logMessage = battle.logs.filter(Boolean).join('；')
    }
  }

  /**
   * 结算胜利奖励并退出战斗：
   * 生成战利品 → 跳转到胜利帧（或返回事件/正常模式）→ 关闭战斗
   */
  function settleVictoryAndExit(): void {
    if (!state.currentBattle) return
    const battle = state.currentBattle
    const settleLogs = settleBattle(state.player, battle)

    // 尝试跳转到胜利帧
    const victoryFrameId = state.pendingBattleFrameIds?.victoryFrameId
    if (victoryFrameId && state.currentEvent) {
      jumpToEventFrame(victoryFrameId)
    } else {
      state.mode = state.currentEvent ? 'event' : 'normal'
    }

    state.currentBattle = null
    state.pendingBattleFrameIds = null
    state.logMessage = [...battle.logs, ...settleLogs].filter(Boolean).join('；')
  }

  /**
   * 设置玩家当前攻击目标（多敌人战斗）
   * @param enemyInstanceId - 敌人实例ID（同一配置的多个敌人用 #下标 区分）
   */
  function setBattleTarget(enemyInstanceId: string): void {
    if (!state.currentBattle) return
    selectBattleTarget(state.currentBattle, enemyInstanceId)
  }

  /**
   * 刷新当前场景描述
   * 使用 exploration.selectSceneDescription 根据条件选取描述
   * 同时检测描述中的自动触发事件
   */
  function refreshSceneDescription(): void {
    const target = state.currentSubScene || state.currentScene
    const selectedDesc = selectSceneDescription(target, state.player)
    if (selectedDesc) {
      state.sceneDescription = selectedDesc.text
      state.currentDescriptionConfig = selectedDesc
      markDescriptionSeen(selectedDesc, state.player)

      // 检测场景描述中的自动触发事件
      const autoTriggerResult = checkAutoTrigger(selectedDesc, state.player)
      if (autoTriggerResult.shouldTrigger && autoTriggerResult.eventKey) {
        // 查找事件入口对应的 eventId
        const entry = selectedDesc.eventEntries?.find((e) => e.key === autoTriggerResult.eventKey)
        if (entry) {
          enterEvent(entry.eventId, true) // 自动触发也视为事件入口触发
          return // 自动触发事件后不再显示场景
        }
      }
    }
  }
  // 处理标志位
  function handleFlag(option: ButtonOption): void {
    if (option.usedFlag) {
      state.player.flags[option.usedFlag] = true
    }
    if (option.usedCountFlag) {
      const currentVal = state.player.flagsNum[option.usedCountFlag]
      if (typeof currentVal === 'number') {
        state.player.flagsNum[option.usedCountFlag] = (currentVal + 1) % 1000000000
      } else if (currentVal === undefined) {
        state.player.flagsNum[option.usedCountFlag] = 1
      }
    }
  }

  /**
   * 触发结局
   * 设置游戏模式为 ending，记录结局信息
   */
  function triggerEnding(ending: EndingConfig, reason: string): void {
    state.mode = 'ending'
    state.currentEnding = ending
    state.endingReason = reason
    state.logMessage = `结局：${ending.name}`
  }

  /**
   * 检查是否触发结局
   * 在时间推进或关键事件后调用
   */
  function checkAndTriggerEnding(): void {
    const result = checkEnding(state.player)
    if (result.triggered && result.ending) {
      triggerEnding(result.ending, result.reason || '')
    }
  }

  // ============================================================
  // 物品使用与装备
  // ============================================================

  /**
   * 使用物品
   */
  function handleUseItem(instanceId: string): void {
    const invItem = state.player.inventory.find((i) => i.instanceId === instanceId)
    if (!invItem) {
      state.logMessage = '物品未找到'
      return
    }

    const config = registry.getItem(invItem.itemId)
    if (!config) {
      state.logMessage = '物品配置未找到'
      return
    }

    if (config.category === ItemCategory.CONSUMABLE) {
      const log = useConsumable(state.player, instanceId)
      state.logMessage = log
    } else if (config.category === ItemCategory.DOCUMENT) {
      // 阅读文档（暂仅显示名称）
      state.logMessage = `你阅读了《${config.name}》`
    } else {
      state.logMessage = `${config.name} 无法在此使用`
    }
  }

  /**
   * 装备物品
   */
  function handleEquipItem(instanceId: string): void {
    const invItem = state.player.inventory.find((i) => i.instanceId === instanceId)
    if (!invItem) {
      state.logMessage = '物品未找到'
      return
    }

    const ok = engineEquipItem(state.player, instanceId)
    if (ok) {
      const config = registry.getItem(invItem.itemId)
      state.logMessage = `装备了 ${config?.name || invItem.itemId}`
    } else {
      state.logMessage = '装备失败：无法装备此物品'
    }
  }

  /**
   * 卸下装备（根据物品ID查找所在槽位）
   */
  function handleUnequipItem(itemId: string): void {
    const equipment = state.player.equipment as Record<string, string | null>
    for (const [slot, equippedId] of Object.entries(equipment)) {
      if (equippedId === itemId) {
        const ok = unequipSlot(state.player, slot as keyof typeof state.player.equipment)
        if (ok) {
          const config = registry.getItem(itemId)
          state.logMessage = `卸下了 ${config?.name || itemId}`
        } else {
          state.logMessage = '卸下失败'
        }
        return
      }
    }
    state.logMessage = '该物品未装备'
  }

  /**
   * 执行制作配方（由 RecipePanel 调用）
   */
  function executeCraftRecipeMode(recipeId: string, quantity: number): CraftResult {
    const result = engineExecuteCraft(
      state.player,
      recipeId,
      quantity,
      getStorageSource(state.currentSubScene?.id) ?? undefined,
    )
    if (result.success && result.timeUsed > 0) {
      advanceGameTime(result.timeUsed)
    }
    state.logMessage = result.message
    return result
  }

  /**
   * 执行烹饪配方（由 RecipePanel 调用）
   */
  function executeCookRecipeMode(recipeId: string, deviceLevel: number = 0): CraftResult {
    const result = engineExecuteCook(
      state.player,
      recipeId,
      getStorageSource(state.currentSubScene?.id) ?? undefined,
      deviceLevel,
    )
    if (result.success && result.timeUsed > 0) {
      advanceGameTime(result.timeUsed)
    }
    state.logMessage = result.message
    return result
  }

  /**
   * 修复指定物品实例（由 RepairPanel 调用）
   */
  function repairItem(instanceId: string): CraftResult {
    const result = engineExecuteRepair(
      state.player,
      instanceId,
      getStorageSource(state.currentSubScene?.id) ?? undefined,
    )
    if (result.success && result.timeUsed > 0) {
      advanceGameTime(result.timeUsed)
    }
    state.logMessage = result.message
    return result
  }

  /**
   * 获取指定场景/建筑当前等级对应的子建筑配置
   */
  function getCurrentSubBuild(buildId: string, subSceneId: string) {
    const build = registry.getBuilding(buildId)
    if (!build) return null
    const currentSubId =
      state.player.progress.campBuildingLevels[subSceneId]?.[buildId] ?? build.defaultBuild
    return build.subBuild.find((s) => s.buildId === currentSubId) ?? null
  }

  /**
   * 将背包物品存入当前仓库（由 StorePanel 调用）
   */
  function handleStoreItem(itemId: string, quantity: number): number {
    const subSceneId = state.currentSubScene?.id
    const buildId = state.currentBuildingId
    if (!subSceneId || !buildId) return 0
    const added = addToStorage(state.player, subSceneId, buildId, itemId, quantity)
    state.logMessage =
      added > 0 ? `已将 ${registry.getItemName(itemId)} ×${added} 存入仓库` : '仓库已满'
    return added
  }

  /**
   * 从当前仓库取出物品到背包（由 StorePanel 调用）
   */
  function handleRetrieveItem(instanceId: string, quantity: number): number {
    const subSceneId = state.currentSubScene?.id
    const buildId = state.currentBuildingId
    if (!subSceneId || !buildId) return 0
    const storage = getStorageItems(state.player, subSceneId, buildId)
    const target = storage.find((s) => s.instanceId === instanceId)
    const removed = removeFromStorage(state.player, subSceneId, buildId, instanceId, quantity)
    if (removed > 0 && target) {
      state.logMessage = `已将 ${registry.getItemName(target.itemId)} ×${removed} 取出仓库`
    }
    return removed
  }

  /**
   * 维修当前建筑（由 BuildingDetail 调用）
   */
  function handleRepairBuilding(buildId: string): void {
    const subSceneId = state.currentSubScene?.id
    if (!subSceneId) return
    const subBuild = getCurrentSubBuild(buildId, subSceneId)
    if (!subBuild?.repairMaterials || subBuild.repairMaterials.length === 0) return

    const source = getStorageSource(subSceneId)
    for (const mat of subBuild.repairMaterials) {
      const count =
        getItemCount(state.player, mat.itemId) + (source ? source.countOf(mat.itemId) : 0)
      if (count < mat.quantity) {
        state.logMessage = `维修材料不足：${registry.getItemName(mat.itemId)}`
        return
      }
    }
    for (const mat of subBuild.repairMaterials) {
      let remaining = mat.quantity
      remaining -= removeItem(state.player, mat.itemId, remaining)
      if (remaining > 0 && source) {
        source.remove(mat.itemId, remaining)
      }
    }
    state.logMessage = `${subBuild.buildName} 已修复`
  }

  /**
   * 推进CG到下一帧（由 CGView 调用）
   */
  function advanceCG(): boolean {
    if (!state.currentCG) return false
    return nextCGFrame(state.currentCG)
  }

  /**
   * 结束CG，返回正常场景模式（由 CGView 调用）
   */
  function endCG(): void {
    state.mode = 'normal'
    state.currentCG = null
  }

  return {
    state: readonly(state) as GameRuntimeState,
    enterEvent,
    selectEventOption,
    handleInteraction,
    handleExplore,
    handleBuild,
    handleRest,
    handleCollect,
    handleSceneMove,
    getCurrentMap,
    moveToMapScene,
    closeMap,
    getCampsiteBuildings,
    enterBuilding,
    exitBuilding,
    setLogMessage,
    executeBuildRecipe,
    executeUpgradeBuildMode,
    executeDeconstructBuilding,
    executeCraftRecipeMode,
    executeCookRecipeMode,
    repairItem,
    handleStoreItem,
    handleRetrieveItem,
    handleRepairBuilding,
    advanceCG,
    endCG,
    exitBuildMode,
    openInventory,
    closeInventory,
    setSceneTextAfter,
    resolveText,
    advanceGameTime,
    executeBattleAction,
    setBattleTarget,
    triggerEnding,
    checkAndTriggerEnding,
    handleUseItem,
    handleEquipItem,
    handleUnequipItem,
  }
}

/**
 * 根据分钟数返回时间段描述
 */
function getTimeOfDayDescription(minutes: number): string {
  const hour = Math.floor(minutes / 60)
  if (hour >= 23 || hour < 2) return '深夜'
  if (hour >= 2 && hour < 5) return '凌晨'
  if (hour >= 5 && hour < 8) return '清晨'
  if (hour >= 8 && hour < 13) return '上午'
  if (hour >= 13 && hour < 18) return '下午'
  if (hour >= 18 && hour < 21) return '傍晚'
  return '夜晚'
}
