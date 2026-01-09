<template>
  <div class="ui-progress-group">
    <div class="ui-progress-label">
      <span>{{ label }}</span>
      <span :style="{ color: isComplete ? 'var(--sys-success)' : '' }">
        {{ displayValue }}
      </span>
    </div>
    <div class="ui-progress-track">
      <div
        class="ui-progress-fill"
        :class="{ striped: striped }"
        :style="{ width: percent + '%', background: color ? `var(${color})` : '' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  label: String,
  striped: Boolean,
  color: String,
})

const percent = computed(() => (props.value / props.max) * 100)
const displayValue = computed(() => {
  if (props.value >= props.max) return 'Completed'
  return Math.round(percent.value) + '%'
})
const isComplete = computed(() => props.value >= props.max)
</script>

<style scoped>
.ui-progress-group {
  margin-bottom: 16px;
}
.ui-progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-secondary);
}
.ui-progress-track {
  width: 100%;
  height: var(--progress-height);
  background: var(--progress-bg);
  border-radius: var(--progress-radius);
  overflow: hidden;
  position: relative;
}
.ui-progress-fill {
  height: 100%;
  background: var(--sys-primary);
  transition: width 0.3s ease;
  border-radius: inherit;
  position: relative;
}

.ui-progress-fill.striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 20px 20px;
  animation: progress-stripe 1s linear infinite;
}
@keyframes progress-stripe {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 0;
  }
}
</style>
