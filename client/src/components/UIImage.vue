<template>
  <div class="ui-image-view" :style="containerStyles">
    <img :src="src" :alt="alt" :style="{ 'object-fit': imageObjectFit }" loading="lazy" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

// Define the available CSS object-fit values, using 'contain' as the requested default
export type ObjectFitValue = 'fill' | 'contain' | 'cover' | 'scale-down' | 'none'

interface Props {
  /** Image source URL */
  src: string
  /** Alternative text for accessibility */
  alt?: string
  /** Optional fixed width (e.g., '100px', '50%', 'auto') */
  width?: string
  /** Optional fixed height (e.g., '100px', 'auto') */
  height?: string
  /** Aspect ratio as a number (e.g., 16/9, 4/3, 1/1). 0 disables aspect ratio control. */
  aspectRatio?: string
  /** Border radius for the container (e.g., '12px', '50%') */
  borderRadius?: string
  /** * CSS object-fit value (equivalent to iOS Content Mode).
   * 'contain' scales to fit (Aspect Fit).
   * 'cover' scales to fill (Aspect Fill).
   */
  scale?: ObjectFitValue
}

// Set defaults for the props
const props = withDefaults(defineProps<Props>(), {
  alt: 'Image',
  aspectRatio: '16 / 9',
  borderRadius: '12px',
  // Renaming 'content' to 'contain' for standard CSS terminology
  scale: 'contain',
})

// --- Computed Properties ---

// Check if any explicit sizing props (width/height) are set by the user.
const hasExplicitSizing = computed(() => !!props.width || !!props.height)

// Dynamic styles for the outer container <div>.
const containerStyles = computed(() => {
  const styles: Record<string, string | number> = {}

  // 1. Sizing and Responsiveness Logic
  if (hasExplicitSizing.value) {
    styles.width = props.width || 'auto'
    styles.height = props.height || 'auto'
  } else {
    // Default behavior: Fit to parent width
    styles.width = '100%'
    styles.height = 'auto'
  }

  // 2. Aspect Ratio Control
  if (props.aspectRatio > 0) {
    styles.aspectRatio = props.aspectRatio
  }

  // 3. Border Radius
  styles.borderRadius = props.borderRadius

  // 4. Base Display Settings
  styles.display = 'block'
  styles.overflow = 'hidden'
  styles.flexShrink = '0'

  return styles
})

// Determines the object-fit style for the <img> tag
const imageObjectFit = computed<ObjectFitValue>(() => {
  // If aspect ratio is controlled OR explicit sizing is provided,
  // we use the backgroundSize prop (defaulting to 'contain').
  if (props.aspectRatio > 0 || hasExplicitSizing.value) {
    return props.scale
  }
  // If no sizing is specified, allow the image to fill the available space naturally (stretch/cover is often implied)
  return props.scale
})
</script>

<style lang="scss" scoped>
.ui-image-view {
  position: relative;
  // Base styles are handled by the dynamic 'style' binding.

  img {
    display: block;
    width: 100%;
    height: 100%; // Image fills the container
    // object-fit is now controlled by the dynamic style binding.
  }
}
</style>
