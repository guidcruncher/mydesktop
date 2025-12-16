<template>
  <ResponsiveGrid v-if="visible">
    <ResponsiveGridItem v-for="item in components">
      <UIWidgetView v-if="item.type == 'widget'">
        <component :is="item.component" v-bind="getprops(item)"></component>
      </UIWidgetView>

      <component v-else :is="item.component" v-bind="getprops(item)"></component>
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
const getprops = (item) => {
  let p = item.props ?? {}
  switch (item.component) {
    case 'UIAnalogClock':
      p.faceColor = '#ffffff'
      p.borderColor = '#000000'
      p.hourHandColor = '#000000'
      p.minuteHandColor = '#000000'
      p.secondHandColor = '#ff0000'
      p.markerColor = '#000000'
      break
  }
  return p
}
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
