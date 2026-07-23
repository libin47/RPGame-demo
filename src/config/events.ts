// config/events.ts
import type { GameEvent, EventRegistry } from '../types/event'
import { EventType, EventOptionStyle, EventOptionCostType } from '../types/event'
import {
  EffectType,
  AttributeType,
  AttributeOperation,
  ItemChangeType,
  GainExpTarget,
  LogicOperator,
  ConditionTargetType,
  ComparisonOperator,
} from '../types/effect'
import { FlagOperation } from '@/types/flag'
import { RecipeType } from '@/types/recipe'

// ===== 飞机残骸事件 =====
const eventPlaneWreckage: GameEvent = {
  id: 'event_plane_wreckage',
  name: '搜索飞机残骸',
  eventType: EventType.NORMAL,
  frames: [
    {
      id: 'wreckage_search',
      order: 1,
      text: '你穿过敞开的变形舱门，尽管已经做好了心理准备，但是里面的场景仍让你感觉呼吸一窒。\n\n扭曲的金属、碎裂的行李箱。\n\n以及，散落在各处的人体组织。\n\n你恍惚了许久才回过神来。',
      onEnterEffects:[
    {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.SAN,
            operation: AttributeOperation.SUBTRACT,
            value: 10,
          },
      probability: 1,
      description: 'SAN-10',
    },
  ],
      options: [
        {
          id: 'find_in_cloth',
          text: '翻找残骸',
          displayPriority: 3,
          costs: [],
          isOneTime: true,
          selectedFlag: 'selected_find_in_cloth',
          result: {
            type: 'nextFrame',
            targetFrameId: 'after_gather',
            text: '你在扭曲的金属和碎裂的行李箱之间翻找。\n大部分东西都已经毁了——压碎的电子设备、浸透燃油的衣物、不知属于谁的家庭合照，玻璃相框已经碎了，照片上的笑容被海水泡得模糊不清。\n你找到了半瓶没开封的矿泉水。瓶身完好无损。你拧开盖子喝了一口，温热的水带着塑料瓶的味道，但你的喉咙已经不在乎了。\n你从座椅下方的应急箱里翻出了几包压缩饼干、一卷绷带、一小瓶消毒用的酒精。还有一把应急用的多功能刀，刀刃上刻着航空公司的标志。\n 你把它装进了口袋——也许以后用得上。',
            effects: [
              {
                effect: {
                  type: EffectType.ITEM,
                  itemId: 'cloth_scrap',
                  changeType: ItemChangeType.ADD,
                  quantity: 3,
                },
                probability: 1,
              },
            ],
          },
        },
        {
          id: 'find_in_xiangzi',
          text: '翻找行李箱',
          displayPriority: 3,
          costs: [],
          isOneTime: true,
          selectedFlag: 'selected_find_in_xiangzi',
          result: {
            type: 'nextFrame',
            targetFrameId: 'after_gather',
            text: '你打开了一个没有被完全压碎的行李箱。衣物叠得很整齐，是某个人的旅途行装。换洗衬衫、牛仔裤、一本旅行指南、一个洗漱包。\n\n在行李箱的夹层里，你找到了一本皮质封面的笔记本，翻开后是空白页面——主人还没来得及写任何东西。你把笔记本收好。空白的纸总有它的用处。\n\n另一个行李箱里有一包烟，还剩大半包，被仔细地装在一个铁盒里。铁盒打开时，烟草的干燥香气暂时盖过了燃油和海水的味道。你合上盖子，把铁盒放进自己的口袋。',
            effects: [
              {
                effect: {
                  type: EffectType.ITEM,
                  itemId: 'one_note',
                  changeType: ItemChangeType.ADD,
                  quantity: 1,
                },
                probability: 1,
              },
            ],
          },
        },
        {
          id: 'take_sword',
          text: '拿起生锈的铁剑',
          displayPriority: 2,
          costs: [],
          isOneTime: true,
          selectedFlag: 'selected_take_sword',
          result: {
            type: 'nextFrame',
            targetFrameId: 'wreckage_search',
            effects: [
              {
                effect: {
                  type: EffectType.ITEM,
                  itemId: 'rusty_sword',
                  changeType: ItemChangeType.ADD,
                  quantity: 1,
                },
                probability: 1,
                description: '获得生锈的铁剑',
              },
              {
                effect: {
                  type: EffectType.SKILL,
                  skillId: 'basic_slash',
                  unlock: true,
                },
                probability: 1,
                description: '解锁基础挥砍技能',
              },
            ],
            setFlags: {
              collected_sword: true,
            },
          },
        },
        {
          id: 'take_blueprint',
          text: '收好篝火建造图',
          displayPriority: 1,
          costs: [],
          isOneTime: true,
          selectedFlag: 'selected_take_blueprint',
          result: {
            type: 'nextFrame',
            targetFrameId: 'after_gather',
            effects: [
              {
                effect: {
                  type: EffectType.ITEM,
                  itemId: 'campfire_blueprint',
                  changeType: ItemChangeType.ADD,
                  quantity: 1,
                },
                probability: 1,
                description: '获得篝火建造图',
              },
              {
                effect: {
                  type: EffectType.RECIPE,
                  recipeId: 'build_campfire',
                  recipeType: RecipeType.BUILD,
                  unlock: true,
                },
                probability: 1,
                description: '解锁篝火建造配方',
              },
            ],
            setFlags: {
              collected_blueprint: true,
            },
          },
        },
      ],
    },
    {
      id: 'after_gather',
      order: 2,
      text: '你将搜刮到的物资收好。{player.armor}现在塞得鼓鼓囊囊的。\n\n{env.timeOfDayDesc}的阳光透过破损的机翼洒下来。你抬头望向岛屿深处，茂密的丛林在热风中摇曳，不知名的鸟鸣从远处传来。\n\n当前最重要的是找个安全的地方度过第一夜。',
      options: [
        {
          id: 'leave_wreckage',
          text: '离开残骸',
          displayPriority: 1,
          costs: [],
          result: {
            type: 'endEvent',
            effects: [],
            exitText: '你离开了飞机残骸，回到了海滩上',
          },
        },
      ],
    },
  ],
}

// ===== 变异蟹遭遇事件 =====

const eventBeachCrabEncounter: GameEvent = {
  id: 'event_beach_crab_encounter',
  name: '海滩遇蟹',
  notes: '玩家在海滩遭遇变异蟹',
  eventType: EventType.BATTLE,
  isRepeatable: true,
  onEnterEffects: [],
  frames: [
    {
      id: 'crab_spotted',
      order: 1,
      text: '一只体型巨大的变异蟹从沙中钻出，挥舞着巨大的螯钳向你逼近。它的甲壳上布满了不规则的尖刺，眼睛闪烁着诡异的光芒。',
      options: [
        {
          id: 'fight_crab',
          text: '战斗',
          displayPriority: 2,
          costs: [],
          result: {
            type: 'triggerBattle',
            enemyId: ['mutated_crab'],
            victoryFrameId: 'crab_victory',
            defeatFrameId: 'crab_defeat',
            escapeFrameId: 'crab_escaped',
            canEscape: true,
            firstEncounterBonus: true,
          },
          optionStyle: EventOptionStyle.DANGER,
        },
        {
          id: 'flee_crab',
          text: '逃跑',
          displayPriority: 1,
          description: '尝试逃离变异蟹',
          costs: [
            {
              costType: EventOptionCostType.STAMINA,
              value: 10,
            },
          ],
          result: {
            type: 'endEvent',
            effects: [],
            exitText: '你飞快地逃离了变异蟹的领地',
          },
          optionStyle: EventOptionStyle.DEFAULT,
        },
      ],
    },
    {
      id: 'crab_victory',
      order: 2,
      text: '变异蟹轰然倒地，不再动弹。它的甲壳或许可以用来制作护甲，蟹肉也可以烤来吃。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.FLAG,
            flagId: 'defeated_first_crab',
            operation: FlagOperation.SET,
            value: true,
          },
          probability: 1,
        },
        {
          effect: {
            type: EffectType.FLAG,
            flagId: 'crabs_killed_count',
            operation: FlagOperation.ADD,
            value: 1,
          },
          probability: 1,
        },
        {
          effect: {
            type: EffectType.GAIN_EXP,
            target: GainExpTarget.SURVIVAL_SKILL,
            targetId: 'exploration',
            amount: 30,
          },
          probability: 1,
        },
      ],
      options: [
        {
          id: 'butcher_crab',
          text: '分解蟹肉',
          displayPriority: 1,
          costs: [],
          result: {
            type: 'endEvent',
            effects: [],
            exitText: '你从变异蟹身上获取了一些有用的材料',
          },
        },
      ],
    },
    {
      id: 'crab_escaped',
      order: 2,
      text: '你抓住机会逃离了战斗。变异蟹没有追上来。',
      options: [
        {
          id: 'return_beach',
          text: '返回海滩',
          displayPriority: 1,
          costs: [],
          result: {
            type: 'endEvent',
            effects: [],
            exitText: '你安全回到了海滩上',
          },
        },
      ],
    },
    {
      id: 'crab_defeat',
      order: 2,
      text: '变异蟹的巨螯击中了你的要害，你失去了意识...',
      options: [
        {
          id: 'accept_defeat',
          text: '...',
          displayPriority: 1,
          costs: [],
          result: {
            type: 'endEvent',
            effects: [],
            exitText: '',
          },
        },
      ],
    },
  ],
}

// ===== 采集浆果事件 =====

const eventGatherBerries: GameEvent = {
  id: 'event_gather_berries',
  name: '采集浆果',
  eventType: EventType.NORMAL,
  isRepeatable: true,
  frames: [
    {
      id: 'gather_start',
      order: 1,
      text: '灌木丛中长满了红色的浆果，看起来可以食用。你要采集一些吗？',
      options: [
        {
          id: 'gather_berries',
          text: '采集浆果',
          displayPriority: 1,
          costs: [
            {
              costType: EventOptionCostType.STAMINA,
              value: 8,
            },
          ],
          result: {
            type: 'nextFrame',
            targetFrameId: 'gather_result',
            effects: [
              {
                effect: {
                  type: EffectType.GAIN_EXP,
                  target: GainExpTarget.SURVIVAL_SKILL,
                  targetId: 'gathering',
                  amount: 15,
                },
                probability: 1,
              },
            ],
          },
        },
        {
          id: 'leave_berries',
          text: '离开',
          displayPriority: 2,
          costs: [],
          result: {
            type: 'endEvent',
            effects: [],
            exitText: '你决定不采摘这些浆果',
          },
        },
      ],
    },
    {
      id: 'gather_result',
      order: 2,
      text: '你小心地采摘了一些浆果。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ITEM,
            itemId: 'crab_meat',
            changeType: ItemChangeType.ADD,
            quantity: 3,
          },
          probability: 1,
          description: '获得一些浆果',
        },
      ],
      options: [
        {
          id: 'done_gathering',
          text: '继续前进',
          displayPriority: 1,
          costs: [],
          result: {
            type: 'endEvent',
            effects: [],
            exitText: '你继续探索森林',
          },
        },
      ],
    },
  ],
}

// ===== 研究日志事件 =====

const eventJournalFragment: GameEvent = {
  id: 'event_journal_fragment',
  name: '发现研究日志',
  eventType: EventType.NORMAL,
  isRepeatable: false,
  triggeredFlag: 'triggered_journal_fragment',
  frames: [
    {
      id: 'find_journal',
      order: 1,
      text: '你在洞穴的角落发现了几页发黄的纸，上面密密麻麻地写着字。看起来是某个研究人员的日志。',
      options: [
        {
          id: 'read_journal',
          text: '阅读日志',
          displayPriority: 1,
          costs: [],
          result: {
            type: 'nextFrame',
            targetFrameId: 'read_journal',
            effects: [
              {
                effect: {
                  type: EffectType.ITEM,
                  itemId: 'journal_fragment',
                  changeType: ItemChangeType.ADD,
                  quantity: 1,
                },
                probability: 1,
              },
              {
                effect: {
                  type: EffectType.FLAG,
                  flagId: 'found_journal_fragment',
                  operation: FlagOperation.SET,
                  value: true,
                },
                probability: 1,
              },
            ],
          },
        },
        {
          id: 'ignore_journal',
          text: '不理会',
          displayPriority: 2,
          costs: [],
          result: {
            type: 'endEvent',
            effects: [],
            exitText: '你决定不去碰那些可疑的纸张',
          },
        },
      ],
    },
    {
      id: 'read_journal',
      order: 2,
      text: '你翻开日志，上面的内容让你不寒而栗：\n\n"孢子扩散速度远超预期。实验体#7在48小时内完成了全身变异，但它依然保持着理智。它说它能听到孢子说话。我们必须——"\n\n日志在此处被撕断了。你的手微微发抖。',
      onEnterEffects: [
        {
          effect: {
            type: EffectType.ATTRIBUTE,
            attribute: AttributeType.SAN,
            operation: AttributeOperation.SUBTRACT,
            value: 10,
          },
          probability: 1,
          description: '阅读日志让你感到不安',
        },
      ],
      options: [
        {
          id: 'close_journal',
          text: '合上日志',
          displayPriority: 1,
          costs: [],
          result: {
            type: 'endEvent',
            effects: [],
            exitText: '你合上了日志，但那些文字仍然在你脑海中回荡',
          },
        },
      ],
    },
  ],
}

export const eventRegistry: EventRegistry = {
  events: {
    event_plane_wreckage: eventPlaneWreckage,
    event_beach_crab_encounter: eventBeachCrabEncounter,
    event_gather_berries: eventGatherBerries,
    event_journal_fragment: eventJournalFragment,
  },
}
