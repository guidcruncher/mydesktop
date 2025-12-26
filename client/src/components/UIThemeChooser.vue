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
import { useThemeStore } from '@/stores/themeStore'
import { onMounted, onUnmounted } from 'vue'

const theme = useThemeStore()

const handleThemeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  theme.setPreference(target.value as 'light' | 'dark' | 'system')
}

onMounted(() => {
  theme.applyThemeClass(theme.activeTheme)
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleSystemChange = (event: MediaQueryListEvent) => {
    if (theme.preference === 'system') {
      const newTheme = event.matches ? 'dark' : 'light'
      theme.applyThemeClass(newTheme)
    }
  }

  mediaQuery.addEventListener('change', handleSystemChange)

  onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleSystemChange)
  })
})
</script>

<style lang="scss" scoped>
.theme-chooser {
  border: 1px solid var(--ui-separator);
  /* Solid Background */
  background: var(--ui-card-bg);
  border-radius: var(--radius-small);
  max-width: 300px;
  position: relative;
  overflow: hidden;
}

.theme-chooser__select {
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: var(--ui-text-primary);
  appearance: none;
  cursor: pointer;
}
</style>
