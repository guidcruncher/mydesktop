<template>
  <div class="segmented-control">
    <button
      v-for="(segment, index) in segments"
      :key="index"
      @click="handleSelect(index)"
      class="segment"
      :class="{ 'segment--selected': selectedIndex === index }"
    >
      {{ segment }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  segments: {
    type: Array,
    required: true,
  },
  defaultIndex: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['change'])

const selectedIndex = ref(props.defaultIndex)

const handleSelect = (index) => {
  selectedIndex.value = index
  emit('change', index, props.segments[index])
}
</script>

<style scoped>
.segmented-control {
  display: inline-flex;
  background-color: var(--segment-background);
  border-radius: var(--radius-small);
  padding: 2px;
  position: relative;
  backdrop-filter: blur(20px);
}

.segment {
  position: relative;
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  color: var(--segment-text);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  z-index: 0;
}

.segment--selected {
  background-color: var(--segment-selected-background);
  color: var(--segment-selected-text);
  box-shadow: var(--segment-selected-shadow);
  z-index: 1;
}

.segment:hover:not(.segment--selected) {
  opacity: 0.8;
}
</style>
