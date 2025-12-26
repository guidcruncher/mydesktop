<template>
  <div class="apple-notification surface">
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

const emit = defineEmits(['close', 'update:modelValue'])

const closeNotification = () => {
  emit('close')
  emit('update:modelValue', false)
}
</script>

<style lang="scss">
.apple-notification {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  z-index: 9000;

  /* Solid Background */
  background-color: var(--notify-bg-color);
  color: var(--notify-text-color-primary);

  border-radius: var(--radius-medium);
  border: 1px solid var(--notify-border-color);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  width: 100%;
  max-width: 350px;

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
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
