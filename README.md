# 蚀岛

单人生存文字冒险 H5 游戏，克苏鲁 + SCP 世界观。手机优先，桌面端可用。

技术栈：**Vue 3 + TypeScript + Vite**（Pinia 状态、Vue Router 路由）。

---

## 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 本地开发（vite --host，支持局域网访问）
npm run build      # type-check + 生产构建
npm run type-check # 仅类型检查
npm run preview    # 预览生产构建
```

`lint` / `format` 可用 oxlint、ESLint、Prettier 做代码检查与格式化。Node 需 ≥ 22.18（或 ≥ 24.12）。

---

## 目录结构

```
src/
├─ main.ts            # 入口：initRegistry() → 创建 App → 挂载路由
├─ App.vue            # 根组件
├─ router/            # 路由：#/（主菜单） /game（游戏） /cg（CG） /ending（结局）
├─ views/             # 页面视图
│  ├─ MainMenuView.vue  # 主菜单：职业选择 + 起名 + 新游戏 / 读档
│  ├─ GameView.vue      # 游戏主视图：按 state.mode 切换各功能面板
│  ├─ CGView.vue        # 剧情 CG 播放
│  └─ EndingView.vue    # 结局展示
├─ components/        # 各系统 UI 面板（见"界面"）
├─ types/             # 数据结构定义（纯类型，无逻辑）
├─ config/            # 静态游戏内容配置（数据，非逻辑）
│  ├─ registry.ts       # 汇总所有子注册表
│  ├─ items/ …/item.ts # 物品配置（武器/防具/消耗品/材料/文档/重要物品等）
│  ├─ sceneConfig/      # 场景配置（逐场景一文件）
│  ├─ eventConfig/      # 事件配置（逐场景一文件）
│  └─ …                # 敌人/地图/配方/制造/商人/技能/状态/结局/季节天气等
├─ engine/            # 纯游戏逻辑（规则引擎，不依赖 UI）
└─ runtime/           # 运行时
   ├─ useGame.ts        # 玩家状态与全部操作的集合（单一事实源）
   ├─ gameInstance.ts   # 全局游戏实例单例 + startNewGame/restoreGame
   ├─ saveManager.ts    # 存档/读档
   └─ useUI.ts          # UI 面板开关等
```

---

## 架构与数据流

引擎采用 **配置驱动**：`types/` 定义数据结构，`config/` 提供静态游戏内容，`engine/` 实现纯规则逻辑，三者经 `registry.ts` 统一注册表关联，由 `runtime/` 组装成可操作的运行状态。

```
types（数据结构）
  ↑ 定义
config（静态配置：物品/场景/事件/敌人/公式素材…）
  ↓ 读取         registry.ts 全局注册表（getRegistry()）
engine（纯逻辑：event/combat/status/inventory/world/formula…）
  ↓ 调用
runtime/useGame.ts（PlayerState 单一事实源 + 所有操作方法）
  ↓ 暴露          gameInstance.ts 全局单例
views + components（按 state.mode 切换渲染）
```

初始化在 `main.ts` 调用 `initRegistry()`；游戏运行状态由 `PlayerState` 承载，所有操作（探索、战斗、使用物品、制作、交易、丢弃…）都通过 `useGame` 提供的函数修改该状态，UI 仅做响应式展示。

---

## 界面（GameView 按 mode 切换）

| 面板           | 文件                                                          | 用途                                             |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| 场景           | `ScenePanel.vue`                                              | 场景描述、可交互事件入口、探索/资源/人物/移动    |
| 状态栏         | `StatusBar.vue`                                               | 顶部生存数值、SAN/昼夜主题等                     |
| 属性           | `AttributesPanel.vue`                                         | 玩家属性与当前异常状态详情                       |
| 背包           | `InventoryPanel.vue`                                          | 物品网格、筛选、详情、装备/使用/丢弃（数量选择） |
| 战斗           | `BattlePanel.vue`                                             | 回合制战斗日志与操作                             |
| 事件           | `EventPanel.vue` / `RollResultPanel.vue`                      | 事件帧、选项、骰点结果                           |
| 地图           | `MapPanel.vue`                                                | 区域地图与移动                                   |
| 制作/烹饪/修理 | `RecipePanel.vue` / `RepairPanel.vue`                         | 配方制作、物品修理                               |
| 营地/建造      | `CampsitePanel.vue` / `BuildPanel.vue` / `BuildingDetail.vue` | 营地设施与建造/升级/拆除                         |
| 休息           | `RestPanel.vue`                                               | 休息/睡觉、跳过时间                              |
| 交易/仓库      | `TradePanel.vue` / `StorePanel.vue`                           | 与商人买卖、场景仓库存取                         |
| 系统           | `SystemMenu.vue`                                              | 保存/读档/设置                                   |
| 其他           | `RichText.vue` `CorruptText.vue`                              | 着色富文本、SAN 低时的污染/扰字渲染              |

---

## 玩家与数值

### 属性构成

- **生存属性**：生命 HP、饱食度、体力、SAN、负重、温暖度。
- **基础属性**：力量、敏捷、智力、体质、幸运（可受临时修正 modifier）。
- **武器熟练度**：按武器类型记录的熟练等级
- **职业**：开局在 `MainMenuView` 选择（`CharacterClass`，配置见 [config/characters.ts](src/config/characters.ts)，含幸存者/医生/猎人等）并起名，会影响初始属性与初始装备。
- **技能**：战斗技能与被动技能（config/skills.ts）。

### 核心公式（src/engine/formula.ts）

| 数值         | 公式                                           | 受下列变化影响             |
| ------------ | ---------------------------------------------- | -------------------------- |
| 生命上限     | 体质 × 2                                       | 体质 / modifier            |
| 饱食度上限   | 100 × 饱食度上限系数                           | 系数 / modifier            |
| 体力上限     | 100 + 体力恢复修正                             | 修正 / modifier            |
| SAN 上限     | 100 + SAN 修正指数                             | 修正 / modifier            |
| 最大负重     | 力量 × 2 + 负重修正                            | 力量 / 装备 / modifier     |
| 负重率       | 当前负重 ÷ 最大负重                            | 负重                       |
| 生命自然恢复 | 体质 × 0.1 × 恢复速率系数（/时）               | 恢复系数 / modifier        |
| 饱食度损失   | 5 × 饱食度损失系数（/时）                      | 损失系数 / modifier        |
| 体力恢复     | 10 × 体力恢复系数 + 体力恢复修正（/时或/回合） | 恢复系数 / 修正 / modifier |
| 体力消耗     | 交互所需消耗 × 体力消耗系数                    | 消耗系数 / modifier        |
| 饥饿伤害     | 由饥饿状态（饱食度=0）结算                     | 见"状态系统"               |
| 行动时间     | 基础分钟 × 敏捷折算                            | 敏捷                       |

生存属性当前值始终 clamp 在 `[0, 上限]`；饥饿（饱食度归零）等由状态系统接管结算。

### SAN 与污染

- SAN 值即理智 / 模因污染程度：越低画面、文本、选项越混乱不可信。
- 由 `getSanLevel()` 生成 `sanTier`（0–4），驱动滤镜、文本扰动（`CorruptText`）与场景描述差异。
- 大量事件、描述、选项以 SAN 值为条件。

### 昼夜 / 季节 / 天气 / 温度

- 时间按分钟推进（`advanceTime`）。
- 环境影响由 `seasonWeather.ts` 配置；`calculateTemperature` 依据时段/季节/地点得出场景温度。
- 温度映射为 `warmthLevel`（cold/hot/适宜），再用属性驱动状态施加「寒冷 / 炎热」（见下）。

---

## 状态系统（src/types/status.ts、src/config/statuses.ts、src/engine/status.ts）

状态定义与实现分离：`StatusConfig` 是模板，`ActiveStatus` 是运行实例（含剩余时长、叠层、计时器）。

一个状态的完整影响由其部分组成：

| 部分                                 | 作用                                                                             | 时机       |
| ------------------------------------ | -------------------------------------------------------------------------------- | ---------- |
| `modifier`                           | 属性修正（力量等 5 基础 + 负重 + 防御 + 各项系数 + 温区），施加/移除时写入或撤销 | 全程       |
| `effects`                            | 周期属性变动（非战斗，分钟）                                                     | 非战斗推进 |
| `battleEffects`                      | 周期属性变动（战斗，回合）                                                       | 每回合     |
| `onApplyEffects` / `onRemoveEffects` | 施加/移除时一次性效果                                                            | 施/移      |

- **属性驱动状态（AttStatusConfig）**：不手动施加，由 `reconcileAttributeStatuses` 在属性变动 / 每次操作 / 场景切换时判断条件，满足则施加、不满足则移除。现有：寒冷、炎热、饥饿（饱食达 0）、超载（负重率 > 100%）。已取代原先 world.ts 中写死的温度/饥饿结算。
- **周期效果运算**（`StatusAttributeChange.operation`）：`add`（加值 × 叠层）、`set`（设为值）、`multiply`（× 系数）、`percentMax`（按最大值的百分比扣减，适合流血/中毒/饥饿）。
- **触发判定**：`interval`（非战斗=分钟，战斗=回合）；`triggerChance`（概率）；`triggerRollAtt`+`triggerRollLevel`（指定属性做 d100 检定，成功则豁免——普通/困难/极难对应 < 属性 / 属性一半 / 属性四分之一）。二者同时出现时优先 `triggerChance`。
- **叠车规则**：NONE / REFRESH / STACK_INDEPENDENT / STACK_REFRESH / STACK_NO_REFRESH。
- **叙事文本**：`description` 中的 start/end/triggerText/normalText/summary 均为列表随机取一（triggerText 支持 `{value}`）。是否在战斗中决定显示在场景主文本最前或战斗日志最前；颜色按 `statusType`（buff 绿 / debuff 红 / neutral 灰 / special 紫）。
- **显示**：属性面板展示当前状态名（`AttributesPanel.vue`），点击查看 tooltip 与剩余时间；状态颜色随昼夜主题。
- 现有状态见 [config/statuses.ts](src/config/statuses.ts)：寒冷、炎热、饥饿、超载、恐惧、流血(bleeding)、力量增强(strength_boost)、中毒(poisoned)。

---

## 世界、探索与事件

- **场景**：场景配置（场景主文本、描述变体、可交互入口、资源点/人物/移动、温度修正等，见 `config/scenes.ts` 与 `sceneConfig/`）。文本由 `exploration.ts` 依据 SAN/条件/已见标记选帧并 `resolveTextVariation` 解析。
- **探索**：资源点采集（消耗时间/体力，产出物品）、区域描述刷新。
- **事件**：`config/events.ts` 与 `eventConfig/` 定义事件；每个事件由多个帧（`EventFrame`）构成，帧内含描述变体与选项；选项与帧可见性受玩家属性 / 物品 / SAN / 天气 / 季节 / 时间等条件控制（`getVisibleOptions`、`isOptionAvailable`）。含骰点帧（`RollResult`）与被动触发事件（进入场景、时间推进时可触发）。

---

## 战斗系统（src/engine/combat.ts）

- 回合制、可多敌人；有交战距离（`MIN_BATTLE_DISTANCE`…`MAX_BATTLE_DISTANCE`）。
- 行动类型 `PlayerActionType`：攻击（近战/远程视距离）、使用技能、物品、闪避、逃跑、存活（按回合结束）等。
- 结算产出结构化战斗日志（伤害计算明细 `DamageCalcDetail`、伤害类型、防御减免），并应用战斗类状态（`applyBattleStartStatuses`）；敌人身上的 `battleEffects` 每回合结算。
- 胜负走向对应 `BattleResult`（胜利/失败/逃跑），失败触发失败事件或死亡终点。

---

## 背包与装备（src/engine/inventory.ts）

- **堆叠**：同 id 物品按 `maxStackSize` 合并；**负重**：由物品数量累加，`recalculateCarryWeight` 更新 `carryWeight` 与 `maxCarryWeight`。
- **装备**：多槽位（武器/头部/身体/手/脚/背/颈/戒指/光源）；可装备/卸下；装备改变属性与防御。
- **耐久**：带耐久物品显示耐久条，破损 >30 出现警告。
- **使用/丢弃**：消耗品使用、文档阅读；丢弃在详情内选数量（range 滑条）确认后从背包移除并重算负重（不可丢弃：MISC 重要物品、以及当前处于装备状态的物品）。

---

## 制作 / 烹饪 / 建造 / 修理 / 仓库（src/engine/crafting.ts、storage.ts）

- 制作（`craftRecipes.ts`）、烹饪（`cookRecipes.ts`，含品质 `calculateCookQuality`）、建造/升级/拆除建筑（`builds.ts`）、修理装备与建筑（`RepairPanel`）。
- 资源可存于场景仓库（`storage.ts`），制作时从背包或仓库取料（`ItemSource`）。

---

## 营地与设施（src/engine/campsite.ts）

- 可在适宜地点建立/迁移营地；营地包含可建造、可升级的设施（取水/采集/生活/生产等）。
- `CampsitePanel` / `BuildPanel` 提供对应交互。

---

## 交易（src/engine/trade.ts）

- `config/traders.ts` 定义商人货物；买卖价格由 `calculateBuyPrice` / `calculateSellPrice` 计算，`TradePanel` 交互。

---

## 地图与移动（src/engine/map.ts、world.ts）

- 区域地图节点（`config/maps.ts`），`findMapRoute` 计算路径、`isMapNodeUnlocked` 判定解锁；移动按目的地消耗时间并触发进入场景（含温度协调）。

---

## CG 与结局（src/engine/cg.ts、ending.ts）

- CG 场景（`config/cgs.ts`）恋爱/事件剧情，`main.ts` 挂载 `/cg` 路由。
- 结局条件（`ending.ts`）在推进时 `checkEnding` 检测，达成后跳转 `/ending` 播放。

---

## 后台世界观（设定保留）

主角因飞机事故，在荒岛的沙滩上醒来，不远处就是飞机的残骸。故事由此开始。

背景基于克苏鲁 + SCP 的世界观。

“远古孢子”（The Spores）一种宇宙造物，它来自地球生命甚至地球诞生之前，便降临地球。在千年前，随着海底地震、火山爆发来到地表。而火山爆发导致了这所岛屿的诞生。

这座无名岛屿便是游戏的舞台。

孢子本身并无意识，可以设定为更高维度的低维投影，但是在孢子周围固定范围内，有一种能量辐射场，暴露在能量场中的生物根据内心深处的欲望、想法、情感等所发生变异。（变异有一定随机性）

孢子拥有被动的学习能力，所有暴露在场内的生物的知识、情感都会被学习。

变异的影响在两方面：一是身体的变化，例如肢体的扭曲、额外的肢体、超越正常人类的能力等；二是大脑的变化，例如宗教般的信仰狂热、彻底疯狂、窥探到更高维度的存在而疯狂等。当然也有能保持一定程度人类理智的存在。

SCP 基金会在十年前首次发现岛屿的异常，并开始收容与研究，最终将孢子核心收容在某个收容装置中以隔绝其能量场的影响。但隔绝并不完全，任由少量能量场泄露而工作人员失控变异。因变异并不传染，SCP 基金会最终决定在稳定收容孢子核心后全员撤离。

岛上存在一定的人类或开始变异但仍保留神智的人与玩家互动。

### 两个关键 NPC 设定

1. **少女**：只有玩家在接触（或解除）孢子核心收容装置后才会出现的 NPC，只有玩家能看到她的存在，且多在 SAN 低下或受模因污染时出现。设定上她是孢子对主角“保护需求”的实时响应，会在危难关头帮助主角；避免与其他 NPC 接触，以文字诡计隐瞒身份，最终在少女结局揭示其真身。
2. **SCP 基金会保安队长**：虽然已变异，但保留着守护孢子核心收容装置的使命，变异令他异常强大。

### 其他 NPC 阵营

1. 原住民阵营——与变异和谐共生的岛民
2. 幸存者——少量空难/船难幸存者组成的聚落，为建造船只而努力
3. SCP 遗留人员——基金会撤离时留下的人
4. 驱逐者——因变异被幸存者或 SCP 人员驱逐的人

### 通关结局（策划设定）

1. 修复研究基地遗留的信号塔呼叫救援
2. 与幸存者一同建造船只离开
3. 独自建造大船离开
4. 原住民相关结局
5. SCP 相关结局
6. 少女的真、假两个结局
7. 驱逐者相关结局
8. 其他结局

---

## 开发：如何新增内容

所有游戏内容均为**数据驱动**，新增内容通常只需在 `src/config/` 添加配置并在对应注册表登记，无需改动引擎与 UI：

- **物品**：`config/items/…` → `config/items.ts`
- **场景 / 事件**：`config/sceneConfig/`、`config/eventConfig/` → `config/scenes.ts`、`config/events.ts`
- **敌人 / 技能 / 状态 / 商人 / 配方 / 地图 / 结局 / CG**：对应 `config/` 文件及类型与注册表。
- 全部注册表最终汇入 `config/registry.ts`，经 `getRegistry()` 读取。

# TODO不着急

- 结局时结局原因提示文本
- 防玩家不小心返回的问题
- 物品图标或取消
- 场景背景
- 营地设施显示与返回逻辑
- 建筑物情况作为判断条件
- 大地图移动图标的显示条件
- 日记图片

# TODO

按照规划剧情完善游戏内容，暂无游戏系统变动。
