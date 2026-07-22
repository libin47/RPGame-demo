// src/composables/useGame.ts

import { reactive, readonly } from 'vue'
import type { PlayerState } from '@/types/player'
import type { Scene, SceneDescription, SubScene } from '@/types/scene'
import type { GameEvent, EventFrame } from '@/types/event'
import { getRegistry } from '@/engine'
import { getEffectResolver } from '@/engine'
/**
 * 游戏界面模式
 */
export type GameMode =
  | 'normal'     // 常态界面：场景描述 + 交互按钮
  | 'event'      // 事件界面：事件文本 + 选项按钮
  | 'battle'     // 战斗界面（后续实现）
  | 'inventory'  // 背包界面（后续实现）
  | 'build'      // 建造界面（后续实现）
  | 'craft'      // 制作界面（后续实现）
  | 'map'        // 地图界面（后续实现）

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
  currentDescriptionConfig: SceneDescription | null  // 新增

  /** 当前事件配置（仅在 mode === 'event' 时有值） */
  currentEvent: GameEvent | null

  /** 当前事件帧（仅在 mode === 'event' 时有值） */
  currentFrame: EventFrame | null

  /** 游戏日志（底部提示信息） */
  logMessage: string
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

  const subScene = subSceneId ? registry.getSubScene(subSceneId) ?? null : null

  const currentTarget = subScene || scene
  const firstDescription = currentTarget.descriptions[0]
  const sceneDescription = firstDescription
    ? firstDescription.text
    : '（场景描述缺失）'

  const state = reactive<GameRuntimeState>({
    mode: 'normal',
    player: initialPlayer,
    currentScene: scene,
    currentSubScene: subScene,
    sceneDescription,
    currentDescriptionConfig: firstDescription || null,  // 新增
    currentEvent: null,
    currentFrame: null,
    logMessage: '',
  })

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

  const option = state.currentFrame.options.find(o => o.id === optionId)
  if (!option) return

  const result = option.result
  const resolver = getEffectResolver()

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

      // 跳转到目标帧
      const nextFrame = state.currentEvent?.frames.find(f => f.id === result.targetFrameId)
      if (nextFrame) {
        state.currentFrame = nextFrame
      } else {
        state.logMessage = `目标帧 ${result.targetFrameId} 未找到`
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
          ? registry.getSubScene(result.subSceneId) ?? null
          : null

        const target = state.currentSubScene || state.currentScene
        const firstDesc = target.descriptions[0]
        state.sceneDescription = firstDesc ? firstDesc.text : '（场景描述缺失）'
        state.currentDescriptionConfig = firstDesc || null  // 新增

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

    case 'triggerBattle':
    case 'playCG':
    case 'openTrade':
      state.logMessage = '该功能尚未实现'
      break
  }
}
  /**
   * 处理场景交互按钮点击
   */
  function handleInteraction(interactionId: string): void {
    // 从当前场景或子场景中查找交互
    const target = state.currentSubScene || state.currentScene
    const interaction = target.interactions.find(i => i.id === interactionId)
    if (!interaction) return

    // 根据交互类型执行不同操作
    const params = interaction.behaviorParams

    switch (params.interactionType) {
      case 'explore':
        // 探索：刷新场景描述（当前先简单重新选取第一条描述）
        state.logMessage = '你四处探索了一番'
        break

      case 'event':
        // 触发事件
        enterEvent(params.eventId)
        break

      case 'enterSubScene':
        // 进入子场景
        const subScene = registry.getSubScene(params.subSceneId)
        if (subScene) {
          state.currentSubScene = subScene
          state.player.currentLocation.subSceneId = params.subSceneId
          const firstDesc = subScene.descriptions[0]
          state.sceneDescription = firstDesc ? firstDesc.text : '（场景描述缺失）'
          state.currentDescriptionConfig = firstDesc || null  // 新增
        }
        break

      case 'exitSubScene':
        // 离开子场景
        state.currentSubScene = null
        state.player.currentLocation.subSceneId = null
        const mainFirstDesc = state.currentScene.descriptions[0]
        state.sceneDescription = mainFirstDesc ? mainFirstDesc.text : '（场景描述缺失）'
        state.currentDescriptionConfig = mainFirstDesc || null  // 新增
        break

      case 'rest':
        state.logMessage = '你休息了一会儿'
        break

      case 'talk':
        enterEvent(params.eventId)
        break

      case 'trade':
        state.logMessage = '交易系统尚未实现'
        break

      case 'move':
        state.logMessage = `你向 ${params.direction} 方向移动`
        break

      case 'moveToScene':
        // 切换场景
        const targetScene = registry.getScene(params.targetSceneId)
        if (targetScene) {
          state.currentScene = targetScene
          state.currentSubScene = null
          const desc = targetScene.descriptions[0]
          state.sceneDescription = desc ? desc.text : '（场景描述缺失）'
          state.player.currentLocation.sceneId = params.targetSceneId
          state.player.currentLocation.subSceneId = null
          state.logMessage = params.pathDescription
        }
        break

      case 'function':
        state.logMessage = `功能 "${params.functionType}" 尚未实现`
        break

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
      resolved = resolved.replace(/\{player\.weapon\}/g, registry.getItemName(state.player.equipment.weapon))
    } else {
      resolved = resolved.replace(/\{player\.weapon\}/g, '徒手')
    }

    // 玩家护甲名称
    if (state.player.equipment.body) {
      resolved = resolved.replace(/\{player\.armor\}/g, registry.getItemName(state.player.equipment.body))
    } else {
      resolved = resolved.replace(/\{player\.armor\}/g, '破旧的衣物')
    }

    // 天气描述（简化为天气ID，后续可扩展为详细描述）
    const weatherConfig = registry.getWeather(state.player.progress.weatherId)
    resolved = resolved.replace(/\{env\.weatherDesc\}/g, weatherConfig ? weatherConfig.description : '未知天气')

    // 时间段描述（根据时间分钟数判断）
    resolved = resolved.replace(/\{env\.timeOfDayDesc\}/g, getTimeOfDayDescription(state.player.progress.timeMinutes))

    return resolved
  }

  return {
    state: readonly(state) as GameRuntimeState,
    enterEvent,
    selectEventOption,
    handleInteraction,
    getCurrentInteractions,
    resolveText,
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