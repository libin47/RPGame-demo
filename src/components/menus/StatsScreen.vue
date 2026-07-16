<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useGameDispatch } from '@/composables/useGameDispatch'

const session = useSessionStore()
const { dispatch } = useGameDispatch()

const survivalStats = computed(() => [
  {
    key: 'hp',
    label: '生命值',
    emoji: '❤️',
    value: Math.round(session.player.state.survival.hp),
    max: session.player.state.survivalMax.hp,
    color: '#c44a4a',
    glow: 'rgba(196, 74, 74, 0.3)',
  },
  {
    key: 'hunger',
    label: '饱食度',
    emoji: '🍖',
    value: Math.round(session.player.state.survival.hunger),
    max: session.player.state.survivalMax.hunger,
    color: '#d8a12c',
    glow: 'rgba(216, 161, 44, 0.3)',
  },
  {
    key: 'thirst',
    label: '口渴度',
    emoji: '💧',
    value: Math.round(session.player.state.survival.thirst),
    max: session.player.state.survivalMax.thirst,
    color: '#4a9ad4',
    glow: 'rgba(74, 154, 212, 0.3)',
  },
  {
    key: 'san',
    label: '理智值',
    emoji: '🧠',
    value: Math.round(session.player.state.survival.san),
    max: session.player.state.survivalMax.san,
    color: '#9a6ab4',
    glow: 'rgba(154, 106, 180, 0.3)',
  },
  {
    key: 'warmth',
    label: '温暖度',
    emoji: '🌡️',
    value: Math.round(session.player.state.survival.warmth),
    max: session.player.state.survivalMax.warmth,
    color: '#5a9a6a',
    glow: 'rgba(90, 154, 106, 0.3)',
  },
])

const baseAttrs = computed(() => [
  { key: 'strength', label: '力量', emoji: '💪', value: session.player.state.attrs.strength },
  { key: 'agility', label: '敏捷', emoji: '⚡', value: session.player.state.attrs.agility },
  { key: 'constitution', label: '体质', emoji: '🏋️', value: session.player.state.attrs.constitution },
  { key: 'intelligence', label: '智力', emoji: '📚', value: session.player.state.attrs.intelligence },
])

const skillIcons: Record<string, string> = {
  scout: '🔍',
  craft: '🔧',
  chop: '🪓',
  climb: '🧗',
  shoot: '🔫',
  brawl: '🥊',
  dodge: '💨',
  run: '🏃',
  stealth: '👻',
  melee: '⚔️',
  unarmed: '✊',
}

const skillLabels: Record<string, string> = {
  scout: '侦察',
  craft: '制作',
  chop: '砍伐',
  climb: '攀岩',
  shoot: '射击',
  brawl: '斗殴',
  dodge: '闪避',
  run: '奔跑',
  stealth: '潜行',
  melee: '近战',
  unarmed: '徒手',
}
</script>

<template>
  <div class="menu-screen">
    <div class="header">
      <button class="back-btn" @click="dispatch({ type: 'closeMenu' })">
        <span class="back-icon">←</span>
        返回
      </button>
      <h1 class="title">属性</h1>
      <div class="placeholder"></div>
    </div>
    
    <div class="content">
      <div class="section">
        <h2 class="section-title">生存属性</h2>
        <div class="survival-grid">
          <div
            v-for="stat in survivalStats"
            :key="stat.key"
            class="survival-card"
          >
            <div class="stat-header">
              <span class="stat-emoji">{{ stat.emoji }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
            <div class="stat-bar-track">
              <span
                class="stat-bar-fill"
                :style="{
                  width: (stat.value / stat.max) * 100 + '%',
                  background: `linear-gradient(90deg, ${stat.color} 0%, ${stat.color}88 100%)`,
                  boxShadow: `0 0 12px ${stat.glow}`,
                }"
              ></span>
              <span class="stat-bar-value">{{ stat.value }}/{{ stat.max }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">基础属性</h2>
        <div class="attrs-grid">
          <div
            v-for="attr in baseAttrs"
            :key="attr.key"
            class="attr-card"
          >
            <span class="attr-emoji">{{ attr.emoji }}</span>
            <div class="attr-info">
              <span class="attr-label">{{ attr.label }}</span>
              <span class="attr-value">{{ attr.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">技能</h2>
        <div class="skills-grid">
          <div
            v-for="(level, key) in session.player.state.skills"
            :key="key"
            class="skill-card"
          >
            <span class="skill-emoji">{{ skillIcons[String(key)] ?? '⭐' }}</span>
            <div class="skill-info">
              <span class="skill-label">{{ skillLabels[String(key)] ?? key }}</span>
              <span class="skill-level">Lv.{{ level ?? 0 }}</span>
            </div>
            <div class="skill-bar-track">
              <span
                class="skill-bar-fill"
                :style="{ width: ((level ?? 0) / 20) * 100 + '%' }"
              ></span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">角色信息</h2>
        <div class="char-info">
          <div class="info-row">
            <span class="info-label">角色名称</span>
            <span class="info-value">{{ session.player.state.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">角色类型</span>
            <span class="info-value">
              {{ session.content.characters[session.player.state.characterId]?.name ?? '未知' }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">感染状态</span>
            <span class="info-value" :class="{ infected: session.player.state.infected }">
              {{ session.player.state.infected ? '已感染' : '健康' }}
            </span>
          </div>
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

.survival-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.survival-card {
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-md);
  padding: 0.75rem;
  transition: all var(--ei-transition-fast);
}

.survival-card:hover {
  border-color: var(--ei-border-light);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.stat-emoji {
  font-size: 1.1rem;
}

.stat-label {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--ei-text);
}

.stat-bar-track {
  height: 14px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
}

.stat-bar-fill {
  display: block;
  height: 100%;
  border-radius: 7px;
  transition: width var(--ei-transition-normal);
  position: relative;
}

.stat-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
  border-radius: 7px;
}

.stat-bar-value {
  font-variant-numeric: tabular-nums;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}

.attrs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.attr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-md);
  padding: 0.8rem;
  transition: all var(--ei-transition-fast);
}

.attr-card:hover {
  border-color: var(--ei-border-light);
  box-shadow: var(--ei-shadow-sm);
}

.attr-emoji {
  font-size: 1.5rem;
}

.attr-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
}

.attr-label {
  font-size: 0.8rem;
  color: var(--ei-text-muted);
}

.attr-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--ei-accent);
}

.skills-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.skill-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-sm);
  padding: 0.6rem;
  transition: all var(--ei-transition-fast);
}

.skill-card:hover {
  border-color: var(--ei-border-light);
}

.skill-emoji {
  font-size: 1.1rem;
  width: 2rem;
  text-align: center;
}

.skill-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.skill-label {
  font-size: 0.88rem;
  color: var(--ei-text);
}

.skill-level {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ei-accent);
}

.skill-bar-track {
  width: 60px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.skill-bar-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--ei-accent);
  transition: width var(--ei-transition-normal);
}

.char-info {
  background: var(--ei-panel);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius-md);
  padding: 0.8rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--ei-border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.85rem;
  color: var(--ei-text-muted);
}

.info-value {
  font-size: 0.85rem;
  color: var(--ei-text);
  font-weight: 500;
}

.info-value.infected {
  color: var(--ei-danger);
}
</style>
