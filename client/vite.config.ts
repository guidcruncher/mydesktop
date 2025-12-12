import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true, // Needed for Docker (maps to 0.0.0.0)
    port: 3010,
    watch: {
      usePolling: true, // Fixes HMR issues on some OS (Windows/WSL)
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3009',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
