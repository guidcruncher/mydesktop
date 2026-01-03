<script setup>
defineProps({
  label: String,
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue'])

function toggle(event) {
  emit('update:modelValue', event.target.checked)
}
</script>

<template>
  <label class="checkbox-container">
    <input type="checkbox" :checked="modelValue" @change="toggle" />
    <span class="checkmark"></span>
    {{ label }}
  </label>
</template>

<style scoped>
.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-family);
  font-size: 0.9rem;
  cursor: pointer;
  color: var(--text-color);
  user-select: none;
}
.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
.checkmark {
  position: relative;
  height: 20px;
  width: 20px;
  background-color: rgba(var(--surface-rgb), 0.1);
  border: var(--surface-border);
  border-radius: 4px;
  transition: all 0.2s;
}
.checkbox-container:hover input ~ .checkmark {
  background-color: rgba(var(--surface-rgb), 0.2);
}
.checkbox-container input:checked ~ .checkmark {
  background-color: var(--sys-primary);
  border-color: transparent;
}
.checkmark:after {
  content: '';
  position: absolute;
  display: none;
}
.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}
.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
/* Framework overrides */
.framework-nextstep .checkmark {
  border: 1px solid black;
}

.framework-riscos .checkmark {
  border: 2px inset #fff;
}
</style>
