<template>
  <UIWidgetView :title="monthName" width="240px" height="210px">
    <div class="cal-calendar-grid">
      <div class="cal-weekday" v-for="day in weekDays" :key="day">{{ day }}</div>

      <div class="cal-days-container">
        <div v-for="pad in paddingDays" :key="'pad-' + pad" class="cal-day cal-empty"></div>

        <div
          v-for="day in daysInMonth"
          :key="day.date"
          class="cal-day"
          :class="{
            'cal-today': isToday(day.date),
            'cal-selected': isSelected(day.date) && !isToday(day.date),
            'cal-weekend': isWeekend(day.date),
          }"
          @click="selectDate(day.date)"
        >
          {{ day.number }}
        </div>
      </div>
    </div>
  </UIWidgetView>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const currentDate = ref(new Date())
const selectedDate = ref(new Date())
const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const monthName = computed(() => {
  return currentDate.value.toLocaleString('default', { month: 'long' })
})

const paddingDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  return firstDayOfWeek
})

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()

  const days = []
  for (let i = 1; i <= lastDay; i++) {
    days.push({
      number: i,
      date: new Date(year, month, i),
    })
  }
  return days
})

const isToday = (date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

const selectDate = (date) => {
  selectedDate.value = date
}

const isSelected = (date) => {
  if (!selectedDate.value) return false
  return (
    date.getDate() === selectedDate.value.getDate() &&
    date.getMonth() === selectedDate.value.getMonth() &&
    date.getFullYear() === selectedDate.value.getFullYear()
  )
}

const isWeekend = (date) => {
  const day = date.getDay()
  return day === 0 || day === 6
}
</script>

<style lang="scss" scoped>
/* Main View Container */
.cal-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: auto 1fr;
  flex-grow: 1;
  gap: 2px;
  padding: 8px;
  font-family: var(--font-family);
}

.cal-weekday {
  text-align: center;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding-bottom: 4px;
}

.cal-days-container {
  display: contents;
}

.cal-day {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  border-radius: 50%;
  aspect-ratio: 1;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--text-color);
  user-select: none;
}

.cal-day:hover:not(.cal-empty) {
  background-color: rgba(var(--surface-rgb), 0.15);
}

.cal-day.cal-empty {
  cursor: default;
}

.cal-day.cal-today {
  background-color: var(--sys-primary);
  color: #fff;
  font-weight: 700;
}

.cal-day.cal-selected {
  border: 1.5px solid var(--sys-primary);
}

.cal-day.cal-weekend {
  color: var(--text-secondary);
}
</style>
