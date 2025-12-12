<template>
  <div class="ui-search-bar">
    <div class="wrapper">
      <IconView name="magnifyingglass" class="search-icon" />
      <input type="text" :placeholder="placeholder" :value="modelValue" @input="handleInput" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import IconView from './IconView.vue' // Assuming IconView is available

interface Props {
  placeholder?: string
  modelValue: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search',
})

const emit = defineEmits(['update:modelValue'])

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<style lang="scss" scoped>
.ui-search-bar {
  display: block;
  padding: 10px 16px;
  background: transparent;

  .wrapper {
    background: var(--system-gray5);
    border-radius: 10px;
    height: 36px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    color: var(--ui-text-secondary);
    transition: background 0.2s ease;
  }

  .search-icon {
    width: 16px;
    height: 16px;
    margin-right: 6px;
    fill: currentColor;
    opacity: 0.6;
  }

  input {
    border: none;
    background: transparent;
    font-size: 17px;
    width: 100%;
    outline: none;
    color: var(--ui-text-primary);
    font-family: inherit;
  }

  input::placeholder {
    color: var(--ui-text-secondary);
  }
}
</style>
