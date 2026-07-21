import type { Condition } from './effect'

export interface MapNode {
  id: string
  sceneId: string
  x: number
  y: number
  name: string
  description?: string
  icon?: string
  connections: MapConnection[]
  isVisible?: boolean
  isUnlocked?: boolean
  unlockCondition?: Condition
}

export interface MapConnection {
  targetNodeId: string
  timeCostMinutes: number
  staminaCost: number
  isPassable: boolean
  condition?: Condition
  description?: string
  dangerLevel?: 'safe' | 'normal' | 'dangerous' | 'extreme'
  randomEventChance?: number
}

export interface TravelResult {
  success: boolean
  destination: string
  timeElapsed: number
  staminaUsed: number
  randomEventId?: string
  encounteredEnemyId?: string
}

export interface MapState {
  currentNodeId: string
  visitedNodes: string[]
  unlockedNodes: string[]
  exploredAreas: string[]
}

export interface MapRegion {
  id: string
  name: string
  description: string
  nodes: string[]
  temperatureModifier?: number
  corruptionLevel?: number
  isAccessible?: boolean
  accessCondition?: Condition
}

export interface WorldMap {
  id: string
  name: string
  regions: MapRegion[]
  nodes: MapNode[]
}