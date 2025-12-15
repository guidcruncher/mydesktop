<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  name: { type: String, required: false, default: '' },
  icon: { type: String, required: false, default: undefined },
  url: { type: String, required: true, default: '' },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

const iconUrl = computed(() => {
  return `http://192.168.1.202:3009/api/icon/${props.icon}/png`
})

const handleClick = () => {
  if (!props.disabled) {
    emit('click', { name: props.name, label: props.label, icon: props.icon, url: props.url })
    window.open(props.url)
  }
}
</script>

<template>
  <div class="cell" :class="{ disabled: props.disabled }" @click="handleClick">
    <div class="cell-content">
      <img v-if="icon" :src="iconUrl" :alt="label" class="app-icon-image" />
      <slot v-else name="icon"></slot>
    </div>

    <div class="cell-label">
      {{ label }}
    </div>
  </div>
</template>

<style scoped>
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    opacity 0.3s ease;
  width: 100%;
  max-width: 100px;
}

/* Disabled State: Visually dims and prevents interaction */
.cell.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  /* Allows scroll events to pass through the item to the container */
  pointer-events: none;
}

.cell-content {
  width: 80px;
  height: 80px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px var(--color-cell-shadow);
  margin-bottom: 8px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

/* Hover/Active effects only apply when the item is NOT disabled */
.cell:not(.disabled) .cell-content:hover {
  transform: scale(0.95);
}

.cell:not(.disabled):active .cell-content {
  transform: scale(0.9);
}

.cell-label {
  font-size: 13px;
  color: var(--color-cell-label);
  text-align: center;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.app-icon-image {
  /* This ensures the image fills the 80x80px .cell-content container */
  width: 95%;
  height: 95%;
  /* Match the border radius of the .cell-content */
  border-radius: 18px;
  object-fit: cover;
}
</style>
