<script setup lang="ts">
import { ref } from 'vue'
const colors = ref(['#c775f0', '#55c1f6', '#f28cbf', '#f7c96e'])

const color = ref('#D6D3FF')
const v = ref({})

const selected = (value) => {
  v.value = value
}
</script>

<template>
  <div class="home">
    <h1>Welcome Home</h1>
    <p>This is the main landing page.</p>
    <ResponsiveGrid>
      <ResponsiveGridItem
        ><UIColorPicker v-model="colors[0]" @selected="selected"
      /></ResponsiveGridItem>
      <ResponsiveGridItem
        ><UIColorPicker v-model="colors[1]" @selected="selected"
      /></ResponsiveGridItem>
      <ResponsiveGridItem
        ><UIColorPicker v-model="colors[2]" @selected="selected"
      /></ResponsiveGridItem>
      <ResponsiveGridItem
        ><UIColorPicker v-model="colors[3]" @selected="selected"
      /></ResponsiveGridItem>
    </ResponsiveGrid>
  </div>
</template>
