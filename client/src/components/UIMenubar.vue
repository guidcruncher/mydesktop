<template>
  <div class="ui-menu-bar">
    <template v-for="(menu, index) in menus || []" :key="index">
      <UIDropdownMenu
        :model-value="activeMenuIndex === index"
        @update:model-value="(val) => handleMenuToggle(index, val)"
      >
        <template #trigger="{ isOpen }">
          <div @mouseenter="handleHover(index)">
            <UIDropdownMenuTrigger
              :label="menu.label || ''"
              :active="isOpen"
              class="menubar-trigger"
            />
          </div>
        </template>

        <template v-for="(item, itemIndex) in menu.items || []" :key="itemIndex">
          <template v-if="item">
            <hr v-if="item.type === 'divider'" class="menu-divider" />

            <UIDropdownMenuItem
              v-else
              :label="item.label || ''"
              :icon="item.icon"
              :active="!!item.active"
              :title="item.shortcut ? `${item.label} (${item.shortcut})` : item.label"
              @click="handleItemClick(item, $event)"
            >
              <div class="item-content">
                <span>{{ item.label }}</span>
                <span v-if="item.shortcut" class="shortcut-text">{{ item.shortcut }}</span>
              </div>
            </UIDropdownMenuItem>
          </template>
        </template>
      </UIDropdownMenu>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import UIDropdownMenu from './UIDropdownMenu.vue'
import UIDropdownMenuTrigger from './UIDropdownMenuTrigger.vue'
import UIDropdownMenuItem from './UIDropdownMenuItem.vue'

const props = defineProps({
  menus: { type: Array, default: () => [] },
})

const emit = defineEmits(['action'])

const activeMenuIndex = ref(null)

const handleMenuToggle = (index, isOpen) => {
  if (isOpen) {
    activeMenuIndex.value = index
  } else if (activeMenuIndex.value === index) {
    // Only clear if the current menu explicitly asks to close
    activeMenuIndex.value = null
  }
}

const handleHover = (index) => {
  // Only switch menus on hover if another menu is ALREADY open
  if (activeMenuIndex.value !== null && activeMenuIndex.value !== index) {
    activeMenuIndex.value = index
  }
}

const handleItemClick = (item, event) => {
  if (!item) return
  activeMenuIndex.value = null // Close menu
  if (typeof item.action === 'function') item.action(event)
  else if (item.action) emit('action', item.action)
}
</script>

<style lang="scss" scoped>
.ui-menu-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(40px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;

  :deep(.menubar-trigger) {
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    &.active {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.menu-divider {
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 4px 0;
}

.item-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
  min-width: 120px;

  .shortcut-text {
    margin-left: 16px;
    opacity: 0.5;
    font-size: 12px;
    font-family: sans-serif;
  }
}
</style>
