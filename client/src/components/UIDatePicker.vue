<template>
  <div class="ui-date-picker" :class="{ disabled: disabled }">
    <div class="picker-container" :style="{ width: pickerWidth + 'px' }">
      <div class="highlight"></div>

      <!-- Month Wheel -->
      <UIWheelListView
        :items="months"
        :selected-index="currentMonthIndex"
        @update:selected-index="handleMonthUpdate"
        :disabled="disabled"
      >
        <template #default="{ item }">{{ item }}</template>
      </UIWheelListView>

      <!-- Day Wheel -->
      <UIWheelListView
        :items="days"
        :selected-index="currentDayIndex"
        @update:selected-index="handleDayUpdate"
        :disabled="disabled"
      >
        <template #default="{ item }">{{ item }}</template>
      </UIWheelListView>

      <!-- Year Wheel -->
      <UIWheelListView
        :items="years"
        :selected-index="currentYearIndex"
        @update:selected-index="handleYearUpdate"
        :disabled="disabled"
      >
        <template #default="{ item }">{{ item }}</template>
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

const START_YEAR = 1900
const END_YEAR = 2100

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const days = Array.from({ length: 31 }, (_, i) => i + 1) // 1-based days
const years = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i)

const pickerWidth = computed(() => props.width)

// Compute indices from the modelValue
const currentMonthIndex = computed(() =>
  props.modelValue ? props.modelValue.getMonth() : new Date().getMonth(),
) // 0-11
const currentDayIndex = computed(() =>
  props.modelValue ? props.modelValue.getDate() - 1 : new Date().getDate() - 1,
) // 0-30
const currentYearIndex = computed(() =>
  props.modelValue
    ? props.modelValue.getFullYear() - START_YEAR
    : new Date().getFullYear() - START_YEAR,
)

// Helper to create a new Date object based on the current modelValue
const getNewDate = () => {
  return props.modelValue ? new Date(props.modelValue) : new Date()
}

// --- Handlers ---

const handleDateUpdate = (newDate: Date) => {
  // This logic ensures that if the day chosen is invalid for the new month/year (e.g., Feb 30),
  // the day automatically snaps to the last valid day (Feb 28/29).
  const currentDayOfMonth = newDate.getDate()
  newDate.setDate(currentDayOfMonth) // Reset the day to handle month change correctly

  if (newDate.getDate() !== currentDayOfMonth) {
    // If the date changed because the day was too high (e.g., setMonth(1) for Feb 31st),
    // use setDate(0) to get the last day of the desired month
    newDate.setDate(0)
  }

  if (!isNaN(newDate.getTime())) {
    emit('update:modelValue', newDate)
  }
}

const handleMonthUpdate = (newIndex: number) => {
  const newDate = getNewDate()
  newDate.setMonth(newIndex)
  handleDateUpdate(newDate)
}

const handleDayUpdate = (newIndex: number) => {
  // New index is 0-based, but Date requires 1-based day
  const newDate = getNewDate()
  newDate.setDate(newIndex + 1)
  handleDateUpdate(newDate)
}

const handleYearUpdate = (newIndex: number) => {
  const newYear = START_YEAR + newIndex
  const newDate = getNewDate()
  newDate.setFullYear(newYear)
  handleDateUpdate(newDate)
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
    background: var(--ui-background);
    border-radius: var(--radius-medium);
    overflow: hidden;
    position: relative;
    margin: 0 auto;
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
}
</style>
