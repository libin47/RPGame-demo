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
      @open-settings="onOpenSettings"
      @open-inventory="onOpenInventory"
      @open-attributes="onOpenAttributes"
    />

    <!-- 主内容区：根据当前模式切换面板 -->
    <div class="main-content">
      <!-- 场景模式 -->
      <ScenePanel
        v-if="game.state.mode === 'normal'"
        :resolved-description="resolvedDescription"
        :description-config="game.state.currentDescriptionConfig"
        :interactions="game.getCurrentInteractions()"
        :background-color="backgroundColor"
        @enter-event="onEnterEventFromEntry"
        @interaction="game.handleInteraction"
      />

      <!-- 事件模式 -->
      <EventPanel
        v-else-if="game.state.mode === 'event' && game.state.currentFrame"
        :frame="game.state.currentFrame"
        :resolved-text="resolvedFrameText"
        :frame-text-prefix="game.state.frameTextPrefix"
        :options="visibleEventOptions"
        @select-option="game.selectEventOption"
      />

      <!-- 战斗模式 -->
      <BattlePanel
        v-else-if="game.state.mode === 'battle' && game.state.currentBattle"
        :enemies="game.state.currentBattle.enemies"
        :logs="game.state.currentBattle.logs"
        @action="onBattleAction"
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

    <!-- 背包面板覆盖层 -->
    <div v-if="uiState.showInventory" class="panel-overlay">
      <InventoryPanel
        :player-state="game.state.player"
        @close="uiState.showInventory = false"
        @use-item="onUseItem"
        @equip-item="onEquipItem"
        @unequip-item="onUnequipItem"
      />
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
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import StatusBar from '@/components/StatusBar.vue'
import ScenePanel from '@/components/ScenePanel.vue'
import EventPanel from '@/components/EventPanel.vue'
import BattlePanel from '@/components/BattlePanel.vue'
import InventoryPanel from '@/components/InventoryPanel.vue'
import SystemMenu from '@/components/SystemMenu.vue'
import AttributesPanel from '@/components/AttributesPanel.vue'
import { PlayerActionType, getTimeOfDay, getRegistry } from '@/engine'
import { getVisibleOptions } from '@/engine'
import { getGameInstance } from '@/runtime/gameInstance'
import type { GameInstance } from '@/runtime/gameInstance'
import { useUI } from '@/runtime/useUI'

const router = useRouter()
const { uiState, toggleInventory, toggleSettings, toggleAttributes } = useUI()
const registry = getRegistry()

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

const resolvedDescription = computed<string>(() => {
  return game.value.resolveText(game.value.state.sceneDescription)
})

const resolvedFrameText = computed<string>(() => {
  if (!game.value.state.currentFrame) return ''
  return game.value.resolveText(game.value.state.currentFrame.text)
})

const visibleEventOptions = computed(() => {
  const frame = game.value.state.currentFrame
  if (!frame) return []
  return getVisibleOptions(frame, game.value.state.player)
})

// ============================================================
// 操作处理
// ============================================================

/** 从场景描述事件入口点击进入事件（传递 fromEventEntry=true） */
function onEnterEventFromEntry(eventId: string): void {
  game.value.enterEvent(eventId, true)
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

/** 打开/关闭背包 */
function onOpenInventory(): void {
  toggleInventory()
}

/** 打开属性面板 */
function onOpenAttributes(): void {
  toggleAttributes()
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
