<!-- MainMenuView.vue - 主菜单
     分两屏：主菜单（标题+按钮）→ 角色选择（职业列表+名字输入） -->
<template>
  <div class="main-menu">
    <div class="bg-layer"></div>

    <!-- ═══════ 第一屏：主菜单 ═══════ -->
    <div v-if="screen === 'main'" class="menu-content">
      <div class="title-section">
        <h1 class="game-title">蚀岛</h1>
        <p class="subtitle">Eroded Island</p>
        <p class="tagline">在这座被腐化的岛屿上，你能存活多久？</p>
      </div>

      <div class="main-actions">
        <button class="main-btn btn-primary" @click="screen = 'classSelect'">
          <span class="btn-icon">⚔️</span>
          <span class="btn-text">新游戏</span>
        </button>
        <button
          class="main-btn btn-continue"
          :class="{ 'btn-disabled': !hasSaveData }"
          :disabled="!hasSaveData"
          @click="onContinue"
        >
          <span class="btn-icon">📂</span>
          <span class="btn-text">继续游戏</span>
          <span v-if="!hasSaveData" class="btn-sub">无存档</span>
        </button>
        <button class="main-btn btn-exit" @click="onExit">
          <span class="btn-icon">🚪</span>
          <span class="btn-text">退出</span>
        </button>
      </div>
    </div>

    <!-- ═══════ 第二屏：角色选择 ═══════ -->
    <div v-else class="class-screen">
      <!-- 顶栏：返回 + 标题 -->
      <div class="class-topbar">
        <button class="back-btn" @click="screen = 'main'">
          <span class="back-arrow">←</span> 返回
        </button>
        <h2 class="class-screen-title">选择你的身份</h2>
      </div>

      <!-- 职业列表（可滚动） -->
      <div class="class-scroll">
        <div class="class-list">
          <button
            v-for="cls in classList"
            :key="cls.id"
            class="class-card"
            :class="{ 'class-selected': selectedClassId === cls.id }"
            @click="selectedClassId = cls.id"
          >
            <div class="class-card-top">
              <span class="class-name">{{ cls.name }}</span>
              <span class="class-difficulty">
                <span v-for="n in cls.difficulty" :key="n" class="diff-dot">●</span>
                <span v-for="n in 5 - cls.difficulty" :key="'e' + n" class="diff-dot-empty">○</span>
              </span>
            </div>
            <div class="class-desc">{{ cls.description }}</div>
            <div v-if="selectedClassId === cls.id" class="class-detail">
              {{ cls.detailedDescription }}
            </div>
          </button>
        </div>
      </div>

      <!-- 底部：名字输入 + 开始按钮（选定职业后显示） -->
      <transition name="fade">
        <div v-if="selectedClass" class="class-footer">
          <div class="name-input-wrap">
            <label class="name-label">角色名称</label>
            <input
              v-model="playerName"
              class="name-input"
              type="text"
              placeholder="输入你的名字…"
              maxlength="12"
              @keyup.enter="startGame"
            />
            <span class="name-count">{{ playerName.length }}/12</span>
          </div>
          <button class="start-btn" :disabled="!playerName.trim()" @click="startGame">
            以「{{ selectedClass.name }}」开始生存
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getRegistry } from '@/engine'
import { startNewGame, restoreGame } from '@/runtime/gameInstance'
import { hasSave, getAllSaveMeta, loadGame } from '@/runtime/saveManager'
import type { CharacterClass } from '@/types/character'

const router = useRouter()
const registry = getRegistry()

// ============================================================
// 屏幕状态
// ============================================================

const screen = ref<'main' | 'classSelect'>('main')

// ============================================================
// 职业选择
// ============================================================

const classList = computed<CharacterClass[]>(() => {
  return registry.getAllCharacterClasses()
})

const selectedClassId = ref<string>('')

const selectedClass = computed<CharacterClass | null>(() => {
  if (!selectedClassId.value) return null
  return registry.getCharacterClass(selectedClassId.value) ?? null
})

const playerName = ref<string>('')

// ============================================================
// 存档检测
// ============================================================

const hasSaveData = computed<boolean>(() => {
  const metas = getAllSaveMeta()
  return metas.some((m) => m !== null)
})

// ============================================================
// 操作
// ============================================================

function startGame(): void {
  if (!selectedClass.value) return
  const name = playerName.value.trim()
  startNewGame(selectedClass.value, name || undefined)
  router.push({ name: 'game' })
}

function onContinue(): void {
  const metas = getAllSaveMeta()
  for (let slot = metas.length - 1; slot >= 0; slot--) {
    if (metas[slot]) {
      const playerState = loadGame(slot)
      if (playerState) {
        restoreGame(playerState)
        router.push({ name: 'game' })
        return
      }
    }
  }
}

function onExit(): void {
  if (window.confirm('确定要退出游戏吗？')) {
    window.close()
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════
   容器
   ═══════════════════════════════════════════ */
.main-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  color: #e0e0e0;
}

.bg-layer {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(30, 30, 60, 0.8) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 80%, rgba(60, 20, 40, 0.3) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a14 0%, #12122a 40%, #16162e 60%, #0f0f1a 100%);
  z-index: 0;
}

/* ═══════════════════════════════════════════
   第一屏 — 主菜单
   ═══════════════════════════════════════════ */
.menu-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 20px;
  width: 100%;
  max-width: 520px;
}

.title-section {
  text-align: center;
  margin-bottom: 48px;
}

.game-title {
  font-size: 52px;
  font-weight: 700;
  color: #ffffff;
  text-shadow:
    0 0 30px rgba(126, 200, 227, 0.25),
    0 2px 8px rgba(0, 0, 0, 0.5);
  margin: 0;
  letter-spacing: 10px;
}

.subtitle {
  font-size: 14px;
  color: #555;
  margin: 6px 0 18px;
  letter-spacing: 5px;
}

.tagline {
  font-size: 14px;
  color: #777;
  font-style: italic;
}

/* ── 主按钮 ── */
.main-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

.main-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: #d0d0d0;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.main-btn:hover:not(.btn-disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.main-btn:active:not(.btn-disabled) {
  transform: translateY(0);
}

.btn-icon {
  font-size: 20px;
  width: 32px;
  text-align: center;
  flex-shrink: 0;
}
.btn-text {
  font-weight: 600;
  letter-spacing: 1px;
}
.btn-sub {
  font-size: 12px;
  color: #666;
  font-weight: 400;
  margin-left: auto;
}

.btn-primary {
  border-color: rgba(78, 205, 196, 0.4);
  background: rgba(78, 205, 196, 0.06);
  color: #4ecdc4;
}
.btn-primary:hover:not(:disabled) {
  background: rgba(78, 205, 196, 0.14);
  border-color: #4ecdc4;
  box-shadow: 0 4px 20px rgba(78, 205, 196, 0.15);
}

.btn-continue {
  border-color: rgba(100, 181, 246, 0.3);
  color: #90caf9;
}
.btn-continue:hover:not(.btn-disabled) {
  background: rgba(100, 181, 246, 0.1);
  border-color: #64b5f6;
}

.btn-exit {
  border-color: rgba(255, 255, 255, 0.06);
  color: #888;
}
.btn-exit:hover:not(.btn-disabled) {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
  color: #ccc;
}

.btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ═══════════════════════════════════════════
   第二屏 — 角色选择
   ═══════════════════════════════════════════ */
.class-screen {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  min-height: 100vh;
  padding: 0 20px;
}

/* ── 顶栏 ── */
.class-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 0 14px;
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  color: #aaa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.16);
  color: #ddd;
}

.back-arrow {
  font-size: 16px;
}

.class-screen-title {
  font-size: 18px;
  font-weight: 700;
  color: #ddd;
  margin: 0;
  letter-spacing: 1px;
}

/* ── 职业列表（可滚动） ── */
.class-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0 16px;
  min-height: 0;
}

.class-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.class-card {
  width: 100%;
  padding: 14px 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  color: #c0c0c0;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.class-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
}

.class-selected {
  border-color: rgba(78, 205, 196, 0.4) !important;
  background: rgba(78, 205, 196, 0.06) !important;
  box-shadow: 0 0 12px rgba(78, 205, 196, 0.1);
}

.class-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.class-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}
.class-difficulty {
  font-size: 12px;
  margin-left: auto;
}
.diff-dot {
  color: #ffa726;
}
.diff-dot-empty {
  color: #333;
}
.class-desc {
  font-size: 13px;
  color: #999;
  line-height: 1.5;
}

.class-detail {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(78, 205, 196, 0.15);
  font-size: 12px;
  color: #aaa;
  line-height: 1.6;
}

/* ── 底部 ── */
.class-footer {
  flex-shrink: 0;
  padding: 16px 0 28px;
  text-align: center;
}

.name-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding: 0 4px;
}

.name-label {
  font-size: 14px;
  color: #aaa;
  white-space: nowrap;
}

.name-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #e0e0e0;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.name-input::placeholder {
  color: #555;
}
.name-input:focus {
  border-color: rgba(78, 205, 196, 0.4);
}

.name-count {
  font-size: 12px;
  color: #555;
  flex-shrink: 0;
}

.start-btn {
  padding: 12px 36px;
  font-size: 15px;
  border: 1px solid #4ecdc4;
  border-radius: 8px;
  background: rgba(78, 205, 196, 0.1);
  color: #4ecdc4;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
  font-weight: 600;
}

.start-btn:hover:not(:disabled) {
  background: rgba(78, 205, 196, 0.2);
  box-shadow: 0 4px 20px rgba(78, 205, 196, 0.2);
  transform: translateY(-1px);
}

.start-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── 淡入动画 ── */
.fade-enter-active {
  transition: all 0.3s ease-out;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>
