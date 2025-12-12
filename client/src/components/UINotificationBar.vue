<template>
  <div class="apple-notification">
    <div class="notification-content">
      <span class="icon-placeholder">🔔</span>

      <div class="text-group">
        <p class="title">{{ title }}</p>
        <p class="message">{{ message }}</p>
      </div>
    </div>

    <button @click="closeNotification" class="close-btn" aria-label="Close notification">
      &times;
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// 1. Props Definition
const props = defineProps({
  title: {
    type: String,
    default: 'Notification',
  },
  message: {
    type: String,
    default: 'A brief message about an event or update.',
  },
  modelValue: {
    type: Boolean,
    default: true,
  },
})

// 3. Close/Visibility Logic
const emit = defineEmits(['close', 'update:modelValue'])

const closeNotification = () => {
  // Emit 'close' for custom handling
  emit('close')
  // Emit 'update:modelValue' for v-model compatibility
  emit('update:modelValue', false)
}
</script>

<style lang="scss">
// 3. Component Styling
.apple-notification {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  z-index: 9000;

  // Apply CSS variables for dynamic coloring
  background-color: var(--notify-bg-color);
  color: var(--notify-text-color-primary);

  // Apple-like styling: Rounded corners, slight border, shadow
  border-radius: var(--radius-medium);
  border: 1px solid var(--notify-border-color);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  // Key for the translucent Apple look
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); // For Safari compatibility

  width: 100%;
  max-width: 350px;

  // Font stack resembling the Apple UI
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif,
    'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';

  .notification-content {
    display: flex;
    align-items: center;
    flex-grow: 1;

    .icon-placeholder {
      font-size: 1.5em;
      margin-right: 10px;
      line-height: 1;
    }

    .text-group {
      flex-direction: column;
      line-height: 1.3;

      .title {
        font-weight: 600;
        margin: 0;
        font-size: 0.95em;
      }

      .message {
        margin: 0;
        font-size: 0.85em;
        color: var(--notify-text-color-secondary);
      }
    }
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2em;
    color: var(--notify-close-btn-color);
    padding: 0;
    margin-left: 10px;
    opacity: 0.7; // Slightly faded close icon

    &:hover {
      opacity: 1;
    }
  }
}
</style>
