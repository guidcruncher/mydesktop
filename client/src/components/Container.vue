<template>
  <div class="container-wrapper" v-background="bg">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { Desktop } from '../config'

const bg = ref({})

/* window.addEventListener(
  'touchmove',
  function (event) {
    if (event.scale !== 1) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  },
  { passive: false },
)*/

onMounted(async () => {
  const json = await Desktop()

  if (json && json.desktop) {
    bg.value = json.desktop
  }
})
</script>

<style lang="scss">
html,
body {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100%;
  overflow: hidden; /* Disables scrolling on the root window */
  overscroll-behavior: none; /* Disables the "bounce" effect on Mac/iOS */
  touch-action: none;
}

#app {
  width: 100vw;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.container-wrapper {
  overflow-y: scroll;
  overflow-x: auto;
  color: var(ui-text-primary);
  width: 100vw;
  height: 100%;
  padding-bottom: 120px;
  padding-top: 53px;
}
</style>
