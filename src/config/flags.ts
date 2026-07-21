// 定义所有游戏内标志位
// 用于追踪非数值的剧情进度、成就、关键选择等，统一管理避免硬编码字符串
// config/flags.ts - 标志位配置实例

import type { Flag, FlagRegistry, FlagType } from '../types/flag'
/**
 * 标志位定义
 * 覆盖游戏开局到初期探索所需的最小标志位集合
 */
const flags: Record<string, Flag> = {
  // ============================================================
  // 教程/引导
  // ============================================================
  tutorial_completed: {
    id: 'tutorial_completed',
    name: '完成教程',
    notes: '玩家完成初始引导后设置为true',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },

  // ============================================================
  // 主线进度
  // ============================================================
  main_quest_stage: {
    id: 'main_quest_stage',
    name: '主线进度阶段',
    notes: '0=初始，1=发现信号塔线索，2=收集材料中，3=准备修复，4=已修复',
    type: 'number' as FlagType,
    defaultValue: 0,
    isPersistent: true,
  },
  signal_tower_discovered: {
    id: 'signal_tower_discovered',
    name: '发现信号塔',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  signal_tower_repaired: {
    id: 'signal_tower_repaired',
    name: '修复信号塔',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  boat_constructed: {
    id: 'boat_constructed',
    name: '建造船只',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },

  // ============================================================
  // NPC相关
  // ============================================================
  npc_fisherman_met: {
    id: 'npc_fisherman_met',
    name: '见过渔民',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  npc_fisherman_friendship: {
    id: 'npc_fisherman_friendship',
    name: '渔民好感度',
    notes: '0=陌生人，1=相识，2=朋友，3=挚友',
    type: 'number' as FlagType,
    defaultValue: 0,
    isPersistent: true,
  },
  npc_hermit_met: {
    id: 'npc_hermit_met',
    name: '见过隐士',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },

  // ============================================================
  // 场景探索
  // ============================================================
  beach_explored: {
    id: 'beach_explored',
    name: '探索过海滩',
    type: 'boolean' as FlagType,
    defaultValue: true, // 初始场景
    isPersistent: true,
  },
  forest_edge_explored: {
    id: 'forest_edge_explored',
    name: '探索过森林边缘',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  cave_entrance_found: {
    id: 'cave_entrance_found',
    name: '发现洞穴入口',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  plane_wreck_searched: {
    id: 'plane_wreck_searched',
    name: '搜索过飞机残骸',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },

  // ============================================================
  // 物品获取
  // ============================================================
  found_survival_knife: {
    id: 'found_survival_knife',
    name: '获得生存刀',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  found_first_aid_kit: {
    id: 'found_first_aid_kit',
    name: '获得急救包',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  found_map_fragment_1: {
    id: 'found_map_fragment_1',
    name: '获得地图碎片1',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },

  // ============================================================
  // 战斗相关
  // ============================================================
  first_battle_won: {
    id: 'first_battle_won',
    name: '赢得首场战斗',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  mutated_crab_defeated: {
    id: 'mutated_crab_defeated',
    name: '击败变异螃蟹',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  enemies_killed_count: {
    id: 'enemies_killed_count',
    name: '击杀敌人数',
    type: 'number' as FlagType,
    defaultValue: 0,
    isPersistent: true,
  },

  // ============================================================
  // 基地
  // ============================================================
  base_established: {
    id: 'base_established',
    name: '已建立基地',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  campfire_built: {
    id: 'campfire_built',
    name: '建造了篝火',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },

  // ============================================================
  // SAN值/腐化相关
  // ============================================================
  first_hallucination: {
    id: 'first_hallucination',
    name: '首次产生幻觉',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  corruption_noticed: {
    id: 'corruption_noticed',
    name: '注意到腐化迹象',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },

  // ============================================================
  // 结局相关
  // ============================================================
  ending_rescue_available: {
    id: 'ending_rescue_available',
    name: '救援结局可用',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  truth_discovered: {
    id: 'truth_discovered',
    name: '发现真相',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },

  // ============================================================
  // 一次性场景描述标记（用于 seenFlag）
  // ============================================================
  seen_beach_arrival: {
    id: 'seen_beach_arrival',
    name: '已看过海滩到达描述',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  seen_strange_altar: {
    id: 'seen_strange_altar',
    name: '已看过奇怪祭坛描述',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },
  seen_night_sky: {
    id: 'seen_night_sky',
    name: '已看过夜空描述',
    type: 'boolean' as FlagType,
    defaultValue: false,
    isPersistent: true,
  },

  // ============================================================
  // 临时标记（非持久化，用于冷却、一次性按钮等）
  // ============================================================
  cooldown_explore: {
    id: 'cooldown_explore',
    name: '探索冷却',
    type: 'number' as FlagType,
    defaultValue: 0,
    isPersistent: false,
  },
  cooldown_rest: {
    id: 'cooldown_rest',
    name: '休息冷却',
    type: 'number' as FlagType,
    defaultValue: 0,
    isPersistent: false,
  },
}

export const flagRegistry: FlagRegistry = {
  flags,
}