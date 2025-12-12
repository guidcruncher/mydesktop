<template>
  <button
    type="button"
    :class="['ui-dropdown-trigger', { active }]"
    :title="title || label"
    @click="$emit('click', $event)"
  >
    <i v-if="icon" :class="['trigger-icon', icon]" />
    <span v-if="label" class="trigger-label">{{ label }}</span>
    <slot v-if="!icon && !label"></slot>
  </button>
</template>

<script setup>
defineProps({
  active: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  label: { type: String, default: '' },
  title: { type: String, default: '' },
})

defineEmits(['click'])
</script>

<style lang="scss" scoped>
.ui-dropdown-trigger {
  /* Inherit generic button resets or parent styles */
  appearance: none;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;

  .trigger-icon + .trigger-label {
    margin-left: 8px;
  }

  /* Active/Open State Highlight */
  &.active {
    background-color: rgba(255, 255, 255, 0.25) !important;
    color: #fff !important;
    border-color: rgba(255, 255, 255, 0.3);
  }
}
</style>
