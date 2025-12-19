<template>
  <div class="cal-wrapper">
    <div class="cal-widget">
      <div class="cal-header">
        <div class="cal-month-name" @click="resetToToday">{{ monthName }}</div>
        <div class="cal-nav-buttons">
          <button class="cal-nav-btn" @click="prevMonth" aria-label="Previous">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button class="cal-nav-btn" @click="nextMonth" aria-label="Next">
            <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>

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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// State
const currentDate = ref(new Date())
const selectedDate = ref(new Date())
const wrapperRef = ref(null)
const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// Computed Properties
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

// Methods
const prevMonth = () => {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() - 1)
  currentDate.value = d
}

const nextMonth = () => {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + 1)
  currentDate.value = d
}

const resetToToday = () => {
  currentDate.value = new Date()
}

const selectDate = (date) => {
  selectedDate.value = date
}

const isToday = (date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
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

// Lifecycle
onMounted(() => {})
</script>

<style scoped>
.cal-wrapper {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--ui-text-primary);
}

/* Ambient Background */
.cal-ambient-light {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--cal-accent-color) 0%, transparent 70%);
  opacity: 0.2;
  top: -150px;
  left: -150px;
  z-index: 0;
  filter: blur(80px);
  animation: cal-float 20s infinite ease-in-out;
}

.cal-ambient-light:nth-child(2) {
  top: auto;
  bottom: -150px;
  left: auto;
  right: -150px;
  background: radial-gradient(circle, var(--cal-accent-secondary) 0%, transparent 70%);
  animation-delay: -10s;
}

@keyframes cal-float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, 30px);
  }
}

/* Widget Container */
.cal-widget {
  position: relative;
  z-index: 1;
  width: 170px;
  height: 170px;
  background: var(--cal-bg-widget);
  backdrop-filter: blur(var(--cal-blur-strength));
  -webkit-backdrop-filter: blur(var(--cal-blur-strength));
  box-shadow: var(--cal-shadow);
  border: 1px solid var(--cal-bg-widget-border);
  border-radius: var(--cal-border-radius);
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow: hidden;
  transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.cal-widget:active {
  transform: scale(0.96);
}

/* Header Section */
.cal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 0 4px;
  height: 24px;
}

.cal-month-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--cal-accent-color);
  cursor: pointer;
  letter-spacing: -0.3px;
}

.cal-nav-buttons {
  display: flex;
  gap: 2px;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.2s ease;
}

.cal-widget:hover .cal-nav-buttons {
  opacity: 1;
  transform: translateX(0);
}

.cal-nav-btn {
  background: none;
  border: none;
  color: var(--ui-text-primary);
  cursor: pointer;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--cal-nav-btn-bg);
}

.cal-nav-btn:hover {
  background-color: var(--cal-accent-color);
  color: #fff;
}

.cal-nav-btn svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Calendar Grid */
.cal-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: auto 1fr;
  height: 100%;
  gap: 2px;
}

.cal-weekday {
  text-align: center;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--ui-text-secondary);
  padding-bottom: 4px;
  opacity: 0.8;
}

.cal-days-container {
  display: contents;
}

.cal-day {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  font-weight: 500;
  border-radius: 50%;
  aspect-ratio: 1;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.cal-day:hover:not(.cal-empty) {
  background-color: var(--cal-hover-bg);
}

.cal-day.cal-empty {
  cursor: default;
}

.cal-day.cal-today {
  background-color: var(--cal-today-bg);
  color: var(--cal-today-text);
  font-weight: 800;
}

.cal-day.cal-selected {
  border: 1.5px solid var(--cal-accent-color);
}

.cal-day.cal-weekend {
  color: var(--ui-text-weekend);
}

/* Controls */
.cal-controls {
  margin-top: 20px;
  z-index: 10;
}

.cal-theme-toggle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--cal-bg-widget);
  backdrop-filter: blur(20px);
  border: 1px solid var(--cal-bg-widget-border);
  color: var(--ui-text-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.cal-theme-toggle:hover {
  transform: scale(1.1);
}

.cal-theme-toggle svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
