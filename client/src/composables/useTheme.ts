import { ref, watch, onMounted } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const currentTheme = ref<Theme>('system')

function applyTheme(theme: Theme) {
  const element = document.documentElement
  if (theme === 'system') {
    element.removeAttribute('data-theme')
  } else {
    element.setAttribute('data-theme', theme)
  }
  localStorage.setItem('theme', theme)
}

export function useTheme() {
  onMounted(() => {
    const storedTheme = (localStorage.getItem('theme') as Theme) || 'system'
    currentTheme.value = storedTheme
    applyTheme(currentTheme.value)
  })

  watch(
    currentTheme,
    (newTheme) => {
      applyTheme(newTheme)
    },
    { immediate: false },
  )

  return {
    currentTheme,
    setTheme: (theme: Theme) => {
      currentTheme.value = theme
    },
    toggleLightDark: () => {
      currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
    },
  }
}
