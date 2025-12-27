<script setup>
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
})
</script>

<template>
  <div class="ui-widget surface">
    <div v-if="title || $slots.title" class="ui-widget-header">
      <div class="ui-widget-title">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      <slot name="header-suffix" />
    </div>

    <div class="ui-widget-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ui-widget {
  padding: 24px;
  border-radius: var(--widget-radius, 20px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 160px;
  justify-content: flex-start;
  box-sizing: border-box;
  text-align: left;
}

.ui-widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.ui-widget-title {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
  font-family: var(--font-family, inherit);
}

.ui-widget-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Ensure nested inputs or controls don't break the layout */
.ui-widget-body :deep(> *) {
  max-width: 100%;
}
</style>
