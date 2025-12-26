<template>
  <div class="popover-wrapper">
    <div v-if="modelValue" class="popover-content surface" role="dialog" aria-modal="true">
      <p><slot>This is a popover!</slot></p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  durationSeconds: {
    type: [Number, String],
    default: 5,
  },
})

const emit = defineEmits(['update:modelValue'])

let timer = null

watch(
  () => props.modelValue,
  (newVal) => {
    clearTimeout(timer)

    if (newVal) {
      const durationMs = parseFloat(props.durationSeconds) * 1000
      timer = setTimeout(() => {
        emit('update:modelValue', false)
        timer = null
      }, durationMs)
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.popover-wrapper {
  position: relative;
  display: inline-block;

  .popover-content {
    position: absolute;
    top: -5px;
    z-index: 9000;

    min-width: 250px;
    padding: 15px;
    border-radius: var(--radius-medium);

    /* Solid Background */
    background-color: var(--popover-bg);
    color: var(--popover-text);
    box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.2),
      0 0 0 1px var(--popover-border);

    &::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-bottom: 10px solid var(--popover-bg);
      z-index: 9000;
    }

    p {
      margin: 0;
    }
  }
}
</style>
