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
  },
}
