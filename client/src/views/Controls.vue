<script setup lang="ts">
import { inject, onMounted, computed, ref } from 'vue'
import { IpInformation } from '../utils/iptools'
import { Desktop } from '../config'

onMounted(async () => {})
</script>

<template>
  <div class="home">
    <ControlsDemo></ControlsDemo>
  </div>
</template>
