<template>
  <div class="ui-tab-bar">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { ref, provide, readonly } from 'vue'
import { TabBarContext, TabBarContextKey } from '@/utils/TabBarContext'

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
  height: 83px;
  z-index: 1000;
  display: flex;
  justify-content: space-around;
  padding-top: 10px;
  padding-bottom: 34px;

  // Liquid Glass Effect
  background: var(--glass-bg);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border-top: 1px solid var(--glass-border);
}
</style>
