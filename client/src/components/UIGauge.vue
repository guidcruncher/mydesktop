<script setup>
import { computed, ref, onUnmounted } from 'vue';

// 1. Props Definition
const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  readonly: {
    type: Boolean,
    default: true,
  },
  /**
   * Array of color bands.
   * Example: [{ from: 0, to: 50, color: '#22c55e' }, { from: 50, to: 100, color: '#ef4444' }]
   */
  bands: {
    type: Array,
    default: () => [],
  },
  // Optional label to show below the value
  label: {
    type: String,
    default: '',
  },
});

// 2. Emits
const emit = defineEmits(['update:modelValue']);

// 3. State
const gaugeRef = ref(null);
const isDragging = ref(false);

// 4. Computed Logic
const percentage = computed(() => {
  const val = Math.min(Math.max(props.modelValue, props.min), props.max);
  const range = props.max - props.min;
  return range === 0 ? 0 : ((val - props.min) / range) * 100;
});

// Determine the active color based on bands or default system primary
const activeColor = computed(() => {
  if (props.bands && props.bands.length > 0) {
    const match = props.bands.find(
      (b) => props.modelValue >= b.from && props.modelValue <= b.to
    );
    if (match) return match.color;
  }
  // Fallback to CSS variable for primary color if no band matches
  return 'var(--sys-primary)';
});

// CSS styles for the root element
const rootStyles = computed(() => {
  return {
    '--gauge-value': percentage.value,
    '--gauge-fill-color': activeColor.value,
    cursor: props.readonly ? 'default' : 'pointer',
  };
});

// 5. Interaction Logic (Drag/Click)
const updateValueFromEvent = (event) => {
  if (props.readonly || !gaugeRef.value) return;

  // Handle both mouse and touch events
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  const rect = gaugeRef.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = clientX - centerX;
  const dy = clientY - centerY;

  // Calculate angle (0 degrees at top/12 o'clock)
  // Math.atan2(y, x) gives angle from positive x axis (3 o'clock)
  // We offset by 90 degrees to make 0 at the top
  let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  
  // Normalize negative angles (0 to 360)
  if (angleDeg < 0) angleDeg += 360;

  // Convert angle to value
  const range = props.max - props.min;
  const rawValue = (angleDeg / 360) * range + props.min;

  // Clamp value
  let newValue = Math.min(Math.max(rawValue, props.min), props.max);
  
  // Round to integer for cleaner UI (optional, remove if float needed)
  newValue = Math.round(newValue);

  emit('update:modelValue', newValue);
};

const startDrag = (event) => {
  if (props.readonly) return;
  isDragging.value = true;
  updateValueFromEvent(event);
  
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchmove', onDrag, { passive: false });
  window.addEventListener('touchend', stopDrag);
};

const onDrag = (event) => {
  if (!isDragging.value) return;
  event.preventDefault(); // Prevent scrolling while dragging
  updateValueFromEvent(event);
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('touchend', stopDrag);
};

// Cleanup on unmount just in case
onUnmounted(() => {
  stopDrag();
});
</script>

<template>
  <div 
    class="ui-gauge" 
    ref="gaugeRef" 
    :style="rootStyles" 
    :class="{ 'is-interactive': !readonly, 'is-dragging': isDragging }"
    @mousedown="startDrag"
    @touchstart="startDrag"
  >
    <!-- The rotating fill is handled by CSS conic-gradient on the pseudo-element in SCSS -->
    
    <!-- Inner Content -->
    <div class="ui-gauge-inner">
      <div class="ui-gauge-value">
        <!-- Slot allows parent to format text (e.g., add units) -->
        <slot :value="modelValue">{{ Math.round(modelValue) }}</slot>
      </div>
      <div v-if="label" class="ui-gauge-label">{{ label }}</div>
    </div>
  </div>
</template>

<style scoped>
/* We stick to standard CSS here, but utilizing the CSS variables 
   defined in the global framework.scss. 
*/

.ui-gauge {
  /* Default Dimensions */
  --gauge-size: 140px;
  --gauge-thickness: 16px;
  
  /* Colors - using Fallbacks if framework not loaded */
  --gauge-bg: var(--surface-bg, rgba(0,0,0,0.1));
  --gauge-text: var(--text-color, #333);
  
  /* Calculated via JS */
  /* --gauge-value: Passed from style binding (0-100) */
  /* --gauge-fill-color: Passed from style binding */

  position: relative;
  width: var(--gauge-size);
  height: var(--gauge-size);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: none; /* Prevent scroll on mobile touch */
  
  /* The Track & Fill */
  /* We use a conic gradient: Fill color up to X%, then Empty color */
  background: conic-gradient(
    var(--gauge-fill-color) calc(var(--gauge-value) * 1%), 
    var(--gauge-bg) 0
  );
  
  transition: transform 0.1s;
}

/* Hover effect for interactive mode */
.ui-gauge.is-interactive:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.ui-gauge.is-interactive:active,
.ui-gauge.is-dragging {
  transform: scale(0.98);
}

/* The Center Mask (Donut Hole) */
.ui-gauge::after {
  content: '';
  position: absolute;
  top: var(--gauge-thickness);
  left: var(--gauge-thickness);
  right: var(--gauge-thickness);
  bottom: var(--gauge-thickness);
  background: var(--widget-bg, #fff); /* Matches widget background */
  border-radius: 50%;
  z-index: 1;
}

/* Inner Text Content */
.ui-gauge-inner {
  position: relative;
  z-index: 2; /* Sit on top of the mask */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* Allow clicks to pass through to the ring */
}

.ui-gauge-value {
  font-family: var(--font-family, sans-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color, #000);
}

.ui-gauge-label {
  font-family: var(--font-family, sans-serif);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.7;
  margin-top: 4px;
  color: var(--text-secondary, #666);
}

/* =========================================
   FRAMEWORK SPECIFIC OVERRIDES
   (Uses :global() selector to hook into framework classes on body/parent)
   ========================================= */

/* VisionOS (Glassy) */
:global(.framework-vision) .ui-gauge {
  --gauge-bg: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}
:global(.framework-vision) .ui-gauge::after {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

/* CDE (Industrial / Retro) */
:global(.framework-cde) .ui-gauge {
  --gauge-bg: #a0a0a0;
  --gauge-thickness: 20px;
  border: 2px inset #f0f0f0; /* Outer Bevel */
  box-shadow: inset 2px 2px 6px rgba(0,0,0,0.3);
}
:global(.framework-cde) .ui-gauge::after {
  background: var(--widget-bg);
  border: 2px outset #f0f0f0; /* Inner Bevel */
}
:global(.framework-cde) .ui-gauge-value {
  text-shadow: 1px 1px 0 #fff;
}

/* NeXTSTEP (Black & White) */
:global(.framework-nextstep) .ui-gauge {
  --gauge-bg: #fff;
  border: 1px solid #000;
}
:global(.framework-nextstep) .ui-gauge::after {
  background: #fff;
  border: 1px solid #000;
}
:global(.framework-nextstep.dark-mode) .ui-gauge {
  --gauge-bg: #333;
  border: 1px solid #fff;
}
:global(.framework-nextstep.dark-mode) .ui-gauge::after {
  background: #000;
  border: 1px solid #fff;
}
</style>
