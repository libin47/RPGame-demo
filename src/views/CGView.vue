<!-- CGView.vue - CG过场视图
     显示CG帧序列：文字 + 背景图 -->
<template>
  <div class="cg-view" :style="cgBackgroundStyle">
    <!-- CG文本内容 -->
    <div class="cg-text-container">
      <transition-group name="cg-fade">
        <div
          v-for="(text, idx) in currentTexts"
          :key="`text-${idx}`"
          class="cg-text-line"
          :style="textStyle(text.style)"
        >
          {{ text.content }}
        </div>
      </transition-group>
    </div>

    <!-- 点击提示/跳过按钮 -->
    <div class="cg-controls" @click="onNextFrame">
      <span class="click-hint">{{ isLastFrame ? '点击结束' : '点击继续' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getGameInstance } from '@/runtime/gameInstance'
import { nextCGFrame } from '@/engine'
import type { CGText } from '@/types/cg'

const router = useRouter()
const game = getGameInstance()

/** 当前CG播放状态 */
const cgState = computed(() => game?.state.currentCG ?? null)

/** 当前帧的文本列表 */
const currentTexts = computed(() => {
  if (!cgState.value) return []
  return cgState.value.currentFrame.texts ?? []
})

/** 是否最后一帧 */
const isLastFrame = computed(() => {
  if (!cgState.value) return false
  return cgState.value.currentFrameIndex >= cgState.value.scene.frames.length - 1
})

/** CG背景样式 */
const cgBackgroundStyle = computed(() => {
  if (!cgState.value) return {}
  const bgImage = cgState.value.currentFrame.backgroundImage
  if (bgImage) {
    return {
      backgroundImage: `url(/images/cg/${bgImage.imageId}.png)`,
      backgroundSize: bgImage.size?.width
        ? `${bgImage.size.width} ${bgImage.size.height}`
        : 'cover',
      backgroundPosition: bgImage.position
        ? `${bgImage.position.x}px ${bgImage.position.y}px`
        : 'center',
    }
  }
  return { backgroundColor: '#000000' }
})

/** 文本样式转换为CSS对象 */
function textStyle(style: CGText['style']): Record<string, string | number> {
  if (!style) return {}
  const css: Record<string, string | number> = {}
  if (style.fontSize) css.fontSize = `${style.fontSize}px`
  if (style.color) css.color = style.color
  if (style.textAlign) css.textAlign = style.textAlign
  if (style.fontWeight) css.fontWeight = style.fontWeight
  if (style.fontStyle) css.fontStyle = style.fontStyle
  if (style.textShadow) css.textShadow = style.textShadow
  if (style.fontFamily) css.fontFamily = style.fontFamily
  return css
}

/** 推进到下一帧或结束CG */
function onNextFrame(): void {
  if (!game) return
  const state = game.state.currentCG
  if (!state) return

  if (isLastFrame.value) {
    // CG结束，返回游戏场景
    endCG()
  } else {
    nextCGFrame(state)
  }
}

/** 结束CG */
function endCG(): void {
  if (!game) return
  // 清除CG状态，返回正常模式
  const state = game.state as { mode: string; currentCG: unknown }
  state.mode = 'normal'
  state.currentCG = null
  router.push({ name: 'game' })
}
</script>

<style scoped>
.cg-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 100vw;
  height: 100vh;
  background: #000;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  user-select: none;
}

.cg-text-container {
  width: 100%;
  max-width: 800px;
  padding: 40px;
  margin-bottom: 60px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.cg-text-line {
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.cg-fade-enter-active,
.cg-fade-leave-active {
  transition: opacity 0.5s ease;
}

.cg-fade-enter-from,
.cg-fade-leave-to {
  opacity: 0;
}

.cg-controls {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}

.cg-controls:hover {
  color: rgba(255, 255, 255, 0.8);
}
</style>
