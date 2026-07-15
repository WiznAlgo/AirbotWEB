import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Semua panggilan /api dari frontend diteruskan ke backend Express
      // (server/server.js) yang jalan di port 4000 saat development, supaya
      // cookie sesi tetap dianggap same-origin oleh browser.
      proxy: {
        '/api': {
          target: process.env.PANEL_API_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
