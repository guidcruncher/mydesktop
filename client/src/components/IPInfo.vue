<template></template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { IpInformation } from '../utils/iptools'

const props = defineProps({
  modelValue: {
    type: [Object],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

onMounted(async () => {
  const ipinfo = await IpInformation()
  emit('update:modelValue', ipinfo)
})
</script>

<style lang="scss" scoped></style>
