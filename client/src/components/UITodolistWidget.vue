<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// --- State ---
const tasks = ref([])
const newTaskInput = ref('')
const currentFilter = ref('all') // 'all', 'active', 'completed'

// --- Computed ---
const filteredTasks = computed(() => {
  if (currentFilter.value === 'active') {
    return tasks.value.filter((t) => !t.completed)
  }
  if (currentFilter.value === 'completed') {
    return tasks.value.filter((t) => t.completed)
  }
  return tasks.value
})

const pendingCount = computed(() => {
  return tasks.value.filter((t) => !t.completed).length
})

const dateDisplay = computed(() => {
  const now = new Date()
  const options = { weekday: 'long', month: 'short', day: 'numeric' }
  return now.toLocaleDateString('en-US', options)
})

// --- Methods ---
const addTask = () => {
  const text = newTaskInput.value.trim()
  if (!text) return

  tasks.value.unshift({
    id: Date.now(),
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  })

  newTaskInput.value = ''
}

const toggleTask = (taskId) => {
  const task = tasks.value.find((t) => t.id === taskId)
  if (task) {
    task.completed = !task.completed
  }
}

const deleteTask = (taskId) => {
  // Simple filter for data removal.
  // In a real app, you might want to wait for animation to finish,
  // but Vue <TransitionGroup> handles the visual part.
  tasks.value = tasks.value.filter((t) => t.id !== taskId)
}

const setFilter = (filter) => {
  currentFilter.value = filter
}

// --- Lifecycle & Persistence ---
onMounted(() => {
  // Load Tasks
  const savedTasks = localStorage.getItem('todo-tasks')
  if (savedTasks) {
    try {
      tasks.value = JSON.parse(savedTasks)
    } catch (e) {
      console.error('Failed to parse tasks', e)
    }
  }
})

watch(
  tasks,
  (newTasks) => {
    localStorage.setItem('todo-tasks', JSON.stringify(newTasks))
  },
  { deep: true },
)

// --- Touch Handling (Swipe to Delete) ---
let touchStartX = 0
const onTouchStart = (e) => {
  touchStartX = e.changedTouches[0].screenX
}

const onTouchEnd = (e, taskId) => {
  const touchEndX = e.changedTouches[0].screenX
  if (touchStartX - touchEndX > 100) {
    // Swipe Left Detected
    deleteTask(taskId)
  }
}
</script>

<template>
  <!-- Main Widget Card -->
  <div class="todo-widget-card">
    <!-- Header -->
    <header class="todo-header">
      <div>
        <h2 class="todo-date-text">{{ dateDisplay }}</h2>
        <h1 class="todo-title-text">Tasks</h1>
        <div class="todo-count-badge">{{ pendingCount }} Pending</div>
      </div>
    </header>

    <!-- Filters -->
    <div class="todo-filter-container">
      <button
        @click="setFilter('all')"
        :class="['todo-filter-btn', { 'todo-active': currentFilter === 'all' }]"
      >
        All
      </button>
      <button
        @click="setFilter('active')"
        :class="['todo-filter-btn', { 'todo-active': currentFilter === 'active' }]"
      >
        Active
      </button>
      <button
        @click="setFilter('completed')"
        :class="['todo-filter-btn', { 'todo-active': currentFilter === 'completed' }]"
      >
        Done
      </button>
    </div>

    <!-- Task List Area -->
    <div class="todo-list-container">
      <TransitionGroup name="todo-list">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="todo-task-item"
          @touchstart="onTouchStart"
          @touchend="(e) => onTouchEnd(e, task.id)"
        >
          <div class="todo-task-inner">
            <button
              @click.stop="toggleTask(task.id)"
              :class="['todo-check-btn', { 'todo-checked': task.completed }]"
            >
              <!-- Check Icon -->
              <svg
                class="todo-check-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>

            <span :class="['todo-task-text', { 'todo-completed': task.completed }]">
              {{ task.text }}
            </span>

            <button @click.stop="deleteTask(task.id)" class="todo-delete-btn">
              <!-- Trash Icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>

      <!-- Empty State -->
      <div v-if="filteredTasks.length === 0" class="todo-empty-state">
        <div class="todo-empty-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <p class="todo-empty-text">No tasks here</p>
        <p class="todo-empty-subtext">Add a task to get started</p>
      </div>
    </div>

    <!-- Input Area -->
    <div class="todo-input-bar-container">
      <div class="todo-input-wrapper">
        <span class="todo-plus-icon">+</span>
        <input
          type="text"
          v-model="newTaskInput"
          class="todo-task-input"
          placeholder="New Reminder..."
          @keydown.enter="addTask"
        />
        <button @click="addTask" class="todo-add-btn">
          <!-- Arrow Up Icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* --- WIDGET CARD --- */
.todo-widget-card {
  width: 100%;
  height: 100%;
  max-width: 600px;
  max-height: 800px;
  border-radius: 40px;
  background: var(--todo-glass-panel-bg);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid var(--todo-glass-border);
  box-shadow: var(--todo-glass-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  z-index: 1;
}

/* --- HEADER --- */
.todo-header {
  padding: 2rem 2rem 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 10;
}

.todo-date-text {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--todo-text-secondary);
  margin-bottom: 0.25rem;
  margin-top: 0;
}

.todo-title-text {
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(to right, var(--todo-text-primary), var(--todo-text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.todo-count-badge {
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  background-color: rgba(0, 122, 255, 0.15);
  color: var(--todo-color-blue);
  display: inline-block;
  margin-top: 0.5rem;
}

.todo-theme-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--todo-btn-bg);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  transition:
    transform 0.2s,
    background-color 0.3s;
  color: var(--todo-text-primary);
}

:root[data-todo-theme='dark'] .todo-theme-btn {
  color: var(--todo-color-yellow);
}

.todo-theme-btn:hover {
  transform: scale(1.05);
}
.todo-theme-btn:active {
  transform: scale(0.95);
}

/* --- FILTERS --- */
.todo-filter-container {
  padding: 0 2rem 0.5rem 2rem;
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.todo-filter-btn {
  background: none;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.5;
  transition:
    opacity 0.3s,
    color 0.3s;
  color: var(--todo-text-primary);
  white-space: nowrap;
}

.todo-filter-btn.todo-active {
  opacity: 1;
  color: var(--todo-color-blue);
}

.todo-filter-btn:hover {
  opacity: 1;
}

/* --- TASK LIST --- */
.todo-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1.5rem 6rem 1.5rem;
}

.todo-list-enter-active,
.todo-list-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.todo-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.todo-list-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.todo-task-item {
  position: relative;
  margin-bottom: 0.75rem;
  border-radius: 1rem;
  user-select: none;
}

.todo-task-inner {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: var(--todo-task-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--todo-task-border);
  border-radius: 1rem;
  transition:
    transform 0.2s,
    background-color 0.2s;
  cursor: pointer;
}

.todo-task-inner:hover {
  background-color: var(--todo-task-bg-hover);
}

.todo-task-inner:active {
  transform: scale(0.98);
}

.todo-check-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(142, 142, 147, 0.5);
  background: transparent;
  margin-right: 1rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.todo-check-btn.todo-checked {
  background-color: var(--todo-color-blue);
  border-color: var(--todo-color-blue);
}

.todo-check-icon {
  color: white;
  width: 12px;
  height: 12px;
  transform: scale(0);
  transition: transform 0.2s;
}

.todo-check-btn.todo-checked .todo-check-icon {
  transform: scale(1);
}

.todo-task-text {
  flex-grow: 1;
  font-size: 1.1rem;
  color: var(--todo-text-primary);
  transition: color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.todo-task-text.todo-completed {
  color: var(--todo-text-secondary);
  text-decoration: line-through;
}

.todo-delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: rgba(255, 59, 48, 0.1);
  color: var(--todo-color-red);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  margin-left: 0.5rem;
  transition: all 0.2s;
}

.todo-delete-btn:hover {
  background-color: var(--todo-color-red);
  color: white;
}

/* Show delete button on hover or focus-within */
.todo-task-item:hover .todo-delete-btn {
  opacity: 1;
}
.todo-task-item:focus-within .todo-delete-btn {
  opacity: 1;
}
/* Always show on touch devices when active? CSS can't detect touch well, relies on :hover which works on tap sometimes */

/* --- EMPTY STATE --- */
.todo-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60%;
  text-align: center;
  opacity: 0.6;
  margin-top: 4rem;
}

.todo-empty-icon {
  width: 96px;
  height: 96px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  backdrop-filter: blur(4px);
  color: var(--todo-color-blue);
  animation: float 6s ease-in-out infinite;
}

.todo-empty-text {
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0.5rem 0 0 0;
}

.todo-empty-subtext {
  font-size: 0.875rem;
  color: var(--todo-text-secondary);
  margin: 0.25rem 0 0 0;
}

/* --- INPUT BAR --- */
.todo-input-bar-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1.5rem;
  padding-bottom: 2rem;
  background: linear-gradient(to top, var(--todo-bg-body) 0%, transparent 100%);
  z-index: 20;
  box-sizing: border-box;
}

.todo-input-wrapper {
  background: var(--todo-glass-panel-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--todo-glass-border);
  border-radius: 2rem;
  padding: 0.5rem 0.5rem 0.5rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.todo-input-wrapper:focus-within {
  transform: scale(1.02);
}

.todo-plus-icon {
  color: var(--todo-text-secondary);
  font-size: 1.2rem;
}

.todo-task-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  height: 3rem;
  font-size: 1.1rem;
  color: var(--todo-text-primary);
  min-width: 0;
}

.todo-task-input::placeholder {
  color: var(--todo-text-placeholder);
}

.todo-add-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--todo-color-blue);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 122, 255, 0.3);
  transition: all 0.2s;
  flex-shrink: 0;
}

.todo-add-btn:hover {
  background-color: var(--todo-color-blue-hover);
}
.todo-add-btn:active {
  transform: scale(0.9);
}

/* --- ANIMATIONS --- */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Scrollbar Hide */
::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}
</style>
