<!-- GameView.vue - 游戏主视图
     组合 StatusBar（三行）+ ScenePanel/EventPanel/BattlePanel
     背景色随时间段变化 -->
<template>
  <!-- data-theme：时段主题（day/dusk/night）；data-overlay：环境叠加（campsite/dungeon）
       data-san：SAN 异常档位（0 正常 ~ 4 极度），驱动内容区滤镜/扭曲/覆盖层
       纸墨主题令牌在此根容器定义，状态栏与所有子面板通过 var(--...) 继承同一套配色 -->
  <div
    class="game-view"
    :data-theme="sceneTheme"
    :data-overlay="sceneOverlay"
    :data-san="sanTier"
    :style="{ background: backgroundColor }"
  >
    <!-- 顶部状态栏（世界信息/生存属性/工具栏） -->
    <StatusBar
      :player-state="game.state.player"
      :scene-name="currentSceneName"
      :has-time-item="hasTimeItem"
      :has-san-item="hasSanItem"
      :background-color="backgroundColor"
      :hide-toolbar="game.state.mode === 'inventory'"
      @open-settings="onOpenSettings"
      @open-inventory="onOpenInventory"
      @open-attributes="onOpenAttributes"
    />

    <!-- 主内容区：根据当前模式切换面板 -->
    <div class="main-content">
      <!-- SAN 异常覆盖层（噪点/边缘变形/划痕，随档位显现，不挡操作） -->
      <div v-if="sanTier > 1" class="san-overlay" aria-hidden="true">
        <div class="san-noise"></div>
        <div class="san-vignette"></div>
        <div v-if="sanTier >= 3" class="san-scratch"></div>
      </div>

      <!-- 场景模式 -->
      <ScenePanel
        v-if="game.state.mode === 'normal'"
        :description-config="game.state.currentDescriptionConfig"
        :scene="currentSceneForPanel"
        :campsite-functions="game.getCampsiteFunctions()"
        :is-campsite="game.isCurrentCampsite()"
        :campsite-move-info="campsiteMoveInfo"
        :scene-text-prefix="game.state.sceneTextPrefix"
        :scene-text-after="game.state.sceneTextAfter"
        :theme="sceneTheme"
        :overlay="sceneOverlay"
        :player-state="game.state.player"
        :san-tier="sanTier"
        :expanded-category="expandedCategory"
        :is-event-clicked="game.state.eventEntryClicked"
        @update:expanded-category="expandedCategory = $event"
        @enter-event="onEnterEventFromEntry"
        @explore="onExplore"
        @build="onBuild"
        @collect="onCollect"
        @move="onMoveAction"
        @character-attack="onCharacterAttack"
        @character-dialog="onCharacterDialog"
        @character-trade="onCharacterTrade"
        @campsite="onOpenCampsite"
        @campsite-function="onCampsiteFunction"
      />

      <!-- 地图模式（moveType === 'move' 时打开大地图） -->
      <MapPanel
        v-else-if="game.state.mode === 'map' && currentMap"
        :map="currentMap"
        :current-scene-id="game.state.player.currentLocation.sceneId"
        :player-state="game.state.player"
        @close="onCloseMap"
        @move-to="onMoveToMapScene"
      />

      <!-- 背包模式 -->
      <InventoryPanel
        v-else-if="game.state.mode === 'inventory'"
        :player-state="game.state.player"
        @close="game.closeInventory()"
        @use-item="onUseItem"
        @equip-item="onEquipItem"
        @unequip-item="onUnequipItem"
      />

      <!-- 事件模式 -->
      <RollResultPanel
        v-else-if="
          game.state.mode === 'event' &&
          game.state.currentFrame?.id === 'roll_result_frame' &&
          game.state.rollResultInfo
        "
        :info="game.state.rollResultInfo"
        @continue="game.selectEventOption('roll_continue')"
      />

      <EventPanel
        v-else-if="game.state.mode === 'event' && game.state.currentFrame"
        :frame="game.state.currentFrame"
        :resolved-text="resolvedFrameText"
        :frame-text-prefix="game.state.frameTextPrefix"
        :frame-text-suffix="game.state.frameTextSuffix"
        :options="visibleEventOptions"
        :variations="visibleEventVariations"
        :option-availability="optionAvailability"
        :san-tier="sanTier"
        @select-option="game.selectEventOption"
      />

      <!-- 战斗模式 -->
      <BattlePanel
        v-else-if="game.state.mode === 'battle' && game.state.currentBattle"
        :enemies="game.state.currentBattle.enemies"
        :logs="game.state.currentBattle.logs"
        :distance="game.state.currentBattle.distance"
        :player="game.state.player"
        :target-enemy-id="game.state.currentBattle.targetEnemyId"
        :skill-cooldowns="game.state.currentBattle.playerSkillCooldowns"
        :result="game.state.currentBattle.result"
        @action="onBattleAction"
        @select-target="onSelectEnemyTarget"
      />

      <!-- 建造模式 -->
      <BuildPanel
        v-else-if="game.state.mode === 'build'"
        :sub-scene="game.state.currentSubScene"
        :player-state="game.state.player"
        @close="game.exitBuildMode()"
        @build="onBuildRecipe"
      />

      <!-- 营地建筑模式（仅已有建筑） -->
      <CampsitePanel
        v-else-if="game.state.mode === 'camp'"
        :sub-scene="game.state.currentSubScene"
        :player-state="game.state.player"
        @close="onCloseCampsite"
        @enter-building="onEnterBuilding"
        @upgrade="onUpgradeBuild"
      />

      <!-- 建筑交互模式 - 配方子模式 -->
      <RecipePanel
        v-else-if="game.state.mode === 'building' && recipeMode"
        :mode="recipeMode"
        :device-level="recipeDeviceLevel"
        :player-state="game.state.player"
        :sub-scene-id="game.state.currentSubScene?.id ?? null"
        @close="onExitRecipe"
        @execute="onRecipeExecute"
      />

      <!-- 建筑交互模式 - 休息子模式 -->
      <RestPanel
        v-else-if="game.state.mode === 'building' && restMode"
        @rest="onRestExecute"
        @back="onRestBack"
        :reset-button="resetButton"
      />

      <!-- 建筑交互模式 - 仓库子模式 -->
      <StorePanel
        v-else-if="game.state.mode === 'building' && storeMode && currentBuildingData"
        :player-state="game.state.player"
        :sub-build="currentBuildingData.subBuild"
        :sub-scene-id="game.state.currentSubScene?.id ?? null"
        :build-id="currentBuildingData.build.buildId"
        @close="onExitStore"
        @store="onStoreItem"
        @retrieve="onRetrieveItem"
      />

      <!-- 建筑交互模式 - 维修子模式 -->
      <RepairPanel
        v-else-if="game.state.mode === 'building' && repairMode"
        :player-state="game.state.player"
        :sub-scene-id="game.state.currentSubScene?.id ?? null"
        @close="onExitRepair"
        @repair="onRepairItem"
      />

      <!-- 建筑交互模式 -->
      <BuildingDetail
        v-else-if="game.state.mode === 'building' && currentBuildingData"
        :build="currentBuildingData.build"
        :sub-build="currentBuildingData.subBuild"
        :player-state="game.state.player"
        :sub-scene-id="game.state.currentSubScene?.id ?? null"
        @exit="onExitBuilding"
        @enter-event="onEnterEventFromEntry"
        @dismantle="onDismantleBuilding"
        @upgrade="onUpgradeBuild"
        @repair="onRepairBuilding"
        @log="onBuildingLog"
        @enter-recipe="onEnterRecipe"
        @enter-rest="onEnterRest"
        @enter-store="onEnterStore"
        @enter-repair="onEnterRepair"
      />

      <!-- 交易模式 -->
      <TradePanel
        v-else-if="game.state.mode === 'trade'"
        :trader-id="game.state.currentTraderId"
        :player-state="game.state.player"
        @buy="onTradeBuy"
        @sell="onTradeSell"
        @close="onExitTrade"
      />

      <!-- 其他模式（占位提示） -->
      <div v-else class="placeholder-panel">
        <p>此功能尚未实现</p>
      </div>
    </div>

    <!-- 系统菜单（保存/读档） -->
    <SystemMenu v-if="uiState.showSettings" @close="uiState.showSettings = false" />

    <!-- 属性面板覆盖层 -->
    <div v-if="uiState.showAttributes" class="panel-overlay">
      <AttributesPanel :player-state="game.state.player" @close="uiState.showAttributes = false" />
    </div>

    <!-- SAN 扭曲滤镜定义（隐藏，供 CSS filter: url() 引用） -->
    <svg class="san-svg-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <!-- 中等扭曲（档位 3） -->
      <filter id="san-distort-mid">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.018"
          numOctaves="2"
          seed="5"
          result="noise"
        >
          <animate
            attributeName="baseFrequency"
            dur="6s"
            values="0.012 0.018;0.018 0.026;0.012 0.018"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="14"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      <!-- 重度扭曲（档位 4） -->
      <filter id="san-distort-severe">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.016 0.024"
          numOctaves="3"
          seed="11"
          result="noise"
        >
          <animate
            attributeName="baseFrequency"
            dur="3.5s"
            values="0.016 0.024;0.028 0.04;0.016 0.024"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="26"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatusBar from '@/components/StatusBar.vue'
import ScenePanel from '@/components/ScenePanel.vue'
import EventPanel from '@/components/EventPanel.vue'
import RollResultPanel from '@/components/RollResultPanel.vue'
import BattlePanel from '@/components/BattlePanel.vue'
import InventoryPanel from '@/components/InventoryPanel.vue'
import SystemMenu from '@/components/SystemMenu.vue'
import AttributesPanel from '@/components/AttributesPanel.vue'
import BuildPanel from '@/components/BuildPanel.vue'
import CampsitePanel from '@/components/CampsitePanel.vue'
import BuildingDetail from '@/components/BuildingDetail.vue'
import RecipePanel from '@/components/RecipePanel.vue'
import RestPanel from '@/components/RestPanel.vue'
import StorePanel from '@/components/StorePanel.vue'
import RepairPanel from '@/components/RepairPanel.vue'
import TradePanel from '@/components/TradePanel.vue'
import MapPanel from '@/components/MapPanel.vue'
import { PlayerActionType, getTimeOfDay, getRegistry } from '@/engine'
import { getVisibleOptions, getVisibleVariations, isOptionAvailable, getSanLevel } from '@/engine'
import { getGameInstance } from '@/runtime/gameInstance'
import type { GameInstance } from '@/runtime/gameInstance'
import { useUI } from '@/runtime/useUI'
import { TimeOfDay } from '@/types/seasonWeather'
import type { ButtonOption } from '@/types/option'
import type { buildOption, CampsiteFunction } from '@/types/build'

const router = useRouter()
const { uiState, toggleSettings, toggleAttributes } = useUI()
const registry = getRegistry()

// ============================================================
// 配方面板状态（由 BuildingDetail 进入）
// ============================================================

const recipeMode = ref<'craft' | 'cook' | null>(null)
const recipeDeviceLevel = ref(0)

function onEnterRecipe(payload: { mode: 'craft' | 'cook'; deviceLevel: number }): void {
  recipeMode.value = payload.mode
  recipeDeviceLevel.value = payload.deviceLevel
}

function onExitRecipe(): void {
  recipeMode.value = null
}

function onRecipeExecute(recipeId: string, quantity: number): void {
  if (recipeMode.value === 'craft') {
    game.value.executeCraftRecipe(recipeId, quantity)
  } else {
    game.value.executeCookRecipe(recipeId, recipeDeviceLevel.value)
  }
}

// ============================================================
// 休息面板状态（由 BuildingDetail 进入）
// ============================================================

const restMode = ref(false)
const resetButton = ref<buildOption>()

/** 打开休息子界面 */
function onEnterRest(act: buildOption): void {
  restMode.value = true
  resetButton.value = act
}

/** 关闭休息子界面，返回建筑详情 */
function onRestBack(): void {
  restMode.value = false
}

/** 执行休息：推进时间、恢复体力、移除休息状态，完成后返回场景 */
function onRestExecute(hours: number, option: buildOption | undefined): void {
  game.value.handleRest(hours, option)
  // 5. 返回场景界面（退出建筑交互模式）
  restMode.value = false
}

// ============================================================
// 仓库面板状态（由 BuildingDetail 进入）
// ============================================================

const storeMode = ref(false)

function onEnterStore(): void {
  storeMode.value = true
}

function onExitStore(): void {
  storeMode.value = false
}

/** 存入仓库（由 useGame 执行变更与提示） */
function onStoreItem(itemId: string, qty: number): void {
  game.value.storeItem(itemId, qty)
}

/** 取出仓库（由 useGame 执行变更与提示） */
function onRetrieveItem(instanceId: string, qty: number): void {
  game.value.retrieveItem(instanceId, qty)
}

// ============================================================
// 维修面板状态（由 BuildingDetail 的 repair 交互进入）
// ============================================================

const repairMode = ref(false)

function onEnterRepair(): void {
  repairMode.value = true
}

function onExitRepair(): void {
  repairMode.value = false
}

/** 维修指定物品实例（由 useGame 执行变更与提示） */
function onRepairItem(instanceId: string): void {
  game.value.repairItem(instanceId)
}

// ============================================================
// 游戏实例
// ============================================================

const game = computed<GameInstance>(() => {
  const instance = getGameInstance()
  if (!instance) {
    router.replace('/')
    throw new Error('游戏未开始')
  }
  return instance
})

// ============================================================
// 时段背景色
// ============================================================

/** 当前时段背景色 */
const backgroundColor = computed<string>(() => {
  const player = game.value.state.player
  const timeOfDay = getTimeOfDay(player.progress.timeMinutes)
  const config = registry.getTimeOfDayConfig(timeOfDay)
  return config?.backgroundColor || '#12122a'
})

// ============================================================
// 场景纸张主题与环境叠加（由时段与场景属性驱动）
// ============================================================

/** 场景纸张主题：day（白天·浅色纸）/ dusk（黄昏黎明·暗纸）/ night（夜晚·深色纸） */
const sceneTheme = computed<'day' | 'dusk' | 'night'>(() => {
  const timeOfDay = getTimeOfDay(game.value.state.player.progress.timeMinutes)
  switch (timeOfDay) {
    case TimeOfDay.DAWN:
    case TimeOfDay.DUSK:
      return 'dusk'
    case TimeOfDay.LATE_NIGHT:
    case TimeOfDay.EARLY_MORNING:
    case TimeOfDay.NIGHT:
      return 'night'
    default:
      return 'day'
  }
})

/** 场景环境叠加：营地暖光 / 地牢危险（有效营地优先） */
const sceneOverlay = computed<'none' | 'campsite' | 'dungeon'>(() => {
  const state = game.value.state
  if (game.value.isCurrentCampsite()) return 'campsite'
  if (state.currentSubScene?.isDungeon) return 'dungeon'
  return 'none'
})

// ============================================================
// SAN 异常档位（驱动内容区滤镜/扭曲/覆盖层与文本异常）
// ============================================================

/**
 * SAN 异常档位：0 正常 ~ 4 极度
 * 由 getSanLevel 映射：5 理性(81+)→0；4 不安(61-80)→1；3 动摇(41-60)→2；
 *                    2 崩溃(21-40)→3；1 疯狂(1-20)→4；0 濒死(<=0)→4（最重）
 */
const sanTier = computed<number>(() => {
  const lvl = getSanLevel(game.value.state.player.survival.san)
  if (lvl >= 5) return 0
  return Math.min(4, 5 - lvl)
})

// ============================================================
// 场景名称（用于工具栏右侧显示）
// ============================================================

/** 当前场景显示名称（子场景优先） */
const currentSceneName = computed<string>(() => {
  const state = game.value.state
  if (state.currentSubScene) {
    return `${state.currentScene.name} - ${state.currentSubScene.name}`
  }
  if (state.currentScene) {
    return state.currentScene.name
  }
  return ''
})

/** 当前场景数据（子场景优先，用于 ScenePanel 的 scene prop） */
const currentSceneForPanel = computed(() => {
  return game.value.state.currentSubScene ?? game.value.state.currentScene
})

/** 二级菜单展开状态（GameView 管理，场景切换时重置，mode 切换时保持） */
const expandedCategory = ref<string | null>(null)

/** 切换场景时收起二级菜单 */
watch(currentSceneForPanel, () => {
  expandedCategory.value = null
})

// ============================================================
// 条件显示道具检测
// ============================================================

/** 玩家是否拥有时间显示道具（手表等） */
const hasTimeItem = computed<boolean>(() => {
  // 检测背包中是否有 show_time 标签道具（如手表）
  const player = game.value.state.player
  return player.inventory.some((inv) => inv.itemId === 'watch')
})

/** 玩家是否拥有SAN检测道具 */
const hasSanItem = computed<boolean>(() => {
  // 检测背包中是否有 show_san 标签道具（如精神检测仪）
  const player = game.value.state.player
  return player.inventory.some((inv) => inv.itemId === 'san_meter')
})

// ============================================================
// 文本替换
// ============================================================

const resolvedFrameText = computed<string>(() => {
  if (!game.value.state.currentFrame) return ''
  return game.value.resolveText(game.value.state.currentFrame.text)
})

const visibleEventOptions = computed(() => {
  const frame = game.value.state.currentFrame
  if (!frame) return []
  return getVisibleOptions(frame, game.value.state.player)
})

const visibleEventVariations = computed(() => {
  const frame = game.value.state.currentFrame
  if (!frame) return []
  return getVisibleVariations(frame, game.value.state.player)
})

/** 选项可用性映射（optionId -> 是否满足 availableCondition） */
const optionAvailability = computed<Record<string, boolean>>(() => {
  const frame = game.value.state.currentFrame
  if (!frame) return {}
  const player = game.value.state.player
  const result: Record<string, boolean> = {}
  for (const option of frame.options) {
    result[option.id] = isOptionAvailable(option, player)
  }
  return result
})

// ============================================================
// 操作处理
// ============================================================

/** 从场景描述事件入口点击进入事件（传递 fromEventEntry=true） */
function onEnterEventFromEntry(eventId: string): void {
  game.value.enterEvent(eventId, true)
}

function onBattleAction(
  actionType: PlayerActionType,
  skillId?: string,
  itemInstanceId?: string,
): void {
  game.value.executeBattleAction(actionType, skillId, itemInstanceId)
}

/** 切换玩家当前攻击目标 */
function onSelectEnemyTarget(enemyId: string): void {
  game.value.setBattleTarget(enemyId)
}

/** 使用物品 */
function onUseItem(instanceId: string): void {
  game.value.useItem(instanceId)
}

/** 装备物品 */
function onEquipItem(instanceId: string): void {
  game.value.equipItem(instanceId)
}

/** 卸下装备 */
function onUnequipItem(itemId: string): void {
  game.value.unequipItem(itemId)
}

/** 打开系统菜单（保存/读档） */
function onOpenSettings(): void {
  toggleSettings()
}

/** 打开背包（仅在场景模式下允许） */
function onOpenInventory(): void {
  if (game.value.state.mode !== 'normal') return
  game.value.openInventory()
}

/** 打开属性面板 */
function onOpenAttributes(): void {
  toggleAttributes()
}

// ============================================================
// 处理 ScenePanel 新事件
// ============================================================

/** 探索 */
function onExplore(explore: ButtonOption): void {
  game.value.handleExplore(explore)
}

/** 建造 */
function onBuild(): void {
  game.value.handleBuild()
}

/** 资源采集/战斗 */
function onCollect(collect: import('@/types/scene').ResourceInteraction): void {
  game.value.handleCollect(collect)
}

/** 移动 */
function onMoveAction(moveAction: import('@/types/scene').MoveInteraction): void {
  game.value.handleSceneMove(moveAction)
}

/** 当前大地图配置（地图模式下显示） */
const currentMap = computed(() => game.value.getCurrentMap())

/** 回营地信息（无营地时 null） */
const campsiteMoveInfo = computed(() => game.value.getCampsiteMoveInfo())

/** 关闭大地图，返回场景 */
function onCloseMap(): void {
  game.value.closeMap()
}

/** 从地图移动到目标场景 */
function onMoveToMapScene(sceneId: string): void {
  game.value.moveToMapScene(sceneId)
}

/** 攻击人物（enemyConfig → 战斗，胜利/失败进入对应事件） */
function onCharacterAttack(char: import('@/types/scene').CharacterInteraction): void {
  game.value.attackCharacter(char)
}

/** 与人物对话（dialogConfig → 进入第一个满足条件的对话事件） */
function onCharacterDialog(char: import('@/types/scene').CharacterInteraction): void {
  game.value.startCharacterDialog(char)
}

/** 与人物交易（tradeConfig → 打开交易界面） */
function onCharacterTrade(char: import('@/types/scene').CharacterInteraction): void {
  game.value.openCharacterTrade(char)
}

/** 交易：从商人购买 */
function onTradeBuy(goodsItemId: string, quantity: number): void {
  game.value.buyFromTrader(goodsItemId, quantity)
}

/** 交易：向商人出售 */
function onTradeSell(itemId: string, quantity: number): void {
  game.value.sellToTrader(itemId, quantity)
}

/** 交易：关闭交易界面 */
function onExitTrade(): void {
  game.value.exitTradeMode()
}

/** 当前交互的建筑数据（用于 BuildingDetail） */
const currentBuildingData = computed<{
  build: import('@/types/build').Build
  subBuild: import('@/types/build').SubBuild
} | null>(() => {
  const buildId = game.value.state.currentBuildingId
  if (!buildId) return null
  const build = registry.getBuilding(buildId)
  if (!build) return null
  const subSceneId = game.value.state.currentSubScene?.id
  const currentSubId = subSceneId
    ? game.value.state.player.progress.campBuildingLevels[subSceneId]?.[buildId]
    : undefined
  const subBuild = build.subBuild.find((s) => s.buildId === (currentSubId ?? build.defaultBuild))
  if (!subBuild) return null
  return { build, subBuild }
})

/** 执行建造配方 */
function onBuildRecipe(recipeId: string): void {
  game.value.executeBuildRecipe(recipeId)
}

/** 执行建筑升级 */
function onUpgradeBuild(buildId: string, targetSubBuildId: string): void {
  game.value.executeUpgradeBuild(buildId, targetSubBuildId)
}

/** 进入建筑交互模式 */
function onEnterBuilding(buildId: string): void {
  // 重置建筑内的子模式状态
  restMode.value = false
  recipeMode.value = null
  storeMode.value = false
  game.value.enterBuilding(buildId)
}

/** 打开营地建筑界面 */
function onOpenCampsite(): void {
  game.value.openCampsitePanel()
}

/** 关闭营地建筑界面，返回场景 */
function onCloseCampsite(): void {
  game.value.closeCampsitePanel()
}

/** 营地功能按钮：直接进入对应功能的实际界面 */
function onCampsiteFunction(fn: CampsiteFunction): void {
  // event 类型直接进入事件（不进入建筑交互模式）
  if (fn.interactionType === 'event') {
    if (fn.eventId) onEnterEventFromEntry(fn.eventId)
    return
  }
  // 其余类型：进入提供该功能的建筑，并打开对应子界面
  restMode.value = false
  recipeMode.value = null
  storeMode.value = false
  repairMode.value = false
  game.value.enterBuilding(fn.buildId)
  switch (fn.interactionType) {
    case 'craft':
      recipeMode.value = 'craft'
      recipeDeviceLevel.value = fn.buildLevel
      break
    case 'cook':
      recipeMode.value = 'cook'
      recipeDeviceLevel.value = fn.buildLevel
      break
    case 'rest':
      restMode.value = true
      resetButton.value = fn.interaction
      break
    case 'store':
      storeMode.value = true
      break
    case 'repair':
      repairMode.value = true
      break
  }
}

/** 退出建筑交互模式 */
function onExitBuilding(): void {
  restMode.value = false
  recipeMode.value = null
  storeMode.value = false
  game.value.exitBuilding()
}

/** 拆除建筑 */
function onDismantleBuilding(buildId: string): void {
  game.value.executeDeconstruct(buildId)
}

/** 维修建筑（由 useGame 检查材料、消耗并提示） */
function onRepairBuilding(buildId: string): void {
  game.value.repairBuilding(buildId)
}

/** 建筑交互日志 */
function onBuildingLog(message: string): void {}

/** 监听结局/CG模式，自动跳转 */
watch(
  () => game.value.state.mode,
  (newMode) => {
    if (newMode === 'ending') {
      router.push({ name: 'ending' })
    } else if (newMode === 'cg') {
      router.push({ name: 'cg' })
    }
  },
)
</script>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: var(--text-primary);
  transition: background 0.6s ease;
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: filter 1.6s ease;
}

/* ═══════════════════════════════════════════════════════════
   纸墨主题令牌（全局根容器层，状态栏与所有子面板共用）
   主题：data-theme = day（浅色纸）/ dusk（黄昏黎明·暗纸）/ night（夜晚·深色纸）
   叠加：data-overlay = none / campsite（营地暖光）/ dungeon（地牢危险）
   ═══════════════════════════════════════════════════════════ */

/* ---- 令牌：白天（默认） ---- */
.game-view {
  /* 墨色 */
  --ink: #000000;
  --ink-mid: #5f5545;
  --ink-weak: #93876f;
  /* 纸面 */
  --paper-root: #efe6d1;
  --narr-top: #f2ebd8;
  --narr-bottom: #ecdfc6;
  --narr-glow: rgba(255, 250, 235, 0.85);
  --panel-bg: linear-gradient(180deg, #eadcc0 0%, #e2d1ae 100%);
  --bar-bg: rgba(226, 213, 182, 0.55);
  --sub-bg: rgba(226, 213, 182, 0.5);
  --card-bg: rgba(255, 252, 242, 0.72);
  --card-hover: #fffdf5;
  --btn-bg: rgba(255, 252, 242, 0.92);
  --prefix-bg: rgba(255, 252, 242, 0.72);
  /* 线条/阴影 */
  --line: rgba(90, 74, 50, 0.2);
  --line-soft: rgba(90, 74, 50, 0.13);
  --shadow: rgba(90, 70, 40, 0.16);
  --shadow-strong: rgba(90, 70, 40, 0.28);
  /* 墨彩强调色 */
  --accent: #4a6a5a;
  --accent-hover: #2f5344;
  --accent-ink: #f5f0e2;
  --accent-bg: rgba(74, 106, 90, 0.08);
  --accent-bg-hover: rgba(74, 106, 90, 0.16);
  --danger: #a64536;
  --danger-bg: rgba(166, 69, 54, 0.06);
  --danger-bg-hover: rgba(166, 69, 54, 0.14);
  --special: #9a6a28;
  --special-bg: rgba(168, 122, 46, 0.06);
  --special-bg-hover: rgba(168, 122, 46, 0.14);
  --madness: #6a4f9e;
  --madness-bg: rgba(106, 79, 158, 0.08);
  --madness-bg-hover: rgba(106, 79, 158, 0.16);
  --link: #2f8a5f;
  --link-hover: #237a51;
  --prefix-line: #a0804f;
  --recovery: #4a7a6a;
  --rc-suf: #3d7a4f;
  --rc-low: #9a7a28;
  --rc-crit: #a64536;
  /* 质感 */
  --text-shadow: none;
  --grain-opacity: 0.09;
  --grain-blend: multiply;
  --grain-filter: invert(1);
  --stain-opacity: 1;
  --vignette:
    radial-gradient(
      ellipse at center top,
      rgba(90, 70, 40, 0) 45%,
      rgba(90, 70, 40, 0.05) 80%,
      rgba(80, 60, 35, 0.1) 100%
    ),
    radial-gradient(ellipse at center bottom, rgba(90, 70, 40, 0) 45%, rgba(80, 60, 35, 0.06) 75%);
  /* 环境叠加（营地暖光 / 地牢危险），默认透明渐变（不能用 transparent，颜色只能出现在 background 最后一层） */
  --warm-glow: radial-gradient(circle, transparent 0, transparent 100%);
  --danger-tint: radial-gradient(circle, transparent 0, transparent 100%);

  /* 映射到既有变量，子组件无需感知主题 */
  --text-primary: var(--ink);
  --text-secondary: var(--ink-mid);
  --text-muted: var(--ink-weak);
  --accent-dim: var(--accent-bg);
  --border-weak: var(--line-soft);
  --border-mid: var(--line);
}

/* ---- 令牌：黄昏/黎明（暗纸） ---- */
.game-view[data-theme='dusk'] {
  --ink: #efe6d2;
  --ink-mid: #c4b59b;
  --ink-weak: #a2917a;
  --paper-root: #382b1a;
  --narr-top: #3f3120;
  --narr-bottom: #2f2414;
  --narr-glow: rgba(255, 190, 110, 0.1);
  --panel-bg: linear-gradient(180deg, #392c1b 0%, #2e2314 100%);
  --bar-bg: rgba(0, 0, 0, 0.14);
  --sub-bg: rgba(0, 0, 0, 0.18);
  --card-bg: rgba(255, 240, 210, 0.05);
  --card-hover: rgba(255, 240, 210, 0.09);
  --btn-bg: rgba(255, 240, 210, 0.06);
  --prefix-bg: rgba(255, 238, 205, 0.06);
  --line: rgba(233, 215, 178, 0.14);
  --line-soft: rgba(233, 215, 178, 0.08);
  --shadow: rgba(0, 0, 0, 0.3);
  --shadow-strong: rgba(0, 0, 0, 0.45);
  --accent: #7fb0a8;
  --accent-hover: #9cc8c0;
  --accent-ink: #101410;
  --accent-bg: rgba(127, 176, 168, 0.12);
  --accent-bg-hover: rgba(127, 176, 168, 0.22);
  --danger: #d98a72;
  --danger-bg: rgba(217, 138, 114, 0.1);
  --danger-bg-hover: rgba(217, 138, 114, 0.2);
  --special: #d9b878;
  --special-bg: rgba(217, 184, 120, 0.1);
  --special-bg-hover: rgba(217, 184, 120, 0.2);
  --madness: #b39ddb;
  --madness-bg: rgba(179, 157, 219, 0.12);
  --madness-bg-hover: rgba(179, 157, 219, 0.22);
  --link: #9ad8ca;
  --link-hover: #b8e8dc;
  --prefix-line: #c9a86a;
  --recovery: #7fb0a8;
  --rc-suf: #7fae8a;
  --rc-low: #c9a86a;
  --rc-crit: #d98a72;
  --text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  --grain-opacity: 0.24;
  --grain-blend: overlay;
  --grain-filter: none;
  --stain-opacity: 0.15;
  --vignette:
    radial-gradient(
      ellipse at center top,
      rgba(0, 0, 0, 0) 30%,
      rgba(0, 0, 0, 0.16) 65%,
      rgba(0, 0, 0, 0.28) 100%
    ),
    radial-gradient(ellipse at center bottom, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.12) 60%);
}

/* ---- 令牌：夜晚（深色纸，更压抑） ---- */
.game-view[data-theme='night'] {
  --ink: #d8cfbb;
  --ink-mid: #b0a68f;
  --ink-weak: #8b8070;
  --paper-root: #100c08;
  --narr-top: #151009;
  --narr-bottom: #0d0a06;
  --narr-glow: transparent;
  --panel-bg: linear-gradient(180deg, #14100a 0%, #0c0906 100%);
  --bar-bg: rgba(0, 0, 0, 0.25);
  --sub-bg: rgba(0, 0, 0, 0.3);
  --card-bg: rgba(240, 230, 210, 0.04);
  --card-hover: rgba(240, 230, 210, 0.08);
  --btn-bg: rgba(240, 230, 210, 0.05);
  --prefix-bg: rgba(240, 230, 210, 0.05);
  --line: rgba(220, 205, 180, 0.1);
  --line-soft: rgba(220, 205, 180, 0.06);
  --shadow: rgba(0, 0, 0, 0.4);
  --shadow-strong: rgba(0, 0, 0, 0.55);
  --accent: #6fa39a;
  --accent-hover: #8ab8b0;
  --accent-ink: #0c0e0c;
  --accent-bg: rgba(95, 143, 136, 0.12);
  --accent-bg-hover: rgba(95, 143, 136, 0.22);
  --danger: #c47763;
  --danger-bg: rgba(184, 106, 88, 0.1);
  --danger-bg-hover: rgba(184, 106, 88, 0.2);
  --special: #c2a468;
  --special-bg: rgba(184, 154, 96, 0.1);
  --special-bg-hover: rgba(184, 154, 96, 0.2);
  --madness: #a98fd8;
  --madness-bg: rgba(169, 143, 216, 0.12);
  --madness-bg-hover: rgba(169, 143, 216, 0.22);
  --link: #88cdbd;
  --link-hover: #a6e0d0;
  --prefix-line: #a0804f;
  --recovery: #6fa39a;
  --rc-suf: #7fae8a;
  --rc-low: #a0804f;
  --rc-crit: #c47763;
  --text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  --grain-opacity: 0.26;
  --grain-blend: overlay;
  --grain-filter: none;
  --stain-opacity: 0.12;
  --vignette:
    radial-gradient(
      ellipse at center top,
      rgba(0, 0, 0, 0) 22%,
      rgba(0, 0, 0, 0.3) 62%,
      rgba(0, 0, 0, 0.52) 100%
    ),
    radial-gradient(ellipse at center bottom, rgba(0, 0, 0, 0) 22%, rgba(0, 0, 0, 0.22) 58%);
}

/* ---- 环境叠加：营地暖光 / 地牢危险（与主题正交） ---- */
.game-view[data-overlay='campsite'] {
  --warm-glow:
    radial-gradient(ellipse 78% 56% at 50% 74%, rgba(255, 158, 66, 0.3), transparent 70%),
    radial-gradient(ellipse 46% 30% at 50% 102%, rgba(255, 138, 48, 0.2), transparent 75%);
}

.game-view[data-overlay='dungeon'] {
  --danger-tint:
    radial-gradient(ellipse 46% 40% at 12% 0%, rgba(196, 32, 24, 0.3), transparent 70%),
    radial-gradient(ellipse 46% 40% at 88% 0%, rgba(196, 32, 24, 0.3), transparent 70%),
    radial-gradient(ellipse 32% 22% at 0% -4%, rgba(216, 44, 32, 0.38), transparent 75%),
    radial-gradient(ellipse 32% 22% at 100% -4%, rgba(216, 44, 32, 0.38), transparent 75%);
}

.placeholder-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 16px;
}

/* ---- 面板覆盖层 ---- */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: #12122a;
}

/* ═══════════════════════════════════════════════════════════
   SAN 异常效果（data-san：0 正常 ~ 4 极度）
   文本异常由 ScenePanel/EventPanel 内的 CorruptText 承担；
   此处负责内容区整体滤镜、晃动与覆盖层（噪点/边缘变形/划痕）
   ═══════════════════════════════════════════════════════════ */

/* 档位 1：轻微——内容区无特效（仅保留覆盖层） */
.game-view[data-san='1'] .main-content {
  filter: none;
}

/* 档位 2：明显——整体色温微偏移（原档 1） */
.game-view[data-san='2'] .main-content {
  filter: contrast(0.985) saturate(1.03) hue-rotate(-2deg);
}

/* 档位 3：混乱——色偏加重 + 轻微晃动（原档 2） */
.game-view[data-san='3'] .main-content {
  filter: contrast(1.05) saturate(1.12) hue-rotate(-6deg);
  animation: san-shake-soft 15s infinite;
}

/* 档位 4：极度——重色偏 + 晃动（关闭扭曲） */
.game-view[data-san='4'] .main-content {
  filter: contrast(1.1) saturate(1.26) hue-rotate(-12deg);
  animation: san-shake-soft 8s infinite;
}

/* 晃动动画（轻/重两档，仅作用于内容区） */
@keyframes san-shake-soft {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  20% {
    transform: translate(0.6px, -0.6px) rotate(-0.08deg);
  }
  40% {
    transform: translate(-0.6px, 0.4px) rotate(0.06deg);
  }
  60% {
    transform: translate(0.4px, 0.6px) rotate(-0.05deg);
  }
  80% {
    transform: translate(-0.5px, -0.4px) rotate(0.07deg);
  }
}

@keyframes san-shake-hard {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  15% {
    transform: translate(-1.6px, 1.2px) rotate(-0.25deg);
  }
  30% {
    transform: translate(1.4px, -1.6px) rotate(0.2deg);
  }
  45% {
    transform: translate(-1.2px, -1px) rotate(-0.15deg);
  }
  60% {
    transform: translate(1.6px, 1.4px) rotate(0.22deg);
  }
  80% {
    transform: translate(-1px, 0.8px) rotate(-0.12deg);
  }
}

/* ---- SAN 覆盖层（pointer-events: none，不挡操作） ---- */
.san-overlay {
  position: absolute;
  inset: 0;
  z-index: 80;
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
  transition: opacity 1.2s ease;
}

.game-view[data-san='1'] .san-overlay {
  opacity: 0.09;
}
.game-view[data-san='2'] .san-overlay {
  opacity: 0.18;
}
.game-view[data-san='3'] .san-overlay {
  opacity: 0.32;
}
.game-view[data-san='4'] .san-overlay {
  opacity: 0.5;
}

/* 噪点层：低频闪烁颗粒（基础透明度由 --noise-scale 按档位缩放） */
.san-noise {
  position: absolute;
  inset: -10%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 240px 240px;
  mix-blend-mode: overlay;
  animation: san-noise-jitter 0.8s steps(2) infinite;
}

.game-view[data-san='1'] .san-noise {
  --noise-scale: 0;
}
.game-view[data-san='2'] .san-noise {
  --noise-scale: 0.15;
}
.game-view[data-san='3'] .san-noise {
  --noise-scale: 0.6;
}
.game-view[data-san='4'] .san-noise {
  --noise-scale: 1;
}

@keyframes san-noise-jitter {
  0% {
    transform: translate(0, 0);
    opacity: calc(0.5 * var(--noise-scale, 1));
  }
  50% {
    transform: translate(-4px, 3px);
    opacity: calc(0.4 * var(--noise-scale, 1));
  }
  100% {
    transform: translate(3px, -4px);
    opacity: calc(0.6 * var(--noise-scale, 1));
  }
}

/* 边缘变形层：暗角呼吸 + 边缘波动 */
.san-vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.4) 100%),
    radial-gradient(ellipse at 50% 0%, transparent 70%, rgba(0, 0, 0, 0.3) 100%);
  animation: san-vignette-breathe 4.5s ease-in-out infinite;
}

@keyframes san-vignette-breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.04);
    opacity: 1;
  }
}

/* 划痕层：横向撕裂线（档位 3+） */
.san-scratch {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    96deg,
    transparent 0 42%,
    rgba(255, 255, 255, 0.05) 42% 42.4%,
    transparent 42.4% 71%,
    rgba(0, 0, 0, 0.12) 71% 71.3%,
    transparent 71.3%
  );
  mix-blend-mode: overlay;
  animation: san-scratch-slide 7s linear infinite;
}

@keyframes san-scratch-slide {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

/* 隐藏 SVG 滤镜定义容器 */
.san-svg-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
</style>
