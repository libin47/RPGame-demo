// registry.ts - 全局配置注册表总入口

import type { SceneRegistry } from './scene'
import type { EventRegistry } from './event'
import type { CGRegistry } from './cg'
import type { ItemRegistry } from './item'
import type { WeaponTypeRegistry } from './weapon'
import type { DamageTypeRegistry } from './damage'
import type { SkillRegistry } from './skill'
import type { EnemyRegistry } from './enemy'
import type { CraftRecipeRegistry } from './craft'
import type { CookRecipeRegistry } from './cook'
import type { BuildRecipeRegistry } from './build'
import type { RepairRecipeRegistry } from './repair'
import type { StatusRegistry } from './status'
import type { TradeRegistry } from './trade'
import type { FlagRegistry } from './flag'
import type { SeasonWeatherRegistry } from './seasonWeather'
import type { MapRegistry } from './map'
import type { CharacterRegistry } from './character'

/**
 * 游戏全局配置注册表
 * 汇总所有子系统的配置数据，作为游戏初始化的唯一入口。
 *
 * 使用方式：
 * 1. 各子系统配置文件分别导出各自的 Registry 对象
 * 2. 在此文件中 import 并组装为 GameRegistry
 * 3. 游戏启动时加载 GameRegistry 到运行时
 *
 * 扩展方式：
 * 新增子系统时：
 * - 在对应子系统的配置文件中定义 XXXRegistry 接口
 * - 在此文件新增对应的 import 和字段
 * - 在对应的配置文件目录中新增配置数据
 */
export interface GameRegistry {
  /** 场景注册表 */
  scenes: SceneRegistry

  /** 事件注册表 */
  events: EventRegistry

  /** CG注册表 */
  cgs: CGRegistry

  /** 物品注册表 */
  items: ItemRegistry

  /** 武器类型注册表 */
  weaponTypes: WeaponTypeRegistry

  /** 伤害类型注册表 */
  damageTypes: DamageTypeRegistry

  /** 技能注册表（生存/战斗/被动） */
  skills: SkillRegistry

  /** 敌人注册表 */
  enemies: EnemyRegistry

  /** 制作配方注册表 */
  craftRecipes: CraftRecipeRegistry

  /** 烹饪配方注册表 */
  cookRecipes: CookRecipeRegistry

  /** 建造配方注册表 */
  buildRecipes: BuildRecipeRegistry

  /** 修复配方注册表 */
  repairRecipes: RepairRecipeRegistry

  /** 异常状态注册表 */
  statuses: StatusRegistry

  /** 交易注册表 */
  traders: TradeRegistry

  /** 标志位注册表 */
  flags: FlagRegistry

  /** 季节天气注册表 */
  seasonWeather: SeasonWeatherRegistry

  /** 大地图注册表 */
  maps: MapRegistry

  /** 职业注册表 */
  characters: CharacterRegistry
  
}