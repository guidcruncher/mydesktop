<template>
  <div class="audio-player-wrapper">
    <canvas ref="visualizerCanvas" class="visualizer"></canvas>

    <div class="player-container" :class="{ playing: isPlaying }">
      <div class="album-art-container">
        <div class="glow-ring"></div>
        <div class="album-art" :style="{ background: track.gradient || defaultGradient }">
          <img v-if="track.cover" :src="track.cover" :alt="track.title" crossorigin="anonymous" />
          <span v-else class="album-art-placeholder">{{ track.emoji || '🎵' }}</span>
        </div>
        <div class="visualizer-bars">
          <div
            v-for="i in 8"
            :key="i"
            class="bar"
            :ref="
              (el) => {
                if (el) albumBars[i - 1] = el
              }
            "
          ></div>
        </div>
      </div>

      <div class="track-info">
        <div class="track-title">{{ track.title || 'No Track Selected' }}</div>
        <div class="track-artist">{{ track.artist || 'Unknown Artist' }}</div>
      </div>

      <div class="waveform-container">
        <div
          v-for="i in 60"
          :key="i"
          class="waveform-bar"
          :ref="
            (el) => {
              if (el) waveformBars[i - 1] = el
            }
          "
        ></div>
      </div>

      <div class="progress-section">
        <div class="progress-bar" @click="handleSeek">
          <div class="progress-fill" :style="{ width: progress + '%' }">
            <div class="progress-handle"></div>
          </div>
        </div>
        <div class="time-display">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(track.duration || 0) }}</span>
        </div>
      </div>

      <div class="controls">
        <div class="control-btn" @click="emit('prev')">⏮</div>
        <div class="control-btn play-btn" @click="togglePlay">{{ isPlaying ? '⏸' : '▶' }}</div>
        <div class="control-btn" @click="emit('next')">⏭</div>
      </div>

      <div class="volume-section">
        <div class="volume-icon">🔊</div>
        <div class="volume-bar" @click="handleVolume">
          <div class="volume-fill" :style="{ width: volume + '%' }"></div>
        </div>
      </div>

      <div class="frequency-display">
        <div class="freq-label">
          <div class="freq-value">{{ bassValue }}</div>
          <div class="freq-name">Bass</div>
        </div>
        <div class="freq-label">
          <div class="freq-value">{{ midValue }}</div>
          <div class="freq-name">Mid</div>
        </div>
        <div class="freq-label">
          <div class="freq-value">{{ trebleValue }}</div>
          <div class="freq-name">Treble</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  track: {
    type: Object,
    required: true,
    default: () => ({
      title: 'Select a Track',
      artist: '...',
      duration: 0,
      gradient: 'linear-gradient(135deg, #ccc 0%, #eee 100%)',
    }),
  },
  initialVolume: { type: Number, default: 70 },
})

const emit = defineEmits(['play', 'pause', 'stop', 'prev', 'next', 'seek', 'volume'])

// --- State ---
const visualizerCanvas = ref(null)
const albumBars = ref([])
const waveformBars = ref([])

const isDarkTheme = ref(false)
const isPlaying = ref(false)
const currentTime = ref(0)
const volume = ref(props.initialVolume)
const defaultGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

// Stats
const bassValue = ref(0)
const midValue = ref(0)
const trebleValue = ref(0)

// Animation / Performance
const cachedParticleColor = ref('rgba(255, 255, 255, 0.3)')
let animationId = null
let ctx = null
let lastTime = 0
let themeObserver = null

// --- Computed ---
const progress = computed(() => {
  if (!props.track.duration) return 0
  return (currentTime.value / props.track.duration) * 100
})

// --- Theme Detection Logic ---
const updateThemeState = () => {
  // Check if body has the class "dark-mode"
  isDarkTheme.value = document.body.classList.contains('dark-mode')

  // Update internal JS colors that CSS variables can't reach (Canvas drawing)
  cachedParticleColor.value = isDarkTheme.value
    ? 'rgba(102, 126, 234, 0.05)' // Dark mode particle
    : 'rgba(255, 255, 255, 0.3)' // Light mode particle

  // Force a redraw so color changes happen immediately even if paused
  if (!isPlaying.value) drawVisualizer()
}

// --- Actions ---
const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    lastTime = performance.now()
    startProgress()
    emit('play', currentTime.value)
  } else {
    cancelAnimationFrame(animationId)
    emit('pause', currentTime.value)
  }
}

const handleSeek = (e) => {
  if (!props.track.duration) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  const newTime = Math.max(0, Math.min(percent, 1)) * props.track.duration
  currentTime.value = newTime
  emit('seek', newTime)
}

const handleVolume = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const newVol = Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * 100, 100))
  volume.value = newVol
  emit('volume', newVol)
}

// Watch for track changes to reset
watch(
  () => props.track,
  () => {
    currentTime.value = 0
    drawVisualizer()
  },
  { deep: true },
)

// --- Visualization Loop ---
const simulateAudioData = () => {
  const bars = 64
  const data = new Array(bars)
  for (let i = 0; i < bars; i++) {
    const base = Math.sin(currentTime.value * 2 + i * 0.5) * 50 + 80
    const variation = Math.random() * 70
    data[i] = Math.max(20, base + variation)
  }
  return data
}

const drawVisualizer = () => {
  if (!ctx || !visualizerCanvas.value) return
  const width = visualizerCanvas.value.width
  const height = visualizerCanvas.value.height
  ctx.clearRect(0, 0, width, height)

  const audioData = simulateAudioData()
  const barWidth = width / audioData.length

  // Particles
  ctx.fillStyle = cachedParticleColor.value
  for (let i = 0; i < 50; i++) {
    const x = (currentTime.value * 50 + i * 100) % width
    const y = Math.sin(currentTime.value + i) * 100 + height / 2
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Canvas Bars
  audioData.forEach((value, i) => {
    const x = i * barWidth
    const barHeight = (value / 255) * height * 0.6
    const hue = (i / audioData.length) * 60 + 240
    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
    const opacity = isDarkTheme.value ? 0.8 : 0.6

    gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, ${opacity})`)
    gradient.addColorStop(1, `hsla(${hue}, 70%, 70%, ${opacity * 0.4})`)
    ctx.fillStyle = gradient
    ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight)
  })

  // DOM Bars (Album & Waveform)
  const updateDOMBars = (refs) => {
    refs.value.forEach((bar, i) => {
      if (bar) {
        const index = Math.floor((i / refs.value.length) * audioData.length)
        bar.style.height = (audioData[index] / 255) * 100 + '%'
      }
    })
  }
  updateDOMBars(waveformBars)
  updateDOMBars(albumBars)

  // Stats
  bassValue.value = Math.floor(audioData.slice(0, 4).reduce((a, b) => a + b) / 4)
  midValue.value = Math.floor(audioData.slice(20, 35).reduce((a, b) => a + b) / 15)
  trebleValue.value = Math.floor(audioData.slice(50, 64).reduce((a, b) => a + b) / 14)
}

const startProgress = () => {
  const animate = (timestamp) => {
    if (!isPlaying.value) return
    const delta = (timestamp - lastTime) / 1000
    lastTime = timestamp

    if (currentTime.value < props.track.duration) {
      if (!isNaN(delta) && delta > 0 && delta < 0.5) currentTime.value += delta
      drawVisualizer()
      animationId = requestAnimationFrame(animate)
    } else {
      currentTime.value = props.track.duration
      isPlaying.value = false
      emit('stop')
      emit('next')
    }
  }
  animationId = requestAnimationFrame(animate)
}

const formatTime = (s) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const resizeCanvas = () => {
  if (visualizerCanvas.value) {
    visualizerCanvas.value.width = window.innerWidth
    visualizerCanvas.value.height = window.innerHeight
    drawVisualizer() // Redraw on resize to prevent blank canvas
  }
}

onMounted(async () => {
  await nextTick()
  if (visualizerCanvas.value) {
    ctx = visualizerCanvas.value.getContext('2d')
    resizeCanvas()
  }
  window.addEventListener('resize', resizeCanvas)

  // --- Initialize Theme Observer ---
  updateThemeState() // Initial check

  // Create a MutationObserver to watch for class changes on <body>
  themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        updateThemeState()
      }
    })
  })

  themeObserver.observe(document.body, { attributes: true })
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resizeCanvas)
  if (themeObserver) themeObserver.disconnect()
})
</script>

<style scoped>
/* COMPONENT STYLES */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.audio-player-wrapper {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--audio-bg);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  position: relative;
  transition: background 0.5s ease;
}

.visualizer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.player-container {
  background: var(--audio-player-bg);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 35px;
  border: 1px solid var(--audio-player-border);
  box-shadow: var(--audio-player-shadow);
  width: 100%;
  max-width: 450px;
  padding: 40px 35px;
  position: relative;
  z-index: 2;
  transition: all 0.5s ease;
}

/* Album Art & Bars */
.album-art-container {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 25px;
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
}
.visualizer-bars {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  padding: 20px;
  gap: 4px;
  z-index: 2;
  pointer-events: none;
}
.bar {
  flex: 1;
  background: var(--audio-bar-gradient);
  border-radius: 4px 4px 0 0;
  height: 20%;
  transition: height 0.1s ease;
  opacity: 0.9;
}
.album-art {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  transition: all 0.5s ease;
}
.album-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.album-art-placeholder {
  font-size: 80px;
}

/* Glow Ring */
.glow-ring {
  position: absolute;
  inset: -20px;
  border-radius: 25px;
  background: var(--audio-glow-ring);
  filter: blur(30px);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}
.playing .glow-ring {
  opacity: 0.6;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

/* Track Info */
.track-info {
  text-align: center;
  margin-bottom: 25px;
}
.track-title {
  color: var(--audio-text-primary);
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.track-artist {
  color: var(--audio-text-secondary);
  font-size: 16px;
  font-weight: 500;
}

/* Waveform */
.waveform-container {
  height: 80px;
  margin-bottom: 20px;
  background: var(--audio-container-bg);
  border-radius: 15px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
}
.waveform-bar {
  flex: 1;
  background: var(--audio-waveform-gradient);
  border-radius: 2px;
  height: 40%;
  transition: height 0.15s ease;
}

/* Progress */
.progress-section {
  margin-bottom: 30px;
}
.progress-bar {
  background: var(--audio-progress-bg);
  height: 6px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 12px;
  position: relative;
}
.progress-fill {
  height: 100%;
  background: var(--audio-progress-gradient);
  border-radius: 10px;
  position: relative;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
}
.progress-handle {
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
}
.progress-bar:hover .progress-handle {
  opacity: 1;
}
.time-display {
  display: flex;
  justify-content: space-between;
  color: var(--audio-text-tertiary);
  font-size: 13px;
  font-weight: 500;
}

/* Controls */
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 25px;
}
.control-btn {
  background: var(--audio-control-bg);
  border: 1px solid var(--audio-control-border);
  border-radius: 50%;
  width: 55px;
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--audio-control-text);
  font-size: 22px;
}
.control-btn:hover {
  background: var(--audio-control-hover);
  transform: scale(1.05);
}
.play-btn {
  width: 70px;
  height: 70px;
  background: var(--audio-play-btn-bg);
  box-shadow: var(--audio-play-btn-shadow);
  color: white;
  font-size: 28px;
}
.play-btn:hover {
  box-shadow: var(--audio-play-btn-shadow-hover);
}

/* Volume */
.volume-section {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 0 10px;
}
.volume-icon {
  color: var(--audio-text-secondary);
  font-size: 20px;
}
.volume-bar {
  flex: 1;
  height: 6px;
  background: var(--audio-progress-bg);
  border-radius: 10px;
  cursor: pointer;
}
.volume-fill {
  height: 100%;
  background: var(--audio-volume-gradient);
  border-radius: 10px;
}

/* Stats */
.frequency-display {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding: 15px;
  background: var(--audio-container-bg);
  border-radius: 15px;
}
.freq-label {
  text-align: center;
  flex: 1;
}
.freq-value {
  color: var(--audio-accent-color);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}
.freq-name {
  color: var(--audio-text-quaternary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
