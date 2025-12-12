<template>
  <nav :class="['navigation-bar', { 'is-scrolled': isScrolled }]">
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
  // Simple logic to check if the user has scrolled past the top of the content.
  // This is often used in iOS to change the appearance of the navigation bar.
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // Check initial state
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
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

  // Liquid Glass Effect
  background: var(--glass-bg);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border-bottom: 1px solid var(--glass-border);

  transition:
    border-bottom 0.3s ease,
    background 0.3s ease;

  &__title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-weight: 600;
    font-size: 17px;
    color: var(--ui-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 140px); // Leave space for buttons
  }

  &__slot {
    // Allows buttons to take their natural width
    flex: 0 0 auto;

    &--left {
      justify-content: flex-start;
    }

    &--right {
      justify-content: flex-end;
    }
  }
}
</style>
