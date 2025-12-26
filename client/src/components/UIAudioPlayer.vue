<template>
  <audio
    ref="audioElement"
    :src="track.src"
    crossorigin="anonymous"
    @ended="handleEnded"
    @timeupdate="handleTimeUpdate"
    @loadedmetadata="handleMetadata"
  ></audio>

  <div class="player-container surface" :class="{ 'compact-mode': !showArt }">
    <div v-if="showArt" class="display-section">
      <div class="album-art-container">
        <div class="glow-ring" :class="{ active: isPlaying }"></div>

        <div class="album-art" :style="{ background: track.gradient || defaultGradient }">
          <img
            v-if="currentCover"
            :src="currentCover"
            :alt="track.title"
            crossorigin="anonymous"
            class="fade-in"
          />
          <span v-else class="album-art-placeholder">
            {{ isLoadingArt ? '⏳' : track.emoji || '🎵' }}
          </span>
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
        <div class="track-title" :title="track.title">
          {{ track.title || 'No Track Selected' }}
        </div>
        <div class="track-artist">{{ track.artist || 'Unknown Artist' }}</div>
      </div>
    </div>

    <div class="controls-section">
      <div v-if="showWaveform" class="waveform-container">
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
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>

      <div class="playback-controls">
        <button class="control-btn" @click="emit('prev')" title="Previous">⏮</button>
        <button class="control-btn play-btn" @click="togglePlay">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <button class="control-btn" @click="emit('next')" title="Next">⏭</button>
      </div>

      <div class="volume-section">
        <div class="volume-icon" @click="toggleMute">{{ volume > 0 ? '🔊' : '🔇' }}</div>
        <div class="volume-bar" @click="handleVolume">
          <div class="volume-fill" :style="{ width: volume + '%' }"></div>
        </div>
      </div>
    </div>

    <div v-if="showStats" class="stats-section">
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
import { inject, ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const API_BASE_URL = `${inject('API_BASE_URL')}`

const props = defineProps({
  track: {
    type: Object,
    required: true,
    default: () => ({
      title: 'Select a Track',
      artist: '...',
      src: '',
      cover: null,
      gradient: 'linear-gradient(135deg, #ccc 0%, #eee 100%)',
    }),
  },
  initialVolume: { type: Number, default: 70 },
  showArt: { type: Boolean, default: true },
  showWaveform: { type: Boolean, default: true },
  showStats: { type: Boolean, default: true },
})

const emit = defineEmits(['play', 'pause', 'stop', 'prev', 'next', 'seek', 'volume'])

// --- Audio & Visualizer State ---
const audioContext = ref(null)
const analyser = ref(null)
const dataArray = ref(null)
const sourceNode = ref(null)
const gainNode = ref(null)
const audioElement = ref(null)
const albumBars = ref([])
const waveformBars = ref([])

const isDarkTheme = ref(false)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(props.initialVolume)
const previousVolume = ref(props.initialVolume)

// Stats
const bassValue = ref(0)
const midValue = ref(0)
const trebleValue = ref(0)

// Art Fetching State
const currentCover = ref(props.track.cover)
const isLoadingArt = ref(false)

// Animation
const defaultGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
const cachedParticleColor = ref('rgba(255, 255, 255, 0.3)')
let animationId = null
let canvasCtx = null
let themeObserver = null

// --- Computed ---
const progress = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

// --- API: Fetch Album Art ---
const fetchAlbumArt = async (track) => {
  // 1. If cover is explicitly provided in the object, use it.
  if (track.cover) {
    currentCover.value = track.cover
    return
  }

  // 2. Otherwise, fetch from proxy
  if (!track.artist || !track.title) {
    currentCover.value = null
    return
  }

  isLoadingArt.value = true
  currentCover.value = null // Reset while loading

  try {
    const artist = encodeURIComponent(track.artist)
    const title = encodeURIComponent(track.title)
    const url = `${API_BASE_URL}/api/proxy/deezer?artist=${artist}&track=${title}`

    const response = await fetch(url)
    const data = await response.json()
    // Check Deezer data structure (usually data[0].album.cover_xl)
    if (data) {
      currentCover.value = data.album.cover_xl
    } else {
      console.warn('No art found for:', track.title)
    }
  } catch (err) {
    console.error('Failed to fetch album art:', err)
  } finally {
    isLoadingArt.value = false
  }
}

// Watch for track changes to trigger fetch
watch(
  () => props.track,
  (newTrack) => {
    isPlaying.value = false
    if (audioElement.value) audioElement.value.pause()
    fetchAlbumArt(newTrack)
  },
  { deep: true, immediate: true },
)

// --- Web Audio Initialization ---
const initAudioContext = () => {
  if (audioContext.value) return
  const AudioContext = window.AudioContext || window.webkitAudioContext
  audioContext.value = new AudioContext()

  analyser.value = audioContext.value.createAnalyser()
  analyser.value.fftSize = 256

  gainNode.value = audioContext.value.createGain()
  gainNode.value.gain.value = volume.value / 100

  sourceNode.value = audioContext.value.createMediaElementSource(audioElement.value)
  sourceNode.value.connect(analyser.value)
  analyser.value.connect(gainNode.value)
  gainNode.value.connect(audioContext.value.destination)

  const bufferLength = analyser.value.frequencyBinCount
  dataArray.value = new Uint8Array(bufferLength)
}

// --- Player Actions ---
const togglePlay = async () => {
  if (!props.track.src) return

  if (!audioContext.value) initAudioContext()
  if (audioContext.value.state === 'suspended') {
    await audioContext.value.resume()
  }

  if (audioElement.value.paused) {
    try {
      await audioElement.value.play()
      isPlaying.value = true
      startVisualizerLoop()
      emit('play', currentTime.value)
    } catch (e) {
      console.error('Playback failed:', e)
    }
  } else {
    audioElement.value.pause()
    isPlaying.value = false
    cancelAnimationFrame(animationId)
    emit('pause', currentTime.value)
  }
}

const handleSeek = (e) => {
  if (!duration.value || !audioElement.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  const newTime = Math.max(0, Math.min(percent, 1)) * duration.value
  audioElement.value.currentTime = newTime
  currentTime.value = newTime
  emit('seek', newTime)
}

const handleVolume = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const newVol = Math.max(0, Math.min(((e.clientX - rect.left) / rect.width) * 100, 100))
  volume.value = newVol
  if (gainNode.value) gainNode.value.gain.value = newVol / 100
  emit('volume', newVol)
}

const toggleMute = () => {
  if (volume.value > 0) {
    previousVolume.value = volume.value
    volume.value = 0
  } else {
    volume.value = previousVolume.value
  }
  if (gainNode.value) gainNode.value.gain.value = volume.value / 100
}

const formatTime = (s) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// --- Audio Events ---
const handleTimeUpdate = () => {
  currentTime.value = audioElement.value.currentTime
}
const handleMetadata = () => {
  duration.value = audioElement.value.duration
}
const handleEnded = () => {
  isPlaying.value = false
  currentTime.value = 0
  cancelAnimationFrame(animationId)
  emit('next')
}

// --- Visualizer ---
const drawVisualizer = () => {
  return
  if (!canvasCtx || !visualizerCanvas.value) return
  const width = visualizerCanvas.value.width
  const height = visualizerCanvas.value.height
  canvasCtx.clearRect(0, 0, width, height)

  if (analyser.value && isPlaying.value) {
    analyser.value.getByteFrequencyData(dataArray.value)
  }

  const getAverage = (start, end) => {
    if (!dataArray.value) return 0
    let sum = 0
    for (let i = start; i < end; i++) sum += dataArray.value[i] || 0
    return sum / (end - start)
  }

  // Draw Background Bars
  const barCount = 64
  const binSize = Math.floor((dataArray.value ? dataArray.value.length : 0) / barCount) || 1
  const barWidth = width / barCount

  for (let i = 0; i < barCount; i++) {
    const value = dataArray.value ? dataArray.value[i * binSize] : 0
    const x = i * barWidth
    const barHeight = (value / 255) * height * 0.6

    const hue = (i / barCount) * 60 + 240
    const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight)
    const opacity = isDarkTheme.value ? 0.8 : 0.6

    gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, ${opacity})`)
    gradient.addColorStop(1, `hsla(${hue}, 70%, 70%, ${opacity * 0.4})`)
    canvasCtx.fillStyle = gradient
    canvasCtx.fillRect(x, height - barHeight, barWidth - 2, barHeight)
  }

  // Draw DOM Bars (Overlay & Waveform)
  if (dataArray.value) {
    albumBars.value.forEach((bar, i) => {
      if (!bar) return
      const idx = Math.floor(i * 2)
      const val = dataArray.value[idx]
      bar.style.height = Math.max(10, (val / 255) * 100) + '%'
    })
    waveformBars.value.forEach((bar, i) => {
      if (!bar) return
      const idx = Math.floor((i / 60) * (dataArray.value.length * 0.8))
      const val = dataArray.value[idx]
      bar.style.height = Math.max(5, (val / 255) * 100) + '%'
    })
    bassValue.value = Math.floor(getAverage(0, 5))
    midValue.value = Math.floor(getAverage(10, 25))
    trebleValue.value = Math.floor(getAverage(40, 60))
  }

  // Particles
  const volFactor = bassValue.value / 255
  canvasCtx.fillStyle = cachedParticleColor.value
  for (let i = 0; i < 30; i++) {
    const x = (currentTime.value * (50 + i) + i * 100) % width
    const offset = Math.sin(currentTime.value + i) * (50 + volFactor * 100)
    const y = height / 2 + offset
    canvasCtx.beginPath()
    canvasCtx.arc(x, y, 2 + volFactor * 2, 0, Math.PI * 2)
    canvasCtx.fill()
  }
}

const startVisualizerLoop = () => {
  const animate = () => {
    if (!isPlaying.value) return
    drawVisualizer()
    animationId = requestAnimationFrame(animate)
  }
  animationId = requestAnimationFrame(animate)
}

// --- Lifecycle & Resize ---
const updateThemeState = () => {
  isDarkTheme.value = document.body.classList.contains('dark-mode')
  cachedParticleColor.value = isDarkTheme.value
    ? 'rgba(102, 126, 234, 0.05)'
    : 'rgba(255, 255, 255, 0.3)'
  if (!isPlaying.value) drawVisualizer()
}

const resizeCanvas = () => {
  if (visualizerCanvas.value) {
    visualizerCanvas.value.width = window.innerWidth
    visualizerCanvas.value.height = window.innerHeight
    drawVisualizer()
  }
}

onMounted(async () => {
  await nextTick()
  if (visualizerCanvas.value) {
    canvasCtx = visualizerCanvas.value.getContext('2d')
    resizeCanvas()
  }
  window.addEventListener('resize', resizeCanvas)
  updateThemeState()
  themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.attributeName === 'class') updateThemeState()
    })
  })
  themeObserver.observe(document.body, { attributes: true })
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resizeCanvas)
  if (themeObserver) themeObserver.disconnect()
  if (audioContext.value) audioContext.value.close()
})
</script>

<style scoped>
/* COMPONENT STYLES */
* {
  box-sizing: border-box;
}

.audio-player-wrapper {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--audio-bg, #eef2f7);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.visualizer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

/* CONTAINER */
.player-container {
  /* Solid Background */
  box-shadow: var(--audio-player-shadow, 0 10px 40px rgba(0, 0, 0, 0.1));
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: fit-content;
  min-width: 300px;
  max-width: 100%;
  padding: 35px;
  position: relative;
  z-index: 2;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.player-container.compact-mode {
  padding: 25px;
}

/* VISUAL DISPLAY */
.display-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.album-art-container {
  width: 320px;
  aspect-ratio: 1;
  border-radius: 25px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}
.visualizer-bars {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  z-index: 2;
  pointer-events: none;
}
.bar {
  width: 12%;
  background: var(
    --audio-bar-gradient,
    linear-gradient(to top, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.2))
  );
  border-radius: 4px 4px 0 0;
  height: 10%;
  transition: height 0.05s ease;
  /* Removed blur */
}
.album-art {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
}
.album-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fade-in {
  animation: fadeIn 0.5s ease-in;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.album-art-placeholder {
  font-size: 80px;
  user-select: none;
}
.glow-ring {
  position: absolute;
  inset: -20px;
  border-radius: 35px;
  background: var(
    --audio-glow-ring,
    radial-gradient(circle, rgba(100, 100, 255, 0.4) 0%, transparent 70%)
  );
  filter: blur(20px);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}
.glow-ring.active {
  opacity: 0.8;
  animation: pulse 3s infinite;
}

.track-info {
  text-align: center;
  width: 100%;
  max-width: 320px;
  overflow: hidden;
}
.track-title {
  color: var(--text-color, #2d3748);
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.track-artist {
  color: var(--audio-text-secondary, #718096);
  font-size: 16px;
  font-weight: 500;
}

/* CONTROLS */
.controls-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 280px;
}
.waveform-container {
  height: 60px;
  background: var(--audio-container-bg, rgba(255, 255, 255, 0.5));
  border-radius: 12px;
  padding: 8px 15px;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
}
.waveform-bar {
  flex: 1;
  background: var(--audio-waveform-gradient, #a0aec0);
  border-radius: 2px;
  height: 10%;
  min-height: 4px;
  transition: height 0.05s linear;
}
.progress-section {
  margin-top: 5px;
}
.progress-bar {
  background: var(--audio-progress-bg, #cbd5e0);
  height: 6px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 8px;
  position: relative;
}
.progress-fill {
  height: 100%;
  background: var(--audio-progress-gradient, linear-gradient(90deg, #667eea 0%, #764ba2 100%));
  border-radius: 10px;
  position: relative;
}
.progress-handle {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.2s;
}
.progress-bar:hover .progress-handle {
  opacity: 1;
}
.time-display {
  display: flex;
  justify-content: space-between;
  color: var(--audio-text-tertiary, #a0aec0);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.playback-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 25px;
}
.control-btn {
  background: var(--audio-control-bg, #fff);
  border: 1px solid var(--audio-control-border, #e2e8f0);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--audio-control-text, #4a5568);
  font-size: 20px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.control-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}
.play-btn {
  width: 65px;
  height: 65px;
  background: var(--audio-play-btn-bg, #667eea);
  border: none;
  color: white;
  font-size: 24px;
  box-shadow: var(--audio-play-btn-shadow, 0 4px 15px rgba(102, 126, 234, 0.4));
}
.play-btn:hover {
  background: var(--audio-play-btn-bg-hover, #5a67d8);
}
.volume-section {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 0 10px;
}
.volume-icon {
  font-size: 18px;
  cursor: pointer;
  user-select: none;
  width: 24px;
  text-align: center;
}
.volume-bar {
  flex: 1;
  height: 5px;
  background: var(--audio-progress-bg, #cbd5e0);
  border-radius: 10px;
  cursor: pointer;
}
.volume-fill {
  height: 100%;
  background: var(--audio-volume-gradient, #718096);
  border-radius: 10px;
}

/* STATS */
.stats-section {
  border-top: 1px solid var(--audio-border-light, rgba(0, 0, 0, 0.05));
  padding-top: 20px;
}
.frequency-display {
  display: flex;
  justify-content: space-between;
  background: var(--audio-container-bg, rgba(255, 255, 255, 0.5));
  border-radius: 15px;
  padding: 15px;
}
.freq-label {
  text-align: center;
  flex: 1;
}
.freq-value {
  color: var(--audio-accent-color, #667eea);
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.freq-name {
  color: var(--audio-text-quaternary, #a0aec0);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 2px;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.8;
  }
}

:global(.dark-mode) .player-container {
  background: #141414;
  border-color: rgba(255, 255, 255, 0.1);
}
:global(.dark-mode) .track-title {
  color: #fff;
}
:global(.dark-mode) .control-btn {
  background: #2d3748;
  border-color: #4a5568;
  color: #fff;
}
</style>
