// src/runtime/useGame.ts

import { reactive, readonly } from 'vue'
import type { PlayerState } from '@/types/player'
import type { Scene, SceneDescription, SubScene } from '@/types/scene'
import type { GameEvent, EventFrame } from '@/types/event'
import type { EndingConfig } from '@/types/ending'
import { getRegistry, getEffectResolver, advanceTime } from '@/engine'
import { selectSceneDescription, markDescriptionSeen, checkAutoTrigger } from '@/engine'
import { getVisibleOptions, findFirstVisibleFrame } from '@/engine'
import { createBattle, startBattle, executePlayerAction, settleBattle } from '@/engine'
import { BattlePhase, BattleResult, PlayerActionType } from '@/engine'
import type { BattleState } from '@/engine'
import { removeRestStatuses } from '@/engine'
import { checkEnding } from '@/engine'
import { startCG } from '@/engine'
import type { CGPlayState } from '@/engine'
import { ItemCategory } from '@/types/item'
import { equipItem as engineEquipItem, unequipSlot, useConsumable } from '@/engine'

/**
 * 游戏界面模式
 */
export type GameMode =
  | 'normal' // 常态界面：场景描述 + 交互按钮
  | 'event' // 事件界面：事件文本 + 选项按钮
  | 'battle' // 战斗界面
  | 'inventory' // 背包界面（后续实现）
  | 'build' // 建造界面（后续实现）
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
    logMessage: '',
    currentEnding: null,
    endingReason: '',
    currentCG: null,
    currentTraderId: null,
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

/**
 * 使用游戏状态
 * 在 Vue 组件中通过此函数获取和操作游戏状态
 */
export function useGame(initialPlayer: PlayerState) {
  const state = createGameState(initialPlayer)
  const registry = getRegistry()

  /**
   * 进入事件
   * 从场景交互按钮或事件入口触发
   */
  function enterEvent(eventId: string): void {
    const event = registry.getEvent(eventId)
    if (!event) {
      state.logMessage = `事件 ${eventId} 未找到`
      return
    }

    // 获取第一个帧
    const firstFrame = event.frames[0]
    if (!firstFrame) {
      state.logMessage = `事件 ${eventId} 没有帧`
      return
    }

    state.mode = 'event'
    state.currentEvent = event
    state.currentFrame = firstFrame
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

    const result = option.result
    const resolver = getEffectResolver()

    // 标记选项已选（用于 isOneTime 追踪）
    if (option.selectedFlag) {
      state.player.flags[option.selectedFlag] = true
      // 打印已选标志位
      console.log(`已选标志位: ${option.selectedFlag}`)
      console.log(`已选标志位值: ${state.player.flags[option.selectedFlag]}`)
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

        // 跳转到目标帧（先从所有帧中查找指定ID，找不到则用条件判断）
        const nextFrame = state.currentEvent?.frames.find((f) => f.id === result.targetFrameId)
        if (nextFrame) {
          state.currentFrame = nextFrame
        } else if (state.currentEvent) {
          // 用条件选择第一个可见帧
          const visibleFrame = findFirstVisibleFrame(state.currentEvent.frames, state.player)
          if (visibleFrame) {
            state.currentFrame = visibleFrame
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
          state.logMessage = (state.logMessage ? state.logMessage + '。' : '') + result.exitText
        }
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
          state.logMessage = (state.logMessage ? state.logMessage + '。' : '') + result.enterText
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
    const interaction = target.interactions.find((i) => i.id === interactionId)
    if (!interaction) return

    // 根据交互类型执行不同操作
    const params = interaction.behaviorParams

    switch (params.interactionType) {
      case 'explore': {
        // 探索：推进10分钟，刷新场景描述
        advanceGameTime(10)
        refreshSceneDescription()
        state.logMessage = '你在周围仔细探索了一番'
        break
      }

      case 'event': {
        // 触发事件（消耗少量时间）
        advanceGameTime(5)
        enterEvent(params.eventId)
        break
      }

      case 'enterSubScene': {
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

      case 'exitSubScene': {
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
        // 对话：消耗10分钟
        advanceGameTime(10)
        enterEvent(params.eventId)
        break
      }

      case 'trade': {
        // 打开交易面板
        state.currentTraderId = params.traderId
        state.mode = 'trade'
        break
      }

      case 'move': {
        // 方向移动：消耗10分钟
        advanceGameTime(10)
        state.logMessage = `你向 ${params.direction} 方向移动`
        break
      }

      case 'moveToScene': {
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

      case 'function': {
        state.logMessage = `功能 "${params.functionType}" 尚未实现`
        break
      }

      default:
        state.logMessage = '未知交互类型'
    }
  }

  /**
   * 获取当前有效的交互按钮列表
   * 子场景优先，没有则使用母场景的交互按钮
   */
  function getCurrentInteractions() {
    const target = state.currentSubScene || state.currentScene
    return target.interactions
  }

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
    executePlayerAction(state.player, battle, actionType, skillId, itemInstanceId)

    // 检查战斗是否结束
    if (battle.result === BattleResult.VICTORY) {
      const settleLogs = settleBattle(state.player, battle)

      // 处理从战斗返回事件帧
      if (state.currentEvent && state.currentFrame) {
        const frame = state.currentEvent.frames.find((f) => f.id === state.currentFrame?.id)
        if (frame && frame.options.length > 0) {
          // 检查是否有"胜利后"逻辑（通过选项结果处理）
        }
      }

      state.currentBattle = null
      state.mode = state.currentEvent ? 'event' : 'normal'
      state.logMessage = [...battle.logs, ...settleLogs].filter(Boolean).join('；')
    } else if (battle.result === BattleResult.DEFEAT) {
      // 战败：检查是否触发结局
      state.currentBattle = null
      checkAndTriggerEnding()
      if (state.mode !== 'ending') {
        state.mode = 'normal'
      }
      state.logMessage = battle.logs.filter(Boolean).join('；')
    } else if (battle.result === BattleResult.ESCAPED) {
      state.currentBattle = null
      state.mode = state.currentEvent ? 'event' : 'normal'
      state.logMessage = battle.logs.filter(Boolean).join('；')
    } else {
      // 战斗还在继续，显示日志
      state.logMessage = battle.logs.filter(Boolean).join('；')
    }
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
          enterEvent(entry.eventId)
          return // 自动触发事件后不再显示场景
        }
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

  return {
    state: readonly(state) as GameRuntimeState,
    enterEvent,
    selectEventOption,
    handleInteraction,
    getCurrentInteractions,
    resolveText,
    advanceGameTime,
    executeBattleAction,
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
