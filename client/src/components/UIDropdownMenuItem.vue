<template>
  <button
    type="button"
    :class="['ui-dropdown-item', { 'is-selected': active }]"
    :title="title || label"
    @click="$emit('click', $event)"
  >
    <div class="icon-wrapper">
      <i v-if="icon" :class="icon" />
    </div>
    <span class="label-text"
      ><slot>{{ label }}</slot></span
    >

    <i v-if="active" class="fa-solid fa-check check-icon" />
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
.ui-dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 2px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  text-align: left;
  transition: all 0.2s ease;

  .icon-wrapper {
    width: 24px;
    display: flex;
    justify-content: center;
    margin-right: 8px;
    font-size: 16px;
  }

  .label-text {
    flex: 1;
  }

  .check-icon {
    font-size: 12px;
    margin-left: 8px;
    opacity: 0.8;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &.is-selected {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-weight: 600;

    .icon-wrapper {
      color: #fff;
    }
  }
}
</style>
