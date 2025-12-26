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
  tasks.value = tasks.value.filter((t) => t.id !== taskId)
}

const setFilter = (filter) => {
  currentFilter.value = filter
}

// Init some dummy data if empty
onMounted(() => {
  if (tasks.value.length === 0) {
    tasks.value = [
      {
        id: 1,
        text: 'Review project specs',
        completed: false,
        createdAt: new Date().toISOString(),
      },
      { id: 2, text: 'Email team', completed: true, createdAt: new Date().toISOString() },
      {
        id: 3,
        text: 'Update documentation',
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]
  }
})
</script>

<template>
  <div class="todo-widget surface">
    <div class="todo-header">
      <div class="todo-title-group">
        <div class="todo-date">{{ dateDisplay }}</div>
        <div class="todo-greeting">
          Task List <span class="todo-count-badge" v-if="pendingCount > 0">{{ pendingCount }}</span>
        </div>
      </div>
      <div class="todo-actions">
        <button
          class="todo-filter-btn"
          @click="setFilter('all')"
          :class="{ active: currentFilter === 'all' }"
        >
          All
        </button>
        <button
          class="todo-filter-btn"
          @click="setFilter('active')"
          :class="{ active: currentFilter === 'active' }"
        >
          Active
        </button>
      </div>
    </div>

    <div class="todo-input-section">
      <div class="todo-input-wrapper surface">
        <div class="todo-plus-icon">+</div>
        <input
          v-model="newTaskInput"
          @keyup.enter="addTask"
          type="text"
          placeholder="Add a task..."
          class="todo-task-input"
        />
        <button @click="addTask" class="todo-add-btn" :disabled="!newTaskInput.trim()">
          <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5v14" /></svg>
        </button>
      </div>
    </div>

    <div class="todo-list-container">
      <TransitionGroup name="list">
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="todo-item"
          :class="{ completed: task.completed }"
        >
          <div class="todo-checkbox" @click="toggleTask(task.id)">
            <svg v-if="task.completed" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <div class="todo-text">{{ task.text }}</div>
          <button class="todo-delete-btn" @click="deleteTask(task.id)">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </TransitionGroup>

      <div v-if="filteredTasks.length === 0" class="todo-empty-state">
        <p>No tasks found</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.todo-widget {
  width: 100%;
  height: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  /* Solid Background */
  color: var(--text-color);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-default);
  position: relative;
}

/* Header */
.todo-header {
  padding: 24px 24px 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  /* Solid background for header area */
  border-bottom: 1px solid var(--todo-panel-border);
}

.todo-date {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--todo-text-secondary);
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.todo-greeting {
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.todo-count-badge {
  background: var(--todo-color-blue);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  vertical-align: middle;
}

.todo-actions {
  display: flex;
  gap: 8px;
}

.todo-filter-btn {
  background: transparent;
  border: none;
  color: var(--todo-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.todo-filter-btn.active {
  background: var(--todo-btn-bg);
  color: var(--text-color);
}

/* Input Section - De-glassed */
.todo-input-section {
  padding: 16px 24px;
  background-color: var(--todo-bg-body); /* Match body to look seamless */
  z-index: 20;
}

.todo-input-wrapper {
  /* Solid Opaque Panel */
  background: var(--todo-input-bg);
  border: 1px solid var(--todo-panel-border);
  border-radius: 16px;
  padding: 8px 8px 8px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.todo-input-wrapper:focus-within {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--todo-color-blue);
}

.todo-plus-icon {
  color: var(--todo-text-secondary);
  font-size: 18px;
  font-weight: 300;
}

.todo-task-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  height: 40px;
  font-size: 16px;
  color: var(--text-color);
  min-width: 0;
}

.todo-task-input::placeholder {
  color: var(--todo-text-placeholder);
}

.todo-add-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: var(--todo-color-blue);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;

  svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  &:hover:not(:disabled) {
    background: var(--todo-color-blue-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
}

/* List */
.todo-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  /* Solid Item Background */
  background: var(--todo-task-bg);
  border: 1px solid var(--todo-task-border);
  border-radius: 16px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.todo-item:hover {
  background: var(--todo-task-bg-hover);
  transform: translateX(2px);
}

.todo-checkbox {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--todo-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  svg {
    width: 14px;
    height: 14px;
    stroke: white;
    stroke-width: 3;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.todo-item.completed .todo-checkbox {
  background: var(--todo-color-green);
  border-color: var(--todo-color-green);
}

.todo-text {
  flex: 1;
  font-size: 15px;
  color: var(--text-color);
  transition: color 0.2s;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--todo-text-secondary);
}

.todo-delete-btn {
  background: transparent;
  border: none;
  color: var(--todo-text-secondary);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  padding: 4px;

  svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
  }

  &:hover {
    color: var(--todo-color-red);
  }
}

.todo-item:hover .todo-delete-btn {
  opacity: 1;
}

.todo-empty-state {
  text-align: center;
  color: var(--todo-text-secondary);
  margin-top: 40px;
  font-style: italic;
}

/* Animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
