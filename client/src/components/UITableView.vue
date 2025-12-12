<template>
  <div class="ui-table-view">
    <div class="table-group">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
// No script logic needed.
</script>

<style lang="scss" scoped>
.ui-table-view {
  display: block;
  margin-bottom: 24px;

  .table-group {
    background: var(--ui-card-bg);
    border-radius: var(--radius-medium);
    overflow: hidden;
    margin: 0 16px; // Apply margin for grouped style look
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); // Subtle shadow for card look
  }
}
</style>
