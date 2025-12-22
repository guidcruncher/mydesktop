<script setup>
import { ref } from 'vue'

const props = defineProps({
  // Trigger (Icon) Props
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: false,
  },
  folderWidth: {
    type: String,
    default: '90%',
  },
  // Default to auto so it fits the content size primarily
  folderHeight: {
    type: String,
    default: 'auto',
  },
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
  <UIAppIconItem :label="props.label" :icon="props.icon" @click="openFolder" />

  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="widget-overlay" @click.self="closeFolder">
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
/* Full screen overlay settings */
.widget-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;

  /* Background Blur & Color from Variables */
  background-color: var(--modal-overlay-bg);
  backdrop-filter: blur(var(--modal-overlay-bg-blur));
  -webkit-backdrop-filter: blur(var(--modal-overlay-bg-blur));

  /* Center the folder in the middle of the screen */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Ensure padding so the folder doesn't touch the screen edges on mobile */
  padding: 20px;
  box-sizing: border-box;
}

.folder-wrapper {
  /* Allow the wrapper to shrink to fit content */
  width: auto;
  height: auto;

  /* Prevent the wrapper from growing larger than the screen */
  max-width: 100%;
  max-height: 100%;

  display: flex;
  justify-content: center;
}

/* Deep selector to override the specific child FolderView styles */
:deep(.folder-view-container) {
  /* Override the margin from the original component so it centers correctly in our flex overlay */
  margin: 0;

  /* Ensure the folder container never exceeds the screen height minus padding */
  max-height: calc(100vh - 40px);

  /* If content is too big for the window, this ensures the scrollbar appears inside the folder */
  overflow-y: auto;
}

/* Vue Transition Styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
