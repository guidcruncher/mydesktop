<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  options: {
    type: Array,
    default: () => [], // Array of { label: string, value: any }
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const containerRef = ref(null)

// Find label for current value
const currentLabel = () => {
  const selected = props.options.find((o) => o.value === props.modelValue)
  return selected ? selected.label : props.options[0]?.label || 'Select'
}

function selectOption(value) {
  emit('update:modelValue', value)
  isOpen.value = false
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

// Close when clicking outside
function handleClickOutside(event) {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="custom-select" ref="containerRef">
    <div class="select-selected" :class="{ 'select-arrow-active': isOpen }" @click="toggleDropdown">
      {{ currentLabel() }}
    </div>

    <div class="select-items" :class="{ 'select-hide': !isOpen }">
      <div
        v-for="option in options"
        :key="option.value"
        :class="{ 'same-as-selected': modelValue === option.value }"
        @click="selectOption(option.value)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  font-family: var(--font-family);
  width: 100%;
  user-select: none;
}

.select-selected {
  background: rgba(var(--surface-rgb), 0.1);
  color: var(--text-color);
  padding: 12px 16px;
  border: var(--surface-border);
  border-radius: var(--btn-radius);
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.select-selected:after {
  content: '';
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-color: var(--text-color) transparent transparent transparent;
  position: relative;
  top: 3px;
}
.select-selected.select-arrow-active:after {
  border-color: transparent transparent var(--text-color) transparent;
  top: -3px;
}

.select-items {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 99;
  margin-top: 6px;
  background: var(--dropdown-bg);
  border-radius: var(--dropdown-radius);
  border: var(--dropdown-border);
  box-shadow: var(--dropdown-shadow);
  backdrop-filter: blur(var(--surface-blur));
  -webkit-backdrop-filter: blur(var(--surface-blur));
  padding: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  pointer-events: all;
}

.select-hide {
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
}

.select-items div {
  color: var(--text-color);
  padding: 10px 16px;
  cursor: pointer;
  border-radius: calc(var(--dropdown-radius) * 0.75);
  transition: background 0.15s;
}

.select-items div:hover {
  background: rgba(var(--surface-rgb), 0.15);
}

.same-as-selected {
  background: var(--sys-primary) !important;
  color: #fff !important;
}

/* RISC OS Specific Overrides handled via global cascading from [data-framework] */
.framework-riscos .select-items div:hover {
  border: 1px inset #fff;
  background: #bbb;
}

.framework-riscos .same-as-selected {
  border: 1px inset #fff;
}
</style>
