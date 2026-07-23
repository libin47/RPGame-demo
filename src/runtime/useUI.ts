// src/runtime/useUI.ts
// UI 状态管理：面板开关、弹窗、日志提示

import { reactive } from 'vue'

/** UI 状态接口 */
export interface UIState {
  /** 是否显示背包面板 */
  showInventory: boolean

  /** 是否显示系统菜单（保存/读档） */
  showSettings: boolean

  /** 是否显示属性面板 */
  showAttributes: boolean

  /** 是否显示建造面板 */
  showBuild: boolean

  /** 是否显示制作面板 */
  showCraft: boolean

  /** 是否显示地图面板 */
  showMap: boolean

  /** 是否显示交易面板 */
  showTrade: boolean

  /** 物品详情弹窗（null=关闭） */
  itemDetail: { instanceId: string; itemId: string } | null
}

/** 创建 UI 状态（响应式） */
function createUIState(): UIState {
  return reactive<UIState>({
    showInventory: false,
    showSettings: false,
    showAttributes: false,
    showBuild: false,
    showCraft: false,
    showMap: false,
    showTrade: false,
    itemDetail: null,
  })
}

/**
 * 使用 UI 状态
 */
export function useUI() {
  const uiState = createUIState()

  /** 切换背包面板 */
  function toggleInventory(): void {
    uiState.showInventory = !uiState.showInventory
  }

  /** 切换系统菜单 */
  function toggleSettings(): void {
    uiState.showSettings = !uiState.showSettings
  }

  /** 切换属性面板 */
  function toggleAttributes(): void {
    uiState.showAttributes = !uiState.showAttributes
  }

  /** 切换建造面板 */
  function toggleBuild(): void {
    uiState.showBuild = !uiState.showBuild
  }

  /** 切换制作面板 */
  function toggleCraft(): void {
    uiState.showCraft = !uiState.showCraft
  }

  /** 切换地图面板 */
  function toggleMap(): void {
    uiState.showMap = !uiState.showMap
  }

  /** 切换交易面板 */
  function toggleTrade(): void {
    uiState.showTrade = !uiState.showTrade
  }

  /** 关闭所有面板 */
  function closeAllPanels(): void {
    uiState.showInventory = false
    uiState.showSettings = false
    uiState.showAttributes = false
    uiState.showBuild = false
    uiState.showCraft = false
    uiState.showMap = false
    uiState.showTrade = false
    uiState.itemDetail = null
  }

  /** 打开物品详情弹窗 */
  function showItemDetail(instanceId: string, itemId: string): void {
    uiState.itemDetail = { instanceId, itemId }
  }

  /** 关闭物品详情弹窗 */
  function closeItemDetail(): void {
    uiState.itemDetail = null
  }

  return {
    uiState,
    toggleInventory,
    toggleSettings,
    toggleAttributes,
    toggleBuild,
    toggleCraft,
    toggleMap,
    toggleTrade,
    closeAllPanels,
    showItemDetail,
    closeItemDetail,
  }
}
