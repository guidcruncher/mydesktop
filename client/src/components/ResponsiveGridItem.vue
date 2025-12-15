<template>
  <div class="grid-cell" :style="itemStyles">
    <slot></slot>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue'

const props = defineProps({
  // CHANGED: Default is now 1 (Standard Grid behavior)
  // This allows items to flow horizontally by default
  span: { type: [Number, String], default: 1 },

  // Responsive Breakpoints
  xs: { type: [Number, String], default: null },
  sm: { type: [Number, String], default: null },
  md: { type: [Number, String], default: null },
  lg: { type: [Number, String], default: null },
  xl: { type: [Number, String], default: null },

  start: { type: [Number, String], default: null },
})

const currentMode = inject('grid-mode', 'dynamic')
const totalColumns = inject('grid-total-columns', 12)

const itemStyles = computed(() => {
  if (currentMode.value !== 'fixed') return {}

  const max = Number(totalColumns.value)

  // Base span defaults to 1 if not provided
  const vSpan = props.span || 1

  // Mobile-first inheritance logic:
  // If a specific breakpoint isn't set, it looks to the previous smaller one.
  const vXs = props.xs || vSpan
  const vSm = props.sm || vXs
  const vMd = props.md || vSm
  const vLg = props.lg || vMd
  const vXl = props.xl || vLg

  const styles = {
    '--s-xs': Math.min(Number(vXs), max),
    '--s-sm': Math.min(Number(vSm), max),
    '--s-md': Math.min(Number(vMd), max),
    '--s-lg': Math.min(Number(vLg), max),
    '--s-xl': Math.min(Number(vXl), max),

    minWidth: '0',
    width: 'auto',
    flexGrow: '0',
    flexShrink: '0',
  }

  if (props.start) {
    styles.gridColumnStart = props.start
  }

  return styles
})
</script>

<style scoped>
.grid-cell {
  /* Dynamic Mode Defaults */
  min-width: 80px;
  flex-grow: 1;
  flex-shrink: 1;
  box-sizing: border-box;
}

/* FIXED MODE CSS VARS */
:where(.mode-fixed .grid-cell) {
  grid-column-end: span var(--s-xs);
}

@media (min-width: 640px) {
  :where(.mode-fixed .grid-cell) {
    grid-column-end: span var(--s-sm);
  }
}

@media (min-width: 768px) {
  :where(.mode-fixed .grid-cell) {
    grid-column-end: span var(--s-md);
  }
}

@media (min-width: 1024px) {
  :where(.mode-fixed .grid-cell) {
    grid-column-end: span var(--s-lg);
  }
}

@media (min-width: 1280px) {
  :where(.mode-fixed .grid-cell) {
    grid-column-end: span var(--s-xl);
  }
}
</style>
