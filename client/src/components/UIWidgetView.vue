<template>
  <div class="widget-container">
    <div class="ui-widget">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
</script>

<style scoped>
.widget-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  transition: background-color 0.3s ease;
}

/* Widget */
.ui-widget {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 28px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  /* Use the variables defined in the theme class */
  background: var(--bg-widget);
  box-shadow: var(--shadow-base);
  border: var(--border-color);
}

/* Widget Interaction Styles (Also using variables) */
.ui-widget:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-hover); /* Only the box-shadow changes on hover */
}

.ui-widget:active {
  transform: scale(0.98);
}
</style>
