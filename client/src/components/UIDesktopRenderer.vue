<template>
  <ResponsiveGrid v-if="visible">
    <ResponsiveGridItem v-for="item in components">
      <UIWidgetView v-if="item.type == 'widget'">
        <component :is="item.component" v-bind="getprops(item)"></component>
      </UIWidgetView>
      <UIFolderViewWidget v-else-if="item.type == 'folder'" v-bind="getprops(item)">
        <component
          v-for="child in item.components"
          :is="child.component"
          v-bind="getprops(child)"
        ></component>
      </UIFolderViewWidget>
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
  location: {
    type: String,
    default: ""
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

  if ((!p.location) || (p.location == "current")) {
    p.location = props.location
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
