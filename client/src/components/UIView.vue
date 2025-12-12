<template>
  <div class="uiview-container">
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
</script>

<style scoped>
.uiview-container {
  background: var(--bg-primary);
  border-radius: var(--radius-medium);
  padding: var(--spacing-large);
  box-shadow: var(--shadow-default);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.uiview-container:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}
</style>
