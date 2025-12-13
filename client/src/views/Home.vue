<script setup lang="ts">
import { ref } from 'vue'
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

    <UIColorPicker v-model="color" @selected="selected" />
    {{ color }} {{ v }}
  </div>
</template>
