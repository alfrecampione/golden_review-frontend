import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    strictPort: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'src/ssl/cloudflare-origin.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'src/ssl/cloudflare-origin.crt'))
    },
    hmr: {
      protocol: 'wss',
      host: 'dev-goldenaudit.goldentrustinsurance.com',
      port: 5173,
      clientPort: 5173,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
});
