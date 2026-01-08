<template>
  <div class="ui-sparkline-wrapper" :style="{ height: height + 'px' }">
    <svg 
      class="ui-sparkline-svg" 
      viewBox="0 0 100 100" 
      preserveAspectRatio="none"
    >
      <!-- Bars Display -->
      <g v-if="type === 'bar'">
        <rect
          v-for="(bar, index) in bars"
          :key="index"
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="bar.height"
          :fill="resolvedColor"
          class="spark-bar"
        />
      </g>

      <!-- Line / Area Display -->
      <g v-else>
        <!-- Area Fill (Only for area type) -->
        <path
          v-if="type === 'area'"
          :d="areaPath"
          :fill="resolvedColor"
          class="spark-area"
        />
        
        <!-- The Line Stroke (For both line and area) -->
        <path
          :d="linePath"
          fill="none"
          :stroke="resolvedColor"
          :stroke-width="strokeWidth"
          vector-effect="non-scaling-stroke"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: { type: Array, required: true, default: () => [] },
  type: { type: String, default: 'line', validator: (v) => ['line', 'area', 'bar'].includes(v) },
  color: { type: String, default: '--sys-primary' }, // Can be var name or hex
  height: { type: Number, default: 50 },
  strokeWidth: { type: Number, default: 2 }
});

// Helper to resolve CSS variable or return raw color
const resolvedColor = computed(() => {
  if (props.color.startsWith('--')) return `var(${props.color})`;
  return props.color;
});

// Normalize data to 0-100 range
const normalizedData = computed(() => {
  if (!props.data.length) return [];
  const max = Math.max(...props.data);
  const min = Math.min(...props.data); // Or 0, depending on preference. Using min makes it dynamic.
  const range = max - min || 1; // Avoid division by zero
  
  // Return values mapped to 0-100 Y-axis (Inverted: 100 is bottom, 0 is top)
  // We leave 5px padding top/bottom so strokes don't clip
  return props.data.map(val => {
    const pct = (val - min) / range;
    return 95 - (pct * 90); 
  });
});

// Generate Path D string for Line
const linePath = computed(() => {
  const points = normalizedData.value;
  if (!points.length) return '';
  
  const stepX = 100 / (points.length - 1);
  
  return points.map((y, i) => {
    const x = i * stepX;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
});

// Generate Path D string for Area (closes the loop at bottom)
const areaPath = computed(() => {
  const line = linePath.value;
  if (!line) return '';
  return `${line} L 100 100 L 0 100 Z`;
});

// Calculate Bar Dimensions
const bars = computed(() => {
  const points = normalizedData.value;
  if (!points.length) return [];
  
  const count = points.length;
  const gap = 1; // 1% gap
  const width = (100 / count) - gap;
  
  return points.map((y, i) => ({
    x: i * (100 / count),
    y: y,
    width: width,
    height: 100 - y // Distance from point to bottom
  }));
});
</script>

<style scoped>
.ui-sparkline-wrapper {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.ui-sparkline-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.spark-area {
  opacity: 0.2;
}

.spark-bar {
  transition: y 0.2s, height 0.2s;
}
</style>
