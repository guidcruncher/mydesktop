<script setup lang="ts">
import { inject, onMounted, computed, ref } from 'vue'
import { IpInformation } from '../utils/iptools'
import { Desktop } from '../config'

const showDesktop = ref(false)
const desktop = ref({})
const location = ref('')

onMounted(async () => {
  const json = await Desktop()
  if (json) {
    if (json.desktop && json.layout) {
      const ipinfo = await IpInformation()
      location.value = ipinfo.full
      desktop.value = json
      showDesktop.value = true
    }
  } else {
    alert('Error')
  }
})
</script>

<template>
  <div class="home">
    <UIDesktopRenderer v-model="desktop" v-if="showDesktop" :location="location">
    </UIDesktopRenderer>
  </div>
</template>
