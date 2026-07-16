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
        class="btn"
        :disabled="btn.disabled"
        @click="emit('press', btn.id)"
      >
        {{ btn.label }}
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
  padding: 0.65rem 0.75rem calc(0.65rem + env(safe-area-inset-bottom));
  background: color-mix(in srgb, var(--ei-panel) 94%, #000);
  border-top: 1px solid var(--ei-border);
}

.col {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.system {
  flex: 0 0 auto;
  max-width: 42%;
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
  background: var(--ei-btn);
  color: var(--ei-text);
  padding: 0.55rem 0.7rem;
  font: inherit;
  font-size: 0.86rem;
  border-radius: 2px;
  min-height: 2.5rem;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn.primary {
  background: var(--ei-accent);
  border-color: transparent;
  color: #f4f0e6;
}

.btn.offset {
  margin-top: 1.75rem;
  margin-left: auto;
  min-width: 48%;
}
</style>
