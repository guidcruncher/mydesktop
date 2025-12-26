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
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;

  background: var(--surface-bg) !important;
  backdrop-filter: blur(var(--surface-blur)) saturate(var(--surface-saturate)) !important;
  -webkit-backdrop-filter: blur(var(--surface-blur)) saturate(var(--surface-saturate));
  border: var(--surface-border);
  border-radius: var(--surface-radius);
  box-shadow: var(--surface-shadow);
  color: var(--text-color);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

</style>
