import type { Condition, EffectResult } from './effect'

export enum EventOptionType {
  END = 'end',
  BATTLE = 'battle',
  TRADE = 'trade',
  CG = 'cg',
  NEXT_EVENT = 'nextEvent',
  COMPOSITE = 'composite',
  SCENE_CHANGE = 'sceneChange',
}

export interface Event {
  id: string
  name: string
  note?: string
  description: string
  image?: string
  subEvents: SubEvent[]
  triggerCondition?: Condition
  priority: number
  isRepeatable?: boolean
  isPassive?: boolean
  passiveTriggerProbability?: number
}

export interface SubEvent {
  id: string
  name: string
  textDescriptions: TextDescription[]
  image?: string
  imageDescription?: string
  options: EventOption[]
  isEnd?: boolean
  nextSubEventId?: string
}

export interface TextDescription {
  content: string
  condition?: Condition
  priority?: number
}

export interface EventOption {
  id: string
  text: string
  description?: string
  availableCondition?: Condition
  unavailableText?: string
  hideWhenUnavailable?: boolean
  result: EventOptionResult
}

export interface EventOptionResult {
  type: EventOptionType
  nextSubEventId?: string
  params?: EventOptionParams
  effects?: EffectResult[]
  setFlags?: Record<string, boolean | number | string>
}

export interface EventOptionParams {
  battleEnemyId?: string
  battleVictoryEventId?: string
  battleDefeatEventId?: string
  cgId?: string
  sceneId?: string
  subSceneId?: string
  tradePartnerId?: string
}

export interface EventChain {
  id: string
  startEventId: string
  conditions?: Condition[]
  priority: number
}

export interface EventState {
  activeEventId?: string
  activeSubEventId?: string
  completedEvents: string[]
  triggeredEvents: string[]
  eventFlags: Record<string, boolean | number | string>
}