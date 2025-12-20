<script setup lang="ts">
import { inject, onMounted, computed, ref } from 'vue'
import { IpInformation } from '../utils/iptools'

const showEditor = ref(false)
const yaml = ref('')

onMounted(async () => {
  var url = `${inject("API_BASE_URL")}/api/desktop`
  const options = {
    method: 'GET',
    headers: new Headers({
      'Content-Type': 'application/yaml',
      Accept: 'application/yaml',
    }),
  }
  const response = await fetch(url, options)
  if (response.ok) {
    yaml.value = await response.text()
    showEditor.value = true
  }
})
</script>

<template>
  <div class="editor-container">
    <YamlEditor v-model="yaml" v-if="showEditor"> </YamlEditor>
  </div>
</template>

<style scoped>
.editor-container {
  width: 100vw;
  height: 90%;
}
</style>
