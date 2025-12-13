<script setup lang="ts">
import { ref } from 'vue'
import { computed } from 'vue'

const colors = ref(['#c775f0', '#55c1f6', '#f28cbf', '#f7c96e'])
const color = ref('#D6D3FF')
const v = ref({})

const bg = computed(() => {
  return {
    type: 'mesh',
    colors: colors.value,
    src: 'https://assets.simpleviewinc.com/simpleview/image/fetch/c_fill,f_jpg,h_431,q_75,w_640/https://swtdmsmedia.newmindmedia.com/wsimgs/Lulworth_Estate_Photo_Competition_credit_Vikki_Douglas_Durdle_Door_2087049103.jpg',
  }
})

const selected = (value) => {
  v.value = value
}
</script>

<template>
  <div class="home" v-background="bg">
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
  {{ bg }}
</template>
