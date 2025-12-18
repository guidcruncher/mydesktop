<template>
  <div class="cal-wrapper">
    <div class="cal-widget">
      <!-- Left Side: Selected Date Info -->
      <div 
        class="cal-left-col" 
        @click="resetToToday" 
        title="Click to jump to Today"
      >
        <div class="cal-today-container">
          <div class="cal-day-name">{{ selectedDayName }}</div>
          <div class="cal-date-number">{{ selectedDayNumber }}</div>
        </div>
        
        <div class="cal-events-list">
          <div class="cal-event-item" v-for="(event, index) in currentEvents" :key="index">
            <div 
              class="cal-event-indicator" 
              :class="event.color === 'blue' ? 'cal-indicator-blue' : 'cal-indicator-orange'"
            ></div>
            <span class="cal-event-text">{{ event.text }}</span>
          </div>
        </div>
      </div>

      <!-- Right Side: Calendar Grid -->
      <div class="cal-right-col">
        <div class="cal-header-row">
          <div class="cal-month-header">{{ currentMonthLabel }}</div>
          <div class="cal-nav-buttons">
            <button class="cal-nav-btn" @click.stop="prevMonth">&#10094;</button>
            <button class="cal-nav-btn" @click.stop="nextMonth">&#10095;</button>
          </div>
        </div>
        
        <div class="cal-calendar-grid">
          <!-- Headers -->
          <div class="cal-grid-header" v-for="day in weekDays" :key="day">{{ day }}</div>
          
          <!-- Days -->
          <div 
            v-for="(cell, index) in gridCells" 
            :key="index"
            class="cal-grid-cell"
            :class="{
              'cal-cell-prev-month': cell.type === 'prev',
              'cal-cell-next-month': cell.type === 'next',
              'cal-cell-today': cell.isToday,
              'cal-cell-selected': cell.isSelected
            }"
            @click="selectDate(cell)"
          >
            {{ cell.dayNum }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// --- State ---
const now = new Date();
// View date tracks the month currently being viewed (always set to 1st of month)
const viewDate = ref(new Date(now.getFullYear(), now.getMonth(), 1));
// Selected date tracks the specific day clicked
const selectedDate = ref(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

// --- Constants ---
const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// --- Computed Props ---

const selectedDayName = computed(() => {
  return dayNames[selectedDate.value.getDay()];
});

const selectedDayNumber = computed(() => {
  return selectedDate.value.getDate();
});

const currentMonthLabel = computed(() => {
  return `${monthNames[viewDate.value.getMonth()]} ${viewDate.value.getFullYear()}`;
});

const currentEvents = computed(() => {
  // Mock event logic
  const date = selectedDate.value.getDate();
  if (date % 2 === 0) {
    return [
      { text: "Design Review", color: "blue" },
      { text: "Gym @ 6pm", color: "orange" }
    ];
  } else {
    return [
      { text: "Deep Work", color: "blue" }
    ];
  }
});

const gridCells = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();
  
  const cells = [];
  
  // First day of month (0=Sun, 1=Mon...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust for Monday start (ISO): Sun(0)->6, Mon(1)->0
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // Previous Month Fillers
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const fullDate = new Date(year, month - 1, dayNum);
    cells.push(createCellObject(dayNum, fullDate, 'prev'));
  }
  
  // Current Month
  for (let i = 1; i <= daysInMonth; i++) {
    const fullDate = new Date(year, month, i);
    cells.push(createCellObject(i, fullDate, 'current'));
  }
  
  // Next Month Fillers
  // We want to fill up to 42 cells (6 rows) to keep height stable
  const totalCells = cells.length;
  const remaining = 42 - totalCells;
  
  for (let i = 1; i <= remaining; i++) {
    const fullDate = new Date(year, month + 1, i);
    cells.push(createCellObject(i, fullDate, 'next'));
  }
  
  return cells;
});

// --- Helper Methods ---

function createCellObject(dayNum, dateObj, type) {
  return {
    dayNum,
    date: dateObj,
    type,
    isToday: isSameDay(dateObj, now),
    isSelected: isSameDay(dateObj, selectedDate.value)
  };
}

function isSameDay(d1, d2) {
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
}

// --- Actions ---

function prevMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1);
}

function nextMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1);
}

function selectDate(cell) {
  selectedDate.value = cell.date;
  
  // If clicking a prev/next month date, switch the view
  if (cell.type !== 'current') {
    viewDate.value = new Date(cell.date.getFullYear(), cell.date.getMonth(), 1);
  }
}

function resetToToday() {
  const today = new Date();
  selectedDate.value = today;
  viewDate.value = new Date(today.getFullYear(), today.getMonth(), 1);
}

</script>

<style scoped>
:root {
  /* Light Mode Variables */
  --cal-wallpaper: #f2f2f7;
  --cal-widget-bg: rgba(255, 255, 255, 0.65);
  --cal-widget-border: rgba(255, 255, 255, 0.4);
  --cal-text-primary: #000000;
  --cal-text-secondary: #8e8e93;
  --cal-text-tertiary: #c7c7cc;
  --cal-accent: #ff3b30;
  --cal-selection-bg: #000000;
  --cal-selection-text: #ffffff;
  --cal-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.15);
  --cal-indicator-blue-bg: #007aff;
  --cal-indicator-orange-bg: #ff9500;
  --cal-hover-bg: rgba(128,128,128,0.1);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark Mode Variables */
    --cal-wallpaper: #000000;
    --cal-widget-bg: rgba(30, 30, 30, 0.65);
    --cal-widget-border: rgba(255, 255, 255, 0.1);
    --cal-text-primary: #ffffff;
    --cal-text-secondary: #98989d;
    --cal-text-tertiary: #48484a;
    --cal-accent: #ff453a;
    --cal-selection-bg: #ffffff;
    --cal-selection-text: #000000;
    --cal-shadow: 0 15px 40px -5px rgba(0, 0, 0, 0.5);
  }
}

/* Base Wrapper to simulate environment */
.cal-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

/* Widget Container */
.cal-widget {
  width: 338px;
  height: 158px;
  background: var(--cal-widget-bg);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid var(--cal-widget-border);
  border-radius: 22px;
  box-shadow: var(--cal-shadow);
  display: flex;
  padding: 16px;
  gap: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
  box-sizing: border-box;
}

/* LEFT COLUMN */
.cal-left-col {
  flex: 0 0 110px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
}

.cal-left-col:active {
  opacity: 0.7;
}

.cal-today-container {
  display: flex;
  flex-direction: column;
}

.cal-day-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--cal-accent);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: -2px;
}

.cal-date-number {
  font-size: 2.6rem;
  font-weight: 500;
  color: var(--cal-text-primary);
  letter-spacing: -0.02em;
  line-height: 1;
}

.cal-events-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cal-event-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cal-event-indicator {
  width: 4px;
  height: 14px;
  border-radius: 2px;
}

.cal-indicator-blue {
  background: var(--cal-indicator-blue-bg);
}

.cal-indicator-orange {
  background: var(--cal-indicator-orange-bg);
}

.cal-event-text {
  font-size: 0.7rem;
  color: var(--cal-text-secondary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

/* RIGHT COLUMN */
.cal-right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.cal-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  height: 20px;
}

.cal-month-header {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--cal-text-primary);
  padding-left: 3px;
}

.cal-nav-buttons {
  display: flex;
  gap: 12px;
  padding-right: 4px;
}

.cal-nav-btn {
  font-size: 1rem;
  color: var(--cal-accent);
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  border: none;
  background: none;
  padding: 0;
  line-height: 1;
}

.cal-nav-btn:hover {
  opacity: 1;
}

.cal-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  height: 100%;
  align-content: space-between;
}

.cal-grid-header {
  font-size: 0.55rem;
  font-weight: 600;
  color: var(--cal-text-secondary);
  text-align: center;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.cal-grid-cell {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--cal-text-primary);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 18px;
  width: 18px;
  margin: 0 auto;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.cal-grid-cell:hover {
  background-color: var(--cal-hover-bg);
}

.cal-cell-prev-month,
.cal-cell-next-month {
  color: var(--cal-text-tertiary);
}

/* Today Logic */
.cal-cell-today {
  color: var(--cal-accent);
  font-weight: 700;
}

/* Selection Logic */
.cal-cell-selected {
  background-color: var(--cal-selection-bg) !important;
  color: var(--cal-selection-text) !important;
  font-weight: 600;
}

/* If selected AND today, use Accent BG overrides */
.cal-cell-selected.cal-cell-today {
  background-color: var(--cal-accent) !important;
  color: #ffffff !important;
}
</style>

