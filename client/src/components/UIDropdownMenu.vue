<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  menu: {
    type: Array,
    required: true,
    default: () => [],
  },
  initialDarkMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['item-click', 'route-change'])

const activeIndex = ref(null)
const isDarkMode = ref(props.initialDarkMode)
const triggerRefs = ref([]) // Store DOM references for positioning
const dropdownStyle = ref({ top: '0px', left: '0px' })

// Helper to capture refs inside v-for
const setTriggerRef = (el, index) => {
  if (el) triggerRefs.value[index] = el
}

// Calculate position based on the trigger element
const updatePosition = (index) => {
  const trigger = triggerRefs.value[index]
  if (trigger) {
    const rect = trigger.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`,
    }
  }
}

// Handle menu scrubbing
const handleMouseEnter = (index) => {
  if (activeIndex.value !== null && activeIndex.value !== index) {
    activeIndex.value = index
    updatePosition(index)
  }
}

const toggleMenu = (index, event) => {
  event.stopPropagation()
  if (activeIndex.value === index) {
    activeIndex.value = null
  } else {
    activeIndex.value = index
    updatePosition(index)
  }
}

const handleItemClick = (item) => {
  if (item.disabled || item.type === 'separator') return

  if (item.to || item.name) {
    emit('route-change', item)
    if (item.to) {
      router.push({ path: item.to, replace: true, query: item.params })
    } else {
      router.push({ name: item.name, replace: true, query: item.params })
    }
  } else {
    emit('item-click', item)
  }

  activeIndex.value = null
}

const closeMenus = () => {
  activeIndex.value = null
}

// Close on resize to prevent floating menus in wrong spots
const handleResize = () => {
  if (activeIndex.value !== null) closeMenus()
}

onMounted(() => {
  window.addEventListener('click', closeMenus)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('click', closeMenus)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="mnu-root">
    <nav class="mnu-navbar">
      <div class="mnu-section mnu-left">
        <div
          v-for="(section, idx) in menu"
          :key="section.id"
          :ref="(el) => setTriggerRef(el, idx)"
          class="mnu-trigger"
          :class="{ 'mnu-active': activeIndex === idx, 'mnu-logo': section.isLogo }"
          @click="toggleMenu(idx, $event)"
          @mouseenter="handleMouseEnter(idx)"
        >
          <template v-if="section.isLogo">
            <i class="fa-solid fa-desktop"></i>
          </template>
          <template v-else>
            {{ section.label }}
          </template>

          <Teleport to="body">
            <Transition name="mnu-dropdown-fade">
              <div
                v-if="activeIndex === idx"
                class="mnu-dropdown"
                :style="dropdownStyle"
                @click.stop
              >
                <template v-for="(item, i) in section.items" :key="item.id || i">
                  <div v-if="item.type === 'separator'" class="mnu-separator" />
                  <div
                    v-else
                    class="mnu-item"
                    :class="{ 'mnu-disabled': item.disabled }"
                    @click="handleItemClick(item)"
                  >
                    <span class="mnu-item-label">{{ item.label }}</span>
                    <span v-if="item.shortcut" class="mnu-item-shortcut">{{ item.shortcut }}</span>
                  </div>
                </template>
              </div>
            </Transition>
          </Teleport>
        </div>
      </div>

      <div class="mnu-section mnu-center">
        <slot name="app-title">
          <span class="mnu-default-title">Untitled App</span>
        </slot>
      </div>

      <div class="mnu-section mnu-right">
        <slot name="right-toolbar">
          <div class="mnu-default-status">
            <span class="mnu-time">8:20 PM</span>
          </div>
        </slot>
      </div>
    </nav>
  </div>
</template>

<style scoped>
/* Base Variables */
.mnu-root {
  font-family: var(--font-family);
  color: var(--text-color);
}

.mnu-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 16px;
  z-index: 9000;
  user-select: none;

  /* Global Surface Variables for Header Bar */
  background: var(--surface-bg);
  backdrop-filter: blur(var(--surface-blur)) saturate(var(--surface-saturate));
  -webkit-backdrop-filter: blur(var(--surface-blur)) saturate(var(--surface-saturate));
  border-bottom: var(--surface-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); /* Slight shadow separation */
  color: var(--text-color);
}

.mnu-section {
  display: flex;
  align-items: center;
}
.mnu-left {
  gap: 2px;
}
.mnu-center {
  font-weight: 600;
  font-size: 15px;
}
.mnu-right {
  justify-content: flex-end;
  gap: 12px;
}

/* Triggers */
.mnu-trigger {
  position: relative;
  padding: 6px 12px;
  border-radius: var(--btn-radius);
  cursor: default;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s ease;
  border: 1px solid transparent;
}

.mnu-trigger:hover,
.mnu-trigger.mnu-active {
  background: rgba(var(--surface-rgb), 0.15);
  border: var(--surface-border);
}

.mnu-logo {
  padding: 6px 10px;
  display: flex;
  align-items: center;
  color: var(--text-color);
}
.mnu-apple-svg {
  width: 18px;
  height: 18px;
}

/* Dropdown */
.mnu-dropdown {
  position: fixed;
  min-width: 240px;
  font-family: var(--font-family);

  /* Global Dropdown Variables */
  background: var(--dropdown-bg);
  backdrop-filter: blur(var(--surface-blur)) saturate(var(--surface-saturate));
  -webkit-backdrop-filter: blur(var(--surface-blur)) saturate(var(--surface-saturate));
  border: var(--dropdown-border);
  box-shadow: var(--dropdown-shadow);
  border-radius: var(--dropdown-radius);
  color: var(--text-color);

  padding: 6px;
  display: flex;
  flex-direction: column;
  z-index: 9000;

  max-height: 90vh;
  overflow-y: auto;
}

.mnu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: calc(var(--dropdown-radius) * 0.75);
  font-size: 14px;
  transition: background 0.05s;
  cursor: default;
  color: var(--text-color);
}

.mnu-item:hover:not(.mnu-disabled) {
  background: var(--sys-primary);
  color: #fff;
}

.mnu-disabled {
  color: var(--text-tertiary);
  pointer-events: none;
}

.mnu-separator {
  height: 1px;
  background: var(--surface-border);
  margin: 6px 10px;
}

.mnu-item-shortcut {
  font-size: 12px;
  opacity: 0.6;
  margin-left: 20px;
}

/* Transitions */
.mnu-dropdown-fade-enter-active,
.mnu-dropdown-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.mnu-dropdown-fade-enter-from,
.mnu-dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

/* Default Slot Styles */
.mnu-default-title {
  opacity: 0.8;
}
.mnu-time {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}
</style>
