// stores/theme.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'app-theme-preference'

// Function to check the system's current dark mode preference
function detectSystemTheme(): 'light' | 'dark' {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export const useThemeStore = defineStore('theme', () => {
  // --- State ---
  // The user's explicit preference ('light', 'dark', or 'system')
  const preference = ref<Theme>((localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'system')

  // --- Getters ---
  // The theme that is currently active and should be applied to the DOM
  const activeTheme = computed<'light' | 'dark'>(() => {
    if (preference.value === 'system') {
      return detectSystemTheme()
    }
    return preference.value
  })

  // --- Actions ---
  /**
   * Sets the user's theme preference and saves it to local storage.
   * @param newTheme 'light', 'dark', or 'system'
   */
  function setPreference(newTheme: Theme) {
    preference.value = newTheme
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    applyThemeClass(activeTheme.value)
  }

  /**
   * Applies the 'dark-mode' class to the <body> element.
   * This function is also called externally on store initialization.
   * @param theme 'light' or 'dark'
   */
  function applyThemeClass(theme: 'light' | 'dark') {
    const bodyClassList = document.body.classList
    if (theme === 'dark') {
      bodyClassList.add('dark-mode')
    } else {
      bodyClassList.remove('dark-mode')
    }
  }

  function restoreTheme() {
    applyThemeClass(activeTheme)
  }

  return {
    preference,
    activeTheme,
    setPreference,
    applyThemeClass,
    restoreTheme,
  }
})
