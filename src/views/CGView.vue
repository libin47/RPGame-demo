<!-- CGView.vue - CG过场视图
     显示CG帧序列：文字 + 背景图 -->
<template>
  <div class="cg-view" :style="cgBackgroundStyle">
    <!-- CG文本内容 -->
    <div class="cg-text-container" :class="{ 'with-options': visibleOptions.length > 0 }">
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

    <!-- CG选项列表 -->
    <div v-if="visibleOptions.length > 0" class="cg-options">
      <button
        v-for="opt in visibleOptions"
        :key="opt.id"
        type="button"
        class="cg-option"
        :class="cgOptionBtnClass(opt)"
        :disabled="!isOptionAvailable(opt)"
        :title="isOptionAvailable(opt) ? undefined : (opt.unavailableTooltip ?? '')"
        @click="onSelectOption(opt)"
      >
        {{ resolveOptionName(opt) }}
      </button>
    </div>

    <!-- 点击提示/跳过按钮（存在选项时不显示，避免误触跳过选择） -->
    <div v-if="visibleOptions.length === 0" class="cg-controls" @click="onNextFrame">
      <span class="click-hint">{{ isLastFrame ? '点击结束' : '点击继续' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getGameInstance } from '@/runtime/gameInstance'
import type { CGText, CGOption } from '@/types/cg'
import { getVisibleCGOptions, evaluateConditions } from '@/engine'

const router = useRouter()
const game = getGameInstance()

/** 当前CG播放状态 */
const cgState = computed(() => game?.state.currentCG ?? null)

/** 当前帧的文本列表 */
const currentTexts = computed(() => {
  if (!cgState.value) return []
  return cgState.value.currentFrame.texts ?? []
})

/** 当前帧可见选项（按配置列表顺序） */
const visibleOptions = computed<CGOption[]>(() => {
  if (!cgState.value) return []
  const player = game?.state.player
  if (!player) return []
  return getVisibleCGOptions(cgState.value.currentFrame, player)
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

/** 解析选项显示文本（支持 name 文本变体） */
function resolveOptionName(opt: CGOption): string {
  if (typeof opt.name === 'string') return opt.name
  const variants = opt.name
  if (!variants || variants.length === 0) return ''
  const player = game?.state.player
  const matched = player
    ? variants.find((v) => evaluateConditions(v.displayCondition, player))
    : undefined
  return matched?.content ?? variants[0]?.content ?? ''
}

/** 选项是否可用 */
function isOptionAvailable(opt: CGOption): boolean {
  if (!game) return true
  return evaluateConditions(opt.availableCondition, game.state.player)
}

/** 选项按钮样式类 */
function cgOptionBtnClass(opt: CGOption): string {
  const style = opt.buttonStyle
  if (style === 'danger' || style === 'madness') return 'btn-danger'
  if (style === 'primary') return 'btn-primary'
  if (style === 'special') return 'btn-special'
  return 'btn-default'
}

/** 推进到下一帧或结束CG */
function onNextFrame(): void {
  if (!game) return

  if (isLastFrame.value) {
    // CG结束，返回游戏场景
    endCG()
  } else {
    game.advanceCG()
  }
}

/** 选择CG选项 */
function onSelectOption(opt: CGOption): void {
  if (!game) return
  game.selectCGOption(opt.id)

  // 选项导致CG结束/切换模式时，离开CG视图
  if (game.state.mode !== 'cg') {
    if (game.state.mode === 'ending') {
      router.push({ name: 'ending' })
    } else {
      router.push({ name: 'game' })
    }
  }
}

/** 结束CG（由 useGame 统一变更状态） */
function endCG(): void {
  if (!game) return
  game.endCG()
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

.cg-text-container.with-options {
  margin-bottom: 140px;
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

.cg-options {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 800px;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
}

.cg-option {
  padding: 10px 28px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 15px;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.cg-option:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.cg-option:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cg-option.btn-primary {
  border-color: rgba(78, 205, 196, 0.6);
  color: var(--accent, #4ecdc4);
}

.cg-option.btn-primary:hover:not(:disabled) {
  background: rgba(78, 205, 196, 0.18);
}

.cg-option.btn-danger {
  border-color: rgba(255, 107, 107, 0.6);
  color: #ff6b6b;
}

.cg-option.btn-danger:hover:not(:disabled) {
  background: rgba(255, 107, 107, 0.18);
}

.cg-option.btn-special {
  border-color: rgba(255, 213, 79, 0.6);
  color: #ffd54f;
}

.cg-option.btn-special:hover:not(:disabled) {
  background: rgba(255, 213, 79, 0.18);
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
