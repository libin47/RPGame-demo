// src/main.ts
// 应用入口：初始化配置注册表、创建 Vue 应用、挂载路由

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initRegistry } from './engine'

// 初始化游戏配置注册表（必须在任何组件使用前调用）
initRegistry()

const app = createApp(App)

// 挂载路由
app.use(router)

app.mount('#app')
