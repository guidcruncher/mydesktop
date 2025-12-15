<script setup lang="ts">
import { ref } from 'vue'
import { computed } from 'vue'

const desktop = ref({})
</script>

<template>
  <div class="home" v-background="bg">
    <UIDesktopRenderer v-model="desktop"> </UIDesktopRenderer>
  </div>
  {{ bg }}
</template>
