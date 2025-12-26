<template>
  <div
    class="ui-tab-item"
    :class="{ active: isActive }"
    @click="handleClick"
    :aria-selected="isActive"
    role="tab"
  >
    <IconView :name="icon" class="ui-tab-item__icon" />
    <div class="ui-tab-item__label">{{ label }}</div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue' // 'onMounted' is no longer needed here
import IconView from './IconView.vue'
import { TabBarContextKey } from '@/utils/TabBarContext'

interface Props {
  icon: string
  label: string
}

const props = defineProps<Props>()

// --- Inject Context ---
const context = inject(TabBarContextKey)

if (!context) {
  throw new Error('UITabItem must be used within a UITabBar component.')
}

// --- Dynamic Index Assignment (FIX: Synchronous Registration) ---
const tabId = Symbol()

// FIX: Register the tab immediately during the setup phase.
// This guarantees 'assignedIndex' is set to 0, 1, 2, etc., before rendering.
const assignedIndex = ref<number>(context.registerTab(tabId))

// --- State Calculation ---
// isActive reliably accesses a positive index value.
const isActive = computed(() => assignedIndex.value === context.activeTabIndex.value)

// --- Action ---
const handleClick = () => {
  // Since registration is synchronous, we know the index is valid.
  context.selectTab(assignedIndex.value)
}
</script>

<style lang="scss" scoped>
.ui-tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
  padding: 0 4px;
  color: var(--ui-text-secondary);

  &.active {
    color: var(--system-blue);
  }

  &__icon {
    font-size: 1.5em;
    margin-bottom: 3px;
  }

  &__label {
    font-size: 10px;
    font-weight: 500;
  }
}
</style>
