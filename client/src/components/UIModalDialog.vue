<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  title: {
    type: String,
    default: 'System Message',
  },
  actions: {
    type: Array,
    required: true,
    default: () => [],
  },
})

const emit = defineEmits(['actionclick', 'close'])

const close = () => {
  props.isOpen = false
  emit('close')
}

const actionClick = (item) => {
  emit('actionclick', item)
  props.isOpen = false
}
</script>

<template>
  <Teleport to="body">
    <div class="ui-modal-overlay" :class="{ active: isOpen }" @click.self="close">
      <div class="ui-modal">
        <div class="ui-widget-header">
          <h2>{{ title }}</h2>
          <div class="close-btn" @click="close">✕</div>
        </div>

        <slot></slot>

        <div class="modal-actions">
          <button class="btn" v-for="action in actions" @click="actionClick(action)">
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.ui-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay-bg);
  backdrop-filter: blur(var(--overlay-blur));
  -webkit-backdrop-filter: blur(var(--overlay-blur));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
}

.ui-modal-overlay.active {
  opacity: 1;
  pointer-events: all;
}

.ui-modal {
  width: 90%;
  max-width: 400px;
  background: rgba(var(--surface-rgb), 0.85);
  backdrop-filter: blur(var(--surface-blur)) saturate(var(--surface-saturate));
  -webkit-backdrop-filter: blur(var(--surface-blur)) saturate(var(--surface-saturate));
  border: var(--surface-border);
  color: var(--text-color);

  border-radius: var(--modal-radius);
  transform: scale(0.95);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ui-modal-overlay.active .ui-modal {
  transform: scale(1);
}

.close-btn {
  cursor: pointer;
  font-weight: bold;
  opacity: 0.6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
}

/* Framework Specific Overrides */
:global([data-framework='riscos']) .ui-modal {
  background: var(--surface-bg);
  border: 2px outset #fff;
  box-shadow: 10px 10px 0 rgba(0, 0, 0, 0.5);
}
.framework-nextstep .ui-modal {
  background: var(--surface-bg);
  border: 1px solid #000;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 1);
}

.dark-mode .framework-nextstep .ui-modal {
  box-shadow: 8px 8px 0 rgba(255, 255, 255, 1);
}
</style>
