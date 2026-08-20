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

    <!-- 战斗日志区（伤害数值为可点击文本，点击弹窗查看计算过程） -->
    <div class="battle-log" ref="logRef">
      <p
        v-for="(log, idx) in logs"
        :key="idx"
        class="log-line"
        :class="logClass(log) + statusNarrClass(log)"
      >
        <template v-for="(seg, si) in logSegments(log)" :key="si">
          <span
            v-if="seg.dmg !== null"
            class="log-dmg"
            title="点击查看伤害计算详情"
            @click="openCalc(log)"
            >{{ seg.dmg }}</span
          >
          <template v-else>{{ seg.text }}</template>
        </template>
      </p>
    </div>

    <!-- 玩家技能区（攻击距离不足的技能禁用；胜利后隐藏） -->
    <div v-if="!isVictory && skills.length > 0" class="battle-skills">
      <button
        v-for="item in skills"
        :key="item.skill.id"
        class="skill-btn"
        :class="{ 'skill-off-range': !item.inRange, 'skill-on-cd': item.onCooldown }"
        :disabled="!item.inRange || item.onCooldown"
        :title="
          item.onCooldown
            ? `${item.skill.name} 冷却中（剩余 ${item.cooldown} 回合）`
            : item.skill.description
        "
        @click="onSkill(item.skill.id)"
      >
        <span class="skill-name">{{ item.skill.name }}</span>
        <span v-if="item.onCooldown" class="skill-cd">冷却 {{ item.cooldown }}</span>
        <span v-else class="skill-range">{{
          item.distance === -1 ? '∞' : `射程${item.distance}`
        }}</span>
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

    <!-- 伤害计算弹窗（点击日志中的伤害数值打开） -->
    <Transition name="item-fade">
      <div v-if="calcDetail" class="item-modal" @click.self="calcDetail = null">
        <div class="item-modal-box calc-modal">
          <div class="item-modal-header">
            <span class="item-modal-title">伤害计算</span>
            <button class="item-modal-close" title="关闭" @click="calcDetail = null">×</button>
          </div>
          <div class="calc-body">
            <div class="calc-title">
              <span class="calc-actor">{{ calcDetail.attackerLabel }}</span>
              <span class="calc-mid">使用</span>
              <span class="calc-action">{{ calcDetail.actionLabel }}</span>
              <span class="calc-mid">攻击</span>
              <span class="calc-target">{{ calcDetail.targetName }}</span>
            </div>
            <div class="calc-result" :class="{ 'calc-crit': calcDetail.isCrit }">
              {{ calcDetail.isCrit ? '暴击！' : '命中！' }}
            </div>
            <div class="calc-row">
              <span class="calc-label">伤害骰</span>
              <span class="calc-value">{{ calcDiceText(calcDetail) }}</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">伤害构成</span>
              <span class="calc-value">{{ calcExpression(calcDetail) }}</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">防御减免</span>
              <span class="calc-value">{{ calcDefenseText(calcDetail) }}</span>
            </div>
            <div class="calc-final">
              最终伤害 <span class="calc-final-num">{{ calcDetail.finalDamage }}</span>
            </div>
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
  LOG_ROLE_PLAYER,
  LOG_ROLE_ENEMY,
  LOG_CALC_SEP,
  DMG_TOKEN_START,
  DMG_TOKEN_END,
  STATUS_NARR_MARKER,
  markerToStatusType,
} from '@/engine'
import type { BattleEnemy, DamageCalcDetail } from '@/engine'
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
  /** 玩家技能剩余冷却（技能ID → 剩余回合数） */
  skillCooldowns: Record<string, number>
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

/** 当前查看的伤害计算详情（null=弹窗关闭） */
const calcDetail = ref<DamageCalcDetail | null>(null)

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

/** 玩家战斗技能（含普攻），附带解析后的射程、当前距离可用性与剩余冷却 */
const skills = computed(() =>
  getPlayerBattleSkills(props.player).map((skill) => {
    const skillDistance = getPlayerBattleSkillDistance(props.player, skill)
    const cooldown = props.skillCooldowns[skill.id] ?? 0
    return {
      skill,
      distance: skillDistance,
      inRange: canSkillHitAtDistance(skillDistance, props.distance),
      cooldown,
      onCooldown: cooldown > 0,
    }
  }),
)

/** 状态着色标记字符集合（用于识别状态叙事日志行） */
const STATUS_MARKERS = Object.values(STATUS_NARR_MARKER)

/** 日志角色样式类（我方绿 / 敌方红，颜色随昼夜主题变量自适应） */
function logClass(log: string): string {
  if (isNarrLog(log)) return ''
  if (log.startsWith(LOG_ROLE_PLAYER)) return 'log-player'
  if (log.startsWith(LOG_ROLE_ENEMY)) return 'log-enemy'
  return ''
}

/** 状态叙事日志：以状态着色标记字符开头 */
function isNarrLog(log: string): boolean {
  return STATUS_MARKERS.includes(log[0] ?? '')
}

/** 状态叙事样式类（buff/debuff/neutral/special） */
function statusNarrClass(log: string): string {
  if (!isNarrLog(log)) return ''
  const type = markerToStatusType(log[0] ?? '')
  return ` log-status ${type}`
}

/** 剥离日志角色前缀与状态着色标记，仅保留正文 */
function logText(log: string): string {
  let t = log
  if (t.startsWith(LOG_ROLE_PLAYER)) t = t.slice(LOG_ROLE_PLAYER.length)
  else if (t.startsWith(LOG_ROLE_ENEMY)) t = t.slice(LOG_ROLE_ENEMY.length)
  if (isNarrLog(t)) t = t.slice(1)
  return t
}

/** 解析日志行：正文 + 计算详情（可能为空） */
function parseLog(log: string): { text: string; calc: DamageCalcDetail | null } {
  const raw = logText(log)
  const sep = raw.indexOf(LOG_CALC_SEP)
  if (sep === -1) return { text: raw, calc: null }
  const text = raw.slice(0, sep)
  try {
    return { text, calc: JSON.parse(raw.slice(sep + LOG_CALC_SEP.length)) as DamageCalcDetail }
  } catch {
    return { text, calc: null }
  }
}

/** 将日志正文按 ⟦伤害数值⟧ 分段，供模板渲染可点击的伤害文本 */
function logSegments(log: string): { text: string; dmg: number | null }[] {
  const { text } = parseLog(log)
  const segments: { text: string; dmg: number | null }[] = []
  const parts = text.split(DMG_TOKEN_START)
  parts.forEach((part, i) => {
    if (i === 0) {
      if (part) segments.push({ text: part, dmg: null })
      return
    }
    const endIdx = part.indexOf(DMG_TOKEN_END)
    if (endIdx === -1) {
      segments.push({ text: DMG_TOKEN_START + part, dmg: null })
      return
    }
    const value = Number(part.slice(0, endIdx))
    segments.push({ text: '', dmg: Number.isFinite(value) ? value : null })
    const rest = part.slice(endIdx + DMG_TOKEN_END.length)
    if (rest) segments.push({ text: rest, dmg: null })
  })
  return segments
}

/** 点击伤害数值：解析并打开计算详情弹窗 */
function openCalc(log: string): void {
  calcDetail.value = parseLog(log).calc
}

/** 格式化数值：整数直接显示，小数保留 1 位 */
function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/** 伤害骰文本（直接伤害无骰子表达式） */
function calcDiceText(c: DamageCalcDetail): string {
  if (!c.dice) return `固定伤害 ${fmtNum(c.diceValue)}`
  const critMark = c.isCrit ? '（暴击取满）' : ''
  return `${c.dice} → ${fmtNum(c.diceValue)}${critMark}`
}

/** 伤害构成式子：骰值 ×倍率 +固定 +属性 = 原始伤害 */
function calcExpression(c: DamageCalcDetail): string {
  const parts = [fmtNum(c.diceValue)]
  if (c.damageMultiplier !== 1) parts.push(`×${fmtNum(c.damageMultiplier)}`)
  if (c.bonusDamage !== 0) parts.push(`${c.bonusDamage > 0 ? '+' : ''}${fmtNum(c.bonusDamage)}`)
  if (c.attributeBonus !== 0) {
    parts.push(`${c.attributeBonus > 0 ? '+' : ''}${c.attributeBonus}(属性)`)
  }
  return `${parts.join(' ')} = ${fmtNum(c.rawDamage)}`
}

/** 防御减免文本 */
function calcDefenseText(c: DamageCalcDetail): string {
  if (c.penetration >= 1) return `无视防御 → ${c.finalDamage}`
  if (c.effectiveDefense === 0) return `无减免 → ${c.finalDamage}`
  const pen = Math.round(c.penetration * 100)
  const penMark = pen > 0 ? `（穿透${pen}%）` : ''
  return `减免${Math.round(c.effectiveDefense * 100)}%${penMark} → ${c.finalDamage}`
}

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
  const cfg = getRegistry().getStatus(statusId)
  return cfg?.description?.tooltip ?? cfg?.name ?? ''
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
  color: var(--special);
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
  border: 2px solid var(--special);
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
  border: 1px solid var(--special);
  color: var(--special);
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
  background: var(--madness-bg);
  border: 1px solid var(--madness);
  color: var(--madness);
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
  color: var(--danger);
}

/* 蓄力中标签 */
.enemy-charging {
  padding: 1px 8px;
  border-radius: 10px;
  background: var(--special-bg);
  border: 1px solid rgba(255, 152, 0, 0.5);
  color: var(--special);
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

/* 我方行动（绿字）/ 敌方行动（红字）——颜色取自昼夜主题令牌，自动适配明暗背景 */
.log-player {
  color: var(--link);
}

.log-enemy {
  color: var(--danger);
}

/* 状态叙事日志着色（buff绿 / debuff红 / neutral灰 / special紫，随主题变量自适应） */
.log-status.buff {
  color: var(--rc-suf);
}
.log-status.debuff {
  color: var(--rc-crit);
}
.log-status.neutral {
  color: var(--ink-weak);
}
.log-status.special {
  color: var(--madness);
}

.log-line:first-child {
  margin-top: 0;
}

/* 可点击伤害数值（点击弹窗查看计算过程） */
.log-dmg {
  display: inline-block;
  margin: 0 2px;
  padding: 0 6px;
  font-weight: 800;
  color: var(--danger);
  background: var(--danger-bg);
  border: 1px solid var(--danger-bg-hover);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.log-dmg:hover {
  color: var(--text-primary);
  background: var(--danger-bg-hover);
  box-shadow: 0 0 8px var(--danger-bg-hover);
}

/* ---- 伤害计算弹窗 ---- */
.calc-modal {
  width: min(400px, 92%);
}

.calc-body {
  padding: 14px 18px 18px;
}

.calc-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.calc-actor {
  font-weight: 800;
  color: var(--link);
}

.calc-action {
  font-weight: 700;
  color: var(--special);
}

.calc-target {
  font-weight: 700;
  color: var(--danger);
}

.calc-mid {
  color: var(--text-muted);
  font-size: 12px;
}

.calc-result {
  display: inline-block;
  margin-bottom: 12px;
  padding: 2px 12px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  color: var(--link);
  border: 1px solid var(--link);
  border-radius: 6px;
}

.calc-result.calc-crit {
  color: var(--special);
  border-color: var(--special);
}

.calc-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 7px 0;
  border-top: 1px dashed var(--line-soft);
  font-size: 13px;
}

.calc-label {
  flex-shrink: 0;
  width: 62px;
  color: var(--text-muted);
  font-size: 12px;
}

.calc-value {
  color: var(--text-primary);
  word-break: break-all;
}

.calc-final {
  margin-top: 12px;
  padding: 8px 12px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bar-bg);
  border-radius: 8px;
}

.calc-final-num {
  font-size: 22px;
  font-weight: 900;
  color: var(--danger);
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

.skill-cd {
  font-size: 11px;
  color: var(--danger);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.skill-btn.skill-on-cd {
  opacity: 0.55;
  border-color: var(--border-weak);
  background: var(--card-bg);
  color: var(--text-muted);
}

.skill-btn.skill-on-cd .skill-name {
  color: var(--text-muted);
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
  border-color: var(--special);
  color: var(--special);
}

.move-btn:hover:not(:disabled) {
  background: var(--special-bg);
  border-color: var(--special);
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
  border-color: var(--rc-suf);
  color: var(--rc-suf);
}

.item-btn:hover:not(:disabled) {
  background: var(--accent-bg);
  border-color: var(--rc-suf);
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
  color: var(--special);
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.45);
  letter-spacing: 2px;
}

.end-battle-btn {
  flex: none;
  width: 220px;
  border-color: var(--special);
  color: var(--special);
}

.end-battle-btn:hover:not(:disabled) {
  background: var(--special-bg);
  border-color: var(--special);
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
  color: var(--special);
}
.g-heal {
  color: var(--rc-suf);
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
  border-color: var(--special);
  color: var(--special);
  background: var(--special-bg);
}
.b-throw:hover {
  background: var(--special-bg-hover);
  border-color: var(--special);
}
.b-heal {
  border-color: var(--rc-suf);
  color: var(--rc-suf);
  background: var(--accent-bg);
}
.b-heal:hover {
  background: var(--accent-bg-hover);
  border-color: var(--rc-suf);
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
