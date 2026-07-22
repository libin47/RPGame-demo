// src/engine/player.ts

import type { PlayerState, NewGameConfig, PlayerSurvival, PlayerAttributes, PlayerDefenses, PlayerCoefficients, PlayerSkills, PlayerLocation, PlayerProgress, PlayerStatistics } from '@/types/player'
import type { CharacterClass } from '@/types/character'
import { AttributeType } from '@/types/effect'
import { Season, SeasonPhase } from '@/types/seasonWeather'

/**
 * 计算生命值上限：体质 × 10
 */
function calculateMaxHp(constitution: number): number {
  return constitution * 10
}

/**
 * 计算最大负重：力量 × 5 + 负重修正
 */
function calculateMaxCarryWeight(strength: number, carryWeightModifier: number): number {
  return strength * 5 + carryWeightModifier
}

/**
 * 计算SAN值上限：100 + 修正指数
 */
function calculateMaxSan(sanModifier: number): number {
  return 100 + sanModifier
}

/**
 * 根据基础属性计算实际防御值
 * 基础值 + 装备加成 + 状态修正（初始无装备和状态，全部为0）
 */
function calculateDefenses(): PlayerDefenses {
  return {
    slashDefense: 0,
    bluntDefense: 0,
    rangedDefense: 0,
    poisonDefense: 0,
    fireDefense: 0,
  }
}

/**
 * 根据职业和初始配置计算系数属性
 * 初始全部为默认值
 */
function calculateCoefficients(classConfig: CharacterClass): PlayerCoefficients {
  // 从职业加成中提取系数修正
  let recoveryRateCoefficient = 1
  let satietyUpperLimitCoefficient = 1
  let satietyLossCoefficient = 1
  let staminaConsumptionCoefficient = 1
  let staminaRecoveryCoefficient = 1
  let staminaRecoveryFix = 0
  let sanModifier = 0
  let temperatureLowModifier = 0
  let temperatureHighModifier = 0
  let carryWeightModifier = 0
  let sanProtection = 0

  // 遍历职业加成，提取属性修正
  for (const bonus of classConfig.classBonuses) {
    if (bonus.attributeModifiers) {
      for (const modifier of bonus.attributeModifiers) {
        const value = modifier.value
        switch (modifier.attribute) {
          case AttributeType.RECOVERY_RATE_COEFFICIENT:
            recoveryRateCoefficient += modifier.modifierType === 'add' ? value : recoveryRateCoefficient * value
            break
          case AttributeType.SATIETY_UPPER_LIMIT_COEFFICIENT:
            satietyUpperLimitCoefficient += modifier.modifierType === 'add' ? value : satietyUpperLimitCoefficient * value
            break
          case AttributeType.SATIETY_LOSS_COEFFICIENT:
            satietyLossCoefficient += modifier.modifierType === 'add' ? value : satietyLossCoefficient * value
            break
          case AttributeType.STAMINA_CONSUMPTION_COEFFICIENT:
            staminaConsumptionCoefficient += modifier.modifierType === 'add' ? value : staminaConsumptionCoefficient * value
            break
          case AttributeType.STAMINA_RECOVERY_COEFFICIENT:
            staminaRecoveryCoefficient += modifier.modifierType === 'add' ? value : staminaRecoveryCoefficient * value
            break
          case AttributeType.STAMINA_RECOVERY_FIX:
            staminaRecoveryFix += value
            break
          case AttributeType.SAN_MODIFIER:
            sanModifier += value
            break
          case AttributeType.TEMPERATURE_LOW:
            temperatureLowModifier += value
            break
          case AttributeType.TEMPERATURE_HIGH:
            temperatureHighModifier += value
            break
          case AttributeType.CARRY_WEIGHT_MODIFIER:
            carryWeightModifier += value
            break
          // 其他属性不在系数表中，忽略
          default:
            break
        }
      }
    }
  }

  return {
    recoveryRateCoefficient,
    satietyUpperLimitCoefficient,
    satietyLossCoefficient,
    staminaConsumptionCoefficient,
    staminaRecoveryCoefficient,
    staminaRecoveryFix,
    sanModifier,
    temperatureLowModifier,
    temperatureHighModifier,
    carryWeightModifier,
    sanProtection,
  }
}

/**
 * 创建新游戏时的初始玩家状态
 *
 * @param classConfig - 玩家选择的职业配置
 * @param config - 新游戏配置（场景、时间、季节等）
 * @returns 完整的初始 PlayerState
 */
export function createNewPlayerState(classConfig: CharacterClass, config: NewGameConfig): PlayerState {
  // 基础属性（从职业配置获取初始值）
  const baseStrength = classConfig.initialAttributes.strength
  const baseAgility = classConfig.initialAttributes.agility
  const baseIntelligence = classConfig.initialAttributes.intelligence
  const baseConstitution = classConfig.initialAttributes.constitution

  // 生存属性覆盖（职业特有）
  const survivalOverrides = classConfig.initialSurvivalAttributes || {}

  // 计算系数
  const coefficients = calculateCoefficients(classConfig)

  // 计算最大生命值
  const maxHp = survivalOverrides.hp ?? calculateMaxHp(baseConstitution)

  // 生存属性
  const survival: PlayerSurvival = {
    hp: maxHp,
    maxHp,
    satiety: survivalOverrides.satiety ?? 100,
    maxSatiety: 100 * coefficients.satietyUpperLimitCoefficient,
    stamina: survivalOverrides.stamina ?? 100,
    maxStamina: 100 + coefficients.staminaRecoveryFix,
    san: survivalOverrides.san ?? 100,
    maxSan: calculateMaxSan(coefficients.sanModifier),
    carryWeight: 0,
    maxCarryWeight: calculateMaxCarryWeight(baseStrength, coefficients.carryWeightModifier),
    warmthLevel: 'comfortable',
    comfortTempLow: 10 + coefficients.temperatureLowModifier,
    comfortTempHigh: 25 + coefficients.temperatureHighModifier,
    // 小数累计值初始化为0
    pendingHpChange: 0,
    pendingSatietyChange: 0,
    pendingStaminaChange: 0,
    pendingSanChange: 0,
  }

  // 基础属性
  const attributes: PlayerAttributes = {
    strength: baseStrength,
    agility: baseAgility,
    intelligence: baseIntelligence,
    constitution: baseConstitution,
    strengthExp: 0,
    agilityExp: 0,
    intelligenceExp: 0,
    constitutionExp: 0,
    strengthModifier: 0,
    agilityModifier: 0,
    intelligenceModifier: 0,
    constitutionModifier: 0,
    defenses: calculateDefenses(),
    coefficients,
  }

  // 技能（从职业配置获取初始生存技能等级和武器熟练度）
  const survivalSkills: Record<string, { level: number; exp: number }> = {}
  for (const skillInit of classConfig.initialSurvivalSkillLevels) {
    survivalSkills[skillInit.skillId] = {
      level: skillInit.level,
      exp: skillInit.exp ?? 0,
    }
  }

  const weaponProficiencies: Record<string, { level: number; exp: number }> = {}
  for (const wpInit of classConfig.initialWeaponProficiency) {
    weaponProficiencies[wpInit.weaponTypeId] = {
      level: wpInit.level,
      exp: wpInit.exp ?? 0,
    }
  }

  const skills: PlayerSkills = {
    survivalSkills,
    weaponProficiencies,
    battleSkills: {},
    unlockedBattleSkillIds: classConfig.initialBattleSkillIds ?? [],
    passiveSkillIds: classConfig.initialPassiveSkillIds,
  }

  // 位置
  const currentLocation: PlayerLocation = {
    mapId: config.initialMapId,
    sceneId: config.initialSceneId,
    subSceneId: config.initialSubSceneId ?? null,
  }

  // 游戏进度
  const progress: PlayerProgress = {
    day: config.initialDay,
    timeMinutes: config.initialTimeMinutes,
    season: config.initialSeason,
    seasonPhase: config.initialSeasonPhase,
    weatherId: config.initialWeatherId,
    corruption: config.initialCorruption,
    totalDaysSurvived: 0,
    isGameCompleted: false,
    unlockedEndingIds: [],
    baseLocation: null,
  }

  // 统计
  const statistics: PlayerStatistics = {
    enemiesKilled: 0,
    totalBattles: 0,
    escapesAttempted: 0,
    itemsCrafted: 0,
    mealsCooked: 0,
    buildingsConstructed: 0,
    scenesExplored: 0,
    eventsTriggered: 0,
    totalDistanceTraveled: 0,
    deaths: 0,
  }

  // 组装初始标志位（先填职业标志位，再填通用标志位）
  const flags: Record<string, boolean | number | string> = {
    ...classConfig.initialFlags,
  }

  // 初始背包：职业初始装备 + 初始物品
  // 直接使用物品ID，instanceId 在存入背包时由运行时生成
  const inventory: Array<{
    instanceId: string
    itemId: string
    quantity: number
    durability: number
    acquiredTime: number
  }> = []
  let instanceCounter = 0

  // 初始背包物品
  for (const item of classConfig.initialInventory) {
    inventory.push({
      instanceId: `init_${instanceCounter++}`,
      itemId: item.itemId,
      quantity: item.quantity,
      durability: item.durability ?? -1,
      acquiredTime: 0,
    })
  }

  // 初始装备
  const equipment = {
    weapon: null as string | null,
    offHand: null as string | null,
    head: null as string | null,
    body: null as string | null,
    hands: null as string | null,
    feet: null as string | null,
    back: null as string | null,
    neck: null as string | null,
    finger: null as string | null,
    tool: null as string | null,
    light: null as string | null,
  }

  for (const equip of classConfig.initialEquipment) {
    const slotKey = equip.slot as keyof typeof equipment
    if (slotKey in equipment) {
      equipment[slotKey] = equip.itemId
      // 装备也加入背包记录（标记为已装备）
      inventory.push({
        instanceId: `init_${instanceCounter++}`,
        itemId: equip.itemId,
        quantity: 1,
        durability: equip.initialDurability ?? -1,
        acquiredTime: 0,
      })
    }
  }

  return {
    id: `player_${Date.now()}`,
    name: config.playerName,
    classId: classConfig.id,
    survival,
    attributes,
    skills,
    equipment,
    inventory,
    activeStatuses: [],
    unlockedRecipes: {
      craftRecipes: classConfig.initialCraftRecipeIds,
      cookRecipes: classConfig.initialCookRecipeIds,
      buildRecipes: classConfig.initialBuildRecipeIds,
      repairRecipes: [],
    },
    currentLocation,
    progress,
    flags,
    gold: 0,
    statistics,
  }
}