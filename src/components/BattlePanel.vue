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
          <span class="enemy-badges">
            <span
              v-if="enemy.instanceId === effectiveTargetId && enemy.hp > 0"
              class="enemy-target-tag"
              >当前目标</span
            >
            <span v-else-if="enemy.chargingSkillId" class="enemy-charging">蓄力中</span>
            <span
              v-for="st in enemy.statuses"
              :key="st.statusId"
              class="enemy-status"
              :title="statusDesc(st.statusId)"
            >
              {{ statusName(st.statusId) }}{{ st.stacks > 1 ? `×${st.stacks}` : '' }}
            </span>
          </span>
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

    <!-- 玩家技能区（攻击距离不足的技能禁用；胜利后隐藏） -->
    <div v-if="!isVictory && skills.length > 0" class="battle-skills">
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

    <!-- 操作按钮区（胜利后隐藏） -->
    <div v-if="!isVictory" class="battle-actions">
      <button class="action-btn move-btn" :disabled="distance <= 1" @click="onAction('moveCloser')">
        靠近
      </button>
      <button class="action-btn move-btn" :disabled="distance >= 5" @click="onAction('moveAway')">
        远离
      </button>
      <button class="action-btn defend-btn" @click="onAction('defend')">防守</button>
      <button class="action-btn item-btn" @click="showItemPanel = true">物品</button>
      <button class="action-btn escape-btn" @click="onAction('escape')">逃跑</button>
    </div>

    <!-- 战斗胜利区：隐藏操作栏，改为"结束战斗"按钮 -->
    <div v-else class="battle-victory">
      <span class="victory-banner">战斗胜利！</span>
      <button class="action-btn end-battle-btn" @click="onEndBattle">结束战斗</button>
    </div>

    <!-- 物品选择面板（三类分区：投掷武器 / 药品 / 道具） -->
    <Transition name="item-fade">
      <div v-if="showItemPanel" class="item-modal" @click.self="showItemPanel = false">
        <div class="item-modal-box">
          <div class="item-modal-header">
            <span class="item-modal-title">选择物品</span>
            <button class="item-modal-close" title="关闭" @click="showItemPanel = false">×</button>
          </div>
          <div class="item-modal-body">
            <div v-if="throwWeapons.length" class="item-group">
              <div class="item-group-title g-throw">🗡️ 投掷武器</div>
              <div v-for="item in throwWeapons" :key="item.instanceId" class="item-row">
                <span class="item-row-name">{{ itemName(item) }}</span>
                <span class="item-row-qty">×{{ item.quantity }}</span>
                <button class="item-row-btn b-throw" @click="onUseItem(item.instanceId)">
                  投掷
                </button>
              </div>
            </div>
            <div v-if="medicines.length" class="item-group">
              <div class="item-group-title g-heal">💊 药品</div>
              <div v-for="item in medicines" :key="item.instanceId" class="item-row">
                <span class="item-row-name">{{ itemName(item) }}</span>
                <span class="item-row-qty">×{{ item.quantity }}</span>
                <button class="item-row-btn b-heal" @click="onUseItem(item.instanceId)">
                  治疗
                </button>
              </div>
            </div>
            <div v-if="tools.length" class="item-group">
              <div class="item-group-title g-tool">🧪 道具</div>
              <div v-for="item in tools" :key="item.instanceId" class="item-row">
                <span class="item-row-name">{{ itemName(item) }}</span>
                <span class="item-row-qty">×{{ item.quantity }}</span>
                <button class="item-row-btn b-tool" @click="onUseItem(item.instanceId)">
                  使用
                </button>
              </div>
            </div>
            <p
              v-if="throwWeapons.length === 0 && medicines.length === 0 && tools.length === 0"
              class="item-empty"
            >
              背包里没有可用于战斗的物品
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  PlayerActionType,
  BattleResult,
  getRegistry,
  getPlayerBattleSkills,
  getPlayerBattleSkillDistance,
  canSkillHitAtDistance,
} from '@/engine'
import type { BattleEnemy } from '@/engine'
import type { PlayerState, PlayerInventoryItem } from '@/types/player'
import { ItemCategory, ConsumableType } from '@/types/item'
import type { Item, ConsumableItem } from '@/types/item'

const props = defineProps<{
  enemies: BattleEnemy[]
  logs: string[]
  /** 当前敌我距离（1-5） */
  distance: number
  /** 玩家状态（用于列出技能与计算射程） */
  player: PlayerState
  /** 玩家当前选中的攻击目标实例ID（null=自动取第一个存活敌人） */
  targetEnemyId: string | null
  /** 战斗结果（胜利后隐藏操作栏并显示"结束战斗"按钮） */
  result: BattleResult
}>()

const emit = defineEmits<{
  (e: 'action', actionType: PlayerActionType, skillId?: string, itemInstanceId?: string): void
  (e: 'selectTarget', enemyId: string): void
}>()

/** 战斗日志容器引用（用于自动滚动到底部） */
const logRef = ref<HTMLElement | null>(null)

/** 物品选择面板是否打开 */
const showItemPanel = ref(false)

/** 是否战斗胜利（胜利后隐藏操作栏，显示"结束战斗"按钮） */
const isVictory = computed(() => props.result === BattleResult.VICTORY)

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

// ── 战斗可用物品（三类：投掷武器 / 药品 / 道具） ──

function getItemConfig(itemId: string): Item | undefined {
  return getRegistry().getItem(itemId)
}

/** 未装备武器 → 投掷 */
const throwWeapons = computed(() =>
  props.player.inventory.filter(
    (i) =>
      i.quantity > 0 &&
      !i.equippedSlot &&
      getItemConfig(i.itemId)?.category === ItemCategory.WEAPON,
  ),
)

/** 药品（consumableType = medicine）→ 治疗 */
const medicines = computed(() =>
  props.player.inventory.filter(
    (i) =>
      i.quantity > 0 &&
      getItemConfig(i.itemId)?.category === ItemCategory.CONSUMABLE &&
      isConsumableType(i.itemId, ConsumableType.MEDICINE),
  ),
)

/** 道具（consumableType = consumableTool）→ 使用 */
const tools = computed(() =>
  props.player.inventory.filter(
    (i) =>
      i.quantity > 0 &&
      getItemConfig(i.itemId)?.category === ItemCategory.CONSUMABLE &&
      isConsumableType(i.itemId, ConsumableType.TOOL),
  ),
)

function isConsumableType(itemId: string, type: ConsumableType): boolean {
  const cfg = getItemConfig(itemId)
  return cfg !== undefined && 'consumableType' in cfg && cfg.consumableType === type
}

function itemName(item: PlayerInventoryItem): string {
  return getItemConfig(item.itemId)?.name ?? item.itemId
}

/** 敌人状态显示名与描述 */
function statusName(statusId: string): string {
  return getRegistry().getStatus(statusId)?.name ?? statusId
}

function statusDesc(statusId: string): string {
  return getRegistry().getStatus(statusId)?.description ?? ''
}

/** 点击物品：使用并关闭面板（物品实例ID随 action 事件透传） */
function onUseItem(instanceId: string): void {
  showItemPanel.value = false
  emit('action', PlayerActionType.USE_ITEM, undefined, instanceId)
}

/** 战斗结束（非进行中）时自动关闭物品面板 */
watch(
  () => props.result,
  (r) => {
    if (r !== BattleResult.ONGOING) showItemPanel.value = false
  },
)

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

/** 点击"结束战斗"：结算胜利奖励并退出战斗 */
function onEndBattle(): void {
  emit('action', PlayerActionType.END_BATTLE)
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
  color: var(--text-primary);
  background: var(--panel-bg);
  font-family: 'FangSong', 'STFangsong', 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
  position: relative;
}

/* ---- 敌我距离条 ---- */
.battle-distance {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  border-bottom: 1px solid var(--border-weak);
  background: var(--bar-bg);
  flex-shrink: 0;
}

.dist-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
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
  background: var(--sub-bg);
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
  border-bottom: 1px solid var(--border-weak);
  background: var(--sub-bg);
}

.enemy-card {
  margin-bottom: 10px;
  padding: 10px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border-weak);
  border-radius: 8px;
  transition: all 0.25s;
  box-shadow: 0 1px 3px var(--shadow);
}

.enemy-card:last-child {
  margin-bottom: 0;
}

.enemy-card.enemy-selectable {
  cursor: pointer;
}

.enemy-card.enemy-selectable:hover {
  background: var(--card-hover);
  border-color: var(--border-mid);
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

/* 敌人头部右侧标签容器 */
.enemy-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

/* 敌人身上的状态徽章 */
.enemy-status {
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(170, 90, 255, 0.18);
  border: 1px solid rgba(170, 90, 255, 0.45);
  color: #c9a0ff;
  font-size: 11px;
  font-weight: 600;
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
  color: var(--text-muted);
  width: 22px;
  text-align: right;
  font-weight: 600;
}

.hp-bar-bg {
  flex: 1;
  height: 16px;
  background: var(--sub-bg);
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
  color: var(--text-primary);
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
  border-top: 1px solid var(--border-weak);
  background: var(--bar-bg);
  flex-shrink: 0;
}

.skill-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--special);
  border-radius: 8px;
  background: var(--special-bg);
  color: var(--special);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-btn:hover:not(:disabled) {
  background: var(--special-bg-hover);
  border-color: var(--special);
  color: var(--text-primary);
}

.skill-btn:disabled {
  cursor: not-allowed;
}

.skill-name {
  font-weight: 700;
}

.skill-range {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
}

.skill-btn.skill-off-range {
  opacity: 0.45;
  border-color: var(--border-weak);
  background: var(--card-bg);
  color: var(--text-muted);
}

.skill-btn.skill-off-range .skill-range {
  color: var(--text-muted);
}

/* ---- 操作按钮 ---- */
.battle-actions {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border-weak);
  background: var(--sub-bg);
}

.action-btn {
  flex: 1;
  padding: 10px 4px;
  border: 1px solid var(--border-mid);
  border-radius: 8px;
  background: var(--btn-bg);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  box-shadow: 0 1px 2px var(--shadow);
}

.action-btn:hover:not(:disabled) {
  background: var(--card-hover);
  border-color: var(--border-mid);
  color: var(--text-primary);
  box-shadow: 0 2px 6px var(--shadow);
}

.action-btn:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 1px 1px var(--shadow);
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
  border-color: var(--accent);
  color: var(--accent);
}

.defend-btn:hover:not(:disabled) {
  background: var(--accent-bg-hover);
  border-color: var(--accent);
}

.item-btn {
  border-color: rgba(139, 195, 74, 0.5);
  color: #8bc34a;
}

.item-btn:hover:not(:disabled) {
  background: rgba(139, 195, 74, 0.12);
  border-color: #8bc34a;
}

.escape-btn {
  border-color: var(--border-mid);
  color: var(--text-muted);
}

.escape-btn:hover:not(:disabled) {
  background: var(--btn-bg);
  border-color: var(--border-mid);
  color: var(--text-secondary);
}

/* ---- 战斗胜利区 ---- */
.battle-victory {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 14px 20px 16px;
  border-top: 1px solid var(--border-weak);
  background: var(--sub-bg);
  flex-shrink: 0;
}

.victory-banner {
  font-size: 18px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.45);
  letter-spacing: 2px;
}

.end-battle-btn {
  flex: none;
  width: 220px;
  border-color: rgba(255, 215, 0, 0.6);
  color: #ffd700;
}

.end-battle-btn:hover:not(:disabled) {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
  color: #fff;
}

/* ---- 物品选择面板 ---- */
.item-modal {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}

.item-modal-box {
  width: min(360px, 92%);
  max-height: 82%;
  display: flex;
  flex-direction: column;
  background: var(--panel-bg);
  border: 1px solid var(--border-mid);
  border-radius: 12px;
  box-shadow: 0 12px 40px var(--shadow-strong);
  overflow: hidden;
}

.item-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-weak);
  background: var(--bar-bg);
  flex-shrink: 0;
}

.item-modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.item-modal-close {
  width: 26px;
  height: 26px;
  border: 1px solid var(--border-mid);
  border-radius: 6px;
  background: var(--btn-bg);
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s;
}
.item-modal-close:hover {
  background: var(--card-hover);
  color: var(--text-primary);
}

.item-modal-body {
  padding: 10px 14px 14px;
  overflow-y: auto;
}

.item-group {
  margin-top: 10px;
}
.item-group:first-child {
  margin-top: 2px;
}

.item-group-title {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 6px;
}
.g-throw {
  color: #ffa726;
}
.g-heal {
  color: #66bb6a;
}
.g-tool {
  color: var(--special);
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--card-bg);
  border: 1px solid var(--border-weak);
  margin-bottom: 6px;
  transition: background 0.15s;
}
.item-row:hover {
  background: var(--card-hover);
}

.item-row-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-row-qty {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.item-row-btn {
  flex-shrink: 0;
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.15s;
}
.b-throw {
  border-color: rgba(255, 167, 38, 0.5);
  color: #ffa726;
  background: rgba(255, 167, 38, 0.08);
}
.b-throw:hover {
  background: rgba(255, 167, 38, 0.18);
  border-color: #ffa726;
}
.b-heal {
  border-color: rgba(102, 187, 106, 0.5);
  color: #66bb6a;
  background: rgba(102, 187, 106, 0.08);
}
.b-heal:hover {
  background: rgba(102, 187, 106, 0.18);
  border-color: #66bb6a;
}
.b-tool {
  border-color: var(--special);
  color: var(--special);
  background: var(--special-bg);
}
.b-tool:hover {
  background: var(--special-bg-hover);
  border-color: var(--special);
}

.item-empty {
  margin: 24px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

/* 面板过渡 */
.item-fade-enter-active,
.item-fade-leave-active {
  transition: opacity 0.18s ease;
}
.item-fade-enter-from,
.item-fade-leave-to {
  opacity: 0;
}
</style>
