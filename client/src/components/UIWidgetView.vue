<template>
  <div class="widget-container">
    <div class="ui-widget surface">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
</script>

<style lang="scss" scoped>
.widget-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  transition: background-color 0.3s ease;
}

/* Widget */
.ui-widget {
  /* Removed Glassmorphism (backdrop-filter) */
  border-radius: 28px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;

  /* Solid Background Variable */
  background: var(--bg-widget);
  box-shadow: var(--shadow-base);
  border: var(--border-color-widget);
}

/* Widget Interaction Styles */
.ui-widget:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-hover);
}

.ui-widget:active {
  transform: scale(0.98);
}
</style>
