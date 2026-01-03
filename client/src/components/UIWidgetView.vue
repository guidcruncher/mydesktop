<script setup>
import { computed } from 'vue'

/**
 * UIWidgetView.vue
 * A wrapper component that applies framework-adaptive glass/solid
 * widget styling to any child component or control.
 */
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  width: {
    type: String,
    default: 'auto',
  },
  height: {
    type: String,
    default: 'auto',
  },
  backgroundImage: {
    type: String,
    default: undefined,
  },
})

const getStyles = computed(() => {
  if (props.backgroundImage) {
    return {
      background: props.backgroundImage,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      width: props.width,
      height: props.height,
    }
  } else {
    return { width: props.width, height: props.height }
  }
})
</script>

<template>
  <div class="ui-widget" :style="getStyles">
    <div v-if="title || $slots.title" class="ui-widget-header">
      <div v-if="title || $slots.title" class="ui-widget-title">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<style scoped>
.ui-widget {
  background: var(--widget-bg);
  border: var(--widget-border);
  border-radius: var(--widget-radius);
  box-shadow: var(--widget-shadow);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  width: auto;
  height: auto;
}

.ui-widget:hover {
  transform: translateY(-2px);
}

.ui-widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ui-widget-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 1px;
  opacity: 0.7;
}
</style>
