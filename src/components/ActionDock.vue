<script setup lang="ts">
export interface DockButton {
  id: string
  label: string
  disabled?: boolean
  primary?: boolean
  offset?: boolean
}

defineProps<{
  systemButtons: DockButton[]
  sceneButtons: DockButton[]
  interactionMode?: boolean
}>()

const emit = defineEmits<{
  press: [id: string]
}>()
</script>

<template>
  <footer class="dock" :class="{ interaction: interactionMode }">
    <div v-if="!interactionMode" class="col system">
      <button
        v-for="btn in systemButtons"
        :key="btn.id"
        type="button"
        class="btn system-btn"
        :disabled="btn.disabled"
        @click="emit('press', btn.id)"
      >
        <span class="btn-icon">
          {{ btn.id === 'system' ? '⚙️' : btn.id === 'inventory' ? '🎒' : btn.id === 'stats' ? '📊' : '⭐' }}
        </span>
        <span class="btn-label">{{ btn.label }}</span>
      </button>
    </div>
    <div class="col scene" :class="{ full: interactionMode }">
      <button
        v-for="btn in sceneButtons"
        :key="btn.id"
        type="button"
        class="btn"
        :class="{ primary: btn.primary, offset: btn.offset }"
        :disabled="btn.disabled"
        @click="emit('press', btn.id)"
      >
        {{ btn.label }}
      </button>
    </div>
  </footer>
</template>

<style scoped>
.dock {
  display: flex;
  gap: 0.5rem;
  padding: 0.7rem 0.8rem calc(0.7rem + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(21, 21, 26, 0.95) 0%, rgba(13, 13, 15, 0.98) 100%);
  border-top: 1px solid var(--ei-border);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.4);
  position: relative;
}

.dock::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--ei-accent) 50%, transparent 100%);
}

.col {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.system {
  flex: 0 0 auto;
  max-width: 40%;
}

.scene {
  flex: 1;
  justify-content: flex-end;
}

.scene.full {
  justify-content: stretch;
}

.scene.full .btn {
  flex: 1 1 100%;
}

.btn {
  appearance: none;
  border: 1px solid var(--ei-border);
  background: linear-gradient(180deg, #252530 0%, #1e1e25 100%);
  color: var(--ei-text);
  padding: 0.65rem 0.85rem;
  font: inherit;
  font-size: 0.88rem;
  border-radius: var(--ei-radius-md);
  min-height: 2.7rem;
  cursor: pointer;
  transition: all var(--ei-transition-fast);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.btn:hover:not(:disabled) {
  background: linear-gradient(180deg, #2d2d38 0%, #252530 100%);
  border-color: var(--ei-border-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.btn.primary {
  background: linear-gradient(180deg, #5a9a6a 0%, #4a8a5a 100%);
  border-color: transparent;
  color: #f4f0e6;
  box-shadow: 0 4px 16px rgba(90, 154, 106, 0.3);
}

.btn.primary:hover:not(:disabled) {
  background: linear-gradient(180deg, #6aa87a 0%, #5a9a6a 100%);
  box-shadow: 0 6px 24px rgba(90, 154, 106, 0.4);
}

.btn.offset {
  margin-top: 1.5rem;
  margin-left: auto;
  min-width: 48%;
}

.system-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.55rem 0.5rem;
  min-width: 5rem;
}

.system-btn .btn-icon {
  font-size: 1.1rem;
}

.system-btn .btn-label {
  font-size: 0.75rem;
}
</style>
