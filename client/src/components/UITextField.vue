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
    <!-- Clear button is hidden when disabled -->
    <IconView
      v-if="clearButton && modelValue && !disabled"
      name="xmark.circle.fill"
      class="clear-btn"
      @click="clearInput"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import IconView from './IconView.vue'

interface Props {
  placeholder?: string
  modelValue: string
  clearButton?: boolean | string
  /** New: Controls the disabled state of the input */
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
  // Guard against input when disabled
  if (!props.disabled) {
    emit('update:modelValue', target.value)
  }
}

const clearInput = () => {
  // Guard against clearing when disabled
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
  position: relative; // Needed for the clear button alignment
  height: 22px; // Typical text field height in iOS

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
    height: 100%; // Match wrapper height

    &::placeholder {
      color: var(--ui-text-secondary);
    }

    // Disabled state for input
    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  // Clear button styling
  .clear-btn {
    width: 20px;
    height: 20px;
    color: var(--ui-text-secondary);
    cursor: pointer;
    margin-left: 8px;
    flex-shrink: 0;
  }

  // General wrapper disabled style (less aggressive, input handles the main logic)
  &.disabled {
    cursor: not-allowed;
  }
}
</style>
