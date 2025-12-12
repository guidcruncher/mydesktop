<template>
  <div class="ui-text-view" :class="{ disabled: disabled }">
    <textarea
      :rows="rows"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      @input="handleInput"
    ></textarea>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  placeholder?: string
  rows?: number | string
  modelValue: string
  /** New: Controls the disabled state of the textarea */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Enter text here...',
  rows: 3,
  disabled: false,
})

const emit = defineEmits(['update:modelValue'])

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  // Guard against input when disabled
  if (!props.disabled) {
    emit('update:modelValue', target.value)
  }
}
</script>

<style lang="scss" scoped>
.ui-text-view {
  display: block;
  width: 100%;
  padding: 10px 0;

  // NEW: Disabled State Styling
  &.disabled {
    opacity: 0.6;
    pointer-events: none; /* Block interaction */
    cursor: not-allowed;
  }

  textarea {
    width: 100%;
    border: none;
    background: transparent;
    font-size: 17px;
    color: var(--ui-text-primary);
    outline: none;
    resize: none;
    padding: 0;
    font-family: inherit;
    line-height: 1.4;

    // Native disabled styling override
    &:disabled {
      color: var(--ui-text-secondary); /* Use secondary text color when disabled */
      -webkit-text-fill-color: var(--ui-text-secondary); /* Safari fix */
      opacity: 1; /* Reset native opacity if applied, let wrapper handle it */
    }
  }

  textarea::placeholder {
    color: var(--ui-text-tertiary);
  }
}
</style>
