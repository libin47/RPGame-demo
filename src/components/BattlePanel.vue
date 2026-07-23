<!-- BattlePanel.vue - 战斗面板
     显示敌人状态、战斗日志、玩家操作按钮 -->
<template>
  <div class="battle-panel">
    <!-- 敌人状态区 -->
    <div class="battle-enemies">
      <div
        v-for="enemy in enemies"
        :key="enemy.config.id"
        class="enemy-card"
        :class="{ 'enemy-defeated': enemy.hp <= 0 }"
      >
        <div class="enemy-header">
          <span class="enemy-name">{{ enemy.config.name }}</span>
        </div>
        <div class="enemy-hp-row">
          <span class="hp-label">HP</span>
          <div class="hp-bar-bg">
            <div
              class="hp-bar-fill"
              :style="{ width: getHpPercent(enemy) + '%' }"
              :class="hpBarClass(enemy)"
            ></div>
          </div>
          <span class="hp-value">{{ Math.max(0, Math.floor(enemy.hp)) }}/{{ enemy.maxHp }}</span>
        </div>
      </div>
    </div>

    <!-- 战斗日志区 -->
    <div class="battle-log" ref="logRef">
      <p v-for="(log, idx) in logs" :key="idx" class="log-line">{{ log }}</p>
    </div>

    <!-- 操作按钮区 -->
    <div class="battle-actions">
      <button class="action-btn attack-btn" @click="onAction('battleSkill')">攻击</button>
      <button class="action-btn defend-btn" @click="onAction('defend')">防守</button>
      <button class="action-btn observe-btn" @click="onAction('observe')">观察</button>
      <button class="action-btn escape-btn" @click="onAction('escape')">逃跑</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PlayerActionType } from '@/engine'
import type { BattleEnemy } from '@/engine'

const props = defineProps<{
  enemies: BattleEnemy[]
  logs: string[]
}>()

const emit = defineEmits<{
  (e: 'action', actionType: PlayerActionType): void
}>()

/** 战斗日志容器引用（用于自动滚动到底部） */
const logRef = ref<HTMLElement | null>(null)

/** 获取敌人 HP 百分比 */
function getHpPercent(enemy: BattleEnemy): number {
  return enemy.maxHp > 0 ? Math.round((Math.max(0, enemy.hp) / enemy.maxHp) * 100) : 0
}

/** HP 条样式类 */
function hpBarClass(enemy: BattleEnemy): string {
  const pct = getHpPercent(enemy)
  if (pct > 60) return 'hp-high'
  if (pct > 30) return 'hp-mid'
  return 'hp-low'
}

/** 日志更新时自动滚动到底部 */
watch(
  () => props.logs.length,
  () => {
    setTimeout(() => {
      if (logRef.value) {
        logRef.value.scrollTop = logRef.value.scrollHeight
      }
    }, 50)
  },
)

/** 发送战斗操作 */
function onAction(actionType: string): void {
  switch (actionType) {
    case 'battleSkill':
      emit('action', PlayerActionType.BATTLE_SKILL)
      break
    case 'defend':
      emit('action', PlayerActionType.DEFEND)
      break
    case 'observe':
      emit('action', PlayerActionType.OBSERVE)
      break
    case 'escape':
      emit('action', PlayerActionType.ESCAPE)
      break
  }
}
</script>

<style scoped>
.battle-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #e0e0e0;
}

/* ---- 敌人状态 ---- */
.battle-enemies {
  padding: 16px 20px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.15);
}

.enemy-card {
  margin-bottom: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  transition: opacity 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.enemy-card:last-child {
  margin-bottom: 0;
}

.enemy-defeated {
  opacity: 0.35;
}

.enemy-header {
  margin-bottom: 6px;
}

.enemy-name {
  font-size: 15px;
  font-weight: 700;
  color: #ff6b6b;
}

.enemy-hp-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hp-label {
  font-size: 11px;
  color: #888;
  width: 22px;
  text-align: right;
  font-weight: 600;
}

.hp-bar-bg {
  flex: 1;
  height: 16px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 4px;
  overflow: hidden;
}

.hp-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 4px;
  min-width: 0;
}

.hp-value {
  font-size: 10px;
  color: #fff;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
  white-space: nowrap;
  line-height: 16px;
  font-weight: 600;
}

.hp-high {
  background: linear-gradient(90deg, #c62828, #e53935);
}

.hp-mid {
  background: linear-gradient(90deg, #e65100, #f57c00);
}

.hp-low {
  background: linear-gradient(90deg, #555, #777);
}

/* ---- 战斗日志 ---- */
.battle-log {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  font-size: 14px;
  line-height: 2;
}

.log-line {
  margin: 2px 0;
  color: #d0d0d0;
}

.log-line:first-child {
  margin-top: 0;
}

/* ---- 操作按钮 ---- */
.battle-actions {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.15);
}

.action-btn {
  flex: 1;
  padding: 10px 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #c0c0c0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.action-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
}

.attack-btn {
  border-color: rgba(255, 107, 107, 0.5);
  color: #ff6b6b;
}

.attack-btn:hover {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}

.defend-btn {
  border-color: rgba(78, 205, 196, 0.5);
  color: #4ecdc4;
}

.defend-btn:hover {
  background: rgba(78, 205, 196, 0.1);
  border-color: #4ecdc4;
}

.observe-btn {
  border-color: rgba(100, 181, 246, 0.5);
  color: #64b5f6;
}

.observe-btn:hover {
  background: rgba(100, 181, 246, 0.1);
  border-color: #64b5f6;
}

.escape-btn {
  border-color: rgba(136, 136, 136, 0.5);
  color: #999;
}

.escape-btn:hover {
  background: rgba(136, 136, 136, 0.1);
  border-color: #aaa;
  color: #ccc;
}
</style>
