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
    <p v-for="(segs, i) in segmentsPerLine" :key="i" class="line">
      <template v-for="(seg, j) in segs" :key="j">
        <button
          v-if="seg.type === 'link'"
          type="button"
          class="link"
          @click="emit('examine', seg.targetId!)"
        >
          {{ seg.text }}
        </button>
        <span v-else>{{ seg.text }}</span>
      </template>
    </p>
  </div>
</template>

<style scoped>
.narrative {
  flex: 1;
  overflow-y: auto;
  padding: 0.85rem 1rem 1.2rem;
  line-height: 1.65;
  font-size: 0.98rem;
}

.line {
  margin: 0 0 0.75rem;
}

.link {
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  color: var(--ei-link);
  text-decoration: underline;
  text-underline-offset: 0.18em;
  font: inherit;
  cursor: pointer;
}
</style>
