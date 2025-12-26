<template>
  <div class="ui-text-field-wrapper" :class="{ disabled: disabled }">
    <input
      type="text"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      @input="handleInput"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
    <IconView
      v-if="clearButton && modelValue && !disabled"
      name="xmark.circle.fill"
      class="clear-btn"
      @click="clearInput"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import IconView from './IconView.vue'

interface Props {
  placeholder?: string
  modelValue: string
  clearButton?: boolean | string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  clearButton: false,
  disabled: false,
})

const emit = defineEmits(['update:modelValue'])

const isFocused = ref(false)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!props.disabled) {
    emit('update:modelValue', target.value)
  }
}

const clearInput = () => {
  if (!props.disabled) {
    emit('update:modelValue', '')
  }
}
</script>

<style lang="scss" scoped>
.ui-text-field-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
  height: 22px;

  input {
    width: 100%;
    border: none;
    background: transparent;
    font-size: 17px;
    color: var(--ui-text-primary);
    outline: none;
    padding: 0;
    margin: 0;
    font-family: inherit;
    height: 100%;

    &::placeholder {
      color: var(--ui-text-secondary);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  .clear-btn {
    margin-left: 8px;
    color: var(--ui-text-tertiary);
    cursor: pointer;
    font-size: 16px;
  }
}
</style>
