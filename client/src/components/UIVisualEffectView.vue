<template>
  <div class="visual-effect-view">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
// This is a simple container and requires no script logic.
</script>

<style lang="scss" scoped>
.visual-effect-view {
  display: block;

  // Liquid Glass Effect
  background: var(--glass-bg);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid var(--glass-border);
  overflow: hidden;
  transition: background-color 0.3s ease;
}
</style>
