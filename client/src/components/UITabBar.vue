<template>
  <div class="ui-tab-bar surface">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { ref, provide, readonly } from 'vue'
import { type TabBarContext, TabBarContextKey } from '@/utils/TabBarContext'

interface Props {
  initialIndex?: number
}
const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0,
})

const emit = defineEmits<{
  (e: 'update:active-index', index: number): void
}>()

// --- State Management ---
const activeTabIndex = ref<number>(props.initialIndex)
const registeredTabIds = ref<symbol[]>([])

const selectTab = (index: number) => {
  if (activeTabIndex.value !== index) {
    activeTabIndex.value = index
    emit('update:active-index', index)
  }
}

// Returns the tab's sequential position (0, 1, 2, ...)
const registerTab = (tabId: symbol): number => {
  const index = registeredTabIds.value.length
  registeredTabIds.value.push(tabId)
  return index
}

// --- Provide Context ---
provide(TabBarContextKey, {
  activeTabIndex: readonly(activeTabIndex),
  selectTab,
  registerTab,
} as TabBarContext)
</script>

<style lang="scss" scoped>
.ui-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 83px; /* Standard iOS Tab Bar height including Home Indicator area */
  z-index: 1000;

  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  padding-top: 10px;
  padding-bottom: 24px; /* Space for Home Indicator */

  /* Solid Background - Removed Glass/Blur */
  background: var(--ui-background);
  border-top: 1px solid var(--border-color);

  /* Standard shadow for separation */
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}
</style>
