<template>
  <ResponsiveGrid v-if="visible">
    <ResponsiveGridItem v-for="item in components">
      <component :is="item.component" v-bind="item.props"></component>
    </ResponsiveGridItem>
  </ResponsiveGrid>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, reactive, Teleport } from 'vue'
const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])
const desktop = ref(props.modelValue)

const components = computed(() => {
  if (desktop.value && desktop.value.layout && desktop.value.layout.components) {
    return desktop.value.layout.components
  }
  return []
})

const visible = computed(() => {
  return desktop.value && desktop.value.layout
})

onMounted(() => {})
</script>

<style lang="scss" scope></style>
