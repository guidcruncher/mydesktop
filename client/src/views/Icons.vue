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
const limit = 100

const searchIcons = (query: string) => {
  if (limit) {
    if (query == '') {
      results.value = images.value.slice(0, limit)
    } else {
      results.value = images.value
        .filter((t: any) => {
          return t.label.toLowerCase().includes(query.toLowerCase())
        })
        .slice(0, limit)
    }
    if (query == '') {
      results.value = images.value.slice(0, limit)
    } else {
    }
  } else {
    if (query == '') {
      results.value = images.value
    } else {
      results.value = images.value.filter((t: any) => {
        return t.label.toLowerCase().includes(query.toLowerCase())
      })
    }
  }

  showEditor.value = true
}

onMounted(async () => {
  var url = `${apiBase}/api/icon/_index`
  const options = {
    method: 'GET',
  }
  const response = await fetch(url, options)
  if (response.ok) {
    images.value = await response.json()
    showEditor.value = true
    searchIcons('')
  }
})
</script>

<template>
  <UIImageBrowser
    v-if="showEditor"
    v-model="results"
    data-url-field="src"
    data-id-field="id"
    data-title-field="label"
    @search="searchIcons"
  >
  </UIImageBrowser>
</template>

<style lang="scss" scoped></style>
