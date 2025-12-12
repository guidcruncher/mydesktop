<template>
  <div class="custom-panel" :style="panelStyle">
    <header class="panel-header">
      <slot name="header"></slot>
    </header>

    <main class="panel-body">
      <slot></slot>
    </main>

    <footer class="panel-footer">
      <slot name="footer"></slot>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  background: {
    type: String,
    required: true,
  },

  borderRadius: {
    type: [String, Number],
    default: 8,
  },
  color: {
    type: String,
    default: 'var(--ui-text-color)',
  },
})

const panelStyle = computed(() => {
  const isImage = props.background.includes('url(')

  return {
    '--panel-bg': isImage ? props.background : props.background,
    '--panel-radius': `${props.borderRadius}${typeof props.borderRadius === 'number' ? 'px' : ''}`,
    '--panel-color': props.color,

    ...(isImage && {
      'background-size': 'cover',
      'background-position': 'center',
    }),
  }
})
</script>

<style lang="scss" scoped>
.custom-panel {
  background: var(--panel-bg);
  border-radius: var(--panel-radius);

  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;

  border-top-left-radius: var(--panel-radius);
  border-top-right-radius: var(--panel-radius);
  color: var(--panel-color);
  font-weight: bold;
}

.panel-body {
  padding: 16px;
  flex-grow: 1;
  color: var(--panel-color);
}

.panel-footer {
  padding: 16px;

  border-bottom-left-radius: var(--panel-radius);
  border-bottom-right-radius: var(--panel-radius);

  // Still uses a raw glass definition as the color is absolute white, not themed.
  background: rgba(var(--color-glass-rgb), 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(var(--color-glass-rgb), 0.3);
  color: var(--panel-color);
  text-align: right;
}
</style>
