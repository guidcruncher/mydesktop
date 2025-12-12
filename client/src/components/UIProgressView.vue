<template>
  <div class="ui-progress-view">
    <div class="track">
      <div class="fill" :style="{ width: `${progressValue}%` }"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

interface Props {
  value?: number | string // 0 to 100
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
})

const progressValue = computed(() => {
  const val = parseFloat(props.value.toString())
  return Math.max(0, Math.min(100, val))
})
</script>

<style lang="scss" scoped>
.ui-progress-view {
  display: block;
  width: 100%;

  .track {
    height: 4px;
    background: var(--system-gray5);
    border-radius: 2px;
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: var(--system-blue);
    transition: width 0.3s ease;
  }
}
</style>
