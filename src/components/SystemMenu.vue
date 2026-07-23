<!-- SystemMenu.vue - 系统菜单（保存/读档）
     半透明遮罩 + 居中卡片，三个存档槽位 -->
<template>
  <div class="system-overlay" @click.self="$emit('close')">
    <div class="system-card">
      <!-- 头部 -->
      <div class="card-header">
        <h2 class="card-title">系统菜单</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- 标签切换 -->
      <div class="tab-bar">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'save' }"
          @click="activeTab = 'save'"
        >
          保存
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'load' }"
          @click="activeTab = 'load'"
        >
          读档
        </button>
      </div>

      <!-- 存档槽位列表 -->
      <div class="slot-list">
        <div
          v-for="(meta, idx) in saveMetas"
          :key="idx"
          class="slot-card"
          :class="{ 'slot-empty': !meta, 'slot-active': activeSlot === idx }"
          @click="activeTab === 'save' ? onSaveSlot(idx) : onLoadSlot(idx)"
        >
          <!-- 槽位编号 -->
          <div class="slot-number">存档 {{ idx + 1 }}</div>

          <!-- 存档信息 -->
          <div v-if="meta" class="slot-info">
            <div class="slot-day">第 {{ meta.day }} 天</div>
            <div class="slot-time">
              {{ String(Math.floor(meta.timeMinutes / 60)).padStart(2, '0') }}:{{
                String(meta.timeMinutes % 60).padStart(2, '0')
              }}
            </div>
            <div class="slot-date">{{ formatDate(meta.savedAt) }}</div>
          </div>

          <!-- 空槽位 -->
          <div v-else class="slot-empty-label">
            {{ activeTab === 'save' ? '空槽位' : '无存档' }}
          </div>

          <!-- 操作按钮 -->
          <div class="slot-action">
            <span v-if="activeTab === 'save'" class="action-hint">
              {{ meta ? '覆盖' : '保存' }}
            </span>
            <span v-else-if="meta" class="action-hint">读取</span>
          </div>
        </div>
      </div>

      <!-- 反馈消息 -->
      <div v-if="feedback" class="feedback" :class="feedbackType">{{ feedback }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { saveGame, loadGame, hasSave, getAllSaveMeta } from '@/runtime/saveManager'
import { getGameInstance, restoreGame } from '@/runtime/gameInstance'
import type { PlayerState } from '@/types/player'
import { useRouter } from 'vue-router'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()

/** 当前激活的标签页 */
const activeTab = ref<'save' | 'load'>('save')

/** 当前操作的槽位索引 */
const activeSlot = ref<number | null>(null)

/** 反馈消息 */
const feedback = ref<string>('')
const feedbackType = ref<'success' | 'error'>('success')

/** 各槽位的存档元数据（使用 ref 手动管理，避免 localStorage 不可响应的问题） */
const saveMetas = ref<ReturnType<typeof getAllSaveMeta>[number][]>([])

/** 刷新存档元数据 */
function refreshMetas(): void {
  saveMetas.value = getAllSaveMeta()
}

onMounted(() => {
  refreshMetas()
})

/** 格式化保存时间 */
function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 提示消息 */
function showFeedback(msg: string, type: 'success' | 'error' = 'success'): void {
  feedback.value = msg
  feedbackType.value = type
  setTimeout(() => {
    feedback.value = ''
  }, 2000)
}

/** 保存 */
function onSaveSlot(slot: number): void {
  const instance = getGameInstance()
  if (!instance) {
    showFeedback('游戏未开始，无法保存', 'error')
    return
  }

  // 保存时需要深拷贝玩家状态快照
  const playerClone: PlayerState = JSON.parse(JSON.stringify(instance.state.player))
  const ok = saveGame(playerClone, slot)
  if (ok) {
    activeSlot.value = slot
    refreshMetas() // 立即刷新槽位显示
    showFeedback(`已保存到存档 ${slot + 1}`)
  } else {
    showFeedback('保存失败，请重试', 'error')
  }
}

/** 读档 */
function onLoadSlot(slot: number): void {
  if (!hasSave(slot)) {
    showFeedback('该槽位没有存档', 'error')
    return
  }

  const playerState = loadGame(slot)
  if (!playerState) {
    showFeedback('读档失败，存档已损坏', 'error')
    return
  }

  // 恢复游戏实例
  restoreGame(playerState)

  // 关闭菜单
  emit('close')

  // 跳转到游戏页面
  router.push({ name: 'game' })
}
</script>

<style scoped>
/* ═══════════════════════════════════════════
   遮罩
   ═══════════════════════════════════════════ */
.system-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

/* ═══════════════════════════════════════════
   卡片
   ═══════════════════════════════════════════ */
.system-card {
  width: 380px;
  max-height: 85vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #12122a 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.close-btn {
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: #aaa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

/* ═══════════════════════════════════════════
   标签
   ═══════════════════════════════════════════ */
.tab-bar {
  display: flex;
  gap: 0;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.tab-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #ccc;
}

.tab-btn.active {
  color: #64b5f6;
  border-bottom-color: #64b5f6;
}

/* ═══════════════════════════════════════════
   存档槽位
   ═══════════════════════════════════════════ */
.slot-list {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slot-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.slot-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.14);
}

.slot-card:active {
  transform: scale(0.98);
}

.slot-card.slot-active {
  border-color: rgba(78, 205, 196, 0.4);
  background: rgba(78, 205, 196, 0.06);
}

.slot-number {
  width: 52px;
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  flex-shrink: 0;
}

.slot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slot-day {
  font-size: 14px;
  font-weight: 600;
  color: #d0d0d0;
}

.slot-time {
  font-size: 12px;
  color: #888;
}

.slot-date {
  font-size: 11px;
  color: #666;
}

.slot-empty-label {
  flex: 1;
  font-size: 13px;
  color: #555;
  font-style: italic;
}

.slot-action {
  flex-shrink: 0;
}

.action-hint {
  font-size: 12px;
  color: #64b5f6;
  padding: 3px 10px;
  border: 1px solid rgba(100, 181, 246, 0.3);
  border-radius: 4px;
  background: rgba(100, 181, 246, 0.06);
  transition: all 0.15s;
}

.slot-card:hover .action-hint {
  background: rgba(100, 181, 246, 0.14);
  border-color: #64b5f6;
}

/* ═══════════════════════════════════════════
   反馈消息
   ═══════════════════════════════════════════ */
.feedback {
  padding: 10px 20px 16px;
  font-size: 13px;
  text-align: center;
  transition: opacity 0.3s;
}

.feedback.success {
  color: #81c784;
}

.feedback.error {
  color: #e57373;
}
</style>
