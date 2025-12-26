<template>
  <nav :class="['navigation-bar', 'surface', { 'is-scrolled': isScrolled }]">
    <div class="navigation-bar__slot navigation-bar__slot--left">
      <slot name="left"></slot>
    </div>
    <div class="navigation-bar__title">{{ title }}</div>
    <div class="navigation-bar__slot navigation-bar__slot--right">
      <slot name="right"></slot>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  title: string
}

const props = defineProps<Props>()

const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss">
.navigation-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  width: 100%;

  /* Solid Background */
  background: var(--ui-background);
  border-bottom: 1px solid var(--border-color);

  transition:
    border-bottom 0.3s ease,
    background 0.3s ease,
    box-shadow 0.3s ease;

  /* Optional: Add slight shadow when scrolled instead of blur */
  &.is-scrolled {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  &__title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-weight: 600;
    font-size: 17px;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 140px);
  }

  &__slot {
    flex: 0 0 auto;

    &--left {
      justify-content: flex-start;
    }

    &--right {
      justify-content: flex-end;
    }
  }

  body {
    padding-bottom: 44px !important;
  }
}
</style>
