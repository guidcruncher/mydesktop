// stores/theme.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'app-theme-preference'
const FRAMEWORK_STORAGE_KEY = 'app-framework-preference'

// Function to check the system's current dark mode themePreference
function detectSystemTheme(): 'light' | 'dark' {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export const useThemeStore = defineStore('theme', () => {
  // --- State ---
  // The user's explicit themePreference ('light', 'dark', or 'system')
  const themePreference = ref<Theme>((localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'system')

  // --- Getters ---
  // The theme that is currently active and should be applied to the DOM
  const activeTheme = computed<'light' | 'dark'>(() => {
    if (themePreference.value === 'system') {
      return detectSystemTheme()
    }
    return themePreference.value
  })

  // --- State ---
  const frameworkPreference = ref<string>(
    (localStorage.getItem(FRAMEWORK_STORAGE_KEY) as string) || 'vision',
  )

  // --- Getters ---
  const activeFramework = computed<string>(() => {
    return frameworkPreference.value
  })

  // --- Actions ---
  /**
   * Sets the user's theme preference and saves it to local storage.
   * @param newTheme 'light', 'dark', or 'system'
   */
  function setFrameworkPreference(newFramework: string) {
    frameworkPreference.value = newFramework
    localStorage.setItem(FRAMEWORK_STORAGE_KEY, newFramework)
    applyFramework(newFramework)
  }

  // --- Actions ---
  /**
   * Sets the user's theme themePreference and saves it to local storage.
   * @param newTheme 'light', 'dark', or 'system'
   */
  function setThemePreference(newTheme: Theme) {
    themePreference.value = newTheme
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    applyThemeClass(activeTheme.value)
  }

  function applyFramework(value: string) {
    if (document.body.dataset.framework) {
      document.body.classList.remove(`framework-${document.body.dataset.framework}`)
    }

    document.body.classList.add(`framework-${value}`)
    document.body.dataset.framework = value
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
    document.body.dataset.theme = theme
  }

  function restoreTheme() {
    applyThemeClass(activeTheme.value)
    applyFramework(activeFramework.value)
  }

  return {
    themePreference,
    frameworkPreference,
    activeTheme,
    activeFramework,
    setFrameworkPreference,
    setThemePreference,
    applyThemeClass,
    applyFramework,
    restoreTheme,
  }
})
