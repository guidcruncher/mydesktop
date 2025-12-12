<template>
  <div class="theme-chooser">
    <select :value="theme.preference" @change="handleThemeChange" class="theme-chooser__select">
      <option value="system">System Default</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </div>
</template>

<script lang="ts" setup>
import { useThemeStore } from '@/stores/themeStore' // Adjust path
import { ref, computed, watch, onMounted, onUnmounted } from 'vue' // <-- Add onUnmounted here!

const theme = useThemeStore()

const handleThemeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  // Pinia's setPreference action handles saving and class application
  theme.setPreference(target.value as 'light' | 'dark' | 'system')
}

// --- Initial Setup and OS Listener ---
onMounted(() => {
  // 1. Initial application of the theme based on loaded preference
  theme.applyThemeClass(theme.activeTheme)

  // 2. Set up listener for OS changes *if* preference is 'system'
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleSystemChange = (event: MediaQueryListEvent) => {
    // Only re-apply if the user's explicit preference is 'system'
    if (theme.preference === 'system') {
      const newTheme = event.matches ? 'dark' : 'light'
      theme.applyThemeClass(newTheme)
    }
  }

  // Attach the listener
  mediaQuery.addEventListener('change', handleSystemChange)

  // Clean up the listener when the component is unmounted
  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleSystemChange)
  })
})
</script>

<style lang="scss" scoped>
.theme-chooser {
  border: 1px solid var(--ui-separator);
  background: var(--ui-card-bg);
  border-radius: var(--radius-small);
  max-width: 300px;
}

.theme-chooser__label {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--ui-text-primary);
}

.theme-chooser__select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--ui-separator);
  background: var(--ui-background);
  color: var(--ui-text-primary);
}
</style>
