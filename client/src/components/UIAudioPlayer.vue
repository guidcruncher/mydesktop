<template>
  <div class="audio-player-wrapper" :class="{ 'light-theme': !isDarkTheme }">
    <canvas ref="visualizerCanvas" class="visualizer"></canvas>

    <div class="theme-toggle" @click="toggleTheme">
      <span class="theme-icon">{{ isDarkTheme ? '🌙' : '☀️' }}</span>
      <span class="theme-text">{{ isDarkTheme ? 'Dark' : 'Light' }}</span>
    </div>

    <div class="player-container" :class="{ playing: isPlaying }">
      <div class="album-art-container">
        <div class="glow-ring"></div>
        <div class="album-art" :style="{ background: currentTrack?.gradient }">
          <img v-if="props.enableAlbumArt && albumArtSrc" :src="albumArtSrc" :alt="currentTrack?.title">
          <span v-else class="album-art-placeholder">{{ currentTrack?.emoji }}</span>
        </div>
        <div class="visualizer-bars">
          <div v-for="i in 8" :key="i" class="bar" :ref="el => { if (el) albumBars[i - 1] = el }"></div>
        </div>
      </div>

      <div class="track-info">
        <div class="track-title">{{ currentTrack?.title || 'Loading...' }}</div>
        <div class="track-artist">{{ currentTrack?.artist || 'Please wait' }}</div>
      </div>

      <div class="waveform-container">
        <div v-for="i in 60" :key="i" class="waveform-bar" :ref="el => { if (el) waveformBars[i - 1] = el }"></div>
      </div>

      <div class="progress-section">
        <div class="progress-bar" @click="seekProgress">
          <div class="progress-fill" :style="{ width: progress + '%' }">
            <div class="progress-handle"></div>
          </div>
        </div>
        <div class="time-display">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(currentTrack?.duration || 0) }}</span>
        </div>
      </div>

      <div class="controls">
        <div class="control-btn" @click="prevTrack">⏮</div>
        <div class="control-btn play-btn" @click="togglePlay">{{ isPlaying ? '⏸' : '▶' }}</div>
        <div class="control-btn" @click="nextTrack">⏭</div>
      </div>

      <div class="volume-section">
        <div class="volume-icon">🔊</div>
        <div class="volume-bar" @click="setVolume">
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

// Props
const props = defineProps({
  enableAlbumArt: {
    type: Boolean,
    default: true
  }
});

// Refs
const visualizerCanvas = ref(null);
const albumBars = ref([]);
const waveformBars = ref([]);

// State
const isDarkTheme = ref(true);
const isPlaying = ref(false);
const currentTime = ref(0);
const currentTrackIndex = ref(0);
const tracks = ref([]);
const tracksLoaded = ref(false);
const volume = ref(70);
const bassValue = ref(0);
const midValue = ref(0);
const trebleValue = ref(0);
const albumArtSrc = ref(null);

// Animation
let animationId = null;
let ctx = null;

// Computed
const currentTrack = computed(() => tracks.value[currentTrackIndex.value]);
const progress = computed(() => {
  if (!currentTrack.value) return 0;
  return (currentTime.value / currentTrack.value.duration) * 100;
});

// Methods
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
};

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
  if (isPlaying.value) {
    startProgress();
  } else {
    cancelAnimationFrame(animationId);
  }
};

const prevTrack = () => {
  if (!tracksLoaded.value || tracks.value.length === 0) return;
  currentTrackIndex.value = (currentTrackIndex.value - 1 + tracks.value.length) % tracks.value.length;
  loadTrack(currentTrackIndex.value);
  if (isPlaying.value) {
    startProgress();
  }
};

const nextTrack = () => {
  if (!tracksLoaded.value || tracks.value.length === 0) return;
  currentTrackIndex.value = (currentTrackIndex.value + 1) % tracks.value.length;
  loadTrack(currentTrackIndex.value);
  if (isPlaying.value) {
    startProgress();
  }
};

const seekProgress = (e) => {
  if (!tracksLoaded.value || tracks.value.length === 0) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  currentTime.value = percent * currentTrack.value.duration;
};

const setVolume = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  volume.value = percent * 100;
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const simulateAudioData = () => {
  const bars = 64;
  const data = new Array(bars);
  for (let i = 0; i < bars; i++) {
    const base = Math.sin(currentTime.value * 2 + i * 0.5) * 50 + 80;
    const variation = Math.random() * 70;
    data[i] = Math.max(20, base + variation);
  }
  return data;
};

const drawVisualizer = () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, visualizerCanvas.value.width, visualizerCanvas.value.height);
  
  if (!isPlaying.value) return;

  const audioData = simulateAudioData();
  const barWidth = visualizerCanvas.value.width / audioData.length;
  
  // Background particles - use CSS variable colors
  const particleColor = isDarkTheme.value ? 
    getComputedStyle(document.documentElement).getPropertyValue('--audio-particle-dark').trim() || 'rgba(102, 126, 234, 0.02)' : 
    getComputedStyle(document.documentElement).getPropertyValue('--audio-particle-light').trim() || 'rgba(255, 255, 255, 0.3)';
  
  ctx.fillStyle = particleColor;
  for (let i = 0; i < 50; i++) {
    const x = (currentTime.value * 50 + i * 100) % visualizerCanvas.value.width;
    const y = Math.sin(currentTime.value + i) * 100 + visualizerCanvas.value.height / 2;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw frequency bars
  audioData.forEach((value, i) => {
    const x = i * barWidth;
    const height = (value / 255) * visualizerCanvas.value.height * 0.6;
    const hue = (i / audioData.length) * 60 + 240;
    
    const gradient = ctx.createLinearGradient(0, visualizerCanvas.value.height, 0, visualizerCanvas.value.height - height);
    const opacity = isDarkTheme.value ? 0.8 : 0.6;
    gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, ${opacity})`);
    gradient.addColorStop(1, `hsla(${hue}, 70%, 70%, ${opacity * 0.4})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, visualizerCanvas.value.height - height, barWidth - 2, height);
  });

  // Update waveform
  waveformBars.value.forEach((bar, i) => {
    if (bar) {
      const index = Math.floor((i / waveformBars.value.length) * audioData.length);
      const height = (audioData[index] / 255) * 100;
      bar.style.height = height + '%';
    }
  });

  // Update album bars
  albumBars.value.forEach((bar, i) => {
    if (bar) {
      const index = Math.floor((i / albumBars.value.length) * audioData.length);
      const height = (audioData[index] / 255) * 100;
      bar.style.height = height + '%';
    }
  });

  // Update frequency displays
  const bass = Math.floor(audioData.slice(0, 4).reduce((a, b) => a + b) / 4);
  const mid = Math.floor(audioData.slice(20, 35).reduce((a, b) => a + b) / 15);
  const treble = Math.floor(audioData.slice(50, 64).reduce((a, b) => a + b) / 14);
  
  bassValue.value = bass;
  midValue.value = mid;
  trebleValue.value = treble;
};

const startProgress = () => {
  const animate = () => {
    if (tracksLoaded.value && currentTime.value < currentTrack.value.duration) {
      currentTime.value += 0.1;
      drawVisualizer();
      animationId = requestAnimationFrame(animate);
    } else if (tracksLoaded.value) {
      // Auto-play next track
      currentTrackIndex.value = (currentTrackIndex.value + 1) % tracks.value.length;
      loadTrack(currentTrackIndex.value);
      if (isPlaying.value) {
        startProgress();
      } else {
        isPlaying.value = false;
      }
    } else {
      animationId = requestAnimationFrame(animate);
    }
  };
  animate();
};

const getRandomGradient = () => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

const getRandomEmoji = () => {
  const emojis = ['🎵', '🎸', '🎹', '🎤', '🎧', '🎼', '🎺', '🎷'];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

const loadTrack = (index) => {
  if (!tracksLoaded.value || tracks.value.length === 0) return;
  
  const track = tracks.value[index];
  currentTime.value = 0;
  
  // Only load album art if enabled via prop
  if (props.enableAlbumArt && track.albumArt) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      albumArtSrc.value = track.albumArt;
    };
    img.onerror = () => {
      albumArtSrc.value = null;
    };
    img.src = track.albumArt;
  } else {
    albumArtSrc.value = null;
  }
};

const loadDefaultTracks = () => {
  tracks.value = [
    {
      title: 'Midnight Dreams',
      artist: 'The Synthwave Collective',
      duration: 225,
      albumArt: null,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      emoji: '🎵'
    },
    {
      title: 'Neon Lights',
      artist: 'Electric Dreams',
      duration: 198,
      albumArt: null,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      emoji: '🌃'
    },
    {
      title: 'Digital Sunrise',
      artist: 'Cyber Waves',
      duration: 243,
      albumArt: null,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      emoji: '🌅'
    },
    {
      title: 'Retro Future',
      artist: 'Vaporwave Dreams',
      duration: 216,
      albumArt: null,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      emoji: '🎹'
    }
  ];
  tracksLoaded.value = true;
  loadTrack(currentTrackIndex.value);
};

const fetchTracks = async () => {
  try {
    // Only fetch from API if album art is enabled
    if (!props.enableAlbumArt) {
      loadDefaultTracks();
      return;
    }
    
    const artists = ['Daft Punk', 'The Beatles', 'Radiohead', 'Pink Floyd', 'Nirvana'];
    const searchArtist = artists[Math.floor(Math.random() * artists.length)];
    
    const searchUrl = `https://musicbrainz.org/ws/2/release?query=artist:${encodeURIComponent(searchArtist)}&fmt=json&limit=10`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.releases && data.releases.length > 0) {
      const trackPromises = data.releases.slice(0, 4).map(async (release) => {
        let albumArt = null;
        
        try {
          const coverUrl = `https://coverartarchive.org/release/${release.id}`;
          const coverResponse = await fetch(coverUrl);
          if (coverResponse.ok) {
            const coverData = await coverResponse.json();
            albumArt = coverData.images?.[0]?.thumbnails?.large || coverData.images?.[0]?.image;
          }
        } catch (e) {
          // Cover art not available
        }
        
        return {
          title: release.title,
          artist: release['artist-credit']?.[0]?.name || 'Unknown Artist',
          duration: Math.floor(Math.random() * 120) + 180,
          albumArt: albumArt,
          gradient: getRandomGradient(),
          emoji: getRandomEmoji()
        };
      });
      
      tracks.value = await Promise.all(trackPromises);
      tracksLoaded.value = true;
      loadTrack(currentTrackIndex.value);
    }
  } catch (error) {
    console.error('Error fetching tracks:', error);
    loadDefaultTracks();
  }
};

const resizeCanvas = () => {
  if (visualizerCanvas.value) {
    visualizerCanvas.value.width = window.innerWidth;
    visualizerCanvas.value.height = window.innerHeight;
  }
};

// Lifecycle
onMounted(async () => {
  await nextTick();
  
  if (visualizerCanvas.value) {
    ctx = visualizerCanvas.value.getContext('2d');
    resizeCanvas();
  }
  
  window.addEventListener('resize', resizeCanvas);
  fetchTracks();
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener('resize', resizeCanvas);
});

// Watch for prop changes
watch(() => props.enableAlbumArt, (newValue) => {
  if (newValue) {
    // Re-fetch tracks with album art
    fetchTracks();
  } else {
    // Clear album art and use emojis
    albumArtSrc.value = null;
  }
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.audio-player-wrapper {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0a0a0a;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  position: relative;
  transition: background 0.5s ease;
}

.audio-player-wrapper.light-theme {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
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
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 35px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 450px;
  padding: 40px 35px;
  position: relative;
  z-index: 2;
  animation: slideUp 0.7s ease-out;
  transition: background 0.5s ease, border 0.5s ease, box-shadow 0.5s ease;
}

.light-theme .player-container {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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
}

.bar {
  flex: 1;
  background: linear-gradient(to top, #667eea, #764ba2, #f093fb);
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
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  position: relative;
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

.glow-ring {
  position: absolute;
  inset: -20px;
  border-radius: 25px;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
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
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.track-info {
  text-align: center;
  margin-bottom: 25px;
}

.track-title {
  color: white;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transition: color 0.5s ease;
}

.light-theme .track-title {
  color: #1a1a1a;
}

.track-artist {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  font-weight: 500;
  transition: color 0.5s ease;
}

.light-theme .track-artist {
  color: rgba(0, 0, 0, 0.6);
}

.waveform-container {
  height: 80px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow: hidden;
  transition: background 0.5s ease;
}

.light-theme .waveform-container {
  background: rgba(0, 0, 0, 0.05);
}

.waveform-bar {
  flex: 1;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 2px;
  height: 40%;
  transition: height 0.15s ease;
}

.progress-section {
  margin-bottom: 30px;
}

.progress-bar {
  background: rgba(255, 255, 255, 0.1);
  height: 6px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 12px;
  position: relative;
  overflow: visible;
  transition: background 0.5s ease;
}

.light-theme .progress-bar {
  background: rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  transition: width 0.1s linear;
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
  box-shadow: 0 0 15px rgba(102, 126, 234, 0.8);
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-bar:hover .progress-handle {
  opacity: 1;
}

.time-display {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 500;
  transition: color 0.5s ease;
}

.light-theme .time-display {
  color: rgba(0, 0, 0, 0.5);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 25px;
}

.control-btn {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  width: 55px;
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  font-size: 22px;
}

.light-theme .control-btn {
  background: rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #1a1a1a;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

.light-theme .control-btn:hover {
  background: rgba(0, 0, 0, 0.12);
}

.control-btn:active {
  transform: scale(0.95);
}

.play-btn {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
  font-size: 28px;
}

.play-btn:hover {
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.6);
}

.playing .play-btn {
  box-shadow: 0 0 40px rgba(102, 126, 234, 0.8);
}

.volume-section {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 0 10px;
}

.volume-icon {
  color: rgba(255, 255, 255, 0.6);
  font-size: 20px;
  min-width: 24px;
  transition: color 0.5s ease;
}

.light-theme .volume-icon {
  color: rgba(0, 0, 0, 0.6);
}

.volume-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: background 0.5s ease;
}

.light-theme .volume-bar {
  background: rgba(0, 0, 0, 0.1);
}

.volume-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.4);
}

.frequency-display {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  transition: background 0.5s ease;
}

.light-theme .frequency-display {
  background: rgba(0, 0, 0, 0.05);
}

.freq-label {
  text-align: center;
  flex: 1;
}

.freq-value {
  color: #667eea;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.freq-name {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.5s ease;
}

.light-theme .freq-name {
  color: rgba(0, 0, 0, 0.4);
}

.theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50px;
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  z-index: 10;
}

.light-theme .theme-toggle {
  background: rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.theme-toggle:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.2);
}

.light-theme .theme-toggle:hover {
  background: rgba(0, 0, 0, 0.12);
}

.theme-icon {
  font-size: 20px;
  transition: transform 0.5s ease;
}

.theme-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
  transition: color 0.5s ease;
}

.light-theme .theme-text {
  color: #1a1a1a;
}
</style>
