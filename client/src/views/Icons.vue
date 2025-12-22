<script setup lang="ts">
import { inject, onMounted, computed, ref } from 'vue'
import { IpInformation } from '../utils/iptools'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const showEditor = ref(false)
const yaml = ref('')

const apiBase = inject('API_BASE_URL')

onMounted(async () => {
  var url = `${apiBase}/api/desktop`
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

const saveChanges = async () => {
  var url = `${apiBase}/api/desktop`

  const options = {
    method: 'PUT',
    body: yaml.value,
    headers: new Headers({
      'Content-Type': 'application/yaml',
    }),
  }

  const response = await fetch(url, options)
  const json = await response.json()

  if (!json.success) {
    alert(json.message)
    return
  }

  router.push({ path: '/', replace: true })
}

const cancelChanges = () => {
  router.push({ path: '/', replace: true })
}
</script>

<template>
  <div class="editor-container">
    <YamlEditor v-model="yaml" v-if="showEditor"> </YamlEditor>

    <UIButton variant="primary" @click="saveChanges">Save Changes</UIButton>&nbsp;
    <UIButton variant="secondary" @click="cancelChanges">Cancel Changes</UIButton>
  </div>
</template>

<style scoped>
.editor-container {
  width: 100vw;
  height: 90%;
}
</style>
