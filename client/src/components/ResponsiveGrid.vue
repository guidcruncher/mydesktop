<template>
  <div class="responsive-grid">
    <slot></slot>
  </div>
</template>

<script setup>
// Composition API setup block
import { ref } from 'vue'
</script>

<style scoped>
.responsive-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  justify-content: center;
}

.grid-cell {
  min-width: 300px;
  flex-grow: 1;
  flex-shrink: 1;
}
</style>
