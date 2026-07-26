// config/flags.ts
import type { Flag, FlagRegistry } from '../types/flag'
import { FlagType } from '../types/flag'

const firstTimeOnBeach: Flag = {
  id: 'first_time_on_beach',
  name: '首次到达海滩',
  notes: '用于判断是否展示海滩的初始描述',
  type: FlagType.BOOLEAN,
  defaultValue: true,
}

const selectedTakeSword: Flag = {
  id: 'selected_take_sword',
  name: '捡起宝剑',
  notes: '捡起宝剑',
  type: FlagType.BOOLEAN,
  defaultValue: true,
}

const selectedTakeBlueprint: Flag = {
  id: 'selected_take_blueprint',
  name: '收好篝火建造图',
  notes: '是否已收好篝火建造图',
  type: FlagType.BOOLEAN,
  defaultValue: false,
}

const defeatedFirstCrab: Flag = {
  id: 'defeated_first_crab',
  name: '击败第一只变异蟹',
  notes: '击败第一只变异蟹后设置，解锁后续剧情',
  type: FlagType.BOOLEAN,
  defaultValue: false,
}

const metWanderingMerchant: Flag = {
  id: 'met_wandering_merchant',
  name: '见过流浪商人',
  notes: '是否已经遇到过流浪商人',
  type: FlagType.BOOLEAN,
  defaultValue: false,
}

const merchantFriendship: Flag = {
  id: 'merchant_friendship',
  name: '商人好感度',
  notes: '与流浪商人的好感度等级',
  type: FlagType.NUMBER,
  defaultValue: 0,
}

const foundJournalFragment: Flag = {
  id: 'found_journal_fragment',
  name: '找到研究日志残页',
  notes: '是否已找到研究日志残页',
  type: FlagType.BOOLEAN,
  defaultValue: false,
}

const crabsKilledCount: Flag = {
  id: 'crabs_killed_count',
  name: '击杀变异蟹数量',
  notes: '累计击杀的变异蟹数量',
  type: FlagType.NUMBER,
  defaultValue: 0,
}

const exploredCave: Flag = {
  id: 'explored_cave',
  name: '探索过洞穴',
  notes: '是否已进入过洞穴',
  type: FlagType.BOOLEAN,
  defaultValue: false,
}

const currentQuestStage: Flag = {
  id: 'current_quest_stage',
  name: '当前任务阶段',
  notes: '追踪主线任务进度',
  type: FlagType.STRING,
  defaultValue: 'woke_up_on_beach',
}

// ============================================================
// 时间变化标志位示例
// ============================================================

/**
 * 浆果可用数量
 * 玩家摘取后减少，随着时间推移逐渐再生。
 * 事件效果：player.flags['berries_available'] -= 采摘数量
 * 引擎自动：每10分钟再生约0.1个（约100分钟再生1个），上限5个
 */
const berriesAvailable: Flag = {
  id: 'berries_available',
  name: '浆果可用数量',
  notes: '当前场景浆果可用数量，随时间自然再生',
  type: FlagType.NUMBER,
  defaultValue: 5,
  timeVarying: {
    mode: 'accumulate',
    deltaPerMinute: 0.01,   // 每10分钟+0.1，约100分钟再生1个
    min: 0,
    max: 5,
  },
}

/**
 * 是否夜晚
 * 根据游戏时间自动判断，无需手动设置。
 * 条件判定时直接使用此标志位即可。
 */
const isNighttime: Flag = {
  id: 'is_nighttime',
  name: '是否夜晚',
  notes: '18:00-06:00为夜晚，引擎自动计算',
  type: FlagType.BOOLEAN,
  defaultValue: false,
  timeVarying: {
    mode: 'periodic',
    schedule: [
      { startMinute: 1080, endMinute: 1440, value: true },  // 18:00-24:00
      { startMinute: 0, endMinute: 360, value: true },       // 00:00-06:00
    ],
  },
}

/**
 * 每日商店已刷新
 * 每天午夜重置为 false，触发商店刷新事件后设为 true。
 */
const dailyShopRefreshed: Flag = {
  id: 'daily_shop_refreshed',
  name: '每日商店已刷新',
  notes: '每天午夜自动重置为 false，由事件设为 true',
  type: FlagType.BOOLEAN,
  defaultValue: false,
  timeVarying: {
    mode: 'reset_daily',
    resetValue: false,
  },
}

export const flagRegistry: FlagRegistry = {
  flags: {
    first_time_on_beach: firstTimeOnBeach,
    defeated_first_crab: defeatedFirstCrab,
    met_wandering_merchant: metWanderingMerchant,
    merchant_friendship: merchantFriendship,
    found_journal_fragment: foundJournalFragment,
    crabs_killed_count: crabsKilledCount,
    explored_cave: exploredCave,
    current_quest_stage: currentQuestStage,
    selected_take_sword: selectedTakeSword,
    selected_take_blueprint: selectedTakeBlueprint,
    berries_available: berriesAvailable,
    is_nighttime: isNighttime,
    daily_shop_refreshed: dailyShopRefreshed,
  },
}
