<template>
  <div class="ui-list-picker" :class="{ disabled: disabled }">
    <div class="picker-container" :style="{ width: pickerWidth + 'px' }">
      <div class="highlight"></div>

      <UIWheelListView
        :items="items"
        :selected-index="currentIndex"
        @update:selected-index="handleIndexUpdate"
        :disabled="disabled"
      >
        <template #default="{ item }">
          <div :class="{ selected: item.key === modelValue }">
            {{ item.value }}
          </div>
        </template>
      </UIWheelListView>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import UIWheelListView from './UIWheelListView.vue'

// --- Types ---
interface ListItem {
  key: string | number
  value: string
}

// --- Props and Emits for v-model ---
interface Props {
  /** The key of the currently selected item, bound via v-model */
  modelValue: string | number | null
  /** The list of selectable items (key/value pairs) */
  items: ListItem[]
  /** Width override for the entire picker container */
  width?: number
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  width: 200,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', key: string | number): void
}>()

// --- State ---
// The UIWheelListView works with index, so we compute the index from the key.
const currentIndex = computed(() => {
  return props.items.findIndex((item) => item.key === props.modelValue)
})

const pickerWidth = computed(() => props.width)

// --- Handlers ---
const handleIndexUpdate = (newIndex: number) => {
  const newItem = props.items[newIndex]
  if (newItem && newItem.key !== props.modelValue) {
    emit('update:modelValue', newItem.key)
  }
}
</script>

<style lang="scss" scoped>
.ui-list-picker {
  display: inline-block;

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
    cursor: not-allowed;
  }

  .picker-container {
    display: flex;
    height: 160px;
    background: var(--ui-background);
    border-radius: var(--radius-medium);
    overflow: hidden;
    position: relative;
    margin: 0 auto;
    // Width is controlled via prop/computed style
  }

  .highlight {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 34px;
    background: rgba(120, 120, 128, 0.1);
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 10;
    border-top: 0.5px solid rgba(0, 0, 0, 0.05);
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
  }

  // Custom styling for the list item label (passed via slot)
  :deep(.item > div) {
    font-size: 17px;
    color: var(--ui-text-primary);

    &.selected {
      font-weight: 600;
      color: var(--system-blue);
    }
  }
}
</style>
