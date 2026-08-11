<!-- RestPanel.vue - 休息面板
     选择休息时长，点击后执行休息并返回场景
     视觉风格与 RecipePanel 保持一致 -->
<template>
  <div class="rest-panel">
    <!-- 头部 -->
    <div class="rp-header">
      <h2 class="rp-title">休息</h2>
      
      
    </div>
    <h2 class="rp-title-text">{{ resetButton?.restDescription }}</h2>

    <div class="rp-body">
      <!-- <h2 class="rp-title-text">{{ resetButton.restDescription }}</h2> -->
      <!-- 休息时长列表 -->
      <div class="rest-list">
        <div v-for="opt in restOptions" :key="opt.hours" class="rest-card">
          <!-- 左侧信息 -->
          <div class="rest-info">
            <span class="rest-icon">🛏</span>
            <div class="rest-text">
              <span class="rest-name">{{ opt.label }}</span>
              <span class="rest-desc">{{ opt.desc }}</span>
            </div>
          </div>
          <!-- 右侧操作 -->
          <button class="rest-btn" @click="$emit('rest', opt.hours, props.resetButton)">休息</button>
        </div>
      </div>

      <!-- 返回按钮 -->
      <button class="btn-return" @click="$emit('back')">返回</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { buildOption } from '@/types/build';

const props = defineProps<{
  /** 休息按钮选项 */
  resetButton: buildOption | undefined
}>()
/**
 * 休息选项列表
 * hours：休息时长（小时）
 * recovery：预计恢复的体力值（沿用建筑休息公式：每 10 分钟恢复 1 点体力）
 */
interface RestOption {
  hours: number
  label: string
  desc: string
}

const restOptions: RestOption[] = [
  { hours: 1, label: '休息 1 小时', desc: `小憩片刻。` },
  { hours: 2, label: '休息 2 小时', desc: `运气好的话，应该能做一个小小美梦。` },
  { hours: 4, label: '休息 4 小时', desc: `休息 4 小时，预计恢复约 ${Math.round(240 / 10)} 点体力。` },
  { hours: 8, label: '休息 8 小时', desc: `休息 8 小时，预计恢复约 ${Math.round(480 / 10)} 点体力。` },
]

defineEmits<{
  /** 点击休息 X 小时 */
  (e: 'rest', hours: number, option: buildOption | undefined): void
  /** 返回建筑详情 */
  (e: 'back'): void
}>()
</script>

<style scoped>
.rest-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: var(--panel-bg);
  font-family: 'FangSong', 'STFangsong', 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
}

/* ---- 头部（与 RecipePanel 一致） ---- */
.rp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid var(--border-weak);
  background: var(--bar-bg);
}

.rp-title {
  margin: 0;
  font-size: var(--font-lg);
  color: var(--text-primary);
  
}

.rp-title-text {
  margin: 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
  padding: 0.1rem 1.2rem;
  background: var(--bar-bg);
}

/* ---- 内容区 ---- */
.rp-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.2rem;
}

/* ---- 休息列表 ---- */
.rest-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* 卡片：水平布局 */
.rest-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  transition: all var(--transition-fast);
}

.rest-card:hover {
  border-color: rgba(165, 214, 167, 0.4);
  background: var(--card-hover);
}

/* 左侧信息 */
.rest-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.rest-icon {
  font-size: 1.4rem;
  line-height: 1;
  flex-shrink: 0;
}

.rest-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.rest-name {
  font-weight: bold;
  color: var(--text-primary);
  white-space: nowrap;
}

.rest-desc {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

/* 右侧休息按钮 */
.rest-btn {
  flex-shrink: 0;
  padding: 0.4rem 1rem;
  border: 1px solid rgba(165, 214, 167, 0.4);
  border-radius: var(--radius-md);
  background: rgba(165, 214, 167, 0.1);
  color: #a5d6a7;
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.rest-btn:hover {
  background: rgba(165, 214, 167, 0.22);
  box-shadow: 0 0 10px rgba(165, 214, 167, 0.1);
}

.rest-btn:active {
  transform: scale(0.97);
}

/* ---- 底部返回按钮（与 RecipePanel 一致） ---- */
.btn-return {
  display: block;
  width: 100%;
  padding: 0.6rem 1rem;
  margin-top: 0.8rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: var(--btn-bg);
  color: var(--text-secondary);
  font-size: var(--font-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.btn-return:hover {
  background: var(--card-hover);
  color: var(--text-primary);
}
</style>
