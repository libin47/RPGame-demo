import type { Condition, EffectResult } from './effect'
import type { WeaponType, DefenseType } from './player'
import type { DamageType } from './item'

export interface Enemy {
  id: string
  name: string
  description: string
  sanityDescription?: string
  enemyType: EnemyType
  attributes: EnemyAttributes
  skills: EnemySkill[]
  aiBehavior: AIBehavior
  lootTable: LootTable[]
  sanDamagePerTurn?: number
  isDreamEnemy?: boolean
}

export enum EnemyType {
  NORMAL = 'normal',
  ELITE = 'elite',
  BOSS = 'boss',
  DREAM = 'dream',
  MUTATED = 'mutated',
}

export interface EnemyAttributes {
  health: number
  maxHealth: number
  attack: number
  defense: EnemyDefense
  agility: number
  strength: number
  intelligence: number
}

export interface EnemyDefense {
  slash: number
  blunt: number
  ranged: number
  poison: number
  fire: number
}

export interface EnemySkill {
  skillId: string
  probability: number
  priority: number
  useCountLimit?: number
}

export interface AIBehavior {
  type: 'aggressive' | 'defensive' | 'cowardly' | 'random' | 'tactical'
  retreatThreshold: number
  useSkillCondition?: Condition
}

export interface LootTable {
  itemId: string
  probability: number
  minQuantity: number
  maxQuantity: number
}

export interface CombatSkill {
  id: string
  name: string
  description: string
  weaponType?: WeaponType
  unlockCondition: SkillUnlockCondition
  level: number
  damageType: DamageType
  damage: CombatSkillDamage
  hitRate: CombatSkillHitRate
  critRate: CombatSkillCritRate
  critMultiplier: CombatSkillCritMultiplier
  staminaCost: number
  cooldown: number
  target: 'single' | 'all' | 'random'
  effects?: EffectResult[]
  duration?: number
  descriptionVariations?: CombatSkillDescriptionVariation[]
}

export interface SkillUnlockCondition {
  minProficiency?: number
  requiredWeaponId?: string
  requiredEventId?: string
}

export interface CombatSkillDamage {
  base: number
  min: number
  max: number
  strengthScaling?: number
  proficiencyScaling?: number
  skillLevelScaling?: number
}

export interface CombatSkillHitRate {
  base: number
  agilityScaling?: number
  proficiencyScaling?: number
}

export interface CombatSkillCritRate {
  base: number
  agilityScaling?: number
  proficiencyScaling?: number
}

export interface CombatSkillCritMultiplier {
  base: number
  proficiencyScaling?: number
}

export interface CombatSkillDescriptionVariation {
  content: string
  condition: Condition
}

export interface EnemySkillConfig {
  id: string
  name: string
  damageType: DamageType
  damage: number
  hitRate: number
  effects?: EffectResult[]
  duration?: number
  target: 'single' | 'all'
  castDelay?: number
  cooldown: number
  useCondition?: Condition
}

export interface CombatAction {
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee' | 'observe'
  target?: string
  skillId?: string
  itemId?: string
}

export interface CombatResult {
  damage: number
  isCritical: boolean
  isHit: boolean
  attackerId: string
  defenderId: string
  damageType: DamageType
  effects?: EffectResult[]
}

export interface CombatState {
  isInCombat: boolean
  playerTurn: boolean
  currentEnemyId?: string
  turnCount: number
  playerDefending: boolean
  enemySkillsUsed: Record<string, number>
  skillCooldowns: Record<string, number>
}

export interface CombatRound {
  roundNumber: number
  actions: CombatAction[]
  results: CombatResult[]
  turnOrder: string[]
}

export interface DamageCalculation {
  baseDamage: number
  finalDamage: number
  defenseReduction: number
  isCritical: boolean
  critMultiplier: number
  damageType: DamageType
}