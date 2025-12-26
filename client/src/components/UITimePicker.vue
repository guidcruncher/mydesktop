<template>
  <div class="ui-date-picker" :class="{ disabled: disabled }">
    <div class="picker-container" :style="{ width: pickerWidth + 'px' }">
      <div class="highlight"></div>

      <UIWheelListView
        :items="hours"
        :selected-index="currentHourIndex"
        @update:selected-index="handleHourUpdate"
        :disabled="disabled"
      >
        <template #default="{ item }">
          {{ String(item).padStart(2, '0') }}
        </template>
      </UIWheelListView>

      <UIWheelListView
        :items="minutes"
        :selected-index="currentMinuteIndex"
        @update:selected-index="handleMinuteUpdate"
        :disabled="disabled"
      >
        <template #default="{ item }">
          {{ String(item).padStart(2, '0') }}
        </template>
      </UIWheelListView>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import UIWheelListView from './UIWheelListView.vue'

interface Props {
  modelValue: Date | null
  width?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 300,
  disabled: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', date: Date): void }>()

const hours = [...Array(24).keys()]
const minutes = [...Array(60).keys()]

const pickerWidth = computed(() => props.width)

const currentHourIndex = computed(() =>
  props.modelValue ? props.modelValue.getHours() : new Date().getHours(),
)
const currentMinuteIndex = computed(() =>
  props.modelValue ? props.modelValue.getMinutes() : new Date().getMinutes(),
)

const getNewDate = () => {
  return props.modelValue ? new Date(props.modelValue) : new Date()
}

const handleHourUpdate = (newIndex: number) => {
  const newDate = getNewDate()
  newDate.setHours(newIndex, newDate.getMinutes(), 0, 0)
  emit('update:modelValue', newDate)
}

const handleMinuteUpdate = (newIndex: number) => {
  const newDate = getNewDate()
  newDate.setMinutes(newIndex, 0, 0)
  emit('update:modelValue', newDate)
}
</script>

<style lang="scss" scoped>
.ui-date-picker {
  display: inline-block;

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
    cursor: not-allowed;
  }

  .picker-container {
    display: flex;
    height: 160px;
    /* Solid Background */
    background: var(--ui-background);
    border-radius: var(--radius-medium);
    overflow: hidden;
    position: relative;
    margin: 0 auto;
    border: 1px solid var(--border-color);
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
  }
}
</style>
