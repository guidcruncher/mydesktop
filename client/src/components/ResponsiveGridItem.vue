<template>
  <div class="grid-cell">
    <slot></slot>
  </div>
</template>

<script setup>
// Composition API setup block
import { ref } from 'vue'
</script>

<style scoped>
.grid-cell {
  min-width: 80px;
  flex-grow: 1;
  flex-shrink: 1;
}
</style>
