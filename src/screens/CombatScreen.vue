<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
import { useGameDispatch } from '@/composables/useGameDispatch'

const session = useSessionStore()
const { dispatch } = useGameDispatch()
</script>

<template>
  <div class="combat-screen">
    <div class="bars">
      <div class="player-section">
        <div class="bar player">
          <span class="name">{{ session.combat.state.player?.name }}</span>
          <!-- <span class="hp-label">HP</span> -->
          <span class="track">
            <span
              class="fill"
              :style="{
                width:
                  (
                    ((session.combat.state.player?.hp ?? 0) /
                      (session.combat.state.player?.maxHp ?? 1)) *
                    100
                  ).toFixed(1) + '%',
              }"
            ></span>
            <span class="value"
              >{{ Math.round(session.combat.state.player?.hp ?? 0) }}/{{
                session.combat.state.player?.maxHp ?? 0
              }}</span
            >
          </span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="enemy-section">
        <div v-for="enemy in session.combat.state.enemies" :key="enemy.id" class="bar enemy">
          <span class="name">{{ enemy.name }}</span>
          <!-- <span class="hp-label">HP</span> -->
          <span class="track">
            <span
              class="fill"
              :style="{ width: ((enemy.hp / enemy.maxHp) * 100).toFixed(1) + '%' }"
            ></span>
            <span class="value">{{ Math.round(enemy.hp) }}/{{ enemy.maxHp }}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="log">
      <p v-for="(line, i) in session.combat.state.log.slice(-8)" :key="i" class="log-line">
        {{ line }}
      </p>
    </div>
    <template v-if="session.ui.state.mode === 'combat_result'">
      <div class="result">
        <p class="result-text">{{ session.combat.state.resultText }}</p>
        <div v-if="session.combat.state.loot.length" class="loot">
          <span>战利品：</span>
          <span v-for="l in session.combat.state.loot" :key="l.itemId"
            >{{ l.itemId }} x{{ l.count }}
          </span>
        </div>
        <button class="btn offset" @click="dispatch({ type: 'confirmCombatResult' })">确认</button>
      </div>
    </template>

    <div v-else class="actions">
      <div class="skills">
        <button
          v-for="skill in session.combatSkills"
          :key="skill.id"
          class="btn"
          :disabled="(session.combat.state.player?.cooldowns[skill.id] ?? 0) > 0"
          @click="dispatch({ type: 'combatSkill', skillId: skill.id })"
        >
          {{ skill.name
          }}<span v-if="(session.combat.state.player?.cooldowns[skill.id] ?? 0) > 0">
            (CD {{ session.combat.state.player?.cooldowns[skill.id] }})</span
          >
        </button>
      </div>
      <button class="btn flee" @click="dispatch({ type: 'combatFlee' })">逃跑</button>
    </div>
  </div>
</template>

<style scoped>
.combat-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--ei-bg) 90%, #300);
}

.bars {
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--ei-border);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-section {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.enemy-section {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--ei-border), transparent);
  margin: 0.25rem 0;
}

.bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
}

.hp-label {
  font-weight: 600;
  font-size: 0.7rem;
  width: 2.2em;
  flex-shrink: 0;
  text-align: right;
}

.name {
  font-weight: 600;
  font-size: 0.7rem;
  width: 5em;
  flex-shrink: 0;
  text-align: right;
}

.player .hp-label,
.player .name {
  color: var(--ei-accent);
}

.enemy .hp-label,
.enemy .name {
  color: #c55;
}

.track {
  flex: 1;
  height: 14px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
}

.fill {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.35s ease;
}

.player .fill {
  background: #4caf50;
}

.enemy .fill {
  background: #c44;
}

.value {
  font-variant-numeric: tabular-nums;
  font-size: 0.62rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}

.log {
  flex: 1;
  overflow-y: auto;
  padding: 0.85rem 1rem;
  line-height: 1.65;
  font-size: 0.92rem;
}

.log-line {
  margin-bottom: 0.5rem;
}

.result {
  padding: 1rem;
  border-top: 1px solid var(--ei-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-text {
  font-size: 1.05rem;
  color: var(--ei-accent);
  text-align: center;
}

.loot {
  font-size: 0.82rem;
  color: var(--ei-muted);
  text-align: center;
}

.actions {
  padding: 0.65rem 0.75rem calc(0.65rem + env(safe-area-inset-bottom));
  border-top: 1px solid var(--ei-border);
  display: flex;
  gap: 0.5rem;
}

.skills {
  flex: 1;
  display: flex;
  gap: 0.4rem;
}

.btn {
  appearance: none;
  border: 1px solid var(--ei-border);
  background: var(--ei-btn);
  color: var(--ei-text);
  padding: 0.55rem 0.7rem;
  font: inherit;
  font-size: 0.86rem;
  border-radius: 2px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn.offset {
  margin-top: 1.75rem;
  margin-left: auto;
  min-width: 48%;
}

.btn.flee {
  background: color-mix(in srgb, var(--ei-btn) 80%, #a33);
  flex: 0 0 auto;
}
</style>
