<template>
  <div class="wheel" ref="wheelRef" @scroll="!disabled && debouncedHandleScroll($event)">
    <div class="padding" :style="{ height: paddingHeight }"></div>

    <div
      v-for="(item, index) in items"
      :key="index"
      class="item"
      :style="{ height: itemHeight + 'px', lineHeight: itemHeight + 'px' }"
    >
      <slot :item="item" :index="index">{{ item }}</slot>
    </div>

    <div class="padding" :style="{ height: paddingHeight }"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'

// --- Simple Local Debounce Utility ---
const debounce = (fn: Function, delay: number) => {
  let timeoutId: number
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay) as any
  }
}

interface Props {
  /** The array of items to display (e.g., months, hours, list items) */
  items: any[]
  /** The 0-based index of the item that should be selected */
  selectedIndex: number
  /** Height of a single item in pixels */
  itemHeight?: number
  /** Total height of the visible container in pixels */
  containerHeight?: number
  /** If the wheel should be disabled */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 34,
  containerHeight: 160,
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:selectedIndex', index: number): void
}>()

const wheelRef = ref<HTMLElement | null>(null)

// Calculated height for the top/bottom padding elements
const paddingHeight = computed(() => {
  return `${(props.containerHeight - props.itemHeight) / 2}px`
})

/**
 * Sets the wheel's scrollTop to center the item corresponding to the initial index.
 */
const calculateInitialScroll = () => {
  if (!wheelRef.value) return

  // Centering the Nth item (0-based) requires a scrollTop of N * ITEM_HEIGHT.
  wheelRef.value.scrollTop = props.selectedIndex * props.itemHeight
}

/**
 * Handles scroll events: determines the new selected index based on scroll position and emits it.
 * NOTE: The manual scroll-snapping line (target.scrollTop = ...) has been removed.
 * The visual snapping is now handled solely by CSS (scroll-snap-type).
 */
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement

  const currentScrollTop = target.scrollTop

  // 1. Calculate the 0-based data index (N) by rounding to the nearest snap point.
  // This is how the selected item is determined, even while scrolling.
  const itemIndex = Math.round(currentScrollTop / props.itemHeight)

  // 2. We skip manual snapping (target.scrollTop = ...), relying on CSS scroll-snap.

  // 3. Emit the index, clamped within the bounds of the actual data array
  const clampedIndex = Math.min(Math.max(0, itemIndex), props.items.length - 1)

  if (clampedIndex !== props.selectedIndex) {
    emit('update:selectedIndex', clampedIndex)
  }
}

const debouncedHandleScroll = debounce(handleScroll, 150)

// Watch the selectedIndex prop to update scroll position externally
watch(
  () => props.selectedIndex,
  () => {
    // We only update the scroll position if the prop change was external
    // and not a result of the local 'update:selectedIndex' emit.
    // nextTick ensures the DOM is ready for scroll manipulation.
    nextTick(calculateInitialScroll)
  },
  { immediate: true },
)

onMounted(() => {
  calculateInitialScroll()
})
</script>

<style lang="scss" scoped>
.wheel {
  flex: 1;
  overflow-y: scroll;
  // Scroll snap ensures the center of the item aligns with the center of the wheel
  scroll-snap-type: y mandatory;
  height: 100%;
  scrollbar-width: none;
  padding: 0 4px;

  &::-webkit-scrollbar {
    display: none;
  }
}

.item {
  text-align: center;
  font-size: 17px;
  color: var(--ui-text-primary);
  scroll-snap-align: center;
  user-select: none;
}

.padding {
  pointer-events: none;
}
</style>
