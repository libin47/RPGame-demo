// cg.ts - CG场景数据结构
import type { EffectResult } from './effect'
import type { Condition } from './effect'

// CG场景配置
export interface CGScene {
  // CG唯一ID
  id: string
  // CG名称
  name: string
  // CG备注（开发者可见）
  notes?: string

  // CG帧序列
  frames: CGFrame[]

  // CG触发条件，事件触发时，依此条件判断是否触发CG
  triggerCondition?: Condition

  // CG类型
  cgType: CGType
}

// CG类型
export enum CGType {
  // 开场CG
  OPENING = 'opening',
  // 结局CG
  ENDING = 'ending',
  // 重要场景CG
  IMPORTANT_SCENE = 'important_scene',
  // 角色CG
  CHARACTER = 'character',
  // 战斗CG
  BATTLE = 'battle',
  // 梦境CG
  DREAM = 'dream',
  // 回忆CG
  MEMORY = 'memory',
}

// CG帧
export interface CGFrame {
  // 帧ID
  id: string
  // 帧序号（用于排序）
  order: number

  // 文本内容
  texts: CGText[]

  // 背景图片
  backgroundImage?: CGSprite

  // 前景图片/角色立绘
  foregroundSprites?: CGSprite[]

  // 屏幕效果（震动、闪屏等）
  screenEffects?: CGScreenEffect[]

  // 选项列表
  options?: CGOption[]

  // 帧显示条件，如果不满足，按照序号自动顺延下一个帧显示
  displayCondition?: Condition
}

// CG文本
export interface CGText {
  // 文本内容
  content: string

  // 显示条件
  condition?: Condition

  // 显示延迟（毫秒）
  displayDelay?: number

  // 文本变动（根据SAN值等条件显示不同文本）
  variations?: CGTextVariation[]

  // 文本样式
  style?: CGTextStyle
}

// CG文本样式
export interface CGTextStyle {
  // 字体大小
  fontSize?: number
  // 字体颜色
  color?: string
  // 字体粗细
  fontWeight?: 'normal' | 'bold'
  // 字体样式
  fontStyle?: 'normal' | 'italic'
  // 文本对齐
  textAlign?: 'left' | 'center' | 'right'
  // 文本装饰
  textDecoration?: 'none' | 'underline' | 'line-through'
  // 文本阴影
  textShadow?: string
  // 特殊效果
  specialEffect?: 'none' | 'glitch' | 'fade' | 'shake' | 'distortion'
  // 字体家族
  fontFamily?: string

  position?: CGTextPosition
}

// CG文本位置
export enum CGTextPosition {
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  CENTER = 'center',
  CUSTOM = 'custom',
}

// CG文本变体（根据条件显示不同文本）
export interface CGTextVariation {
  // 变体文本
  content: string
  // 显示条件（如SAN值范围）
  condition: Condition
  // 变体样式
  style?: CGTextStyle
}

// CG精灵（图片元素）
export interface CGSprite {
  // 图片URL或资源ID
  imageId: string
  // 位置
  position: {
    x: number | string
    y: number | string
  }
  // 大小
  size?: {
    width: number | string
    height: number | string
  }
  // 透明度 (0-1)
  opacity?: number
  // 显示条件
  condition?: Condition
  // 图层顺序
  zIndex?: number
}

// 屏幕效果
export interface CGScreenEffect {
  // 效果类型
  type: CGScreenEffectType
  // 强度 (0-1)
  intensity: number
  // 持续时间（毫秒）
  duration: number
  // 延迟（毫秒）
  delay?: number
  // 效果条件
  condition?: Condition
}

// 屏幕效果类型
export enum CGScreenEffectType {
  SHAKE = 'shake',
  FLASH = 'flash',
  FADE_TO_BLACK = 'fadeToBlack',
  FADE_FROM_BLACK = 'fadeFromBlack',
  FADE_TO_WHITE = 'fadeToWhite',
  BLUR = 'blur',
  COLOR_GRADING = 'colorGrading',
  INVERT = 'invert',
  SEPIA = 'sepia',
  RED_TINT = 'redTint',
}

// CG选项
export interface CGOption {
  // 选项文本
  text: string
  // 选项描述（可选）
  description?: string
  // 选项文本变体（根据条件）
  textVariations?: CGTextVariation[]
  // 选项可用条件
  availableCondition?: Condition
  // 选项不可用时的文本
  unavailableText?: string
  // 选项结果
  result: CGOptionResult
  // 选项显示的优先级顺序
  priority?: number
  // 是否隐藏（不满足条件时）
  hideWhenUnavailable?: boolean
  // 选项样式
  style?: 'default' | 'danger' | 'special' | 'hidden'
  // 选项提示
  tooltip?: string
}

// CG选项结果（联合类型版本）
export type CGOptionResult =
  | CGNextFrameResult
  | CGNextCGResult
  | CGEnterSceneResult
  | CGTriggerEventResult
  | CGTriggerBattleResult
  | CGEndingResult

// 跳转到下一帧
export interface CGNextFrameResult {
  type: 'nextFrame'
  // 目标帧ID（必填）
  nextFrameId: string
  // 触发的效果列表
  effects?: EffectResult[]
  // 设置标志位
  setFlags?: Record<string, number | string | boolean>
}

// 跳转到另一个CG
export interface CGNextCGResult {
  type: 'nextCG'
  // 目标CG的ID（必填）
  nextCGId: string
  // 触发的效果列表
  effects?: EffectResult[]
  // 设置标志位
  setFlags?: Record<string, number | string | boolean>
}

// 结束CG，进入游戏场景
export interface CGEnterSceneResult {
  type: 'enterScene'
  // 场景信息（必填）
  sceneInfo: {
    sceneId: string
    subSceneId?: string
  }
  // 触发的效果列表
  effects?: EffectResult[]
  // 设置标志位
  setFlags?: Record<string, number | string | boolean>
}

// 触发事件
export interface CGTriggerEventResult {
  type: 'triggerEvent'
  // 事件ID（必填）
  eventId: string
  // 触发的效果列表
  effects?: EffectResult[]
  // 设置标志位
  setFlags?: Record<string, number | string | boolean>
}

// 触发战斗
export interface CGTriggerBattleResult {
  type: 'triggerBattle'
  // 敌人ID（必填）
  enemyId: string
  // 胜利后跳转的帧ID
  victoryFrameId?: string
  // 失败后跳转的帧ID
  defeatFrameId?: string
  // 逃跑后跳转的帧ID
  escapeFrameId?: string
  // 触发的效果列表
  effects?: EffectResult[]
  // 设置标志位
  setFlags?: Record<string, number | string | boolean>
}

// 进入结局
export interface CGEndingResult {
  type: 'ending'
  // 结局ID
  endingId: string
  // 触发的效果列表
  effects?: EffectResult[]
  // 设置标志位
  setFlags?: Record<string, number | string | boolean>
}
export interface CGRegistry {
  cgs: Record<string, CGScene>
}
