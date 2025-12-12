<template>
  <div class="container-wrapper" v-background-mesh>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
</script>

<style lang="scss">
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Disables scrolling on the root window */
  overscroll-behavior: none; /* Disables the "bounce" effect on Mac/iOS */
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
