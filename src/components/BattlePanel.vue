<!-- BattlePanel.vue - 战斗面板
     显示敌人状态、战斗日志、玩家操作按钮 -->
<template>
  <div class="battle-panel">
    <!-- 敌我距离条 -->
    <div class="battle-distance">
      <span class="dist-label">距离</span>
      <div class="dist-track">
        <span v-for="i in 5" :key="i" class="dist-cell" :class="{ active: i <= distance }"></span>
      </div>
      <span class="dist-num">{{ distance }}/5</span>
    </div>

    <!-- 敌人状态区（点击卡片可切换攻击目标） -->
    <div class="battle-enemies">
      <div
        v-for="enemy in enemies"
        :key="enemy.instanceId"
        class="enemy-card"
        :class="{
          'enemy-defeated': enemy.hp <= 0,
          'enemy-selected': enemy.instanceId === effectiveTargetId && enemy.hp > 0,
          'enemy-selectable': enemy.hp > 0,
        }"
        :title="enemy.hp > 0 ? '点击选择攻击目标' : ''"
        @click="onSelectEnemy(enemy)"
      >
        <div class="enemy-header">
          <span class="enemy-name">{{ enemyLabel(enemy) }}</span>
          <span
            v-if="enemy.instanceId === effectiveTargetId && enemy.hp > 0"
            class="enemy-target-tag"
            >当前目标</span
          >
          <span v-else-if="enemy.chargingSkillId" class="enemy-charging">蓄力中</span>
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

    <!-- 玩家技能区（攻击距离不足的技能禁用） -->
    <div v-if="skills.length > 0" class="battle-skills">
      <button
        v-for="item in skills"
        :key="item.skill.id"
        class="skill-btn"
        :class="{ 'skill-off-range': !item.inRange }"
        :disabled="!item.inRange"
        :title="item.skill.description"
        @click="onSkill(item.skill.id)"
      >
        <span class="skill-name">{{ item.skill.name }}</span>
        <span class="skill-range">{{ item.distance === -1 ? '∞' : `射程${item.distance}` }}</span>
      </button>
    </div>

    <!-- 操作按钮区 -->
    <div class="battle-actions">
      <button class="action-btn move-btn" :disabled="distance <= 1" @click="onAction('moveCloser')">
        靠近
      </button>
      <button class="action-btn move-btn" :disabled="distance >= 5" @click="onAction('moveAway')">
        远离
      </button>
      <button class="action-btn defend-btn" @click="onAction('defend')">防守</button>
      <button class="action-btn observe-btn" @click="onAction('observe')">观察</button>
      <button class="action-btn escape-btn" @click="onAction('escape')">逃跑</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  PlayerActionType,
  getPlayerBattleSkills,
  getPlayerBattleSkillDistance,
  canSkillHitAtDistance,
} from '@/engine'
import type { BattleEnemy } from '@/engine'
import type { PlayerState } from '@/types/player'

const props = defineProps<{
  enemies: BattleEnemy[]
  logs: string[]
  /** 当前敌我距离（1-5） */
  distance: number
  /** 玩家状态（用于列出技能与计算射程） */
  player: PlayerState
  /** 玩家当前选中的攻击目标实例ID（null=自动取第一个存活敌人） */
  targetEnemyId: string | null
}>()

const emit = defineEmits<{
  (e: 'action', actionType: PlayerActionType, skillId?: string): void
  (e: 'selectTarget', enemyId: string): void
}>()

/** 战斗日志容器引用（用于自动滚动到底部） */
const logRef = ref<HTMLElement | null>(null)

/**
 * 当前生效的攻击目标实例ID：
 * 优先取选中的目标（若存活），否则回退到第一个存活敌人
 */
const effectiveTargetId = computed<string | null>(() => {
  const living = props.enemies.filter((e) => e.hp > 0)
  const selected = living.find((e) => e.instanceId === props.targetEnemyId)
  if (selected) return selected.instanceId
  return living[0]?.instanceId ?? null
})

/** 敌人显示名称：同名敌人加序号区分（如"食尸鬼 2"） */
function enemyLabel(enemy: BattleEnemy): string {
  const siblings = props.enemies.filter((e) => e.config.id === enemy.config.id)
  if (siblings.length > 1) {
    const no = siblings.indexOf(enemy) + 1
    return `${enemy.config.name} ${no}`
  }
  return enemy.config.name
}

/** 点击敌人卡片：切换攻击目标 */
function onSelectEnemy(enemy: BattleEnemy): void {
  if (enemy.hp <= 0) return
  emit('selectTarget', enemy.instanceId)
}

/** 玩家战斗技能（含普攻），附带解析后的射程与当前距离可用性 */
const skills = computed(() =>
  getPlayerBattleSkills(props.player).map((skill) => {
    const skillDistance = getPlayerBattleSkillDistance(props.player, skill)
    return {
      skill,
      distance: skillDistance,
      inRange: canSkillHitAtDistance(skillDistance, props.distance),
    }
  }),
)

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

/** 使用技能 */
function onSkill(skillId: string): void {
  emit('action', PlayerActionType.BATTLE_SKILL, skillId)
}

/** 发送战斗操作 */
function onAction(actionType: string): void {
  switch (actionType) {
    case 'moveCloser':
      emit('action', PlayerActionType.MOVE_CLOSER)
      break
    case 'moveAway':
      emit('action', PlayerActionType.MOVE_AWAY)
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

/* ---- 敌我距离条 ---- */
.battle-distance {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.dist-label {
  font-size: 13px;
  font-weight: 600;
  color: #a0a0a0;
}

.dist-track {
  display: flex;
  gap: 4px;
  flex: 1;
  max-width: 260px;
}

.dist-cell {
  flex: 1;
  height: 10px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  transition: background 0.3s;
}

.dist-cell.active {
  background: linear-gradient(90deg, #ffd700, #ff9800);
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
}

.dist-num {
  font-size: 13px;
  font-weight: 700;
  color: #ffd700;
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
  transition: all 0.25s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.enemy-card:last-child {
  margin-bottom: 0;
}

.enemy-card.enemy-selectable {
  cursor: pointer;
}

.enemy-card.enemy-selectable:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 当前选中攻击目标：金色高亮 */
.enemy-card.enemy-selected {
  border: 2px solid #ffd700;
  background: rgba(255, 215, 0, 0.16);
  box-shadow: 0 0 14px rgba(255, 215, 0, 0.4);
}

/* 未选中卡片在已有选中目标时弱化，突出选中项 */
.battle-enemies:has(.enemy-card.enemy-selected) .enemy-card:not(.enemy-selected) {
  opacity: 0.55;
}

/* 当前目标标签 */
.enemy-target-tag {
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(255, 215, 0, 0.25);
  border: 1px solid #ffd700;
  color: #ffd700;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.enemy-defeated {
  opacity: 0.35;
}

.enemy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.enemy-name {
  font-size: 15px;
  font-weight: 700;
  color: #ff6b6b;
}

/* 蓄力中标签 */
.enemy-charging {
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(255, 152, 0, 0.2);
  border: 1px solid rgba(255, 152, 0, 0.5);
  color: #ffb74d;
  font-size: 11px;
  font-weight: 600;
  animation: charge-pulse 1.2s ease-in-out infinite;
}

@keyframes charge-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
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

/* ---- 玩家技能区 ---- */
.battle-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.skill-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(100, 181, 246, 0.4);
  border-radius: 8px;
  background: rgba(100, 181, 246, 0.08);
  color: #c0d9f0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-btn:hover:not(:disabled) {
  background: rgba(100, 181, 246, 0.2);
  border-color: #64b5f6;
  color: #fff;
}

.skill-btn:disabled {
  cursor: not-allowed;
}

.skill-name {
  font-weight: 700;
}

.skill-range {
  font-size: 11px;
  color: #7ea8cc;
  font-weight: 400;
}

.skill-btn.skill-off-range {
  opacity: 0.45;
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: #777;
}

.skill-btn.skill-off-range .skill-range {
  color: #666;
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
  padding: 10px 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #c0c0c0;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.action-btn:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.move-btn {
  border-color: rgba(255, 193, 7, 0.45);
  color: #ffc107;
}

.move-btn:hover:not(:disabled) {
  background: rgba(255, 193, 7, 0.12);
  border-color: #ffc107;
}

.defend-btn {
  border-color: rgba(78, 205, 196, 0.5);
  color: #4ecdc4;
}

.defend-btn:hover:not(:disabled) {
  background: rgba(78, 205, 196, 0.1);
  border-color: #4ecdc4;
}

.observe-btn {
  border-color: rgba(100, 181, 246, 0.5);
  color: #64b5f6;
}

.observe-btn:hover:not(:disabled) {
  background: rgba(100, 181, 246, 0.1);
  border-color: #64b5f6;
}

.escape-btn {
  border-color: rgba(136, 136, 136, 0.5);
  color: #999;
}

.escape-btn:hover:not(:disabled) {
  background: rgba(136, 136, 136, 0.1);
  border-color: #aaa;
  color: #ccc;
}
</style>
