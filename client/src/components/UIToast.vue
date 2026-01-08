<template>
  <div class="ui-toast-container">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="ui-toast"
        :class="toast.type"
      >
        <i class="fa-solid ui-toast-icon" :class="getIcon(toast.type)"></i>
        <div class="ui-toast-content">
          <span class="ui-toast-title">{{ capitalize(toast.type) }}</span>
          <span class="ui-toast-msg">{{ toast.message }}</span>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast';

const { toasts } = useToast();

const getIcon = (type) => {
  if (type === 'success') return 'fa-circle-check';
  if (type === 'error') return 'fa-circle-exclamation';
  return 'fa-circle-info';
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
</script>

<style scoped>
.ui-toast-container {
  position: fixed; bottom: 60px; right: 20px;
  display: flex; flex-direction: column; gap: 10px;
  z-index: 10000; pointer-events: none;
}

.ui-toast {
  background: var(--surface-bg);
  backdrop-filter: blur(var(--surface-blur));
  -webkit-backdrop-filter: blur(var(--surface-blur));
  border: var(--surface-border);
  padding: 12px 16px;
  border-radius: var(--btn-radius);
  color: var(--text-color);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 250px;
  pointer-events: auto;
  display: flex; align-items: center; gap: 12px;
}

.ui-toast-icon { font-size: 1.2rem; }
.ui-toast.success .ui-toast-icon { color: var(--sys-success); }
.ui-toast.error .ui-toast-icon { color: var(--sys-danger); }
.ui-toast.info .ui-toast-icon { color: var(--sys-info); }

.ui-toast-content { display: flex; flex-direction: column; gap: 2px; }
.ui-toast-title { font-size: 0.9rem; font-weight: 700; }
.ui-toast-msg { font-size: 0.8rem; color: var(--text-secondary); }

.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(120%);
}
</style>
