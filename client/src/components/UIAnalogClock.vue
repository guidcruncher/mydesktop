<template>
  <div class="analog-clock-wrapper">
    <div class="analog-clock" :style="clockPanelStyle">
      <svg :width="size" :height="size" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="50"
          :fill="faceColor || 'var(--clock-face-color, #ffffff)'"
          :stroke="borderColor || 'rgba(var(--clock-border-color, 0,0,0), 0.1)'"
          stroke-width="1"
        />

        <g class="minute-markers">
          <line
            v-for="m in 60"
            :key="m"
            x1="50"
            y1="2"
            x2="50"
            y2="4"
            stroke="var(--ui-text-tertiary, #8e8e93)"
            stroke-width="0.5"
            :transform="`rotate(${m * 6} 50 50)`"
          />
        </g>

        <g class="hour-markers">
          <line
            v-for="h in 12"
            :key="h"
            x1="50"
            y1="2"
            x2="50"
            y2="7"
            stroke="var(--ui-text-tertiary, #8e8e93)"
            stroke-width="1.5"
            :transform="`rotate(${(h * 30) % 360} 50 50)`"
          />
        </g>

        <g class="hour-numbers">
          <text
            v-for="h in 12"
            :key="h"
            :x="50 + 40 * Math.sin((h * 30 * Math.PI) / 180)"
            :y="50 - 40 * Math.cos((h * 30 * Math.PI) / 180) + 1.5"
            text-anchor="middle"
            alignment-baseline="middle"
            font-size="6"
            font-weight="bold"
            fill="var(--ui-text-primary, #000000)"
          >
            {{ h }}
          </text>
        </g>

        <line
          class="hour-hand"
          x1="50"
          y1="55"
          x2="50"
          y2="28"
          :stroke="hourHandColor || 'var(--clock-hand-hour, #000000)'"
          stroke-width="3"
          stroke-linecap="round"
          :transform="`rotate(${hourAngle} 50 50)`"
        />

        <line
          class="minute-hand"
          x1="50"
          y1="55"
          x2="50"
          y2="15"
          :stroke="minuteHandColor || 'var(--clock-hand-minute, #000000)'"
          stroke-width="2"
          stroke-linecap="round"
          :transform="`rotate(${minuteAngle} 50 50)`"
        />

        <line
          class="second-hand"
          x1="50"
          y1="55"
          x2="50"
          y2="10"
          :stroke="secondHandColor || 'var(--clock-hand-second, #ff3b30)'"
          stroke-width="1.5"
          stroke-linecap="round"
          :transform="`rotate(${secondAngle} 50 50)`"
        />

        <circle
          cx="50"
          cy="50"
          r="2.5"
          fill="var(--ui-background, #ffffff)"
          stroke="var(--ui-text-tertiary, #8e8e93)"
          stroke-width="0.5"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  size?: string
  timezone?: string
  glide?: boolean
  // New Optional Color Props
  faceColor?: string
  borderColor?: string
  hourHandColor?: string
  minuteHandColor?: string
  secondHandColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: '150',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  glide: false,
  // No defaults needed for color props, they will be undefined
  // and fall back to the CSS variables in the template.
})

const emit = defineEmits(['tick'])

const prevTime = ref(new Date())
const currentTime = ref(new Date())
let interval: number

type TimeUnit = 'hour' | 'minute' | 'second'

function parseTimeComponent(date: Date, timezone: string, type: TimeUnit): number {
  const options: Intl.DateTimeFormatOptions = { timeZone: timezone, [type]: '2-digit' }

  if (type === 'hour') {
    options.hourCycle = 'h23'
  }

  const formatter = new Intl.DateTimeFormat('en-US', options)
  const formattedTime = formatter.format(date)

  // Clean string to ensure only digits remain
  const numericalString = formattedTime.replace(/[^0-9]/g, '')
  return parseInt(numericalString, 10) || 0
}

const hour = computed(() => parseTimeComponent(currentTime.value, props.timezone, 'hour'))
const minute = computed(() => parseTimeComponent(currentTime.value, props.timezone, 'minute'))
const second = computed(() => parseTimeComponent(currentTime.value, props.timezone, 'second'))

// Millisecond-based calculations for smooth movement
const milliseconds = computed(() => currentTime.value.getMilliseconds())
const fractionalSecond = computed(() => second.value + milliseconds.value / 1000)

const secondAngle = computed(
  () =>
    props.glide
      ? fractionalSecond.value * 6 // Smooth rotation using fractional seconds
      : second.value * 6, // Stepping rotation using whole seconds
)

// The minute and hour angles also use the fractional second for a smoother look
const minuteAngle = computed(() => minute.value * 6 + fractionalSecond.value * 0.1)
const hourAngle = computed(
  () => (hour.value % 12) * 30 + minute.value * 0.5 + fractionalSecond.value * (0.5 / 60),
)

// Computed style for the container
const clockPanelStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}))

onMounted(() => {
  // Set a fast interval (16ms ≈ 60 FPS) when glide is true, otherwise use 1000ms (1 FPS)
  const intervalDuration = props.glide ? 16 : 1000

  interval = window.setInterval(() => {
    prevTime.value = currentTime.value
    currentTime.value = new Date()

    if (prevTime.value.getMinutes() != currentTime.value.getMinutes()) {
      emit('tick')
    }
  }, intervalDuration)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<style lang="scss" scoped>
.analog-clock-wrapper {
  --size: v-bind('props.size + "px"');
  display: flex;
  justify-content: center;
  align-items: center;

  .analog-clock {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: 50%;
    padding: 0;

    /* Use the variable or fallback */
    width: var(--size);
    height: var(--size);

    svg {
      display: block; /* Removes weird SVG spacing issues */
      shape-rendering: geometricPrecision;

      /* Animate Hour and Minute */
      .hour-hand,
      .minute-hand {
        transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
      }

      /* Second hand does not use CSS transition; gliding is handled by rapid JS updates. */
      .second-hand {
        // No CSS transition needed
      }

      /*
        NOTE: The color assignments are now handled directly in the <template>
        using the new props, and falling back to these CSS variables if the
        props are not provided.
      */
    }
  }
}
</style>
