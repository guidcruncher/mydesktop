<template>
  <div>
    <!-- Modal Overlay -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="modelValue" class="overlay" @click="closeOnOverlay">
          <div class="modal-container" :class="{ maximized: isMaximized }">
            <!-- Header -->
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

            <!-- Body -->
            <div class="modal-body">
              <slot name="body">
                <h2>Welcome to iOS 26</h2>
                <p>This is a modal dialog component with customizable content.</p>
              </slot>
            </div>

            <!-- Footer -->
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

// Props
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

// Emits
const emit = defineEmits(['update:modelValue', 'confirm', 'close'])

// State
const isMaximized = ref(false)
const isMinimizing = ref(false)

// Methods
const close = () => {
  emit('update:modelValue', false)
  emit('close')
  isMaximized.value = false
}

const closeOnOverlay = (event) => {
  if (props.closeOnOverlayClick && event.target.classList.contains('modal-overlay')) {
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

// Watch for modal state changes
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

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* Modal Container */
.modal-container {
  background: var(--modal-container-bg);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border-radius: 20px;
  box-shadow: 0 20px 60px var(--modal-shadow);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.modal-container.maximized {
  max-width: 95%;
  max-height: 95vh;
}

/* Modal Header */
.modal-header {
  background: linear-gradient(
    180deg,
    var(--modal-header-bg-start) 0%,
    var(--modal-header-bg-end) 100%
  );
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

.control-btn:active {
  transform: scale(0.95);
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

/* Control icons appear on hover */
.modal-header:hover .control-btn::after {
  opacity: 1;
}

.control-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.control-btn.close::after {
  content: '×';
  font-size: 10px;
  color: var(--control-close-icon);
  line-height: 1;
}

.control-btn.minimize::after {
  width: 6px;
  height: 1px;
  background: var(--control-minimize-icon);
}

.control-btn.maximize::after {
  width: 5px;
  height: 5px;
  border: 1px solid var(--control-maximize-icon);
  border-top: none;
  border-right: none;
  transform: translate(-50%, -50%) rotate(-45deg);
  margin-top: 1px;
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
  color: var(--btn-primary-color);
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

.modal-btn:active {
  transform: scale(0.98);
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

.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
}
</style>
