<!-- AttributesPanel.vue - 属性面板
     显示玩家基础属性、防御、系数、技能、统计信息 -->
<template>
  <div class="attributes-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h2 class="panel-title">角色属性</h2>
      <span class="player-class">{{ className }}</span>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="panel-body">
      <!-- ═══════ 基础属性 ═══════ -->
      <section class="attr-section">
        <h3 class="section-title">基础属性</h3>
        <div class="attr-grid">
          <div class="attr-item">
            <span class="attr-label">力量</span>
            <span class="attr-value">{{ baseStr }}</span>
            <span v-if="strMod !== 0" class="attr-mod" :class="modClass(strMod)">
              {{ strMod > 0 ? '+' : '' }}{{ strMod }}
            </span>
          </div>
          <div class="attr-item">
            <span class="attr-label">敏捷</span>
            <span class="attr-value">{{ baseAgi }}</span>
            <span v-if="agiMod !== 0" class="attr-mod" :class="modClass(agiMod)">
              {{ agiMod > 0 ? '+' : '' }}{{ agiMod }}
            </span>
          </div>
          <div class="attr-item">
            <span class="attr-label">智力</span>
            <span class="attr-value">{{ baseInt }}</span>
            <span v-if="intMod !== 0" class="attr-mod" :class="modClass(intMod)">
              {{ intMod > 0 ? '+' : '' }}{{ intMod }}
            </span>
          </div>
          <div class="attr-item">
            <span class="attr-label">体质</span>
            <span class="attr-value">{{ baseCon }}</span>
            <span v-if="conMod !== 0" class="attr-mod" :class="modClass(conMod)">
              {{ conMod > 0 ? '+' : '' }}{{ conMod }}
            </span>
          </div>
          <div class="attr-item">
            <span class="attr-label">幸运</span>
            <span class="attr-value">{{ baseLuk }}</span>
            <span v-if="lukMod !== 0" class="attr-mod" :class="modClass(lukMod)">
              {{ lukMod > 0 ? '+' : '' }}{{ lukMod }}
            </span>
          </div>
        </div>
      </section>

      <!-- ═══════ 生存属性概况 ═══════ -->
      <section class="attr-section">
        <h3 class="section-title">生存状态</h3>
        <div class="stat-grid">
          <div class="stat-row">
            <span class="stat-label">生命值</span>
            <span class="stat-value"
              >{{ playerState.survival.hp.toFixed(0) }} / {{ playerState.survival.maxHp }}</span
            >
          </div>
          <div class="stat-row">
            <span class="stat-label">饱食度</span>
            <span class="stat-value"
              >{{ playerState.survival.satiety.toFixed(0) }} /
              {{ playerState.survival.maxSatiety }}</span
            >
          </div>
          <div class="stat-row">
            <span class="stat-label">体力</span>
            <span class="stat-value"
              >{{ playerState.survival.stamina.toFixed(0) }} /
              {{ playerState.survival.maxStamina }}</span
            >
          </div>
          <div class="stat-row">
            <span class="stat-label">SAN</span>
            <span class="stat-value"
              >{{ playerState.survival.san.toFixed(0) }} / {{ playerState.survival.maxSan }}</span
            >
          </div>
          <div class="stat-row">
            <span class="stat-label">负重</span>
            <span class="stat-value"
              >{{ playerState.survival.carryWeight.toFixed(1) }} /
              {{ playerState.survival.maxCarryWeight.toFixed(1) }} kg</span
            >
          </div>
          <div class="stat-row">
            <span class="stat-label">温暖度</span>
            <span class="stat-value warmth-text" :class="warmthClass">{{ warmthLabel }}</span>
          </div>
        </div>
      </section>

      <!-- ═══════ 防御属性 ═══════ -->
      <section class="attr-section">
        <h3 class="section-title">防御</h3>
        <div class="attr-grid cols-3">
          <div v-for="dt in defenseTypes" :key="dt.id" class="attr-item">
            <span class="attr-label">{{ dt.name }}</span>
            <span class="attr-value def-value">{{ formatDefense(totalDefenses[dt.id] ?? 0) }}</span>
          </div>
        </div>
      </section>

      <!-- ═══════ 系数属性 ═══════ -->
      <section class="attr-section">
        <h3 class="section-title">系数</h3>
        <div class="coeff-grid">
          <div class="coeff-row">
            <span class="coeff-label">恢复速率</span>
            <span class="coeff-value">{{ coeffs.recoveryRateCoefficient.toFixed(2) }}</span>
          </div>
          <div class="coeff-row">
            <span class="coeff-label">体力消耗</span>
            <span class="coeff-value">{{ coeffs.staminaConsumptionCoefficient.toFixed(2) }}</span>
          </div>
          <div class="coeff-row">
            <span class="coeff-label">体力恢复</span>
            <span class="coeff-value">{{ coeffs.staminaRecoveryCoefficient.toFixed(2) }}</span>
          </div>
          <div class="coeff-row">
            <span class="coeff-label">负重修正</span>
            <span class="coeff-value">{{ coeffs.carryWeightModifier.toFixed(1) }} kg</span>
          </div>
          <div class="coeff-row">
            <span class="coeff-label">SAN恢复</span>
            <span class="coeff-value">{{ coeffs.sanRecoveryCoefficient.toFixed(2) }}</span>
          </div>
        </div>
      </section>

      <!-- ═══════ 统计 ═══════ -->
      <section class="attr-section">
        <h3 class="section-title">统计</h3>
        <div class="stat-grid">
          <div class="stat-row">
            <span class="stat-label">击杀敌人</span>
            <span class="stat-value">{{ stats.enemiesKilled }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">战斗次数</span>
            <span class="stat-value">{{ stats.totalBattles }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">制作物品</span>
            <span class="stat-value">{{ stats.itemsCrafted }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">烹饪次数</span>
            <span class="stat-value">{{ stats.mealsCooked }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">建造建筑</span>
            <span class="stat-value">{{ stats.buildingsConstructed }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">探索场景</span>
            <span class="stat-value">{{ stats.scenesExplored }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">触发事件</span>
            <span class="stat-value">{{ stats.eventsTriggered }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">金币</span>
            <span class="stat-value gold-value">{{ playerState.gold }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerState } from '@/types/player'
import type { DamageTypeId } from '@/types/damage'
import { getRegistry, calcPlayerTotalDefense } from '@/engine'

const props = defineProps<{
  playerState: PlayerState
}>()

defineEmits<{
  (e: 'close'): void
}>()

const registry = getRegistry()

/** 职业名称 */
const className = computed<string>(() => {
  const cls = registry.getCharacterClass(props.playerState.classId)
  return cls ? cls.name : props.playerState.classId
})

// ── 基础属性 ──

const baseStr = computed(() => props.playerState.attributes.strength)
const baseAgi = computed(() => props.playerState.attributes.agility)
const baseInt = computed(() => props.playerState.attributes.intelligence)
const baseCon = computed(() => props.playerState.attributes.constitution)
const baseLuk = computed(() => props.playerState.attributes.luck)

const strMod = computed(() => props.playerState.attributes.strengthModifier)
const agiMod = computed(() => props.playerState.attributes.agilityModifier)
const intMod = computed(() => props.playerState.attributes.intelligenceModifier)
const conMod = computed(() => props.playerState.attributes.constitutionModifier)
const lukMod = computed(() => props.playerState.attributes.luckModifier)

function modClass(val: number): string {
  return val > 0 ? 'mod-positive' : 'mod-negative'
}

// ── 防御 ──

/** 可防御的伤害类型列表（排除真实伤害——穿透1，防御恒为0），用于按注册表渲染防御行 */
const defenseTypes = computed(() =>
  Object.values(registry.getAllDamageTypes())
    .filter((dt) => dt.id !== 'realDamage')
    .map((dt) => ({ id: dt.id as DamageTypeId, name: dt.name })),
)

/** 各伤害类型的总防御（基础/状态 + 已装备未破损防具，与战斗结算同一口径） */
const totalDefenses = computed<Partial<Record<DamageTypeId, number>>>(() => {
  const result: Partial<Record<DamageTypeId, number>> = {}
  for (const dt of defenseTypes.value) {
    result[dt.id] = calcPlayerTotalDefense(props.playerState, dt.id)
  }
  return result
})

/** 防御比例（0~1，负数=弱点）转百分比显示 */
function formatDefense(v: number): string {
  return `${Math.round(v * 100)}%`
}

// ── 系数 ──

const coeffs = computed(() => props.playerState.attributes.coefficients)

// ── 统计 ──

const stats = computed(() => props.playerState.statistics)

// ── 温暖度 ──

const warmthLabel = computed<string>(() => {
  const map: Record<string, string> = {
    comfortable: '舒适',
    cold: '寒冷',
    hot: '炎热',
    freezing: '严寒',
    scorching: '酷热',
  }
  return map[props.playerState.survival.warmthLevel] || '未知'
})

const warmthClass = computed<string>(() => {
  const lv = props.playerState.survival.warmthLevel
  if (lv === 'comfortable') return 'warmth-comfortable'
  if (lv === 'cold' || lv === 'freezing') return 'warmth-cold'
  if (lv === 'hot' || lv === 'scorching') return 'warmth-hot'
  return ''
})
</script>

<style scoped>
.attributes-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: var(--panel-bg);
  font-family: 'FangSong', 'STFangsong', 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
}

/* ═══════════════════════════════════════════
   头部
   ═══════════════════════════════════════════ */
.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-weak);
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.player-class {
  font-size: 12px;
  color: var(--special);
  background: var(--special-bg);
  padding: 2px 10px;
  border-radius: 4px;
  margin-right: auto;
}

.close-btn {
  padding: 4px 10px;
  border: 1px solid var(--border-mid);
  border-radius: 6px;
  background: var(--btn-bg);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.close-btn:hover {
  background: var(--card-hover);
  color: var(--text-primary);
}

/* ═══════════════════════════════════════════
   可滚动内容区
   ═══════════════════════════════════════════ */
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px 24px;
}

/* ═══════════════════════════════════════════
   区块
   ═══════════════════════════════════════════ */
.attr-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-weak);
  letter-spacing: 1px;
}

/* ═══════════════════════════════════════════
   基础属性网格
   ═══════════════════════════════════════════ */
.attr-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.attr-grid.cols-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.attr-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--card-bg);
  border: 1px solid var(--border-weak);
  border-radius: 8px;
}

.attr-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.attr-value {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-left: auto;
}

.attr-value.def-value {
  color: var(--special);
}

.attr-mod {
  font-size: 12px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
}

.mod-positive {
  color: var(--rc-suf);
  background: var(--accent-bg);
}

.mod-negative {
  color: var(--danger);
  background: var(--danger-bg);
}

/* ═══════════════════════════════════════════
   统计 / 状态 列表
   ═══════════════════════════════════════════ */
.stat-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--card-bg);
  border-radius: 6px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.gold-value {
  color: var(--special);
}

.warmth-text {
  font-size: 13px;
  font-weight: 600;
}
.warmth-comfortable {
  color: var(--accent, #81c784);
}
.warmth-cold {
  color: var(--link);
}
.warmth-hot {
  color: var(--danger);
}

/* ═══════════════════════════════════════════
   系数列表
   ═══════════════════════════════════════════ */
.coeff-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.coeff-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--card-bg);
  border-radius: 6px;
}

.coeff-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.coeff-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}
</style>
