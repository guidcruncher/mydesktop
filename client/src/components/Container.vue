<template>
  <div class="container-wrapper" v-background="bg">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const bg = computed(() => {
  return {
    type: 'image',
    src: 'https://assets.simpleviewinc.com/simpleview/image/fetch/c_fill,f_jpg,h_431,q_75,w_640/https://swtdmsmedia.newmindmedia.com/wsimgs/Lulworth_Estate_Photo_Competition_credit_Vikki_Douglas_Durdle_Door_2087049103.jpg',
  }
})

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
