<script setup>
defineProps({
  modelValue: String,
  placeholder: String,
  type: {
    type: String,
    default: 'text',
  },
})

const emit = defineEmits(['update:modelValue'])

function handleInput(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <input
    :type="type"
    class="form-control"
    :placeholder="placeholder"
    :value="modelValue"
    @input="handleInput"
  />
</template>

<style scoped>
.form-control {
  width: 100%;
  padding: 12px 16px;
  box-sizing: border-box;
  font-family: var(--font-family);
  font-size: 0.95rem;
  color: var(--text-color);
  background: rgba(var(--surface-rgb), 0.1);
  border: var(--surface-border);
  border-radius: var(--btn-radius);
  outline: none;
  transition: all 0.2s ease;
}
.form-control:focus {
  border-color: var(--sys-primary);
  background: rgba(var(--surface-rgb), 0.2);
  box-shadow: 0 0 0 1px var(--sys-primary);
}
</style>
