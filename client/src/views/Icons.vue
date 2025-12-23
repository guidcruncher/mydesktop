<script setup lang="ts">
import { inject, onMounted, computed, ref } from 'vue'
import { IpInformation } from '../utils/iptools'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const showEditor = ref(false)
const images = ref([])
const results = ref([])
const query = ref('')

const apiBase = inject('API_BASE_URL')

const searchIcons = (limit: Number) => {
  if (limit) {
    if (query.value == '') {
      results.value = images.value.slice(0, limit)
    } else {
      results.value = images.value
        .filter((t: any) => {
          return t.label.toLowerCase().startsWith(query.value.toLowerCase())
        })
        .slice(0, limit)
    }
    if (query.value == '') {
      results.value = images.value.slice(0, limit)
    } else {
    }
  } else {
    if (query.value == '') {
      results.value = images.value
    } else {
      results.value = images.value.filter((t: any) => {
        return t.label.toLowerCase().startsWith(query.value.toLowerCase())
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
    searchIcons(100)
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
    <template #sidebar>
      <UITextField v-model="query" />

      <UIButton variant="primary" @click="searchIcons(100)">Search</UIButton>&nbsp;
    </template>
  </UIImageBrowser>
</template>

<style lang="scss" scoped></style>
