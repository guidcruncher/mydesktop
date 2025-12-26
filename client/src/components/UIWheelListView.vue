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

const emit = defineEmits<{ (e: 'update:selectedIndex', index: number): void }>()

const wheelRef = ref<HTMLElement | null>(null)

// Calculate padding to ensure the first and last items can be centered
const paddingHeight = computed(() => {
  const halfContainer = props.containerHeight / 2
  const halfItem = props.itemHeight / 2
  return `${halfContainer - halfItem}px`
})

const calculateInitialScroll = () => {
  if (wheelRef.value) {
    wheelRef.value.scrollTop = props.selectedIndex * props.itemHeight
  }
}

// --- Scroll Handling ---
const handleScroll = (event: Event) => {
  if (!wheelRef.value) return

  const currentScrollTop = wheelRef.value.scrollTop
  // Calculate the index based on scroll position
  const itemIndex = Math.round(currentScrollTop / props.itemHeight)

  const clampedIndex = Math.min(Math.max(0, itemIndex), props.items.length - 1)

  if (clampedIndex !== props.selectedIndex) {
    emit('update:selectedIndex', clampedIndex)
  }
}

const debouncedHandleScroll = debounce(handleScroll, 50) // Faster debounce for snappier feel

watch(
  () => props.selectedIndex,
  () => {
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
  scroll-snap-type: y mandatory;
  height: 100%;
  scrollbar-width: none;
  padding: 0 4px;
  /* Solid Background Implicit from Parent */

  &::-webkit-scrollbar {
    display: none;
  }
}

.item {
  text-align: center;
  scroll-snap-align: center;
  font-size: 18px;
  color: var(--ui-text-primary);
  cursor: pointer;
  user-select: none;
  transition:
    color 0.2s,
    transform 0.2s;
  opacity: 0.6;
}

/* Simple active state based on proximity would need JS, 
   but standard CSS hover can simulate focus */
.wheel:hover .item {
  opacity: 0.8;
}
</style>
