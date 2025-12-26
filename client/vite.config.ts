import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { defineConfig } from 'vite';
import { GlassUiRegistry } from './scripts/vite-plugin-glassuiregistry.ts';

export default defineConfig({
  plugins: [
    vue(),
    GlassUiRegistry({
      directory: './src/components',
      outputFile: './src/components/index.ts',
      virtualModuleId: 'virtual:glassui-registry',
    }),
  ],
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
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
});
