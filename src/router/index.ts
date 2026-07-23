// src/router/index.ts
// Vue Router 路由配置，定义页面路径与视图组件的映射关系

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainMenuView from '@/views/MainMenuView.vue'
import GameView from '@/views/GameView.vue'
import CGView from '@/views/CGView.vue'
import EndingView from '@/views/EndingView.vue'

/** 路由表 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'mainMenu',
    component: MainMenuView,
    meta: { title: '蚀岛 - 主菜单' },
  },
  {
    path: '/game',
    name: 'game',
    component: GameView,
    meta: { title: '蚀岛' },
  },
  {
    path: '/cg',
    name: 'cg',
    component: CGView,
    meta: { title: '蚀岛' },
  },
  {
    path: '/ending',
    name: 'ending',
    component: EndingView,
    meta: { title: '蚀岛 - 结局' },
  },
]

/** Vue Router 实例 */
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
