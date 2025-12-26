<template>
  <div class="visual-effect-view surface">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
// This is now a simple container.
</script>

<style lang="scss" scoped>
.visual-effect-view {
  display: block;

  /* Replaced Glass Effect with Solid Theme Variable */
  background-color: var(--ui-card-bg);
  border: 1px solid var(--border-color);

  overflow: hidden;
  transition: background-color 0.3s ease;
}
</style>
