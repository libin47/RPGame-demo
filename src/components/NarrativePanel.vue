<script setup lang="ts">
import { computed } from 'vue'
import { parseInteractiveText } from '@/composables/useInteractiveText'

const props = defineProps<{
  lines: string[]
}>()

const emit = defineEmits<{
  examine: [targetId: string]
}>()

const segmentsPerLine = computed(() => props.lines.map((line) => parseInteractiveText(line)))
</script>

<template>
  <div class="narrative">
    <div class="vignette-overlay"></div>
    <div class="content">
      <p v-for="(segs, i) in segmentsPerLine" :key="i" class="line">
        <template v-for="(seg, j) in segs" :key="j">
          <button
            v-if="seg.type === 'link'"
            type="button"
            class="link"
            @click="emit('examine', seg.targetId!)"
          >
            <span class="link-decoration"></span>
            {{ seg.text }}
          </button>
          <span v-else>{{ seg.text }}</span>
        </template>
      </p>
    </div>
  </div>
</template>

<style scoped>
.narrative {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.2rem 1.5rem;
  line-height: 1.75;
  font-size: 1rem;
  background: linear-gradient(180deg, #121218 0%, #0d0d0f 50%, #121218 100%);
  position: relative;
}

.vignette-overlay {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(ellipse at center top, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0.15) 60%, rgba(0, 0, 0, 0.3) 100%),
    radial-gradient(ellipse at center bottom, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0.1) 50%);
  pointer-events: none;
  z-index: 1;
}

.content {
  position: relative;
  z-index: 2;
}

.line {
  margin: 0 0 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  color: var(--ei-text);
}

.line:last-child {
  margin-bottom: 0;
}

.link {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: var(--ei-link);
  font: inherit;
  cursor: pointer;
  position: relative;
  display: inline-flex;
  align-items: center;
  transition: color var(--ei-transition-fast);
}

.link:hover {
  color: var(--ei-link-hover);
}

.link-decoration {
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--ei-link);
  border-radius: 1px;
  transition: all var(--ei-transition-fast);
}

.link:hover .link-decoration {
  background: var(--ei-link-hover);
  height: 3px;
  box-shadow: 0 0 8px rgba(107, 179, 212, 0.4);
}
</style>
