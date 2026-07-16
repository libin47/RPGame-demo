<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
import { useGameDispatch } from '@/composables/useGameDispatch'

const session = useSessionStore()
const { dispatch } = useGameDispatch()

const menuId = session.ui.state.menu
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="dispatch({ type: 'closeMenu' })">
      <div class="panel">
        <button class="close" @click="dispatch({ type: 'closeMenu' })">✕</button>

        <!-- System Menu -->
        <template v-if="menuId === 'system'">
          <h2>系统</h2>
          <div class="menu-list">
            <button class="item" @click="dispatch({ type: 'save', slot: 1 })">存档至槽位 1</button>
            <button class="item" @click="dispatch({ type: 'save', slot: 2 })">存档至槽位 2</button>
            <button class="item" @click="dispatch({ type: 'save', slot: 3 })">存档至槽位 3</button>
            <button class="item" @click="dispatch({ type: 'returnTitle' })">返回标题</button>
          </div>
          <div class="saves-info">
            <p v-for="(s, i) in session.saves" :key="i">
              槽位 {{ i + 1 }}：{{ s ? new Date(s.savedAt).toLocaleString() : '空' }}
            </p>
          </div>
        </template>

        <!-- Inventory Menu -->
        <template v-if="menuId === 'inventory'">
          <h2>背包</h2>
          <p class="capacity">
            负重
            {{
              session.inventory.state.slots
                .reduce(
                  (s: number, x) => s + (session.content.items[x.itemId]?.weight ?? 0) * x.count,
                  0,
                )
                .toFixed(1)
            }}
            / {{ session.inventory.state.capacity }}
          </p>
          <div class="menu-list">
            <div v-for="slot in session.inventory.state.slots" :key="slot.itemId" class="item">
              <span class="name">{{
                session.content.items[slot.itemId]?.name ?? slot.itemId
              }}</span>
              <span class="count">x{{ slot.count }}</span>
              <span class="act">
                <button
                  v-if="session.content.items[slot.itemId]?.usable"
                  class="mini-btn"
                  @click="dispatch({ type: 'useItem', itemId: slot.itemId })"
                >
                  使用
                </button>
                <button
                  v-if="session.content.items[slot.itemId]?.equipSlot"
                  class="mini-btn"
                  @click="dispatch({ type: 'equipItem', itemId: slot.itemId })"
                >
                  装备
                </button>
              </span>
            </div>
            <p v-if="!session.inventory.state.slots.length" class="empty">背包空空如也。</p>
          </div>
          <h3 class="equip-title">装备</h3>
          <div class="equip">
            <p v-for="(itemId, slot) in session.player.state.equipment" :key="String(slot)">
              <span class="slot">{{ slot }}</span
              >：
              <span v-if="itemId">{{ session.content.items[itemId]?.name ?? itemId }}</span>
              <span v-else class="empty">空</span>
              <button
                v-if="itemId"
                class="mini-btn"
                @click="dispatch({ type: 'unequip', slot: String(slot) })"
              >
                卸下
              </button>
            </p>
          </div>
        </template>

        <!-- Stats Menu -->
        <template v-if="menuId === 'stats'">
          <h2>属性</h2>
          <div class="stats">
            <p>
              <strong>生命</strong> {{ Math.round(session.player.state.survival.hp) }} /
              {{ session.player.state.survivalMax.hp }}
            </p>
            <p>
              <strong>饱食</strong> {{ Math.round(session.player.state.survival.hunger) }} /
              {{ session.player.state.survivalMax.hunger }}
            </p>
            <p>
              <strong>口渴</strong> {{ Math.round(session.player.state.survival.thirst) }} /
              {{ session.player.state.survivalMax.thirst }}
            </p>
            <p>
              <strong>SAN</strong> {{ Math.round(session.player.state.survival.san) }} /
              {{ session.player.state.survivalMax.san }}
            </p>
            <p>
              <strong>温暖</strong> {{ Math.round(session.player.state.survival.warmth) }} /
              {{ session.player.state.survivalMax.warmth }}
            </p>
          </div>
          <h3>基础属性</h3>
          <div class="stats">
            <p><strong>力量</strong> {{ session.player.state.attrs.strength }}</p>
            <p><strong>敏捷</strong> {{ session.player.state.attrs.agility }}</p>
            <p><strong>体质</strong> {{ session.player.state.attrs.constitution }}</p>
            <p><strong>智力</strong> {{ session.player.state.attrs.intelligence }}</p>
          </div>
          <h3>技能</h3>
          <div class="stats">
            <p v-for="(v, k) in session.player.state.skills" :key="String(k)">
              <strong>{{ k }}</strong> {{ v }}
            </p>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 150;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.panel {
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: 4px 4px 0 0;
  width: 100%;
  max-width: 420px;
  max-height: 75vh;
  overflow-y: auto;
  padding: 1.2rem 1rem calc(1.2rem + env(safe-area-inset-bottom));
  position: relative;
}

.close {
  appearance: none;
  border: none;
  background: none;
  color: var(--ei-muted);
  font-size: 1.2rem;
  position: absolute;
  top: 0.5rem;
  right: 0.7rem;
  cursor: pointer;
  padding: 0.3rem;
}

h2,
h3 {
  color: var(--ei-accent);
  margin-bottom: 0.6rem;
  font-size: 1.1rem;
}

h3 {
  margin-top: 1rem;
  font-size: 0.95rem;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.45rem 0;
  border-bottom: 1px solid color-mix(in srgb, var(--ei-border) 50%, transparent);
  font-size: 0.9rem;
  border: none;
  background: none;
  color: var(--ei-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  width: 100%;
}

.item .name {
  flex: 1;
}

.item .count {
  margin: 0 0.5rem;
  color: var(--ei-muted);
}

.item .act {
  display: flex;
  gap: 0.3rem;
}

.mini-btn {
  appearance: none;
  border: 1px solid var(--ei-border);
  background: var(--ei-btn);
  color: var(--ei-text);
  padding: 0.2rem 0.45rem;
  font: inherit;
  font-size: 0.75rem;
  border-radius: 2px;
  cursor: pointer;
}

.empty {
  color: var(--ei-muted);
  font-style: italic;
}

.stats {
  font-size: 0.88rem;
  line-height: 1.7;
}

.stats p {
  margin: 0;
}

.equip {
  font-size: 0.88rem;
  line-height: 1.7;
}

.equip p {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.equip .slot {
  color: var(--ei-muted);
  width: 4em;
}

.equip-title {
  margin-top: 1rem;
}

.saves-info {
  margin-top: 0.8rem;
  font-size: 0.78rem;
  color: var(--ei-muted);
  line-height: 1.5;
}

.capacity {
  font-size: 0.82rem;
  color: var(--ei-muted);
  margin-bottom: 0.5rem;
}
</style>
