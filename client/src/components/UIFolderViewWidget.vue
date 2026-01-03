<script setup>
import { ref } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  icon: { type: String, required: false },
  folderWidth: { type: String, default: '90%' },
  folderHeight: { type: String, default: 'auto' },
})

const isOpen = ref(false)
const openFolder = () => {
  isOpen.value = true
}
const closeFolder = () => {
  isOpen.value = false
}
</script>

<template>
  <UIAppIconButton :label="props.label" :icon="props.icon" @click="openFolder" />

  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="ui-modal-overlay active" @click.self="closeFolder">
        <div class="folder-wrapper">
          <UIFolderView
            :width="props.folderWidth"
            :height="props.folderHeight"
            class="folder-content"
            v-if="isOpen"
          >
            <template #title>
              <slot name="title">{{ props.label }}</slot>
            </template>
            <slot></slot>
          </UIFolderView>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.folder-wrapper {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  justify-content: center;
}

:deep(.folder-view-container) {
  margin: 0;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  /* Use system surface styles */
  background: var(--surface-bg);
  backdrop-filter: blur(var(--surface-blur));
  border: var(--surface-border);
  border-radius: var(--folder-radius);
  color: var(--text-color);
  box-shadow: var(--dropdown-shadow);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
