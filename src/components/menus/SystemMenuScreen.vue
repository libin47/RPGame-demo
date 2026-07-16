<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
import { useGameDispatch } from '@/composables/useGameDispatch'

const session = useSessionStore()
const { dispatch } = useGameDispatch()

function saveToSlot(slot: number) {
  dispatch({ type: 'save', slot })
}
</script>

<template>
  <div class="menu-screen">
    <div class="header">
      <button class="back-btn" @click="dispatch({ type: 'closeMenu' })">
        <span class="back-icon">←</span>
        返回
      </button>
      <h1 class="title">系统菜单</h1>
      <div class="placeholder"></div>
    </div>
    
    <div class="content">
      <div class="section">
        <h2 class="section-title">存档管理</h2>
        <div class="save-slots">
          <div
            v-for="(save, index) in session.saves"
            :key="index"
            class="save-slot"
          >
            <div class="slot-header">
              <span class="slot-number">槽位 {{ index + 1 }}</span>
              <button
                class="save-btn"
                @click="saveToSlot(index + 1)"
              >
                存档
              </button>
            </div>
            <div v-if="save" class="slot-info">
              <span class="save-time">{{ new Date(save.savedAt).toLocaleString() }}</span>
              <span class="save-day">第{{ save.snapshot.world.day }}日</span>
            </div>
            <div v-else class="slot-empty">
              <span>空槽位</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">游戏设置</h2>
        <div class="menu-items">
          <button
            class="menu-item danger"
            @click="dispatch({ type: 'returnTitle' })"
          >
            <span class="item-icon">🏠</span>
            <span class="item-text">返回标题</span>
          </button>
        </div>
      </div>

      <div class="section info">
        <h2 class="section-title">游戏信息</h2>
        <div class="info-content">
          <p><span class="info-label">角色:</span> {{ session.player.state.name }}</p>
          <p><span class="info-label">当前地点:</span> {{ session.location?.name ?? '未知' }}</p>
          <p><span class="info-label">游戏时间:</span> {{ session.timeLabel }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--ei-bg);
  color: var(--ei-text);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-top));
  background: var(--ei-gradient-panel);
  border-bottom: 1px solid var(--ei-border);
  box-shadow: var(--ei-shadow-sm);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  appearance: none;
  border: none;
  background: none;
  color: var(--ei-text-muted);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  border-radius: var(--ei-radius-sm);
  transition: all var(--ei-transition-fast);
}

.back-btn:hover {
  color: var(--ei-text);
  background: rgba(255, 255, 255, 0.05);
}

.back-icon {
  font-size: 1rem;
}

.title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--ei-accent);
  letter-spacing: 0.05em;
}

.placeholder {
  width: 60px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: var(--ei-gradient-bg);
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ei-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.8rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--ei-border);
}

.save-slots {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.save-slot {
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-md);
  padding: 0.8rem;
  transition: all var(--ei-transition-fast);
}

.save-slot:hover {
  border-color: var(--ei-border-light);
  box-shadow: var(--ei-shadow-sm);
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}

.slot-number {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--ei-text);
}

.save-btn {
  appearance: none;
  border: 1px solid var(--ei-accent);
  background: rgba(90, 154, 106, 0.15);
  color: var(--ei-accent);
  padding: 0.35rem 0.7rem;
  font: inherit;
  font-size: 0.8rem;
  border-radius: var(--ei-radius-sm);
  cursor: pointer;
  transition: all var(--ei-transition-fast);
}

.save-btn:hover {
  background: rgba(90, 154, 106, 0.25);
  border-color: var(--ei-accent-hover);
}

.slot-info {
  display: flex;
  gap: 1rem;
  font-size: 0.78rem;
  color: var(--ei-text-muted);
}

.slot-empty {
  font-size: 0.8rem;
  color: var(--ei-text-muted);
  font-style: italic;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  appearance: none;
  border: 1px solid var(--ei-border);
  background: var(--ei-gradient-btn);
  color: var(--ei-text);
  padding: 0.75rem 1rem;
  font: inherit;
  font-size: 0.9rem;
  border-radius: var(--ei-radius-md);
  cursor: pointer;
  transition: all var(--ei-transition-fast);
  box-shadow: var(--ei-shadow-sm);
}

.menu-item:hover:not(:disabled) {
  background: var(--ei-gradient-btn-hover);
  border-color: var(--ei-border-light);
  transform: translateY(-1px);
  box-shadow: var(--ei-shadow-md);
}

.menu-item:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--ei-shadow-sm);
}

.menu-item.danger {
  border-color: rgba(196, 74, 74, 0.4);
  background: rgba(196, 74, 74, 0.1);
  color: var(--ei-danger);
}

.menu-item.danger:hover {
  background: rgba(196, 74, 74, 0.18);
  border-color: var(--ei-danger);
}

.item-icon {
  font-size: 1.1rem;
}

.item-text {
  flex: 1;
  text-align: left;
}

.info {
  margin-top: auto;
}

.info-content {
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-md);
  padding: 0.8rem;
}

.info-content p {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
}

.info-content p:last-child {
  margin-bottom: 0;
}

.info-label {
  color: var(--ei-text-muted);
  font-weight: 500;
  min-width: 5em;
}
</style>
