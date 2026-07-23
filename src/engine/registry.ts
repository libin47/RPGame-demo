// src/engine/registry.ts

import type { GameRegistry } from '@/types/registry'
import type { Item } from '@/types/item'
import type { GameEvent } from '@/types/event'
import type { Enemy } from '@/types/enemy'
import type { Scene, SubScene } from '@/types/scene'
import type { WeaponType } from '@/types/weapon'
import type { DamageType } from '@/types/damage'
import type { SurvivalSkill, BattleSkill, PassiveSkill } from '@/types/skill'
import type { StatusConfig } from '@/types/status'
import type { BuildResult } from '@/types/building'
import type { BuildRecipe } from '@/types/build'
import type { CraftRecipe } from '@/types/craft'
import type { CookRecipe } from '@/types/cook'
import type { TraderConfig } from '@/types/trade'
import type { Flag } from '@/types/flag'
import type { CGScene } from '@/types/cg'
import type { CharacterClass } from '@/types/character'
import type { SeasonConfig, WeatherConfig, TimeOfDayConfig } from '@/types/seasonWeather'
import type { GameMap } from '@/types/map'
import type { Season, SeasonPhase } from '@/types/seasonWeather'

import { gameRegistry } from '@/config/registry'

/**
 * 游戏配置管理器
 * 汇总所有配置数据，提供类型安全的只读查询接口。
 * 全局单例，游戏启动时初始化一次。
 */
class GameRegistryManager {
  private registry: GameRegistry

  constructor(registry: GameRegistry) {
    this.registry = registry
  }

  // ============================================================
  // 物品
  // ============================================================

  /** 根据ID获取物品配置，找不到返回 undefined */
  getItem(id: string): Item | undefined {
    return this.registry.items.items[id]
  }

  /** 获取物品名称，找不到返回物品ID本身 */
  getItemName(id: string): string {
    const item = this.getItem(id)
    return item ? item.name : id
  }

  // ============================================================
  // 武器类型
  // ============================================================

  getWeaponType(id: string): WeaponType | undefined {
    return this.registry.weaponTypes.weaponTypes[id]
  }

  // ============================================================
  // 伤害类型
  // ============================================================

  getDamageType(id: string): DamageType | undefined {
    return this.registry.damageTypes.damageTypes[id]
  }

  // ============================================================
  // 技能
  // ============================================================

  /** 获取生存技能配置 */
  getSurvivalSkill(id: string): SurvivalSkill | undefined {
    return this.registry.skills.survivalSkills[id]
  }

  /** 获取战斗技能配置 */
  getBattleSkill(id: string): BattleSkill | undefined {
    return this.registry.skills.battleSkills[id]
  }

  /** 获取被动技能配置 */
  getPassiveSkill(id: string): PassiveSkill | undefined {
    return this.registry.skills.passiveSkills[id]
  }

  // ============================================================
  // 异常状态
  // ============================================================

  getStatus(id: string): StatusConfig | undefined {
    return this.registry.statuses.statuses[id]
  }

  // ============================================================
  // 敌人
  // ============================================================

  getEnemy(id: string): Enemy | undefined {
    return this.registry.enemies.enemies[id]
  }

  // ============================================================
  // 配方
  // ============================================================

  /** 获取制作配方 */
  getCraftRecipe(id: string): CraftRecipe | undefined {
    return this.registry.craftRecipes.recipes[id]
  }

  /** 获取烹饪配方 */
  getCookRecipe(id: string): CookRecipe | undefined {
    return this.registry.cookRecipes.recipes[id]
  }

  /** 获取建造配方 */
  getBuildRecipe(id: string): BuildRecipe | undefined {
    return this.registry.buildRecipes.recipes[id]
  }

  /** 获取所有建造配方 */
  getAllBuildRecipes(): BuildRecipe[] {
    return Object.values(this.registry.buildRecipes.recipes)
  }

  // ============================================================
  // 建筑实体
  // ============================================================

  /** 根据建筑ID获取建筑配置 */
  getBuilding(id: string): BuildResult | undefined {
    return this.registry.buildings.build[id]
  }

  /** 获取所有建筑配置 */
  getAllBuildings(): BuildResult[] {
    return Object.values(this.registry.buildings.build)
  }

  // ============================================================
  // 交易
  // ============================================================

  getTrader(id: string): TraderConfig | undefined {
    return this.registry.traders.traders[id]
  }

  // ============================================================
  // 场景
  // ============================================================

  getScene(id: string): Scene | undefined {
    return this.registry.scenes.scenes[id]
  }

  getSubScene(id: string): SubScene | undefined {
    return this.registry.scenes.subScenes[id]
  }

  /** 获取初始场景ID */
  getInitialSceneId(): string {
    return this.registry.scenes.initialSceneId
  }

  /** 获取初始子场景ID */
  getInitialSubSceneId(): string | undefined {
    return this.registry.scenes.initialSubSceneId
  }

  // ============================================================
  // 事件
  // ============================================================

  getEvent(id: string): GameEvent | undefined {
    return this.registry.events.events[id]
  }

  // ============================================================
  // CG
  // ============================================================

  getCG(id: string): CGScene | undefined {
    return this.registry.cgs.cgs[id]
  }

  // ============================================================
  // 标志位
  // ============================================================

  getFlag(id: string): Flag | undefined {
    return this.registry.flags.flags[id]
  }

  /** 获取标志位的默认值 */
  getFlagDefaultValue(id: string): boolean | number | string {
    const flag = this.getFlag(id)
    if (flag) return flag.defaultValue
    return false
  }

  // ============================================================
  // 职业
  // ============================================================

  getCharacterClass(id: string): CharacterClass | undefined {
    return this.registry.characters.classes[id]
  }

  /** 获取默认职业ID */
  getDefaultClassId(): string {
    return this.registry.characters.defaultClassId
  }

  /** 获取所有职业 */
  getAllCharacterClasses(): CharacterClass[] {
    return Object.values(this.registry.characters.classes)
  }

  // ============================================================
  // 季节天气
  // ============================================================

  getSeason(season: Season): SeasonConfig {
    return this.registry.seasonWeather.seasons[season]
  }

  getWeather(id: string): WeatherConfig | undefined {
    return this.registry.seasonWeather.weathers[id]
  }

  getTimeOfDayConfig(timeOfDay: string): TimeOfDayConfig | undefined {
    // TimeOfDay 枚举值直接作为 key
    return this.registry.seasonWeather.timeOfDayConfigs[timeOfDay as keyof typeof this.registry.seasonWeather.timeOfDayConfigs]
  }

  /** 初始季节 */
  getInitialSeason(): Season {
    return this.registry.seasonWeather.initialSeason
  }

  /** 初始季节阶段 */
  getInitialSeasonPhase(): SeasonPhase {
    return this.registry.seasonWeather.initialSeasonPhase
  }

  /** 初始天气ID */
  getInitialWeatherId(): string {
    return this.registry.seasonWeather.initialWeatherId
  }

  /** 初始天数 */
  getInitialDay(): number {
    return this.registry.seasonWeather.initialDay
  }

  /** 初始时间（分钟） */
  getInitialTimeMinutes(): number {
    return this.registry.seasonWeather.initialTimeMinutes
  }

  /** 初始腐化度 */
  getInitialCorruption(): number {
    return this.registry.seasonWeather.corruption.initialValue
  }

  // ============================================================
  // 地图
  // ============================================================

  getMap(id: string): GameMap | undefined {
    return this.registry.maps.maps[id]
  }

  getInitialMapId(): string {
    return this.registry.maps.initialMapId
  }

  // ============================================================
  // 结局
  // ============================================================

  /** 获取结局配置 */
  getEnding(id: string): import('@/types/ending').EndingConfig | undefined {
    return this.registry.endings.endings[id]
  }

  /** 获取所有结局配置 */
  getAllEndings(): import('@/types/ending').EndingConfig[] {
    return Object.values(this.registry.endings.endings)
  }
}

/**
 * 全局配置管理器单例
 * 在游戏启动时通过 initRegistry() 初始化
 */
let registryManager: GameRegistryManager | null = null

/**
 * 初始化配置管理器
 * 必须在游戏启动时调用一次
 */
export function initRegistry(): void {
  registryManager = new GameRegistryManager(gameRegistry)
}

/**
 * 获取配置管理器实例
 * 使用前必须确保已调用 initRegistry()
 */
export function getRegistry(): GameRegistryManager {
  if (!registryManager) {
    throw new Error('配置管理器未初始化，请先调用 initRegistry()')
  }
  return registryManager
}