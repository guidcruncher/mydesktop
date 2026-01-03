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
  <div class="switch-container">
    <label class="switch">
      <input type="checkbox" :checked="modelValue" @change="toggle" />
      <span class="slider"></span>
    </label>
    <span v-if="label">{{ label }}</span>
  </div>
</template>

<style scoped>
.switch-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--font-family);
  font-size: 0.9rem;
  color: var(--text-color);
}
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(150, 150, 150, 0.3);
  border: var(--surface-border);
  transition: 0.4s;
  border-radius: 999px;
}
.slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 3px;
  background-color: var(--text-color);
  transition: 0.4s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: var(--sys-primary);
}
input:checked + .slider:before {
  transform: translateX(20px);
  background-color: #fff;
}
/* RISC OS Specific */
.framework-riscos .slider {
  border-radius: 0;
  border: 2px inset #fff;
}
</style>
