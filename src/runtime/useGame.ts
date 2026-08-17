// src/runtime/useGame.ts

import { reactive, readonly } from 'vue'
import type { PlayerState } from '@/types/player'
import type {
  Scene,
  SceneDescription,
  SubScene,
  ResourceInteraction,
  MoveInteraction,
  CharacterInteraction,
  PassiveEventSource,
} from '@/types/scene'
import type { GameEvent, EventFrame, EventOptionResult } from '@/types/event'
import type { EffectResult } from '@/types/effect'
import { EffectType, GainExpTarget } from '@/types/effect'
import type { EndingConfig } from '@/types/ending'
import {
  getRegistry,
  getEffectResolver,
  advanceTime,
  evaluateConditions,
  addItem,
  onItemAdded,
  onAttributeChanged,
  applySanDelta,
  selectSceneDescription,
  markDescriptionSeen,
  getScenePassiveEvent,
  markDescriptionEventSeen,
} from '@/engine'
import type { AttributeChangeRecord } from '@/engine'
import { getVisibleOptions, findFirstVisibleFrame, resolveTextVariation } from '@/engine'
import { findMapRoute, isMapNodeUnlocked, calcMoveTime } from '@/engine'
import {
  createBattle,
  startBattle,
  executePlayerAction,
  settleBattle,
  selectBattleTarget,
  applyBattleStartStatuses,
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
import { buyFromTrader as tradeBuyFromTrader, sellToTrader as tradeSellToTrader } from '@/engine'
import { nextCGFrame, jumpToCGFrame } from '@/engine'
import type { CraftResult, ItemSource } from '@/engine'
import type { ButtonOption, textVariation } from '@/types/option'
import { OptionCostType } from '@/types/option'
import type { buildOption, CampsiteFunction } from '@/types/build'
import type { GameMap } from '@/types/map'
import { isSceneDescriptionEligible } from '@/engine/exploration'

/** 掷骰判定结果 */
type RollOutcome = 'bigSuccess' | 'success' | 'fail' | 'bigFail'
/** 掷骰检定使用的属性（中文，与 rollResult.attribute 一致） */
type RollAttribute = '力量' | '智力' | '敏捷' | '体质' | 'SAN'

/** 掷骰判定结果中文标签 */
const ROLL_OUTCOME_LABELS: Record<RollOutcome, string> = {
  bigSuccess: '大成功',
  success: '成功',
  fail: '失败',
  bigFail: '大失败',
}

/** 掷骰判定展示信息（供 RollResultPanel 渲染） */
export interface RollResultInfo {
  /** 检定的属性（中文） */
  attribute: string
  /** 属性最终值（基础 + 修正，判定阈值基准） */
  attributeValue: number
  /** 属性基础值（不含修正，用于经验档位） */
  attributeBase: number
  /** 奖励骰净数量（正=奖励，负=惩罚） */
  bonusDice: number
  /** 本次投掷的所有 d100（共 1+|bonusDice| 个，按投掷顺序） */
  rolls: number[]
  /** 最终判定值（奖励骰取最小、惩罚骰取最大、无奖罚取基准） */
  finalRoll: number
  /** 难度：0 普通成功 / 1 困难成功 / 2 极难成功 */
  dc: number
  /** 达成判定所需阈值（投掷 ≤ 阈值即达成对应等级） */
  threshold: number
  /** 实际掷出的成功等级（失败为 null；大成功/大失败时按其对应等级） */
  successGrade: 'normal' | 'hard' | 'extreme' | null
  /** 判定结果 */
  outcome: RollOutcome
  /** 奖励/惩罚骰原因 */
  modifierReasons: string[]
  /** 本次获得经验（SAN 检定恒为 0；暂不展示） */
  gainedExp: number
  /** 选项描述（顶部展示） */
  description: string
}

/**
 * 带幸运加成的概率判定（用于资源采集/狩猎的扩展命中）
 * @param probability - 基础概率（0-1）
 * @param luck - 幸运系数（未设置则忽略玩家幸运值）
 * @param playerLuck - 玩家幸运值（-100~100）
 */
function rollLuckAdjusted(
  probability: number,
  luck: number | undefined,
  playerLuck: number,
): boolean {
  const p = luck === undefined ? probability : probability + (luck * playerLuck) / 100
  return Math.random() < p
}

/**
 * 解析数量（支持固定值或 [min, max] 范围）
 */
function resolveQuantity(quantity: number | [number, number]): number {
  if (Array.isArray(quantity)) {
    const [min, max] = quantity
    return min + Math.floor(Math.random() * (max - min + 1))
  }
  return quantity
}

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
  | 'camp' // 营地建筑界面（仅展示已有建筑）
  | 'craft' // 制作界面（后续实现）
  | 'map' // 地图界面（后续实现）
  | 'ending' // 结局界面
  | 'cg' // CG过场界面
  | 'trade' // 交易界面

/**
 * 回营地信息（由 getCampsiteMoveInfo 返回）
 * 耗时 = 当前场景母场景在大地图上移动到营地母场景的时间；
 * 同母场景时固定 10 分钟
 */
export interface CampsiteMoveInfo {
  /** 营地子场景ID */
  subSceneId: string
  /** 营地子场景名称 */
  subSceneName: string
  /** 移动时间（分钟，尚未应用敏捷系数） */
  minutes: number
  /** 体力消耗（原值，尚未应用体力消耗系数） */
  staminaCost: number
  /** 是否可回营地（营地存在且路径可达） */
  available: boolean
}

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

  /** 当前掷骰判定展示信息（判定帧 roll_result_frame 时有值） */
  rollResultInfo: RollResultInfo | null

  /** 当前战斗状态（仅在 mode === 'battle' 时有值） */
  currentBattle: BattleState | null

  /** 事件帧文本前缀（上一帧选中的选项结果文本，拼接到当前帧文本前） */
  frameTextPrefix: string

  /** 事件帧文本后缀（选项资源不足等拦截提示，显示在帧文本下方；成功选择/切换帧时清空） */
  frameTextSuffix: string

  /** 场景文本前缀（从事件跳转到场景时，显示 exitText/enterText 在场景描述前） */
  sceneTextPrefix: string
  /** 场景文本后缀（从事件返回场景时，显示 exitText/enterText 在场景描述后） */
  sceneTextAfter: string

  /** 当前场景描述中的事件入口是否已被点击（点击后该入口渲染为纯文本；场景描述被刷新/切换后恢复可点击） */
  eventEntryClicked: boolean

  /** 当前触发的结局配置（仅在 mode === 'ending' 时有值） */
  currentEnding: EndingConfig | null

  /** 结局触发原因 */
  endingReason: string

  /** 当前CG播放状态（仅在 mode === 'cg' 时有值） */
  currentCG: CGPlayState | null

  /** 当前交易商人ID（仅在 mode === 'trade' 时有值） */
  currentTraderId: string | null

  /** 角色攻击战斗待结算事件（胜利→winEventId，失败→failEventId） */
  pendingCharacterResult: { winEventId?: string; failEventId?: string } | null

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
    rollResultInfo: null,
    currentBattle: null,
    frameTextPrefix: '',
    frameTextSuffix: '',
    sceneTextPrefix: '',
    sceneTextAfter: '',
    eventEntryClicked: false,
    currentEnding: null,
    endingReason: '',
    currentCG: null,
    currentTraderId: null,
    pendingCharacterResult: null,
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

/** 上一个 useGame 实例注册的物品获得/属性变动监听器注销函数（新实例创建时先注销旧的，避免重复触发） */
let disposeItemAddedListener: (() => void) | null = null
let disposeAttributeChangeListener: (() => void) | null = null

/**
 * 事件中获得物品/属性变动的提示缓冲
 * 事件中发生的变动同时写入场景后缀（sceneTextAfter）与缓冲，
 * 缓冲在下一帧跳转时合并进帧前缀（frameTextPrefix）显示；
 * 离开事件（endEvent）或进入新事件（enterEvent）时清空。
 */
let pendingNotices: string[] = []

/** 属性中文标签 */
const ATTRIBUTE_LABELS: Record<AttributeChangeRecord['attribute'], string> = {
  strength: '力量',
  agility: '敏捷',
  intelligence: '智力',
  constitution: '体质',
  san: 'SAN',
}

/**
 * 将属性变动记录格式化为带颜色标记的提示行（{{green}}/{{red}} 由渲染层 RichText 解析）
 * - 经验变动：力量+++（1-8 一个、9-16 两个…，按 Math.ceil(|delta|/8)），涨绿跌红
 * - 升级（经验达标）：你的等级提升了：力量 50→51（绿色）
 * - 直接基础值变动：力量 50→55（绿）/ 力量 50→45（红）
 * - SAN 变动：SAN++（1-5 一个、6-10 两个…，按 Math.ceil(|delta|/5)），涨绿跌红
 */
function formatAttributeChangeNotices(change: AttributeChangeRecord): string[] {
  const label = ATTRIBUTE_LABELS[change.attribute]
  const lines: string[] = []

  // SAN 变动（生存属性，仅增减量）
  if (change.attribute === 'san') {
    if (change.delta !== undefined && change.delta !== 0) {
      const sign = change.delta > 0 ? '+' : '-'
      const count = Math.ceil(Math.abs(change.delta) / 5)
      const color = change.delta > 0 ? 'green' : 'red'
      lines.push(`{{${color}}}${label}${sign.repeat(count)}{{/${color}}}`)
    }
    return lines
  }

  // 经验变动（原始增减量）
  if (change.expDelta !== undefined && change.expDelta !== 0) {
    const sign = change.expDelta > 0 ? '+' : '-'
    const count = Math.ceil(Math.abs(change.expDelta) / 8)
    const color = change.expDelta > 0 ? 'green' : 'red'
    lines.push(`{{${color}}}${label}${sign.repeat(count)}{{/${color}}}`)
  }

  // 基础值（等级）变动：升级 / 直接改值，涨绿跌红
  if (
    change.oldValue !== undefined &&
    change.newValue !== undefined &&
    change.oldValue !== change.newValue
  ) {
    if (change.newValue > change.oldValue) {
      const head = change.levelUp ? '你的等级提升了：' : ''
      lines.push(`{{green}}${head}${label} ${change.oldValue}→${change.newValue}{{/green}}`)
    } else {
      lines.push(`{{red}}${label} ${change.oldValue}→${change.newValue}{{/red}}`)
    }
  }

  return lines
}

/**
 * 使用游戏状态
 * 在 Vue 组件中通过此函数获取和操作游戏状态
 */
export function useGame(initialPlayer: PlayerState) {
  // 旧存档兜底：缺少 campsiteSceneId 时重置为"未建立营地"
  if (initialPlayer.progress.campsiteSceneId === undefined) {
    initialPlayer.progress.campsiteSceneId = null
  }
  const state = createGameState(initialPlayer)
  const registry = getRegistry()

  // 初始场景被动事件检查（命中则直接进入事件）
  tryTriggerPassiveEvents()

  /**
   * 执行一组效果，并将日志输出到底部消息栏
   */
  function executeEffects(effects: EffectResult[] | undefined): void {
    if (!effects || effects.length === 0) return
    const resolver = getEffectResolver()
    const logs = resolver.executeEffectResults(state.player, effects)
    if (logs.length > 0) {
    }
  }

  /**
   * 进入事件
   * 从场景交互按钮或事件入口触发
   *
   * @param eventId - 事件ID
   * @param fromEventEntry - 是否由场景描述中的事件入口点击触发（标记入口已点击转为纯文本、removeAfterInteraction 判断）
   */
  function enterEvent(eventId: string, fromEventEntry = false): void {
    const event = registry.getEvent(eventId)
    if (!event) {
      return
    }

    // 由场景描述事件入口触发时，检查是否需要标记描述为已使用
    if (fromEventEntry && state.currentDescriptionConfig?.eventFlag) {
      markDescriptionEventSeen(state.currentDescriptionConfig, state.player)
    }

    // 从描述事件入口进入：该入口转为纯文本（场景描述刷新/切换后恢复可点击）
    if (fromEventEntry) {
      state.eventEntryClicked = true
    }
    // 从描述事件入口进入：如果entry设置了removeAfterClick，且已点击过该入口，将该入口的usedFlag设置为true，后续点击将不触发事件
    const entry = state.currentDescriptionConfig?.eventEntries?.find((e) => e.eventId === eventId)
    if (fromEventEntry && entry && entry.removeAfterClick) {
      if (entry.usedFlag) {
        state.player.flags[entry.usedFlag] = true
      } else {
        state.player.flags[entry.key] = false
      }
    }

    // 获取第一个可见帧（按 order 顺序，满足 displayFlag 和 displayCondition 的帧）
    const firstFrame = findFirstVisibleFrame(event.frames, state.player)
    if (!firstFrame) {
      return
    }

    state.mode = 'event'
    state.currentEvent = event
    state.currentFrame = firstFrame
    // 清空跨事件残留的物品/属性变动提示缓冲（提示已写入场景后缀）
    pendingNotices = []
    state.rollResultInfo = null
    state.frameTextPrefix = ''
    state.frameTextSuffix = ''
    state.sceneTextPrefix = ''
    state.sceneTextAfter = ''
    // 设置事件触发标志位
    if (event.triggeredFlag) {
      state.player.flags[event.triggeredFlag] = true
    }
    // 设置第一个帧显示标志位
    if (firstFrame.seenFlag) {
      state.player.flags[firstFrame.seenFlag] = true
    }

    // 执行事件级 onEnterEffects
    executeEffects(event.onEnterEffects)
    // 执行首帧 onEnterEffects
    executeEffects(firstFrame.onEnterEffects)
  }

  // ============================================================
  // 事件选项结果解析（直接执行 / 条件判断 / 掷骰判定）
  // ============================================================

  /**
   * 获取用于检定的属性值（基础值 + 临时修正）
   */
  function getRollAttribute(player: PlayerState, attribute: RollAttribute): number {
    switch (attribute) {
      case '力量':
        return player.attributes.strength + player.attributes.strengthModifier
      case '敏捷':
        return player.attributes.agility + player.attributes.agilityModifier
      case '智力':
        return player.attributes.intelligence + player.attributes.intelligenceModifier
      case '体质':
        return player.attributes.constitution + player.attributes.constitutionModifier
      case 'SAN':
        return player.survival.san
      default:
        return 10
    }
  }

  /**
   * 获取用于经验档位的基础属性值（不含临时修正）
   */
  function getRollBaseAttribute(player: PlayerState, attribute: RollAttribute): number {
    switch (attribute) {
      case '力量':
        return player.attributes.strength
      case '敏捷':
        return player.attributes.agility
      case '智力':
        return player.attributes.intelligence
      case '体质':
        return player.attributes.constitution
      case 'SAN':
        return player.survival.san
      default:
        return 10
    }
  }

  /**
   * 检定经验结算（COC 规则，判定完成时立即结算；SAN 检定无经验）
   * 基础经验按属性基础值分档：<40 → +4，40-60 → +3，60-80 → +2，80-100 → +1
   * 难度倍率：困难(dc=1)成功 ×2，极难(dc=2)成功 ×3；大成功再 ×2；失败 +1；大失败 +0
   */
  function gainRollExp(
    player: PlayerState,
    attribute: RollAttribute,
    baseValue: number,
    dc: number,
    outcome: RollOutcome,
  ): number {
    if (attribute === 'SAN' || outcome === 'bigFail') return 0
    if (outcome === 'fail') {
      gainAttributeExp(player, attribute, 1)
      return 1
    }
    const baseExp = baseValue < 40 ? 4 : baseValue < 60 ? 3 : baseValue < 80 ? 2 : 1
    const dcMult = dc === 1 ? 2 : dc === 2 ? 3 : 1
    const gained = baseExp * dcMult * (outcome === 'bigSuccess' ? 2 : 1)
    if (gained > 0) gainAttributeExp(player, attribute, gained)
    return gained
  }

  /**
   * 累加基础属性经验并触发升级检查（复用引擎效果结算器的升级逻辑）
   */
  function gainAttributeExp(player: PlayerState, attribute: RollAttribute, amount: number): void {
    if (attribute === 'SAN' || amount <= 0) return
    const expTarget: Record<RollAttribute, string> = {
      力量: 'strength',
      敏捷: 'agility',
      智力: 'intelligence',
      体质: 'constitution',
      SAN: '',
    }
    const targetId = expTarget[attribute]
    if (!targetId) return
    const resolver = getEffectResolver()
    resolver.executeGainExpEffect(player, {
      type: EffectType.GAIN_EXP,
      target: GainExpTarget.ATTRIBUTE,
      targetId,
      amount,
    })
  }

  /**
   * 解析事件选项的最终结果
   * 四种模式：
   *  1. rollResult - 掷骰判定：生成判定帧展示过程，返回 null（分支结果由"继续"按钮触发）
   *  2. conditionResult - 条件判断：条件满足返回 successResult，否则 failResult
   *  3. probabilityResult - 概率判断：extend 中条件满足且概率命中（含幸运加成）的第一个生效，否则使用默认 result
   *  4. results - 直接执行
   *
   * @param option - 被选中的选项
   * @param player - 玩家状态
   * @returns 最终要执行的结果；掷骰判定时返回 null
   */
  function resolveEventOptionResult(
    option: NonNullable<(typeof state)['currentFrame']>['options'][number],
    player: PlayerState,
  ): EventOptionResult | null {
    // 1. 掷骰判定（COC d100 规则）
    if (option.rollResult) {
      const roll = option.rollResult

      // 属性最终值（判定阈值基准）与基础值（经验档位）
      const attributeValue = getRollAttribute(player, roll.attribute)
      const attributeBase = getRollBaseAttribute(player, roll.attribute)

      // 奖励/惩罚骰净额（满足条件的项累加，正=奖励数量，负=惩罚数量）
      let bonusDice = 0
      const modifierReasons: string[] = []
      if (roll.modifier) {
        for (const m of roll.modifier) {
          if (evaluateConditions(m.condition, player)) {
            bonusDice += m.value
            if (m.text) modifierReasons.push(m.text)
          }
        }
      }

      // 投掷 1 + |奖励/惩罚骰净数量| 个 d100（1-100）：奖励骰取最小、惩罚骰取最大
      const rollCount = 1 + Math.abs(bonusDice)
      const rolls: number[] = []
      for (let i = 0; i < rollCount; i++) {
        rolls.push(Math.floor(Math.random() * 100) + 1)
      }
      const finalRoll =
        bonusDice > 0 ? Math.min(...rolls) : bonusDice < 0 ? Math.max(...rolls) : (rolls[0] ?? 1)

      // 难度（dc）：0 普通成功 / 1 困难成功 / 2 极难成功
      const dc = Math.min(Math.max(roll.dc ?? 0, 0), 2)

      // 成功等级（投掷 ≤ 属性 → 普通；≤ 属性/2 → 困难；≤ 属性/5 → 极难）
      let successGrade: 'normal' | 'hard' | 'extreme' | null = null
      if (finalRoll <= attributeValue / 5) {
        successGrade = 'extreme'
      } else if (finalRoll <= attributeValue / 2) {
        successGrade = 'hard'
      } else if (finalRoll <= attributeValue) {
        successGrade = 'normal'
      }

      // 大成功/大失败优先于难度比对
      // 属性 <50：投出 1 大成功、95-100 大失败；属性 ≥50：投出 1-5 大成功、100 大失败
      let outcome: RollOutcome
      const bigSuccessRoll = attributeValue >= 50 ? finalRoll <= 5 : finalRoll === 1
      const bigFailRoll = attributeValue >= 50 ? finalRoll === 100 : finalRoll >= 95
      if (bigSuccessRoll) {
        outcome = 'bigSuccess'
      } else if (bigFailRoll) {
        outcome = 'bigFail'
      } else {
        // 依据 dc 判定：所需成功等级必须达成
        const success =
          dc === 0
            ? successGrade !== null
            : dc === 1
              ? successGrade === 'hard' || successGrade === 'extreme'
              : successGrade === 'extreme'
        outcome = success ? 'success' : 'fail'
      }
      // 展示阈值：按 dc 要求的等级对应
      const threshold =
        dc === 0 ? attributeValue : dc === 1 ? attributeValue / 2 : attributeValue / 5

      // 经验结算（SAN 无经验；判定完成即结算，暂不展示）
      const gainedExp = gainRollExp(player, roll.attribute, attributeBase, dc, outcome)

      // 取对应分支结果（大成功/大失败未配置时回退到成功/失败）
      const branchResult: EventOptionResult | undefined =
        outcome === 'bigSuccess'
          ? (roll.bigSuccessResult ?? roll.successResult)
          : outcome === 'bigFail'
            ? (roll.bigFailResult ?? roll.failResult)
            : outcome === 'success'
              ? roll.successResult
              : roll.failResult

      // 生成判定帧展示判定过程，分支结果由"继续"按钮执行
      createRollResultFrame(
        option,
        {
          attributeValue,
          attributeBase,
          bonusDice,
          rolls,
          finalRoll,
          dc,
          threshold,
          successGrade,
          outcome,
          gainedExp,
          modifierReasons,
        },
        branchResult,
      )
      return null
    }

    // 2. 条件判断
    if (option.conditionResult) {
      const cr = option.conditionResult
      return evaluateConditions(cr.condition, player) ? cr.successResult : cr.failResult
    }

    // 3. 概率判断
    if (option.probabilityResult) {
      const pr = option.probabilityResult
      // 依次检查 extend：条件满足且概率命中（含幸运加成）的第一个生效，否则使用默认 result
      if (pr.extend) {
        const playerLuck = player.attributes.luck + player.attributes.luckModifier
        for (const ext of pr.extend) {
          if (ext.condition && !evaluateConditions(ext.condition, player)) continue
          if (rollLuckAdjusted(ext.probability, ext.luck, playerLuck)) {
            return ext.result
          }
        }
      }
      return pr.result
    }

    // 4. 直接执行
    return option.results ?? null
  }

  /**
   * 生成掷骰判定帧
   * 帧文本展示判定过程与结果，顶部显示选项描述（frameTextPrefix），固定一个"继续"按钮执行分支结果
   */
  function createRollResultFrame(
    option: NonNullable<(typeof state)['currentFrame']>['options'][number],
    info: {
      attributeValue: number
      attributeBase: number
      bonusDice: number
      rolls: number[]
      finalRoll: number
      dc: number
      threshold: number
      successGrade: 'normal' | 'hard' | 'extreme' | null
      outcome: RollOutcome
      gainedExp: number
      modifierReasons: string[]
    },
    branchResult: EventOptionResult | undefined,
  ): void {
    if (!branchResult) {
      return
    }

    const roll = option.rollResult
    if (!roll) return
    const attributeLabel = roll.attribute
    const dcLabel = info.dc === 1 ? '困难' : info.dc === 2 ? '极难' : '普通'

    // 判定过程文本
    const lines = [
      `【${attributeLabel}检定】`,
      `属性：${attributeLabel} ${info.attributeValue}`,
      ...info.modifierReasons.map((t) => `· ${t}`),
      ...(info.bonusDice !== 0
        ? [`奖励/惩罚骰：${info.bonusDice > 0 ? '+' : ''}${info.bonusDice}`]
        : []),
      `投掷：d100 → ${info.finalRoll}${info.rolls.length > 1 ? `（${info.rolls.join(' / ')}，${info.bonusDice > 0 ? '取最小' : '取最大'}）` : ''}`,
      `要求：${dcLabel}成功（≤ ${info.threshold}）`,
      `判定结果：${ROLL_OUTCOME_LABELS[info.outcome]}`,
    ]

    // 顶部显示选项描述
    const description = option.description
      ? typeof option.description === 'string'
        ? option.description
        : resolveTextVariation(option.description, '', state.player)
      : ''

    // 保存判定展示信息（供 RollResultPanel 渲染）
    state.rollResultInfo = {
      attribute: attributeLabel,
      attributeValue: info.attributeValue,
      attributeBase: info.attributeBase,
      bonusDice: info.bonusDice,
      rolls: info.rolls,
      finalRoll: info.finalRoll,
      dc: info.dc,
      threshold: info.threshold,
      successGrade: info.successGrade,
      outcome: info.outcome,
      modifierReasons: info.modifierReasons,
      gainedExp: info.gainedExp,
      description,
    }
    state.frameTextPrefix = description
    state.currentFrame = {
      id: 'roll_result_frame',
      text: lines.join('\n'),
      options: [
        {
          id: 'roll_continue',
          name: '继续',
          results: branchResult,
        },
      ],
    }
  }

  /**
   * 汇总按钮交互的资源消耗（时间不参与校验，仅扣减阶段使用）
   */
  function summarizeButtonCosts(
    button: ButtonOption,
    extraStamina = 0,
  ): {
    needStamina: number
    needSatiety: number
    needSan: number
    needHp: number
    itemCosts: { itemId: string; quantity: number }[]
  } {
    let needStamina = (button.costEnergy ?? 0) + extraStamina
    let needSatiety = 0
    let needSan = button.costSan ?? 0
    let needHp = button.costHp ?? 0
    const itemCosts: { itemId: string; quantity: number }[] = []
    if (button.costs) {
      for (const c of button.costs) {
        const value = c.value
        switch (c.costType) {
          case OptionCostType.STAMINA:
            needStamina += value
            break
          case OptionCostType.SATIETY:
            needSatiety += value
            break
          case OptionCostType.SAN:
            needSan += value
            break
          case OptionCostType.HP:
            needHp += value
            break
          case OptionCostType.ITEM:
            if (c.itemId) {
              itemCosts.push({ itemId: c.itemId, quantity: c.itemQuantity ?? 1 })
            }
            break
        }
      }
    }
    // 实际体力消耗 = 原消耗体力 × 体力消耗系数（100/(力量+100)），向上取整
    needStamina = Math.ceil(
      needStamina * state.player.attributes.coefficients.staminaConsumptionCoefficient,
    )
    return { needStamina, needSatiety, needSan, needHp, itemCosts }
  }

  /**
   * 校验按钮交互花费是否满足（不扣减资源/时间）
   * 用于在被动事件触发之前做前置校验，资源不足时立即给出提示并中止交互
   *
   * @param button - 交互按钮（事件选项或场景交互）
   * @param extraStamina - 额外的体力消耗（如 moveToScene 的 staminaCost）
   * @returns 不足时的提示文本；满足返回 null
   */
  function checkButtonCosts(button: ButtonOption, extraStamina = 0): string | null {
    const survival = state.player.survival
    const { needStamina, needSatiety, needSan, needHp, itemCosts } = summarizeButtonCosts(
      button,
      extraStamina,
    )
    if (needStamina > 0 && survival.stamina < needStamina) return '体力不足，无法执行此操作'
    if (needSatiety > 0 && survival.satiety < needSatiety) return '饱食度不足，无法执行此操作'
    if (needHp > 0 && survival.hp < needHp) return '生命值不足，无法执行此操作'
    if (needSan > 0 && survival.san < needSan) return '精神不足以支撑这个选择'
    for (const ic of itemCosts) {
      if (getItemCount(state.player, ic.itemId) < ic.quantity) return '缺少所需物品，无法执行此操作'
    }
    return null
  }

  /**
   * 资源不足等拦截提示：事件中显示在事件帧文本下方，场景中追加到场景文本之后
   */
  function showBlockedMessage(message: string): void {
    if (state.mode === 'event') {
      state.frameTextSuffix = message
    } else {
      setSceneTextAfter(message)
    }
  }

  /**
   * 执行按钮交互的花费（快捷字段 costTime/costEnergy/costSan/costHp 与 costs[] 叠加扣减）
   * 先校验体力/饱食度/生命/物品是否充足，不足则拦截（交互不执行）
   * 用于事件选项与场景交互按钮统一结算。
   *
   * @param button - 交互按钮（事件选项或场景交互）
   * @param defaultMinutes - 未配置 costTime 时的默认消耗分钟数
   * @param extraStamina - 额外的体力消耗（如 moveToScene 的 staminaCost）
   * @param isMoveAction - 是否为移动操作（移动时间受敏捷影响：原时间 × 100/(敏捷+50)，向上取整）
   * @returns 是否消耗成功（false = 资源不足，调用方应中止交互）
   */
  function consumeButtonCosts(
    button: ButtonOption,
    defaultMinutes = 0,
    extraStamina = 0,
    isMoveAction = false,
  ): boolean {
    // 资源校验：不足则拦截并给出提示
    const error = checkButtonCosts(button, extraStamina)
    if (error) {
      showBlockedMessage(error)
      return false
    }
    const survival = state.player.survival
    const { needStamina, needSatiety, needSan, needHp, itemCosts } = summarizeButtonCosts(
      button,
      extraStamina,
    )

    // 扣减各类资源
    if (needStamina > 0) survival.stamina = Math.max(0, survival.stamina - needStamina)
    if (needSatiety > 0) survival.satiety = Math.max(0, survival.satiety - needSatiety)
    if (needSan > 0) applySanDelta(state.player, -needSan)
    if (needHp > 0) survival.hp = Math.max(0, survival.hp - needHp)
    for (const ic of itemCosts) {
      removeItem(state.player, ic.itemId, ic.quantity)
    }

    // 时间消耗（未配置 costTime 时使用默认值；移动操作按敏捷折算实际时间）
    let minutes = button.costTime ?? defaultMinutes
    if (isMoveAction && minutes > 0) {
      minutes = calcMoveTime(minutes, state.player.attributes.agility)
    }
    if (minutes > 0) {
      advanceGameTime(minutes)
    }

    return true
  }

  /**
   * 处理事件选项选择
   * 根据选项结果执行对应操作
   */
  function selectEventOption(optionId: string): void {
    if (!state.currentFrame) return

    const option = state.currentFrame.options.find((o) => o.id === optionId)
    if (!option) return

    // 先执行选项花费（资源不足则拦截，不执行选项）
    if (!consumeButtonCosts(option)) return
    // 花费校验通过，清掉本帧上一次的资源不足拦截提示
    state.frameTextSuffix = ''

    const result = resolveEventOptionResult(option, state.player)
    if (!result) return
    const resolver = getEffectResolver()

    // 标记选项已选（用于 isOneTime 追踪）
    if (option.usedFlag) {
      state.player.flags[option.usedFlag] = true
    }

    // 根据选项结果类型执行不同操作
    switch (result.type) {
      case 'nextFrame': {
        // 执行效果
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
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
          // 帧显示后设置其 seenFlag（与 enterEvent 进入事件时一致）
          if (nextFrame.seenFlag) {
            state.player.flags[nextFrame.seenFlag] = true
          }
          // 执行新帧的 onEnterEffects
          executeEffects(nextFrame.onEnterEffects)
        } else if (state.currentEvent) {
          // 用条件选择第一个可见帧
          const visibleFrame = findFirstVisibleFrame(state.currentEvent.frames, state.player)
          if (visibleFrame) {
            state.currentFrame = visibleFrame
            // 帧显示后设置其 seenFlag（与 enterEvent 进入事件时一致）
            if (visibleFrame.seenFlag) {
              state.player.flags[visibleFrame.seenFlag] = true
            }
            // 执行新帧的 onEnterEffects
            executeEffects(visibleFrame.onEnterEffects)
          } else {
          }
        }
        // 合并本次事件中获得的物品/属性变动提示到帧前缀（显示在下一帧顶部）
        if (pendingNotices.length > 0) {
          state.frameTextPrefix = [state.frameTextPrefix, ...pendingNotices]
            .filter(Boolean)
            .join('\n')
          pendingNotices = []
        }
        break
      }

      case 'endEvent': {
        // 执行效果
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
          }
        }

        // 设置标志位
        if (result.setFlags) {
          for (const [flagId, value] of Object.entries(result.setFlags)) {
            state.player.flags[flagId] = value
          }
        }

        // 刷新场景？
        const currentDesc = state.currentDescriptionConfig
        const currentStillValid =
          !currentDesc || isSceneDescriptionEligible(currentDesc, state.player)
        if (result.refreshScene || !currentStillValid) {
          refreshSceneDescription()
        }

        // 结束事件
        state.mode = 'normal'
        state.currentEvent = null
        state.currentFrame = null
        if (result.exitText) {
          setSceneTextAfter(result.exitText)
        }
        // 丢弃物品/属性变动提示缓冲（提示已写入场景后缀，返回场景时展示）
        pendingNotices = []
        state.frameTextSuffix = ''
        break
      }

      case 'switchScene': {
        // 执行效果
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
          }
        }

        // 设置标志位
        if (result.setFlags) {
          for (const [flagId, value] of Object.entries(result.setFlags)) {
            state.player.flags[flagId] = value
          }
        }

        // 先重置事件状态，再切换场景（enterScene 内部会检测被动事件）
        state.mode = 'normal'
        state.currentEvent = null
        state.currentFrame = null

        if (result.enterText) {
          state.sceneTextPrefix = result.enterText
        }

        // 切换场景
        const newScene = registry.getScene(result.sceneId)
        if (newScene) {
          enterScene(newScene, result.subSceneId ?? null)
        }
        break
      }

      case 'triggerEvent': {
        // 执行效果（如果有的话）
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
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
        // 战斗开始时为敌人施加开场状态（TriggerBattleResult.buffs）
        applyBattleStartStatuses(battle, result.buffs)
        break
      }

      case 'playCG': {
        // 执行效果
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
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
        }
        break
      }

      case 'openTrade': {
        // 执行效果
        if (result.effects && result.effects.length > 0) {
          const logs = resolver.executeEffectResults(state.player, result.effects)
          if (logs.length > 0) {
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

    // 判定帧已被消费，清除判定展示信息
    state.rollResultInfo = null
  }

  // ============================================================
  // 建筑相关操作
  // ============================================================

  /**
   * 休息恢复（建筑休息 handleRest 与场景休息 rest case 共用）
   * 每休息 10 分钟恢复 buildLevel 点体力/HP，SAN 恢复 (buildLevel - 1) 点，并移除休息时应移除的状态
   */
  function applyRestRecovery(timeHours: number, buildLevel: number): void {
    // 恢复体力（沿用原休息公式：每休息 10 分钟恢复 1 点 × buildLevel）
    state.player.survival.stamina = Math.min(
      state.player.survival.maxStamina,
      state.player.survival.stamina + Math.round((timeHours * 60) / 10) * buildLevel,
    )
    // 回复HP
    state.player.survival.hp = Math.min(
      state.player.survival.maxHp,
      state.player.survival.hp + Math.round((timeHours * 60) / 10) * buildLevel,
    )
    // 回复SAN（buildLevel - 1），受智力SAN恢复系数影响
    const baseSanRecovery = Math.round((timeHours * 60) / 10) * (buildLevel - 1)
    applySanDelta(
      state.player,
      Math.round(baseSanRecovery * state.player.attributes.coefficients.sanRecoveryCoefficient),
    )
    // 移除休息时应移除的状态
    removeRestStatuses(state.player)
  }

  function handleRest(timeHours: number, option: buildOption | undefined): void {
    // 1. 推进游戏时间
    advanceGameTime(timeHours * 60)
    // 2. 恢复体力/HP/SAN，移除休息状态（共用恢复逻辑）
    applyRestRecovery(timeHours, option?.buildLevel || 1)
    // 3. 记录日志
    setSceneTextAfter((option?.description || '').replace(/\{time\}/g, timeHours.toString()))
    setLogMessage(`你休息了 ${timeHours} 小时，恢复了一些体力`)
    // 4. 返回场景界面（退出建筑交互模式）
    exitBuilding()
  }

  // ============================================================
  // 新 ScenePanel 事件处理
  // ============================================================

  /**
   * 探索：推进时间、刷新描述
   */
  function handleExplore(explore: ButtonOption): void {
    // 前置校验：资源不足立即提示并中止（不触发被动事件）
    const error = checkButtonCosts(explore)
    if (error) {
      showBlockedMessage(error)
      return
    }
    if (tryTriggerPassiveEvents('explore')) return
    state.sceneTextAfter = ''
    // 统一消耗（未配置 costTime 时默认 10 分钟）
    if (!consumeButtonCosts(explore, 10)) return
    refreshSceneDescription()
    handleFlag(explore)
  }
  /**
   * 建造：推进时间、刷新描述
   */
  function handleBuild(): void {
    refreshSceneDescription()
    state.mode = 'build'
  }

  /**
   * 资源采集/战斗
   */
  function handleCollect(collect: ResourceInteraction): void {
    // 前置校验：资源不足立即提示并中止（不触发被动事件）
    const error = checkButtonCosts(collect)
    if (error) {
      showBlockedMessage(error)
      return
    }
    if (tryTriggerPassiveEvents('collect')) return
    // 检查可用条件
    if (!evaluateConditions(collect.availableCondition, state.player)) {
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
    // 2. 统一消耗（时间/体力/SAN/HP/物品；不足则拦截）
    if (!consumeButtonCosts(collect, 10)) return

    // 显示资源文本（使用 sceneTextAfter 追加到主文字区域下方）
    if (collect.text) {
      setSceneTextAfter(collect.text)
    }

    // 敌人类型 → 按配置解析敌人组并进入战斗
    if (collect.resourceType === 'enemy' && collect.enemyConfig) {
      const cfg = collect.enemyConfig
      // 依次检查 extend：条件满足且概率命中（含幸运加成）的第一个生效，否则使用基础配置
      let hitText: string | undefined
      let groups = cfg.enemy
      if (cfg.extend) {
        const playerLuck = state.player.attributes.luck + state.player.attributes.luckModifier
        for (const ext of cfg.extend) {
          if (ext.condition && !evaluateConditions(ext.condition, state.player)) continue
          if (rollLuckAdjusted(ext.probability, ext.luck, playerLuck)) {
            groups = ext.enemy
            hitText = ext.text
            break
          }
        }
      }

      // 按解析出的敌人组展开敌人ID
      const enemyIds: string[] = []
      for (const g of groups) {
        const quantity = resolveQuantity(g.quantity)
        for (let i = 0; i < quantity; i++) {
          enemyIds.push(g.enemyId)
        }
      }

      // 根据命中情况显示对应文本
      if (hitText) {
        setSceneTextAfter(hitText)
      } else if (cfg.text) {
        setSceneTextAfter(cfg.text)
      }

      if (enemyIds.length > 0) {
        const battle = createBattle(state.player, enemyIds)
        startBattle(battle)
        state.currentBattle = battle
        state.mode = 'battle'
      } else {
      }
    } else if (collect.resourceType === 'item' && collect.itemConfig) {
      const cfg = collect.itemConfig
      // 依次检查 extend：条件满足且概率命中（含幸运加成）的第一个生效，否则使用基础配置
      let hitText: string | undefined
      let groups = cfg.item
      if (cfg.extend) {
        const playerLuck = state.player.attributes.luck + state.player.attributes.luckModifier
        for (const ext of cfg.extend) {
          if (ext.condition && !evaluateConditions(ext.condition, state.player)) continue
          if (rollLuckAdjusted(ext.probability, ext.luck, playerLuck)) {
            groups = ext.item
            hitText = ext.text
            break
          }
        }
      }

      // 按解析出的物品组获得物品（获得提示由 onItemAdded 监听器统一追加）
      for (const g of groups) {
        addItem(state.player, g.itemId, resolveQuantity(g.quantity))
      }

      // 根据命中情况显示对应文本
      if (hitText) {
        setSceneTextAfter(hitText)
      } else if (cfg.text) {
        setSceneTextAfter(cfg.text)
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

  // ============================================================
  // 角色交互（攻击 / 对话 / 交易）
  // ============================================================

  /**
   * 攻击角色：按 enemyConfig 解析敌人组并进入战斗
   * 胜利后进入 enemyConfig.winEventId 对应事件，失败后进入 failEventId 对应事件
   */
  function attackCharacter(character: CharacterInteraction): void {
    const cfg = character.enemyConfig
    if (!cfg) return

    // 依次检查 extend：条件满足且概率命中（含幸运加成）的第一个生效，否则使用基础配置
    let hitText: string | undefined
    let groups = cfg.enemy
    if (cfg.extend) {
      const playerLuck = state.player.attributes.luck + state.player.attributes.luckModifier
      for (const ext of cfg.extend) {
        if (ext.condition && !evaluateConditions(ext.condition, state.player)) continue
        if (rollLuckAdjusted(ext.probability, ext.luck, playerLuck)) {
          groups = ext.enemy
          hitText = ext.text
          break
        }
      }
    }

    // 按解析出的敌人组展开敌人ID
    const enemyIds: string[] = []
    for (const g of groups) {
      const quantity = resolveQuantity(g.quantity)
      for (let i = 0; i < quantity; i++) {
        enemyIds.push(g.enemyId)
      }
    }

    // 根据命中情况显示对应文本
    if (hitText) {
      setSceneTextAfter(hitText)
    } else if (cfg.text) {
      setSceneTextAfter(cfg.text)
    }

    if (enemyIds.length === 0) return

    const battle = createBattle(state.player, enemyIds)
    state.currentBattle = battle
    state.pendingCharacterResult = { winEventId: cfg.winEventId, failEventId: cfg.failEventId }
    state.mode = 'battle'
    startBattle(battle)
  }

  /**
   * 与角色对话：进入 dialogConfig 列表中第一个满足显示条件的对话事件
   */
  function startCharacterDialog(character: CharacterInteraction): void {
    const dialog = (character.dialogConfig ?? []).find(
      (d) => !d.displayCondition || evaluateConditions(d.displayCondition, state.player),
    )
    if (dialog) {
      enterEvent(dialog.dialogEventId)
    }
  }

  /**
   * 打开角色交易界面（mode = 'trade'，由 TradePanel 渲染）
   */
  function openCharacterTrade(character: CharacterInteraction): void {
    const trader = character.tradeConfig
    if (!trader) return
    state.currentTraderId = trader.id
    state.mode = 'trade'
  }

  /**
   * 退出交易界面（回到事件/场景模式）
   */
  function exitTradeMode(): void {
    state.currentTraderId = null
    state.mode = state.currentEvent ? 'event' : state.currentCG ? 'cg' : 'normal'
  }

  /**
   * 从当前商人处购买物品
   */
  function buyFromTrader(goodsItemId: string, quantity = 1): void {
    const trader = state.currentTraderId ? registry.getTrader(state.currentTraderId) : undefined
    if (!trader) return
    const result = tradeBuyFromTrader(state.player, trader, goodsItemId, quantity)
    if (!result.success) {
      setLogMessage(result.message)
    }
  }

  /**
   * 向当前商人出售物品
   */
  function sellToTrader(itemId: string, quantity = 1): void {
    const trader = state.currentTraderId ? registry.getTrader(state.currentTraderId) : undefined
    if (!trader) return
    const result = tradeSellToTrader(state.player, trader, itemId, quantity)
    if (!result.success) {
      setLogMessage(result.message)
    }
  }

  /**
   * 切换进入目标场景（选择描述 + 标记已见 + 更新位置 + 被动事件判定）
   * 注意：不修改 mode，由调用方负责模式切换
   */
  function enterScene(scene: Scene, subSceneId?: string | null): void {
    // 切换场景后，事件入口恢复可点击
    state.eventEntryClicked = false
    state.currentScene = scene
    state.currentSubScene = subSceneId ? (registry.getSubScene(subSceneId) ?? null) : null
    state.player.currentLocation.sceneId = scene.id
    state.player.currentLocation.subSceneId = state.currentSubScene?.id ?? null
    const target = state.currentSubScene || scene
    const selectedDesc = selectSceneDescription(target, state.player)
    state.sceneDescription = selectedDesc ? selectedDesc.text : '（场景描述缺失）'
    state.currentDescriptionConfig = selectedDesc || null
    if (selectedDesc) {
      markDescriptionSeen(selectedDesc, state.player)
    }
    // 检测目标场景被动事件
    tryTriggerPassiveEvents('enter')
  }
  /**
   * 进入场景（handleSceneMove 与 handleInteraction 共用）
   * 离开场景前先拦截被动事件（触发则覆盖进入操作）
   */
  function enterSceneById(sceneId: string, subSceneId?: string, button?: ButtonOption): boolean {
    // 前置校验：资源不足立即提示并中止（不触发被动事件）
    if (button) {
      const error = checkButtonCosts(button)
      if (error) {
        showBlockedMessage(error)
        return false
      }
    }
    // 离开当前场景前被动事件拦截（触发后覆盖进入操作，不消耗）
    if (tryTriggerPassiveEvents('leave')) {
      return false
    }
    // 统一消耗（未配置 costTime 时默认 5 分钟；移动时间受敏捷影响）
    if (button && !consumeButtonCosts(button, 5, 0, true)) {
      return false
    }
    const scene = registry.getScene(sceneId)
    if (scene) {
      enterScene(scene, subSceneId)
    }
    return true
  }
  /**
   * 进入子场景（handleSceneMove 与 handleInteraction 共用）
   * 离开母场景前先拦截被动事件（触发则覆盖进入操作）
   */
  function enterSubSceneById(subSceneId: string, button?: ButtonOption): boolean {
    // 前置校验：资源不足立即提示并中止（不触发被动事件）
    if (button) {
      const error = checkButtonCosts(button)
      if (error) {
        showBlockedMessage(error)
        return false
      }
    }
    // 离开当前场景（母场景）进入子场景前被动事件拦截（触发后覆盖离开操作）
    if (tryTriggerPassiveEvents('leave')) {
      return false
    }
    // 统一消耗（未配置 costTime 时默认 5 分钟）
    if (button && !consumeButtonCosts(button, 5)) {
      return false
    }
    if (registry.getSubScene(subSceneId)) {
      enterScene(state.currentScene, subSceneId)
    }
    return true
  }

  /**
   * 离开子场景返回母场景（handleSceneMove 与 handleInteraction 共用）
   * 离开前先拦截被动事件（触发则覆盖离开操作）
   */
  function exitSubSceneToParent(button?: ButtonOption): boolean {
    // 前置校验：资源不足立即提示并中止（不触发被动事件）
    if (button) {
      const error = checkButtonCosts(button)
      if (error) {
        showBlockedMessage(error)
        return false
      }
    }
    // 离开子场景前被动事件拦截（触发后覆盖离开操作）
    if (tryTriggerPassiveEvents('leave')) {
      return false
    }
    // 统一消耗（未配置 costTime 时默认 5 分钟；移动时间受敏捷影响）
    if (button && !consumeButtonCosts(button, 5, 0, true)) {
      return false
    }
    enterScene(state.currentScene, null)
    return true
  }

  /**
   * 场景移动（enterSubScene / exitSubScene / move）
   */
  function handleSceneMove(moveAction: MoveInteraction): void {
    const moveType = moveAction.moveType ?? 'move'
    state.sceneTextAfter = ''
    // 检查可用条件
    if (!evaluateConditions(moveAction.availableCondition, state.player)) {
      setSceneTextAfter(moveAction.unavailableTooltip || '该操作当前不可用')
      return
    }

    if (moveType === 'enterSubScene' && moveAction.subSceneId) {
      if (!enterSubSceneById(moveAction.subSceneId, moveAction)) return
    } else if (moveType === 'exitSubScene') {
      if (!exitSubSceneToParent(moveAction)) return
    } else if (moveType === 'enterScene' && moveAction.sceneId) {
      if (!enterSceneById(moveAction.sceneId, moveAction.subSceneId, moveAction)) return
    } else if (moveType === 'toCampsite') {
      // 回到营地：耗时由大地图路线（同母场景固定 10 分钟）决定
      if (!moveToCampsite()) {
        setSceneTextAfter('暂时无法回到营地')
        return
      }
    } else {
      // 普通 move 类型：打开大地图界面（不消耗时间，移动时再结算）
      state.sceneTextAfter = ''
      if (tryTriggerPassiveEvents('leave')) {
        return
      }
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
      state.mode = 'normal'
      return
    }
    // 根据路径/距离计算移动方案（时间 + 体力）
    const currentMap =
      registry.getMap(state.player.currentLocation.mapId || registry.getInitialMapId()) ?? null
    if (!currentMap) {
      state.mode = 'normal'
      return
    }

    // 节点解锁校验（未解锁的目标节点不应出现在大地图上，此处为防御 UI 绕过）
    const targetNode = currentMap.nodes.find((n) => n.sceneId === sceneId)
    if (targetNode && !isMapNodeUnlocked(targetNode, state.player)) {
      return
    }

    const cost = calculateMoveCost(currentMap, state.currentScene, targetScene, state.player)

    // 无可行路径 → 无法移动（仅影响配置了 paths 的地图）
    if (!cost) {
      return
    }

    // 实际体力消耗 = 原消耗体力 × 体力消耗系数（100/(力量+100)），向上取整
    const actualStaminaCost = Math.ceil(
      cost.staminaCost * state.player.attributes.coefficients.staminaConsumptionCoefficient,
    )

    // 体力校验
    if (actualStaminaCost > 0 && state.player.survival.stamina < actualStaminaCost) {
      return
    }

    // 离开前被动事件拦截（触发后覆盖离开操作，不消耗时间/体力）
    if (tryTriggerPassiveEvents('leave')) {
      return
    }

    // 扣除体力并推进时间（移动时间受敏捷影响：原时间 × 100/(敏捷+50)，向上取整）
    if (actualStaminaCost > 0) {
      state.player.survival.stamina = Math.max(0, state.player.survival.stamina - actualStaminaCost)
    }
    advanceGameTime(calcMoveTime(cost.minutes, state.player.attributes.agility))

    // 移动到目标场景
    state.sceneTextAfter = ''
    state.sceneTextPrefix = ''
    state.mode = 'normal'
    enterScene(targetScene, null)
  }

  /**
   * 关闭大地图，返回进入地图前的场景
   */
  function closeMap(): void {
    state.sceneTextAfter = ''
    state.mode = 'normal'
  }

  /**
   * 回营地信息（供"回到营地"按钮显示与移动结算）
   * 耗时 = 当前场景母场景在大地图上移动到营地母场景的时间；
   * 同母场景时固定 10 分钟。无营地或路径不可达时 available 为 false。
   */
  function getCampsiteMoveInfo(): CampsiteMoveInfo | null {
    const campsiteId = state.player.progress.campsiteSceneId
    if (!campsiteId) return null
    const campSub = registry.getSubScene(campsiteId)
    if (!campSub) return null
    const campParent = registry.getScene(campSub.parentSceneId)
    if (!campParent) return null

    const base = {
      subSceneId: campsiteId,
      subSceneName: campSub.name,
      minutes: 0,
      staminaCost: 0,
      available: true,
    }

    // 同母场景：固定 10 分钟
    if (campParent.id === state.currentScene?.id) {
      return { ...base, minutes: 10 }
    }

    // 跨母场景：按大地图移动耗时
    const currentMap =
      registry.getMap(state.player.currentLocation.mapId || registry.getInitialMapId()) ?? null
    if (!currentMap) return { ...base, available: false }
    const cost = calculateMoveCost(currentMap, state.currentScene, campParent, state.player)
    if (!cost) return { ...base, available: false }
    return { ...base, minutes: cost.minutes, staminaCost: cost.staminaCost }
  }

  /**
   * 回到营地：移动到当前营地的子场景
   * 耗时/体力与大地图移动规则一致（同母场景固定 10 分钟），时间受敏捷影响
   */
  function moveToCampsite(): boolean {
    const info = getCampsiteMoveInfo()
    if (!info || !info.available) return false

    // 实际体力消耗 = 原消耗体力 × 体力消耗系数（100/(力量+100)），向上取整
    const actualStaminaCost = Math.ceil(
      info.staminaCost * state.player.attributes.coefficients.staminaConsumptionCoefficient,
    )
    if (actualStaminaCost > 0 && state.player.survival.stamina < actualStaminaCost) {
      return false
    }

    // 离开前被动事件拦截（触发后覆盖离开操作，不消耗时间/体力）
    if (tryTriggerPassiveEvents('leave')) {
      return false
    }

    if (actualStaminaCost > 0) {
      state.player.survival.stamina = Math.max(0, state.player.survival.stamina - actualStaminaCost)
    }
    advanceGameTime(calcMoveTime(info.minutes, state.player.attributes.agility))

    // 进入营地子场景（跨母场景时同时切换到营地母场景）
    const campSub = registry.getSubScene(info.subSceneId)
    const campParent = campSub ? registry.getScene(campSub.parentSceneId) : null
    state.sceneTextAfter = ''
    state.sceneTextPrefix = ''
    state.mode = 'normal'
    enterScene(campParent ?? state.currentScene, info.subSceneId)
    return true
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
    } else {
    }

    return result
  }

  /**
   * 执行建筑升级
   */
  function executeUpgradeBuildMode(buildId: string, targetSubBuildId: string): CraftResult {
    const subSceneId = state.currentSubScene?.id
    if (!subSceneId) {
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
    } else {
    }

    return result
  }

  /**
   * 执行拆除建筑
   */
  function executeDeconstructBuilding(buildId: string): CraftResult {
    const subSceneId = state.currentSubScene?.id
    if (!subSceneId) {
      return { success: false, message: '当前不在营地场景中', timeUsed: 0 }
    }

    const result = executeDeconstruct(state.player, buildId, subSceneId)

    if (result.success) {
      if (result.timeUsed > 0) {
        advanceGameTime(result.timeUsed)
      }
      // 退出建筑交互模式返回场景
      exitBuilding()
    } else {
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
   * 判断当前子场景是否为"当前营地"
   * 唯一营地由 player.progress.campsiteSceneId 记录；
   * 场景配置 isCampsite 仅表示"候选营地"（可建立/搬入），不直接决定 UI 渲染。
   */
  function isCurrentCampsite(): boolean {
    const subScene = state.currentSubScene
    if (!subScene) return false
    return subScene.id === state.player.progress.campsiteSceneId
  }

  /**
   * 获取当前营地的可用功能列表
   * 遍历已有建筑（buildingInit + 玩家建造）的交互配置，按 interactionType 聚合成功能按钮。
   * 多个建筑提供同一功能时，取建筑（交互）等级最高的那个；collect/special 类型不展示。
   */
  function getCampsiteFunctions(): CampsiteFunction[] {
    if (!isCurrentCampsite()) return []
    const subScene = state.currentSubScene!

    const initIds: string[] = subScene.buildingInit ?? []
    const builtIds: string[] = state.player.progress.campBuildings[subScene.id] ?? []
    const allIds = new Set([...initIds, ...builtIds])

    const funcMap = new Map<CampsiteFunction['interactionType'], CampsiteFunction>()
    for (const bldId of allIds) {
      const build = registry.getBuilding(bldId)
      if (!build) continue

      const currentSubId =
        state.player.progress.campBuildingLevels[subScene.id]?.[bldId] ?? build.defaultBuild
      const currentSub = build.subBuild.find((s) => s.buildId === currentSubId)
      if (!currentSub) continue

      for (const act of currentSub.interactions ?? []) {
        if (act.interactionType === 'collect' || act.interactionType === 'special') continue
        const level = act.buildLevel ?? 0
        const existing = funcMap.get(act.interactionType)
        if (existing && level <= existing.buildLevel) continue
        funcMap.set(act.interactionType, {
          interactionType: act.interactionType,
          name: resolveOptionName(act.name, state.player),
          buildLevel: level,
          buildId: bldId,
          eventId: act.eventId,
          interaction: act,
        })
      }
    }

    // 按固定优先级排序展示
    const priority: CampsiteFunction['interactionType'][] = [
      'craft',
      'cook',
      'rest',
      'store',
      'repair',
      'event',
    ]
    return [...funcMap.values()].sort(
      (a, b) => priority.indexOf(a.interactionType) - priority.indexOf(b.interactionType),
    )
  }

  /**
   * 解析交互名称（支持 textVariation 变体：取第一个满足条件的变体文本）
   */
  function resolveOptionName(value: string | textVariation[], player: PlayerState): string {
    if (typeof value === 'string') return value
    const matched = value.find((v) => evaluateConditions(v.displayCondition, player))
    return matched?.content ?? value[0]?.content ?? ''
  }

  /**
   * 打开营地建筑界面（仅显示已有建筑）
   */
  function openCampsitePanel(): void {
    state.mode = 'camp'
  }

  /**
   * 关闭营地建筑界面，返回场景
   */
  function closeCampsitePanel(): void {
    state.mode = 'normal'
  }

  /**
   * 进入建筑交互模式
   */
  function enterBuilding(buildId: string): void {
    state.mode = 'building'
    state.currentBuildingId = buildId
  }

  /**
   * 退出建筑交互模式返回场景
   */
  function exitBuilding(): void {
    state.mode = 'normal'
    state.currentBuildingId = null
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
  }

  /**
   * 设置底部日志消息
   */
  function setLogMessage(message: string): void {}

  // 设置场景文本下部描述
  function setSceneTextAfter(description: string): void {
    if (state.sceneTextAfter) {
      state.sceneTextAfter += '\n'
    }
    state.sceneTextAfter += description
  }

  // 注册物品获得监听：获得物品时追加场景后缀提示；事件中同时缓冲给下一帧前缀
  disposeItemAddedListener?.()
  disposeItemAddedListener = onItemAdded((itemId, quantity) => {
    const itemName = registry.getItemName(itemId)
    const msg = `你获得了【${itemName}】×${quantity}`
    // 场景后缀始终追加（事件回场景 / 场景中变动都能看到）
    setSceneTextAfter(msg)
    // 事件中发生的变动，保留给下一帧前缀合并显示
    if (state.mode === 'event') {
      pendingNotices.push(msg)
    }
  })

  // 注册属性变动监听：基础属性/经验变动时追加场景后缀提示；事件中同时缓冲给下一帧前缀
  disposeAttributeChangeListener?.()
  disposeAttributeChangeListener = onAttributeChanged((change) => {
    const lines = formatAttributeChangeNotices(change)
    if (lines.length === 0) return
    // 场景后缀始终追加（事件回场景 / 场景中变动都能看到）
    for (const line of lines) {
      setSceneTextAfter(line)
    }
    // 事件中发生的变动，保留给下一帧前缀合并显示
    if (state.mode === 'event') {
      pendingNotices.push(...lines)
    }
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
    }
  }

  /**
   * 战斗结束后跳转到结果帧（事件帧或CG帧）
   * @returns 是否成功跳转
   */
  function jumpToBattleResultFrame(frameId: string): boolean {
    if (state.currentEvent) {
      jumpToEventFrame(frameId)
      return true
    }
    if (state.currentCG) {
      if (jumpToCGFrame(state.currentCG, frameId)) {
        state.mode = 'cg'
        return true
      }
      // CG帧不存在：结束CG返回场景
      state.currentCG = null
      state.mode = 'normal'
    }
    return false
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
    } else if (battle.result === BattleResult.DEFEAT) {
      // 角色攻击战斗：失败后进入配置的失败事件
      const charResult = state.pendingCharacterResult
      state.pendingCharacterResult = null
      if (charResult?.failEventId) {
        state.currentBattle = null
        state.pendingBattleFrameIds = null
        enterEvent(charResult.failEventId)
        return
      }

      // 尝试跳转到战败帧（事件帧或CG帧）
      const defeatFrameId = state.pendingBattleFrameIds?.defeatFrameId
      if (defeatFrameId && (state.currentEvent || state.currentCG)) {
        jumpToBattleResultFrame(defeatFrameId)
        state.currentBattle = null
        state.pendingBattleFrameIds = null
      } else {
        // 没有战败帧则进入结局判定
        state.currentBattle = null
        state.pendingBattleFrameIds = null
        checkAndTriggerEnding()
        if (state.mode !== 'ending') {
          state.mode = 'normal'
        }
      }
    } else if (battle.result === BattleResult.ESCAPED) {
      // 角色攻击战斗逃跑：清除待结算事件
      state.pendingCharacterResult = null
      // 尝试跳转到逃跑帧（事件帧或CG帧）
      const escapeFrameId = state.pendingBattleFrameIds?.escapeFrameId
      if (escapeFrameId && (state.currentEvent || state.currentCG)) {
        jumpToBattleResultFrame(escapeFrameId)
      } else {
        state.mode = state.currentEvent ? 'event' : state.currentCG ? 'cg' : 'normal'
      }

      state.currentBattle = null
      state.pendingBattleFrameIds = null
    } else {
      // 战斗还在继续，显示日志
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

    const charResult = state.pendingCharacterResult
    const victoryFrameId = state.pendingBattleFrameIds?.victoryFrameId

    state.currentBattle = null
    state.pendingBattleFrameIds = null
    state.pendingCharacterResult = null

    // 角色攻击战斗：胜利后进入配置的胜利事件
    if (charResult?.winEventId) {
      enterEvent(charResult.winEventId)
      return
    }

    // 尝试跳转到胜利帧（事件帧或CG帧）
    if (victoryFrameId && (state.currentEvent || state.currentCG)) {
      jumpToBattleResultFrame(victoryFrameId)
    } else {
      state.mode = state.currentEvent ? 'event' : state.currentCG ? 'cg' : 'normal'
    }
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
   * 尝试触发当前场景/子场景的被动事件
   * 命中（条件满足 + 概率通过）时进入对应事件并标记一次性事件的 seenFlag
   * 若配置了该来源的承接文案（enterTexts），注入到事件首帧文本之前显示
   *
   * 统一语义：被动事件在各动作（探索/采集/离开/进入）执行前判定，
   * 触发后调用方应 return 中止当前动作——不消耗时间/体力，不标记动作 usedFlag。
   *
   * @param source - 触发来源（进入场景 / 采集 / 离开场景 / 探索）
   * @returns 是否触发了被动事件（触发后调用方中止当前动作）
   */
  function tryTriggerPassiveEvents(source: PassiveEventSource = 'enter'): boolean {
    const target = state.currentSubScene || state.currentScene
    const passiveEvent = getScenePassiveEvent(target, state.player)
    if (!passiveEvent) return false
    if (passiveEvent.isOneTime && passiveEvent.seenFlag) {
      state.player.flags[passiveEvent.seenFlag] = true
    }
    enterEvent(passiveEvent.id)
    // 注入触发来源承接文案（enterEvent 会清空 frameTextPrefix，因此在此之后设置）
    const bridge = passiveEvent.enterTexts?.[source]
    if (bridge) state.frameTextPrefix = bridge
    return true
  }

  /**
   * 刷新当前场景描述
   * 使用 exploration.selectSceneDescription 根据条件选取描述
   * （被动事件判定由各动作入口前置触发，此处不再检测）
   */
  function refreshSceneDescription(): void {
    // 重新选取描述后，事件入口恢复可点击
    state.eventEntryClicked = false
    const target = state.currentSubScene || state.currentScene
    const selectedDesc = selectSceneDescription(target, state.player)
    if (selectedDesc) {
      state.sceneDescription = selectedDesc.text
      state.currentDescriptionConfig = selectedDesc
      markDescriptionSeen(selectedDesc, state.player)
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
      return
    }

    const config = registry.getItem(invItem.itemId)
    if (!config) {
      return
    }

    if (config.category === ItemCategory.CONSUMABLE) {
      const log = useConsumable(state.player, instanceId)
    } else if (config.category === ItemCategory.DOCUMENT) {
      // 阅读文档（暂仅显示名称）
    } else {
    }
  }

  /**
   * 装备物品
   */
  function handleEquipItem(instanceId: string): void {
    const invItem = state.player.inventory.find((i) => i.instanceId === instanceId)
    if (!invItem) {
      return
    }

    const ok = engineEquipItem(state.player, instanceId)
    if (ok) {
      const config = registry.getItem(invItem.itemId)
    } else {
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
        } else {
        }
        return
      }
    }
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

  /**
   * 选择CG选项（由 CGView 调用）
   * 根据选项结果执行：跳帧 / 跳CG / 进入场景 / 触发事件 / 触发战斗 / 进入结局
   */
  function selectCGOption(optionId: string): void {
    if (!state.currentCG) return

    const frame = state.currentCG.currentFrame
    const option = frame.options?.find((o) => o.id === optionId)
    if (!option) return

    // 标记选项已选（isOneTime 追踪）
    if (option.usedFlag) {
      state.player.flags[option.usedFlag] = true
    }

    const result = option.result

    // 执行效果
    executeEffects(result.effects)

    // 设置标志位（number 存入 flagsNum，其余存入 flags）
    if (result.setFlags) {
      for (const [flagId, value] of Object.entries(result.setFlags)) {
        if (typeof value === 'number') {
          state.player.flagsNum[flagId] = value
        } else {
          state.player.flags[flagId] = value as boolean
        }
      }
    }

    switch (result.type) {
      case 'nextFrame': {
        // 跳转到CG内指定帧
        if (!jumpToCGFrame(state.currentCG, result.nextFrameId)) {
        }
        break
      }

      case 'nextCG': {
        // 切换到另一个CG
        const cgPlay = startCG(result.nextCGId)
        if (cgPlay) {
          state.currentCG = cgPlay
        } else {
        }
        break
      }

      case 'enterScene': {
        // 切换场景
        const newScene = registry.getScene(result.sceneInfo.sceneId)
        if (newScene) {
          state.currentScene = newScene
          state.currentSubScene = result.sceneInfo.subSceneId
            ? (registry.getSubScene(result.sceneInfo.subSceneId) ?? null)
            : null

          const target = state.currentSubScene || state.currentScene
          const selectedDesc = selectSceneDescription(target, state.player)
          state.sceneDescription = selectedDesc ? selectedDesc.text : '（场景描述缺失）'
          state.currentDescriptionConfig = selectedDesc || null
          if (selectedDesc) {
            markDescriptionSeen(selectedDesc, state.player)
          }

          state.player.currentLocation.sceneId = result.sceneInfo.sceneId
          state.player.currentLocation.subSceneId = result.sceneInfo.subSceneId ?? null
        }

        state.currentCG = null
        state.mode = 'normal'
        break
      }

      case 'triggerEvent': {
        // 结束CG，进入事件
        state.currentCG = null
        enterEvent(result.eventId)
        break
      }

      case 'triggerBattle': {
        // 存储战斗结果待跳转的CG帧ID
        state.pendingBattleFrameIds = {
          victoryFrameId: result.victoryFrameId,
          defeatFrameId: result.defeatFrameId,
          escapeFrameId: result.escapeFrameId,
        }

        // 创建并开始战斗
        const battle = createBattle(state.player, [result.enemyId])
        state.currentBattle = battle
        state.mode = 'battle'
        startBattle(battle)
        break
      }

      case 'ending': {
        const ending = registry.getEnding(result.endingId)
        if (ending) {
          triggerEnding(ending, 'CG结局')
        } else {
          state.currentCG = null
          state.mode = 'normal'
        }
        break
      }
    }
  }

  return {
    state: readonly(state) as GameRuntimeState,
    enterEvent,
    selectEventOption,
    handleExplore,
    handleBuild,
    handleRest,
    handleCollect,
    handleSceneMove,
    getCurrentMap,
    moveToMapScene,
    closeMap,
    getCampsiteFunctions,
    getCampsiteMoveInfo,
    isCurrentCampsite,
    openCampsitePanel,
    closeCampsitePanel,
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
    selectCGOption,
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
    attackCharacter,
    startCharacterDialog,
    openCharacterTrade,
    exitTradeMode,
    buyFromTrader,
    sellToTrader,
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
