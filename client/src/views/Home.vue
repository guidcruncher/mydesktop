<script setup lang="ts">
import { inject, onMounted, computed, ref } from 'vue'
import { IpInformation } from '../utils/iptools'

const showDesktop = ref(false)
const desktop = ref({})
const bg = ref({})
const location = ref('')

onMounted(async () => {
  var url = `${inject('API_BASE_URL')}/api/desktop`
  const options = {
    method: 'GET',
    headers: new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
  }
  const response = await fetch(url, options)
  if (response.ok) {
    const json = await response.json()

    if (json.desktop && json.layout) {
      const ipinfo = await IpInformation()
      location.value = ipinfo.full
      desktop.value = json
      if (json.desktop.background) {
        bg.value = json.desktop.background
      }
      showDesktop.value = true
    }
  } else {
    alert('Error')
  }
})
</script>

<template>
  <div class="home" v-background="bg">
    <UIDesktopRenderer v-model="desktop" v-if="showDesktop" :location="location">
    </UIDesktopRenderer>
  </div>
</template>
