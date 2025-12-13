<template>
  <div class="container-wrapper">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

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
  touch-action: none;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.container-wrapper {
  overflow-y: scroll;
  color: var(ui-text-primary);
}
</style>
