import { createRouter, createWebHistory } from 'vue-router'
import TitleScreen from '../screens/TitleScreen.vue'
import GameShell from '../screens/GameShell.vue'
import EndingScreen from '../screens/EndingScreen.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: TitleScreen,
    },
    {
      path: '/play',
      name: 'play',
      component: GameShell,
    },
    {
      path: '/ending/:id',
      name: 'ending',
      component: EndingScreen,
    },
  ],
})

export default router