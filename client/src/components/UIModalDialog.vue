<template>
  <div>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="modelValue" class="overlay" @click="closeOnOverlay">
          <div class="modal-container surface" :class="{ maximized: isMaximized }">
            <div class="modal-header">
              <div class="window-controls">
                <button class="control-btn close" @click="close" title="Close"></button>
                <button class="control-btn minimize" @click="minimize" title="Minimize"></button>
                <button
                  class="control-btn maximize"
                  @click="toggleMaximize"
                  title="Maximize"
                ></button>
              </div>
              <div class="modal-title">
                <slot name="header">Modal Dialog</slot>
              </div>
            </div>

            <div class="modal-body">
              <slot name="body">
                <h2>Welcome</h2>
                <p>This is a modal dialog component with customizable content.</p>
              </slot>
            </div>

            <div class="modal-footer" v-if="$slots.footer || showDefaultFooter">
              <slot name="footer">
                <button class="modal-btn secondary" @click="close">Cancel</button>
                <button class="modal-btn primary" @click="confirm">Confirm</button>
              </slot>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  showDefaultFooter: {
    type: Boolean,
    default: true,
  },
  closeOnOverlayClick: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'close'])

const isMaximized = ref(false)
const isMinimizing = ref(false)

const close = () => {
  emit('update:modelValue', false)
  emit('close')
  isMaximized.value = false
}

const closeOnOverlay = (event) => {
  if (props.closeOnOverlayClick && event.target.classList.contains('overlay')) {
    close()
  }
}

const minimize = () => {
  isMinimizing.value = true
  setTimeout(() => {
    close()
    isMinimizing.value = false
  }, 300)
}

const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value
}

const confirm = () => {
  emit('confirm')
  close()
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
/* Overlay with Dimmed Background */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--modal-overlay-bg);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal Container - Solid */
.modal-container {
  background: var(--modal-container-bg);
  border-radius: 20px;
  box-shadow: 0 20px 60px var(--modal-shadow);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color); /* Added subtle border */
}

.modal-container.maximized {
  max-width: 95%;
  max-height: 95vh;
}

/* Modal Header */
.modal-header {
  background: var(--modal-header-bg);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--modal-header-border);
  flex-shrink: 0;
}

/* Window Controls */
.window-controls {
  display: flex;
  gap: 8px;
  margin-right: 12px;
}

.control-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.control-btn:hover {
  filter: brightness(1.1);
}

.control-btn.close {
  background: linear-gradient(135deg, var(--control-close-start) 0%, var(--control-close-end) 100%);
}

.control-btn.minimize {
  background: linear-gradient(
    135deg,
    var(--control-minimize-start) 0%,
    var(--control-minimize-end) 100%
  );
}

.control-btn.maximize {
  background: linear-gradient(
    135deg,
    var(--control-maximize-start) 0%,
    var(--control-maximize-end) 100%
  );
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--modal-title-color);
  flex: 1;
  text-align: center;
  margin-right: 32px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
}

/* Modal Body */
.modal-body {
  padding: 24px 20px;
  color: var(--modal-body-color);
  line-height: 1.6;
  overflow-y: auto;
  flex: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
}

.modal-body :deep(h2) {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--modal-body-color);
}

.modal-body :deep(p) {
  font-size: 15px;
  color: var(--modal-body-secondary);
  margin-bottom: 20px;
}

/* Modal Footer */
.modal-footer {
  padding: 16px 20px;
  background: var(--modal-footer-bg);
  border-top: 1px solid var(--modal-footer-border);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.modal-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
}

.modal-btn.primary {
  background: linear-gradient(
    135deg,
    var(--btn-primary-bg-start) 0%,
    var(--btn-primary-bg-end) 100%
  );
  color: var(--text-color);
}

.modal-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--btn-primary-shadow);
}

.modal-btn.secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-color);
}

.modal-btn.secondary:hover {
  background: var(--btn-secondary-bg-hover);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.9) translateY(20px);
}
</style>
