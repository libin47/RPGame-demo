好的，我已经仔细阅读了你的游戏策划书。这是一个非常详尽且有野心的项目，将配置与逻辑分离是明智的架构决策。

我将为你规划清晰的项目结构，并创建所有必要的空白文件，在文件中用注释说明其职责。

### 项目结构规划

```
eclipse-isle/
├── public/                     # 静态资源，直接通过根路径访问
│   └── favicon.ico
├── src/
│   ├── assets/                 # 需要构建处理的资源（图片、字体、样式等）
│   │   ├── images/
│   │   │   ├── scenes/         # 场景图片
│   │   │   ├── events/         # 事件图片
│   │   │   ├── monsters/       # 怪物图片
│   │   │   ├── items/          # 物品图标
│   │   │   ├── ui/             # UI相关图片（状态图标、按钮等）
│   │   │   └── cg/             # CG图片
│   │   └── styles/
│   │       ├── main.css        # 全局基础样式
│   │       ├── ui.css          # UI框架样式
│   │       └── fonts/          # 特殊字体（如疯狂状态字体）
│   ├── config/                 # 【核心】游戏配置数据，纯数据/配置表
│   │   ├── index.ts            # 配置统一导出
│   │   ├── characters.ts      # 角色配置（可选职业）
│   │   ├── scenes.ts           # 场景配置
│   │   ├── subscenes.ts        # 子场景配置（含地牢）
│   │   ├── events.ts           # 事件配置
│   │   ├── items.ts            # 物品、装备、武器配置
│   │   ├── enemies.ts          # 敌人配置
│   │   ├── skills.ts           # 生存技能、战斗技能、被动技能配置
│   │   ├── crafts.ts           # 合成表（制作、修理、烹饪、建造）
│   │   ├── world.ts            # 世界配置（季节、天气、昼夜、腐化度）
│   │   ├── map.ts              # 地图及距离配置
│   │   ├── cg.ts               # CG动画配置
│   │   ├── documents.ts        # 可收集文档内容配置
│   │   └── flags.ts            # 标志位定义
│   ├── core/                   # 游戏核心逻辑引擎，与UI/配置解耦
│   │   ├── GameEngine.ts       # 游戏主引擎，管理游戏循环、状态保存加载
│   │   ├── Player.ts           # 玩家类，管理所有玩家属性、状态
│   │   ├── EventManager.ts     # 事件管理器，负责事件触发、解析、执行
│   │   ├── CombatSystem.ts     # 战斗系统，处理战斗逻辑
│   │   ├── WorldSimulator.ts   # 世界模拟器，推进时间、天气、季节
│   │   ├── SkillManager.ts     # 技能管理器，处理技能学习、升级、效果
│   │   ├── Inventory.ts        # 背包系统
│   │   ├── StatusManager.ts    # 状态管理器，管理增益/减益/异常状态
│   │   ├── CraftingSystem.ts   # 制作/建造/烹饪/修理系统
│   │   ├── ExplorationSystem.ts # 探索系统
│   │   └── utils/
│   │       ├── dice.ts         # 通用随机与概率工具
│   │       └── formula.ts      # 所有计算公式的纯函数集合
│   ├── stores/                 # Pinia 状态管理，连接Vue组件与游戏核心
│   │   ├── gameStore.ts        # 游戏全局状态（界面切换、游戏阶段）
│   │   ├── playerStore.ts      # 玩家状态（响应式，供UI订阅）
│   │   ├── worldStore.ts       # 世界状态（响应式）
│   │   └── uiStore.ts          # UI交互状态（弹窗、特效等）
│   ├── views/                  # 游戏各主要界面/页面
│   │   ├── MainMenuView.vue    # 主菜单界面
│   │   ├── GameView.vue        # 游戏主界面（常态、事件、战斗容器）
│   │   ├── CGView.vue          # CG过场界面
│   │   └── EndingView.vue      # 结局界面
│   ├── components/             # 可复用的UI组件
│   │   ├── ui/                 # 基础UI组件
│   │   │   ├── StatusBar.vue   # 顶部状态栏（日期、生命、SAN等）
│   │   │   ├── InteractionPanel.vue # 底部交互面板
│   │   │   ├── TextRenderer.vue # 核心文本渲染器，处理涂黑、混乱特效
│   │   │   └── ChoiceButton.vue # 选项按钮
│   │   ├── scenes/             # 场景相关组件
│   │   │   ├── SceneView.vue   # 场景视图（图片、描述）
│   │   │   └── MapView.vue     # 地图/移动视图
│   │   ├── events/             # 事件相关组件
│   │   │   └── EventDialog.vue # 事件对话/选项界面
│   │   ├── combat/             # 战斗相关组件
│   │   │   ├── CombatView.vue  # 战斗主视图
│   │   │   ├── PlayerStatus.vue # 战斗中的玩家状态
│   │   │   └── EnemyStatus.vue # 战斗中的敌人状态
│   │   └── panels/             # 功能面板组件
│   │       ├── InventoryPanel.vue  # 背包界面
│   │       ├── CraftingPanel.vue   # 制作/建造/烹饪/修理面板
│   │       ├── SkillPanel.vue      # 技能面板
│   │       └── TradingPanel.vue    # 交易面板
│   ├── composables/            # 可复用的组合式API逻辑
│   │   ├── useGameLoop.ts      # 游戏主循环逻辑
│   │   ├── useEventTrigger.ts  # 事件触发逻辑
│   │   └── useTextEffect.ts    # 文本特效逻辑（混乱、涂黑）
│   ├── router/
│   │   └── index.ts            # Vue Router 路由配置
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 应用入口
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 文件创建说明

现在，我将按照上述结构，为你创建所有空白文件。每个文件会用注释写明它的用途。这仅创建结构，不实现功能。

**(我将以文本形式列出所有需创建的文件路径和内容，你可以用脚本或手动创建它们。以下是完整列表。)**

---

**`public/favicon.ico`** (一个空图标或默认图标，可后续添加)

---

**`src/assets/images/scenes/.gitkeep`**

```gitkeep
// 存放场景背景图
```

**`src/assets/images/events/.gitkeep`**

```gitkeep
// 存放事件插图
```

**`src/assets/images/monsters/.gitkeep`**

```gitkeep
// 存放怪物图片
```

**`src/assets/images/items/.gitkeep`**

```gitkeep
// 存放物品图标
```

**`src/assets/images/ui/.gitkeep`**

```gitkeep
// 存放UI图标（状态图标、按钮背景等）
```

**`src/assets/images/cg/.gitkeep`**

```gitkeep
// 存放CG动画帧/图
```

**`src/assets/styles/main.css`**

```css
/* 全局基础样式，CSS变量定义，字体导入，重置样式 */
```

**`src/assets/styles/ui.css`**

```css
/* UI框架样式，按钮、面板、状态栏等具体组件样式 */
```

**`src/assets/styles/fonts/.gitkeep`**

```gitkeep
// 存放特殊字体文件（如疯狂状态下的扭曲字体）
```

---

**`src/config/index.ts`**

```typescript
// 统一导出所有游戏配置数据
// 例如: export * from './characters';
```

**`src/config/characters.ts`**

```typescript
// 定义玩家可选角色职业配置
// 包括：角色名、初始属性、特有技能/物品、描述等
```

**`src/config/scenes.ts`**

```typescript
// 定义所有场景配置
// 包括：场景id、名称、描述（多种条件）、温度影响、特有交互内容、可触发事件列表等
```

**`src/config/subscenes.ts`**

```typescript
// 定义所有子场景配置（包括地牢）
// 包括：子场景id、所属场景、名称、描述、交互、地牢相邻关系等
```

**`src/config/events.ts`**

```typescript
// 定义所有事件配置（事件树/链）
// 包括：事件id、描述、子事件、选项、选项条件、选项结果（属性/物品/标志位变动，战斗触发等）
```

**`src/config/items.ts`**

```typescript
// 定义所有物品、装备、武器配置
// 包括：物品id、类型、名称、描述、属性、效果、重量、耐久度、堆叠等
```

**`src/config/enemies.ts`**

```typescript
// 定义所有敌人配置
// 包括：敌人id、名称、属性、技能列表、AI行为配置、战利品表、描述（正常/疯狂视角）等
```

**`src/config/skills.ts`**

```typescript
// 定义所有技能配置（生存技能、战斗技能、被动技能）
// 包括：技能id、名称、类型、解锁条件、等级效果公式、消耗等
```

**`src/config/crafts.ts`**

```typescript
// 定义所有合成配方（制作、建造、烹饪、修理）
// 包括：配方id、类型、所需材料、产出、工作台限制、蓝图要求、时间消耗等
```

**`src/config/world.ts`**

```typescript
// 定义世界模拟相关配置
// 包括：季节基准温度、天气影响值、天气转换概率矩阵、昼夜时段划分、腐化度阈值等
```

**`src/config/map.ts`**

```typescript
// 定义游戏地图与移动配置
// 包括：场景之间联通关系、移动所需时间/体力、是否可通行条件等
```

**`src/config/cg.ts`**

```typescript
// 定义CG过场动画配置
// 包括：CG id、图片序列、文字旁白、选项分支等
```

**`src/config/documents.ts`**

```typescript
// 定义可收集的文档、书籍等文本内容配置
// 用于在特定界面展示完整故事背景碎片
```

**`src/config/flags.ts`**

```typescript
// 定义所有游戏内标志位
// 用于追踪非数值的剧情进度、成就、关键选择等，统一管理避免硬编码字符串
```

---

**`src/core/GameEngine.ts`**

```typescript
// 游戏主引擎
// 职责：初始化游戏、驱动游戏主循环、管理存档读档、协调各子系统
```

**`src/core/Player.ts`**

```typescript
// 玩家类
// 职责：存储和管理玩家所有属性（生存、基础、技能）、状态、装备、负重计算、属性成长经验值等
```

**`src/core/EventManager.ts`**

```typescript
// 事件管理器
// 职责：根据配置和游戏状态，解析事件树，判断选项可用性，执行选项结果（属性变更、物品增减、触发战斗等），管理事件链
```

**`src/core/CombatSystem.ts`**

```typescript
// 战斗系统
// 职责：管理战斗流程（回合制），计算出手顺序，处理玩家/敌人行动（技能、物品、防守、逃跑），计算伤害/命中/暴击公式，处理战斗结束与战利品
```

**`src/core/WorldSimulator.ts`**

```typescript
// 世界模拟器
// 职责：管理游戏内时间推进（分钟/小时/天），更新天气、季节、昼夜、腐化度，触发与时间相关的被动效果（如饥饿掉血、温度影响）
```

**`src/core/SkillManager.ts`**

```typescript
// 技能管理器
// 职责：管理技能学习、解锁、升级，提供技能效果查询接口，处理技能经验值累加
```

**`src/core/Inventory.ts`**

```typescript
// 背包系统
// 职责：管理物品的增删改查、堆叠、排序、负重计算，提供装备/使用/丢弃物品的接口
```

**`src/core/StatusManager.ts`**

```typescript
// 状态管理器
// 职责：管理玩家身上的所有状态（增益、减益、异常），跟踪持续时间/条件，计算状态对属性的实时修正值
```

**`src/core/CraftingSystem.ts`**

```typescript
// 制作系统
// 职责：处理制作、建造、烹饪、修理的逻辑，检查配方可用性，消耗材料，产出成品，处理时间流逝
```

**`src/core/ExplorationSystem.ts`**

```typescript
// 探索系统
// 职责：处理场景探索逻辑，根据场景配置、玩家属性、SAN值、腐化度等，随机刷新场景描述/事件入口
```

**`src/core/utils/dice.ts`**

```typescript
// 通用随机与概率工具函数
// 职责：提供加权随机、概率判定、洗牌、范围随机数等纯函数
```

**`src/core/utils/formula.ts`**

```typescript
// 核心计算公式库
// 职责：集中存放所有游戏内的计算公式，如伤害、命中、暴击、经验值、负重等，便于调整和验证
```

---

**`src/stores/gameStore.ts`**

```typescript
// 游戏全局状态管理
// 职责：管理游戏阶段（菜单、游玩、战斗、CG）、场景切换、存档读档状态等
```

**`src/stores/playerStore.ts`**

```typescript
// 玩家状态管理（响应式）
// 职责：将核心层Player的数据转化为Vue响应式数据，供所有UI组件订阅
```

**`src/stores/worldStore.ts`**

```typescript
// 世界状态管理（响应式）
// 职责：将核心层WorldSimulator的数据转化为Vue响应式数据
```

**`src/stores/uiStore.ts`**

```typescript
// UI交互状态管理
// 职责：管理弹窗的显示/隐藏、提示信息、加载动画、UI特效等全局UI状态
```

---

**`src/views/MainMenuView.vue`**

```vue
<template>
  <!-- 主菜单界面：新游戏、继续、设置、退出 -->
</template>
<script setup lang="ts">
// 主菜单逻辑：处理用户选择，触发路由跳转或游戏引擎操作
</script>
```

**`src/views/GameView.vue`**

```vue
<template>
  <!-- 游戏主容器：根据当前状态（常态、事件、战斗）动态显示对应组件 -->
</template>
<script setup lang="ts">
// 主游戏视图逻辑：组合状态栏、场景视图、交互面板等
</script>
```

**`src/views/CGView.vue`**

```vue
<template>
  <!-- CG过场动画界面：全屏显示图片和文字，提供选项推进剧情 -->
</template>
<script setup lang="ts">
// CG界面逻辑：按顺序播放CG图片/文字，处理选项分支
</script>
```

**`src/views/EndingView.vue`**

```vue
<template>
  <!-- 结局界面：展示结局类型、文字描述和统计信息 -->
</template>
<script setup lang="ts">
// 结局界面逻辑：接收结局数据并展示，提供返回主菜单选项
</script>
```

---

**`src/components/ui/StatusBar.vue`**

```vue
<template>
  <!-- 顶部状态栏：日期、时间、天气图标、生命/饱食/体力/SAN值 -->
</template>
<script setup lang="ts">
// 从playerStore和worldStore获取数据并显示
</script>
```

**`src/components/ui/InteractionPanel.vue`**

```vue
<template>
  <!-- 下方交互区域：左侧系统按钮（背包、属性），右侧场景交互按钮（探索、建造等） -->
</template>
<script setup lang="ts">
// 根据当前场景配置动态生成按钮，处理按钮点击事件
</script>
```

**`src/components/ui/TextRenderer.vue`**

```vue
<template>
  <!-- 核心文本渲染组件：根据SAN值对文本进行特效处理（如涂黑、错乱、涂鸦覆盖） -->
</template>
<script setup lang="ts">
// 接收原始文本和SAN等级，返回处理后的HTML/VNode
</script>
```

**`src/components/ui/ChoiceButton.vue`**

```vue
<template>
  <!-- 通用选项按钮，可能包含不同样式（可用、禁用、危险等） -->
</template>
<script setup lang="ts">
// 接收选项配置，处理点击事件，可能发出事件到父组件
</script>
```

**`src/components/scenes/SceneView.vue`**

```vue
<template>
  <!-- 场景视图：显示场景图片、场景描述文字（含可交互的蓝色事件入口） -->
</template>
<script setup lang="ts">
// 根据当前场景配置、SAN值等显示不同描述和事件入口
</script>
```

**`src/components/scenes/MapView.vue`**

```vue
<template>
  <!-- 地图/移动视图：显示简化地图，标记可前往地点，显示预计时间，点击移动 -->
</template>
<script setup lang="ts">
// 从地图配置获取数据，处理移动逻辑
</script>
```

**`src/components/events/EventDialog.vue`**

```vue
<template>
  <!-- 事件界面：显示事件描述和动态选项列表 -->
</template>
<script setup lang="ts">
// 接收当前事件节点，调用EventManager处理选项点击，更新玩家状态
</script>
```

**`src/components/combat/CombatView.vue`**

```vue
<template>
  <!-- 战斗主界面：组合玩家状态、敌人状态、战斗日志和操作面板 -->
</template>
<script setup lang="ts">
// 封装整个战斗回合的UI逻辑
</script>
```

**`src/components/combat/PlayerStatus.vue`**

```vue
<template>
  <!-- 战斗中玩家侧状态显示：生命、体力、SAN条 -->
</template>
```

**`src/components/combat/EnemyStatus.vue`**

```vue
<template>
  <!-- 战斗中敌人侧状态显示：名称、生命条、可能的意图图标 -->
</template>
```

**`src/components/panels/InventoryPanel.vue`**

```vue
<template>
  <!-- 背包面板：分类显示物品，支持使用、装备、查看详情、丢弃 -->
</template>
<script setup lang="ts">
// 调用Inventory系统，处理背包操作
</script>
```

**`src/components/panels/CraftingPanel.vue`**

```vue
<template>
  <!-- 通用制作面板：建造、制作、烹饪、修理，根据类型动态切换内部UI -->
</template>
<script setup lang="ts">
// 接收“制作类型”参数，调用CraftingSystem，显示配方列表和所需材料
</script>
```

**`src/components/panels/SkillPanel.vue`**

```vue
<template>
  <!-- 技能面板：显示生存技能、战斗技能、被动技能、武器熟练度等信息 -->
</template>
<script setup lang="ts">
// 从playerStore获取技能信息并展示
</script>
```

**`src/components/panels/TradingPanel.vue`**

```vue
<template>
  <!-- 交易面板：显示买卖双方物品列表，支持数量调整、确认交易 -->
</template>
<script setup lang="ts">
// 处理交易逻辑
</script>
```

---

**`src/composables/useGameLoop.ts`**

```typescript
// 游戏主循环组合式API
// 职责：封装时间推进、自动保存、状态更新等需要按帧或按时间执行的逻辑
```

**`src/composables/useEventTrigger.ts`**

```typescript
// 事件触发逻辑
// 职责：封装被动事件检查逻辑（如属性归零、时间到达、状态满足时自动触发事件）
```

**`src/composables/useTextEffect.ts`**

```typescript
// 文本特效逻辑
// 职责：根据SAN值档位，提供对文本字符串进行过滤、替换、加扰等处理的函数
```

---

**`src/router/index.ts`**

```typescript
// Vue Router 路由配置
// 定义路径 `/`, `/game`, `/cg` 等与视图的映射关系
```

**`src/App.vue`**

```vue
<template>
  <!-- 应用根组件，通常只包含 <router-view /> -->
</template>
```

**`src/main.ts`**

```typescript
// 应用入口文件
// 创建Vue应用实例，安装Pinia、Router，挂载到DOM
```

这些就是我为你规划的全部文件结构和空文件内容。现在你可以直接在你的项目中创建这些目录和文件了。这个结构为你的大型文字冒险游戏奠定了坚实的基础。祝开发顺利！
