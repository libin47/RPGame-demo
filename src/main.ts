// src/main.ts

import { createApp } from 'vue'
import App from './App.vue'
import { initRegistry, createNewPlayerState } from './engine'
import { getRegistry } from './engine'

// 初始化配置
initRegistry()

const registry = getRegistry()
const defaultClassId = registry.getDefaultClassId()
const classConfig = registry.getCharacterClass(defaultClassId)

if (!classConfig) {
  throw new Error(`默认职业 ${defaultClassId} 未找到`)
}

// 创建初始玩家状态
const playerState = createNewPlayerState(classConfig, {
  classId: defaultClassId,
  playerName: '幸存者',
  initialMapId: registry.getInitialMapId(),
  initialSceneId: registry.getInitialSceneId(),
  initialSubSceneId: registry.getInitialSubSceneId(),
  initialDay: registry.getInitialDay(),
  initialTimeMinutes: registry.getInitialTimeMinutes(),
  initialSeason: registry.getInitialSeason(),
  initialSeasonPhase: registry.getInitialSeasonPhase(),
  initialWeatherId: registry.getInitialWeatherId(),
  initialCorruption: registry.getInitialCorruption(),
})

// 挂载应用
const app = createApp(App, {
  playerState,
})

app.mount('#app')