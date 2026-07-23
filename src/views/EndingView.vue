<!-- EndingView.vue - 结局展示视图
     显示触发的结局名称、描述、原因等 -->
<template>
  <div class="ending-view">
    <div v-if="ending" class="ending-content">
      <!-- 结局评级 -->
      <div class="ending-rank" :class="`rank-${ending.rank.toLowerCase()}`">
        {{ ending.rank }}
      </div>

      <!-- 结局名称 -->
      <h1 class="ending-title">{{ ending.name }}</h1>

      <!-- 结局描述 -->
      <p class="ending-description">{{ ending.description }}</p>

      <!-- 结局触发原因 -->
      <p class="ending-reason">— {{ reasonText }} —</p>
    </div>

    <div v-else class="ending-empty">
      <p>未检测到结局数据</p>
    </div>

    <!-- 操作按钮 -->
    <div class="ending-actions">
      <button class="action-btn" @click="goBackToMenu">返回主菜单</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getGameInstance } from '@/runtime/gameInstance'
import type { EndingConfig } from '@/types/ending'

const router = useRouter()

/** 获取当前游戏实例中的结局信息 */
const game = getGameInstance()
const ending = computed<EndingConfig | null>(() => {
  return game?.state.currentEnding ?? null
})

/** 触发原因文本 */
const reasonText = computed<string>(() => {
  return game?.state.endingReason ?? ''
})

/** 返回主菜单 */
function goBackToMenu(): void {
  // 清除当前游戏实例
  // (通过路由跳转后，GameView 守卫会自动检测实例是否存在)
  router.push({ name: 'mainMenu' })
}
</script>

<style scoped>
.ending-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%);
  color: #e0e0e0;
  padding: 40px;
  text-align: center;
}

.ending-content {
  max-width: 600px;
}

.ending-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 24px;
  animation: rankGlow 2s ease-in-out infinite alternate;
}

.rank-s {
  color: #ffd700;
  border: 3px solid #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}

.rank-a {
  color: #ff6b6b;
  border: 3px solid #ff6b6b;
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
}

.rank-b {
  color: #64b5f6;
  border: 3px solid #64b5f6;
  box-shadow: 0 0 20px rgba(100, 181, 246, 0.4);
}

.rank-c {
  color: #aed581;
  border: 3px solid #aed581;
  box-shadow: 0 0 20px rgba(174, 213, 129, 0.4);
}

.rank-d {
  color: #ce93d8;
  border: 3px solid #ce93d8;
  box-shadow: 0 0 20px rgba(206, 147, 216, 0.4);
}

.rank-e {
  color: #888;
  border: 3px solid #666;
  box-shadow: 0 0 20px rgba(100, 100, 100, 0.3);
}

@keyframes rankGlow {
  from {
    transform: scale(1);
    opacity: 0.8;
  }
  to {
    transform: scale(1.1);
    opacity: 1;
  }
}

.ending-title {
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 20px;
  letter-spacing: 4px;
}

.ending-description {
  font-size: 16px;
  line-height: 1.8;
  color: #c0c0c0;
  margin-bottom: 16px;
}

.ending-reason {
  font-size: 13px;
  color: #888;
  font-style: italic;
}

.ending-empty {
  color: #666;
  font-size: 16px;
}

.ending-actions {
  margin-top: 40px;
}

.action-btn {
  padding: 10px 32px;
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  background: #1e1e3a;
  color: #c0c0c0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #2a2a4a;
  border-color: #5a5a8a;
  color: #fff;
}
</style>
