<script setup>
import { computed } from 'vue'
</script>

<template>
  <div class="os-surface">
    <slot></slot>
  </div>
</template>

<style scoped>
.os-surface {
  background: var(--surface-bg);
  backdrop-filter: blur(var(--surface-blur)) saturate(var(--surface-saturate));
  -webkit-backdrop-filter: blur(var(--surface-blur)) saturate(var(--surface-saturate));
  border: var(--surface-border);
  border-radius: var(--surface-radius);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  color: var(--text-color);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
