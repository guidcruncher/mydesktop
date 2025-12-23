<script setup lang="ts">
import { inject, onMounted, computed, ref } from 'vue'
import { IpInformation } from '../utils/iptools'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const showEditor = ref(false)
const images = ref([])
const results = ref([])

const apiBase = inject('API_BASE_URL')

const searchIcons = () => {
  results = imasges
  showEditor = true
}

onMounted(async () => {
  var url = `${apiBase}/api/icon/_index`
  const options = {
    method: 'GET',
  }
  const response = await fetch(url, options)
  if (response.ok) {
    images = await response.json()
    showEditor.value = true
  }
})
</script>

<template>
  <UIImageBrowser
    v-if="showEditor"
    v-model="results"
    dataurlfield="src"
    dataidfield="id"
    datatitlefield="label"
  >
  </UIImageBrowser>
</template>

<style lang="scss" scoped></style>
