<!-- RollResultPanel.vue - 掷骰判定结果面板
     用于 rollResult 判定帧：骰子滚动动画 + 醒目的判定结果横幅
     顶部展示选项描述，固定"继续"按钮执行分支结果 -->
<template>
  <div class="roll-panel">
    <!-- 选项描述（顶部） -->
    <div v-if="info.description" class="roll-desc">{{ info.description }}</div>

    <!-- 检定标题 -->
    <div class="roll-title">【{{ info.attribute }}检定】</div>

    <!-- 骰子区（奖励/惩罚骰时显示多个 d100） -->
    <div class="dice-stage">
      <div class="dice-row">
        <div
          v-for="(_, i) in diceCount"
          :key="i"
          class="dice"
          :class="[
            !settled ? 'rolling' : selectedIndices.has(i) ? 'dice-' + info.outcome : 'dice-dim',
          ]"
        >
          <span class="d20-num">{{ settled ? info.rolls[i] : rollDisplay[i] }}</span>
          <span v-if="info.bonusDice !== 0 && settled" class="d20-label">
            {{ selectedIndices.has(i) ? (info.bonusDice > 0 ? '取小' : '取大') : '' }}
          </span>
        </div>
      </div>
      <div v-if="info.bonusDice !== 0" class="dice-note">
        奖励/惩罚骰 ×{{ Math.abs(info.bonusDice) }}（{{
          info.bonusDice > 0 ? '取最小' : '取最大'
        }}）
      </div>
    </div>

    <!-- 属性与要求信息 -->
    <div class="roll-meta">属性 {{ info.attribute }} {{ info.attributeValue }}</div>
    <div v-for="(r, i) in info.modifierReasons" :key="i" class="roll-reason">· {{ r }}</div>

    <!-- 投掷与结果（骰子定格后出现） -->
    <transition name="pop">
      <div v-if="settled" class="roll-footer">
        <div class="total-line">
          投掷 <b>{{ info.finalRoll }}</b> ／ 要求 {{ requirementText }}
        </div>
        <div class="roll-result" :class="'result-' + info.outcome">{{ outcomeText }}</div>
      </div>
    </transition>

    <!-- 继续按钮 -->
    <button class="continue-btn" @click="emit('continue')">继续</button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { RollResultInfo } from '@/runtime/useGame'

const props = defineProps<{
  info: RollResultInfo
}>()

const emit = defineEmits<{
  (e: 'continue'): void
}>()

/** 判定结果文案 */
const OUTCOME_LABELS: Record<RollResultInfo['outcome'], string> = {
  bigSuccess: '大成功！',
  success: '成功',
  fail: '失败',
  bigFail: '大失败！',
}

/** 判定要求文本（按难度等级） */
const requirementText = computed(() => {
  const v = props.info.attributeValue
  if (props.info.dc === 1) return `困难成功（≤ ${Math.floor(v / 2)}）`
  if (props.info.dc === 2) return `极难成功（≤ ${Math.floor(v / 5)}）`
  return `成功（≤ ${v}）`
})

/** 判定结果文案 */
const outcomeText = computed(() => OUTCOME_LABELS[props.info.outcome])

/** 骰子数量（奖励/惩罚骰时 >1） */
const diceCount = computed(() => Math.max(props.info.rolls.length, 1))

/** 滚动中的骰子显示值 */
const rollDisplay = ref<number[]>([])

/** 最终选中的骰子下标集合（奖励取最小/惩罚取最大） */
const selectedIndices = computed(() => {
  const set = new Set<number>()
  if (!settled.value) return set
  props.info.rolls.forEach((v, i) => {
    if (v === props.info.finalRoll) set.add(i)
  })
  return set
})

/** 是否已定格（骰子滚动结束，显示结果） */
const settled = ref(false)

let rollTimer: number | undefined

/** 骰子滚动动画：每个骰子随机跳动约 1 秒后定格真实结果 */
function startRoll(): void {
  rollDisplay.value = Array.from(
    { length: diceCount.value },
    () => Math.floor(Math.random() * 100) + 1,
  )
  const start = performance.now()
  const tick = () => {
    rollDisplay.value = rollDisplay.value.map(() => Math.floor(Math.random() * 100) + 1)
    if (performance.now() - start < 300) {
      rollTimer = window.setTimeout(tick, 10)
    } else {
      settled.value = true
    }
  }
  tick()
}

onMounted(startRoll)
onBeforeUnmount(() => {
  if (rollTimer) window.clearTimeout(rollTimer)
})
</script>

<style scoped>
.roll-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  overflow-y: auto;
  padding: 1.2rem 1.5rem;
  color: var(--text-primary);
  text-align: center;
}

/* 选项描述（顶部，斜体） */
.roll-desc {
  width: 100%;
  font-style: italic;
  background: rgba(0, 0, 0, 0.25);
  border-radius: var(--radius-sm);
  padding: 0.5em 0.8em;
  margin-bottom: 0.8rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: var(--font-md);
  color: var(--text-secondary);
}

/* 检定标题 */
.roll-title {
  font-size: 1.3rem;
  letter-spacing: 0.15em;
  margin: 0.2rem 0 1rem;
  color: var(--text-secondary);
}

/* 骰子区 */
.dice-stage {
  margin: 0.4rem 0 1rem;
}

/* 多骰子横向排列 */
.dice-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
}

/* 骰子卡片 */
.dice {
  position: relative;
  width: 92px;
  height: 92px;
  border-radius: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.07);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

/* 未被选中的骰子（奖励/惩罚骰时） */
.dice-dim {
  opacity: 0.35;
  filter: saturate(0.4);
}

/* 滚动中：抖动 + 呼吸脉冲 */
.dice.rolling {
  animation: dice-shake 0.12s infinite alternate;
}

@keyframes dice-shake {
  from {
    transform: translate(-3px, -2px) rotate(-2deg) scale(0.98);
  }
  to {
    transform: translate(3px, 2px) rotate(2deg) scale(1.02);
  }
}

/* 定格后按结果染色 */
.dice-bigSuccess {
  border-color: #ffd54f;
  background: rgba(255, 213, 79, 0.16);
  box-shadow: 0 0 28px rgba(255, 213, 79, 0.35);
  animation: dice-land 0.35s ease;
}

.dice-success {
  border-color: #66bb6a;
  background: rgba(102, 187, 106, 0.14);
  box-shadow: 0 0 24px rgba(102, 187, 106, 0.3);
  animation: dice-land 0.35s ease;
}

.dice-fail {
  border-color: #ef5350;
  background: rgba(239, 83, 80, 0.14);
  box-shadow: 0 0 20px rgba(239, 83, 80, 0.25);
  animation: dice-land 0.35s ease;
}

.dice-bigFail {
  border-color: #ab47bc;
  background: rgba(171, 71, 188, 0.16);
  box-shadow: 0 0 26px rgba(171, 71, 188, 0.35);
  animation: dice-land 0.35s ease;
}

@keyframes dice-land {
  0% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}

.d20-num {
  font-size: 2.6rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
  color: var(--text-primary);
}

.d20-label {
  margin-top: 0.2rem;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: var(--text-secondary);
  text-transform: uppercase;
}

/* 奖励/惩罚骰说明 */
.dice-note {
  margin-top: 0.6rem;
  font-size: var(--font-sm);
  color: var(--text-tertiary);
}

/* 属性与修正 */
.roll-meta {
  font-size: var(--font-md);
  color: var(--text-secondary);
  margin-bottom: 0.3rem;
}

.roll-reason {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  line-height: 1.7;
}

/* 合计与结果（弹出动画） */
.roll-footer {
  margin-top: 1rem;
}

.pop-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.pop-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.92);
}

.total-line {
  font-size: var(--font-md);
  color: var(--text-secondary);
  margin-bottom: 0.7rem;
}

.total-line b {
  color: var(--text-primary);
  font-size: 1.1em;
}

/* 结果横幅 */
.roll-result {
  font-size: 2.1rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1.2;
}

.result-bigSuccess {
  color: #ffd54f;
  text-shadow:
    0 0 18px rgba(255, 213, 79, 0.6),
    0 2px 4px rgba(0, 0, 0, 0.5);
}

.result-success {
  color: #81c784;
  text-shadow:
    0 0 14px rgba(102, 187, 106, 0.55),
    0 2px 4px rgba(0, 0, 0, 0.5);
}

.result-fail {
  color: #ef5350;
  text-shadow:
    0 0 12px rgba(239, 83, 80, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.5);
}

.result-bigFail {
  color: #ce93d8;
  text-shadow:
    0 0 16px rgba(171, 71, 188, 0.6),
    0 2px 4px rgba(0, 0, 0, 0.5);
}

/* 继续按钮（与 EventPanel 风格一致） */
.continue-btn {
  margin-top: 1.4rem;
  min-height: 48px;
  width: 100%;
  max-width: 420px;
  padding: 0.6rem 1.15rem;
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  font-size: var(--font-md);
  letter-spacing: 0.03em;
  cursor: pointer;
  transition:
    all var(--transition-fast),
    transform 0.12s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.continue-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}

.continue-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
</style>
