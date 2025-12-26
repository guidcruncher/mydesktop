<template>
  <i v-if="iconClass" :class="iconClass" class="icon-view" aria-hidden="true"></i>
  <span v-else class="icon-view--missing"> [Icon: {{ name }} missing or not mapped] </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  name: string // The UI-specific name (e.g., 'star.fill', 'chevron.left')
  style?: 'solid' | 'regular' | 'light' | 'duotone' // Maps to Font Awesome styles (fa-solid, fa-regular, etc.)
}

const props = withDefaults(defineProps<Props>(), {
  style: 'solid', // Default to Font Awesome's fa-solid
})

// --- Computed Class Generation ---
const stylePrefix = computed(() => {
  switch (props.style) {
    case 'regular':
      return 'fa-regular'
    case 'light':
      return 'fa-light'
    case 'duotone':
      return 'fa-duotone'
    case 'solid':
    default:
      return 'fa-solid'
  }
})

const iconClass = computed(() => {
  const faName = props.name
  if (!faName) {
    return null
  }
  // Returns a string like: 'fa-solid fa-star'
  return `${stylePrefix.value} fa-${faName}`
})
</script>

<style lang="scss" scoped>
.icon-view {
  // Base Font Awesome styling ensures correct alignment
  display: inline-block;
  vertical-align: middle;

  // Set the size using Font Awesome's default font sizing
  font-size: 1.2em;

  // Inherit the color set by the parent element (e.g., UITabItem's color)
  color: inherit;
}

.icon-view--missing {
  color: var(--system-red);
  font-size: 10px;
}

// Example override for UITabItem:
.ui-tab-item .icon-view {
  font-size: 1.5em; // Make tab icons slightly larger
}
</style>
