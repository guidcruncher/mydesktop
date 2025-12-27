<script setup>
import { ref, nextTick } from 'vue'

/**
 * UIModal.vue
 * An adaptive modal component that shifts its geometry and
 * backdrop effects based on the active framework.
 */
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
})

const isVisible = ref(false)
const isActive = ref(false)

/**
 * Exposes the show method to parent components.
 * Triggers the visibility and the entry animation.
 */
const show = async () => {
  isVisible.value = true
  // Wait for DOM to render before triggering the 'active' scale animation
  await nextTick()
  setTimeout(() => {
    isActive.value = true
  }, 10)
}

/**
 * Exposes the hide method to parent components.
 */
const hide = () => {
  isActive.value = false
  // Wait for the transition to finish before removing from DOM
  setTimeout(() => {
    isVisible.value = false
  }, 400) // Matches the 0.4s transition in the design system
}

// Expose methods to be accessible via template ref
defineExpose({ show, hide })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="ui-modal-overlay"
      :style="{ display: 'flex', opacity: isActive ? 1 : 0 }"
      @click.self="hide"
    >
      <div class="ui-modal surface" :class="{ active: isActive }">
        <!-- Modal Header -->
        <header v-if="title || $slots.title" class="ui-modal-header">
          <div class="ui-modal-title">
            <slot name="title">
              <span class="tag">{{ title }}</span>
            </slot>
          </div>
        </header>

        <!-- Modal Content (Default Slot) -->
        <div class="ui-modal-content">
          <slot />
        </div>

        <!-- Modal Footer (Buttons Slot) -->
        <footer v-if="$slots.buttons" class="ui-modal-footer">
          <slot name="buttons" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/**
 * Layout styles utilizing the global design system variables.
 */
.ui-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay-bg, rgba(0, 0, 0, 0.65));
  backdrop-filter: blur(var(--overlay-blur, 5px));
  -webkit-backdrop-filter: blur(var(--overlay-blur, 5px));
  z-index: 2000;
  transition: opacity 0.4s ease;
  align-items: center;
  justify-content: center;
}

.ui-modal {
  width: 95%;
  max-width: 500px;
  padding: 32px;
  border-radius: var(--modal-radius, 16px);
  display: flex;
  flex-direction: column;
  gap: 20px;
  transform: scale(0.9);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-sizing: border-box;
}

.ui-modal.active {
  transform: scale(1);
}

.ui-modal-header {
  display: flex;
  flex-direction: column;
}

.ui-modal-title {
  font-family: var(--font-family, inherit);
}

.ui-modal-content {
  font-family: var(--font-family, inherit);
  line-height: 1.6;
}

.ui-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

/* Framework-specific tag styling inside modal */
.tag {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.6;
  display: block;
  margin-bottom: 8px;
}

h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
}
</style>
