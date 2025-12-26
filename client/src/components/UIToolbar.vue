<template>
  <div class="ui-toolbar surface">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
// Props/Emits are not strictly necessary for this container, but could be added
// to handle fixed positioning or scrolling behavior if required.
</script>

<style lang="scss" scoped>
.ui-toolbar {
  // Styles mirroring the original component structure
  display: flex;
  align-items: center;
  width: 100%;
  height: 44px;
  padding: 0 16px;
  gap: 10px;

  /* Solid Background - Removed Glass/Blur */
  background: var(--ui-background);
  border-top: 1px solid var(--border-color);

  /* Position it just above the TabBar if used in layout */
  margin-top: 20px;
}
</style>
