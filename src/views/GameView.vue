<!-- GameView.vue - 游戏主视图
     组合 StatusBar（三行）+ ScenePanel/EventPanel/BattlePanel
     背景色随时间段变化 -->
<template>
  <div class="game-view" :style="{ background: backgroundColor }">
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
      <!-- 场景模式 -->
      <ScenePanel
        v-if="game.state.mode === 'normal'"
        :description-config="game.state.currentDescriptionConfig"
        :scene="currentSceneForPanel"
        :campsite-buildings="game.getCampsiteBuildings()"
        :is-campsite="!!game.state.currentSubScene?.isCampsite"
        :scene-text-prefix="game.state.sceneTextPrefix"
        :scene-text-after="game.state.sceneTextAfter"
        :background-color="backgroundColor"
        :player-state="game.state.player"
        :expanded-category="expandedCategory"
        :is-event-clicked="isEventClicked"
        @update:expanded-category="expandedCategory = $event"
        @enter-event="onEnterEventFromEntry"
        @explore="onExplore"
        @build="onBuild"
        @collect="onCollect"
        @scene-interaction="onSceneInteraction"
        @move="onMoveAction"
        @character="onCharacter"
        @enter-building="onEnterBuilding"
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
      <EventPanel
        v-else-if="game.state.mode === 'event' && game.state.currentFrame"
        :frame="game.state.currentFrame"
        :resolved-text="resolvedFrameText"
        :frame-text-prefix="game.state.frameTextPrefix"
        :options="visibleEventOptions"
        :variations="visibleEventVariations"
        :option-availability="optionAvailability"
        @select-option="game.selectEventOption"
      />

      <!-- 战斗模式 -->
      <BattlePanel
        v-else-if="game.state.mode === 'battle' && game.state.currentBattle"
        :enemies="game.state.currentBattle.enemies"
        :logs="game.state.currentBattle.logs"
        @action="onBattleAction"
      />

      <!-- 建造模式 -->
      <BuildPanel
        v-else-if="game.state.mode === 'build'"
        :sub-scene="game.state.currentSubScene"
        :player-state="game.state.player"
        @close="game.exitBuildMode()"
        @build="onBuildRecipe"
        @upgrade="onUpgradeBuild"
      />

      <!-- 建筑交互模式 - 配方子模式 -->
      <RecipePanel
        v-else-if="game.state.mode === 'building' && recipeMode"
        :mode="recipeMode"
        :device-level="recipeDeviceLevel"
        :player-state="game.state.player"
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
        @log="onBuildingLog"
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
      />

      <!-- 其他模式（占位提示） -->
      <div v-else class="placeholder-panel">
        <p>此功能尚未实现</p>
      </div>
    </div>

    <!-- 底部消息栏 -->
    <div class="bottom-message" v-if="game.state.logMessage">
      <span class="log-text">{{ game.state.logMessage }}</span>
    </div>

    <!-- 系统菜单（保存/读档） -->
    <SystemMenu v-if="uiState.showSettings" @close="uiState.showSettings = false" />

    <!-- 属性面板覆盖层 -->
    <div v-if="uiState.showAttributes" class="panel-overlay">
      <AttributesPanel :player-state="game.state.player" @close="uiState.showAttributes = false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatusBar from '@/components/StatusBar.vue'
import ScenePanel from '@/components/ScenePanel.vue'
import EventPanel from '@/components/EventPanel.vue'
import BattlePanel from '@/components/BattlePanel.vue'
import InventoryPanel from '@/components/InventoryPanel.vue'
import SystemMenu from '@/components/SystemMenu.vue'
import AttributesPanel from '@/components/AttributesPanel.vue'
import BuildPanel from '@/components/BuildPanel.vue'
import BuildingDetail from '@/components/BuildingDetail.vue'
import RecipePanel from '@/components/RecipePanel.vue'
import RestPanel from '@/components/RestPanel.vue'
import StorePanel from '@/components/StorePanel.vue'
import { PlayerActionType, getTimeOfDay, getRegistry } from '@/engine'
import { getVisibleOptions, getVisibleVariations, isOptionAvailable } from '@/engine'
import { getGameInstance } from '@/runtime/gameInstance'
import type { GameInstance } from '@/runtime/gameInstance'
import { useUI } from '@/runtime/useUI'
import type { ButtonOption } from '@/types/option'
import type { buildOption } from '@/types/build'

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

function onRecipeExecute(result: import('@/engine').CraftResult): void {
  if (result.success && result.timeUsed > 0) {
    game.value.advanceGameTime(result.timeUsed)
  }
  game.value.setLogMessage(result.message)
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

/** 描述中事件是否点击 */
const isEventClicked = ref(false)

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
  isEventClicked.value = true
}

function onBattleAction(actionType: PlayerActionType): void {
  if (actionType === PlayerActionType.BATTLE_SKILL) {
    game.value.executeBattleAction(PlayerActionType.BATTLE_SKILL, 'basic_attack')
  } else {
    game.value.executeBattleAction(actionType)
  }
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
  isEventClicked.value = false
  game.value.handleExplore(explore)
}

/** 建造 */
function onBuild(): void {
  isEventClicked.value = false
  game.value.handleBuild()
}

/** 资源采集/战斗 */
function onCollect(collect: import('@/types/scene').ResourceInteraction): void {
  game.value.handleCollect(collect)
}

/** 场景交互（代替旧的 @interaction） */
function onSceneInteraction(interactionId: string): void {
  game.value.handleInteraction(interactionId)
}

/** 移动 */
function onMoveAction(moveAction: import('@/types/scene').MoveInteraction): void {
  
  isEventClicked.value = false
  game.value.handleSceneMove(moveAction)
}

/** 人物交互（暂未实现） */
function onCharacter(char: import('@/types/scene').CharacterInteraction): void {
  game.value.setLogMessage(`与 ${char.name} 交互 - 功能开发中`)
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

/** 修理建筑（BuildingDetail 内部已完成消耗，这里仅处理日志） */
function onRepairBuilding(_buildId: string): void {
  // 实际维修逻辑在 BuildingDetail 内部完成
  console.log('修理建筑', _buildId)
}

/** 建筑交互日志 */
function onBuildingLog(message: string): void {
  game.value.setLogMessage(message)
}

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
  color: #e0e0e0;
  transition: background 0.6s ease;
}

.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.placeholder-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 16px;
}

/* ---- 底部消息 ---- */
.bottom-message {
  padding: 3px 12px;
  background: rgba(0, 0, 0, 0.3);
  min-height: 22px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.log-text {
  font-size: 12px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
</style>
