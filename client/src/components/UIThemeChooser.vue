<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue' // Added nextTick
import { useThemeStore } from '@/stores/themeStore'

const theme = useThemeStore()

// --- State ---
const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null) // Added ref for the dropdown
const dropdownStyle = ref({ top: '0px', left: '0px', transformOrigin: 'top left' }) // Added transformOrigin for smoother flipping

// --- Configuration ---
const themeOptions = [
  { label: 'System Default', value: 'system' },
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
] as const

const frameworkOptions = [
  { label: 'Adwaita', value: 'gnome' },
  { label: 'Android', value: 'android' },
  { label: 'Breeze', value: 'kde' },
  { label: 'Fluent', value: 'fluent' },
  { label: 'Motif', value: 'cde' },
  { label: 'NeXTSTEP', value: 'nextstep' },
  { label: 'RISC OS', value: 'riscos' },
  { label: 'VisionOS', value: 'vision' },
]

// --- Logic ---
const updatePosition = () => {
  if (!triggerRef.value || !dropdownRef.value) return

  const trigger = triggerRef.value.getBoundingClientRect()
  const dropdown = dropdownRef.value.getBoundingClientRect() // Note: Scale transform might slightly affect this, offsetWidth is safer if scaling
  const padding = 10 // Minimum spacing from window edge
  const gap = 6 // Spacing between trigger and menu

  const winWidth = window.innerWidth
  const winHeight = window.innerHeight

  // Use offsetWidth/Height to get the real non-transformed size
  const ddWidth = dropdownRef.value.offsetWidth
  const ddHeight = dropdownRef.value.offsetHeight

  // 1. Calculate Horizontal Position
  let left = trigger.left
  let transformOriginX = 'left'

  // Check if it overflows the right side of the screen
  if (left + ddWidth > winWidth - padding) {
    // Align to the right edge of the trigger instead
    left = trigger.right - ddWidth
    transformOriginX = 'right'

    // If it still overflows left (screen too narrow), force it to fit inside padding
    if (left < padding) {
      left = padding
      transformOriginX = 'center'
    }
  }

  // 2. Calculate Vertical Position
  let top = trigger.bottom + gap
  let transformOriginY = 'top'

  // Check if it overflows the bottom of the screen
  if (top + ddHeight > winHeight - padding) {
    // Flip to top: Place it above the trigger
    const topPosition = trigger.top - ddHeight - gap

    // Only flip if there is space on top
    if (topPosition > padding) {
      top = topPosition
      transformOriginY = 'bottom'
    }
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    transformOrigin: `${transformOriginX} ${transformOriginY}`,
  }
}

const toggleMenu = async (event: Event) => {
  event.stopPropagation()
  if (isOpen.value) {
    isOpen.value = false
  } else {
    isOpen.value = true
    // Wait for v-if to render the element so we can measure it
    await nextTick()
    updatePosition()
  }
}

const closeMenu = () => {
  isOpen.value = false
}

const handleResize = () => {
  if (isOpen.value) {
    // Real-time update on resize instead of closing is better UX, but closing is safer
    closeMenu()
  }
}

const handleThemeClick = (value: 'light' | 'dark' | 'system') => {
  document.body.dataset.theme = value
  theme.setThemePreference(value)
  closeMenu()
}

const handleFrameworkClick = (value: string) => {
  theme.setFrameworkPreference(value)
  closeMenu()
}

// --- Lifecycle ---
onMounted(() => {
  theme.applyFramework(theme.activeFramework)
  theme.applyThemeClass(theme.activeTheme)
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemChange = (event: MediaQueryListEvent) => {
    if (theme.themePreference === 'system') {
      const newTheme = event.matches ? 'dark' : 'light'
      theme.applyThemeClass(newTheme)
    }
  }
  mediaQuery.addEventListener('change', handleSystemChange)

  window.addEventListener('click', closeMenu)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', closeMenu, true) // Optional: close on scroll to prevent floating weirdness

  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleSystemChange)
    window.removeEventListener('click', closeMenu)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', closeMenu, true)
  })
})
</script>

<template>
  <div class="theme-chooser-root">
    <div
      ref="triggerRef"
      class="theme-trigger"
      :class="{ 'theme-active': isOpen }"
      @click="toggleMenu"
    >
      <span class="theme-label">
        <i class="fa-solid fa-palette"></i>
      </span>
      <i class="fa-solid fa-chevron-down theme-caret"></i>
    </div>

    <Teleport to="body">
      <Transition name="theme-dropdown-fade">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="theme-dropdown"
          :style="dropdownStyle"
          @click.stop
        >
          <div class="theme-section-title">Color Mode</div>
          <div
            v-for="option in themeOptions"
            :key="option.value"
            class="theme-item"
            :class="{ 'theme-selected': theme.themePreference === option.value }"
            @click="handleThemeClick(option.value)"
          >
            <span class="theme-item-label">{{ option.label }}</span>
            <i
              v-if="theme.themePreference === option.value"
              class="fa-solid fa-check theme-check"
            ></i>
          </div>

          <div class="theme-separator"></div>

          <div class="theme-section-title">Interface Style</div>
          <div
            v-for="option in frameworkOptions"
            :key="option.value"
            class="theme-item"
            :class="{ 'theme-selected': theme.activeFramework === option.value }"
            @click="handleFrameworkClick(option.value)"
          >
            <span class="theme-item-label">{{ option.label }}</span>
            <i
              v-if="theme.activeFramework === option.value"
              class="fa-solid fa-check theme-check"
            ></i>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Root */
.theme-chooser-root {
  display: inline-block;
  font-family: var(--font-family);
  user-select: none;
}

/* Trigger */
.theme-trigger {
  position: relative;
  padding: 6px 12px;
  border-radius: var(--btn-radius);
  cursor: default;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
  background: transparent;
  border: 1px solid transparent;
}

.theme-trigger:hover,
.theme-trigger.theme-active {
  background: rgba(var(--surface-rgb), 0.1);
  border: var(--surface-border);
}

.theme-caret {
  font-size: 10px;
  opacity: 0.6;
}

/* Dropdown */
.theme-dropdown {
  position: fixed;
  min-width: 220px;
  max-height: 80vh;
  overflow-y: auto;

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
}

/* Items */
.theme-item {
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

.theme-item:hover {
  background: var(--sys-primary);
  color: #fff;
}

.theme-item:hover .theme-check {
  color: #fff;
}

.theme-check {
  font-size: 12px;
  color: var(--sys-primary);
  margin-left: 12px;
}

/* Section Headers & Separators */
.theme-section-title {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.7;
  color: var(--text-secondary);
  padding: 8px 12px 4px;
  letter-spacing: 0.5px;
}

.theme-separator {
  height: 1px;
  background: var(--surface-border);
  margin: 6px 4px;
}

/* Transitions */
.theme-dropdown-fade-enter-active,
.theme-dropdown-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.theme-dropdown-fade-enter-from,
.theme-dropdown-fade-leave-to {
  opacity: 0;
  transform: scale(0.98); /* Removed translateY so transform-origin works cleanly */
}
</style>
