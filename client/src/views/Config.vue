<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { IpInformation } from '../utils/iptools'

const showDesktop = ref(false)
const desktop = ref({})
const bg = ref({})
const location = ref('')

onMounted(async () => {
  var url = 'http://192.168.1.202:3009/api/desktop'
  const response = await fetch(url)
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
