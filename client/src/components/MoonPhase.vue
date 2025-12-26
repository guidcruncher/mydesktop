<script setup>
import { computed } from 'vue'

// Define props mirroring the attributes described in the article
const props = defineProps({
  // 0 to 100
  illumination: {
    type: Number,
    default: 50,
  },
  // 'new moon', 'waxing crescent', 'first quarter', 'waxing gibbous',
  // 'full moon', 'waning gibbous', 'last quarter', 'waning crescent'
  phase: {
    type: String,
    default: 'full moon',
  },
  width: {
    type: String,
    default: '200px',
  },
  // Latitude for rotation calculation
  lat: {
    type: Number,
    default: 0,
  },
  // Hour of the day (0-24)
  hour: {
    type: Number,
    default: 12,
  },
})

// Compute CSS variables to pass data to the styles
const styleVars = computed(() => ({
  '--illumination': props.illumination,
  '--lat': props.lat,
  '--hour': props.hour,
  width: props.width,
}))
</script>

<template>
  <div class="moon-phase" :data-phase="phase.toLowerCase()" :style="styleVars"></div>
</template>

<style lang="scss" scoped>
/* Container 
*/
.moon-phase {
  aspect-ratio: 1;
  border-radius: 50%;
  display: block;
  overflow: hidden; /* 'clip' is newer, 'hidden' is safer if avoiding fallbacks */
  position: relative;

  /* Calculate rotation based on Lat/Hour inputs 
    Logic adapted from the article's calc() formulas
  */
  --_l: calc(var(--lat) * 1.5deg);
  --_a: calc(((var(--hour) - 12) * 15 * 0.7) * 1deg);
  --_r: calc(var(--_l) + var(--_a));

  transform: rotate(var(--_r, 0deg));
}

.moon-phase::before {
  background: #f0f0f0; /* Fallback color if image missing */
  background: url('/img/moon.png') center / cover no-repeat;
  background-size: contain;
  background-repeat: no-repeat;
  content: '';
  inset: 0;
  position: absolute;
  filter: sepia(1) grayscale(0.25); /* Filter from the article */
}

/* Shadow / Phase Shape (::after) 
*/
.moon-phase::after {
  background-color: #000;
  content: '';
  height: 100%;
  position: absolute;

  /* Width Calculation:
    100% - (1% * illumination value)
  */
  --_w: calc(100% - 1% * var(--illumination));
  width: var(--_w, 0%);

  /* Inset Inline: 
    Controls if the shadow is on the left or right 
  */
  inset-inline: var(--_ii, auto 0);

  /* Border Radius Control:
    Controlled by 4 variables for specific corners
  */
  border-radius: var(--_btlr, 0) var(--_btrr, 0) var(--_bbrr, 0) var(--_bblr, 0);
}

/* Phase Logic Selectors 
  Mapping props.phase to CSS logic
*/

/* Shadow position for waxing phases */
.moon-phase[data-phase*='first-quarter'],
.moon-phase[data-phase*='waxing'] {
  --_ii: 0 auto;
}

/* Rounding for crescent/first-quarter/waxing (Left side curves) */
.moon-phase[data-phase*='crescent'],
.moon-phase[data-phase*='first-quarter'],
.moon-phase[data-phase*='waxing'] {
  --_bblr: 100%;
  --_btlr: 100%;
}

/* Rounding for crescent/last-quarter/waning (Right side curves) */
.moon-phase[data-phase*='crescent'],
.moon-phase[data-phase*='last-quarter'],
.moon-phase[data-phase*='waning'] {
  --_btrr: 100%;
  --_bbrr: 100%;
}

/* Gibbous Logic 
  The shadow becomes concave, so we cannot use border-radius.
  We switch to using a mask.
*/
.moon-phase[data-phase*='gibbous']::after {
  border-radius: 0;
  width: 100%;
}

/* Waxing Gibbous Mask */
.moon-phase[data-phase='waxing gibbous']::after {
  mask: radial-gradient(
    circle at 100% 50%,
    #0000 calc(100% - var(--_w)),
    #000 calc(100% - var(--_w) + 1px)
  );
  -webkit-mask: radial-gradient(
    circle at 100% 50%,
    #0000 calc(100% - var(--_w)),
    #000 calc(100% - var(--_w) + 1px)
  );
}

/* Waning Gibbous Mask */
.moon-phase[data-phase='waning gibbous']::after {
  mask: radial-gradient(
    circle at 0% 50%,
    #0000 calc(100% - var(--_w)),
    #000 calc(100% - var(--_w) + 1px)
  );
  -webkit-mask: radial-gradient(
    circle at 0% 50%,
    #0000 calc(100% - var(--_w)),
    #000 calc(100% - var(--_w) + 1px)
  );
}
</style>
