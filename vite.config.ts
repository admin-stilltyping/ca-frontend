/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = process.env.BACKEND_URL ?? 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allow ngrok / cloudflared tunnel hostnames in local dev
    allowedHosts: true,
    // Same-origin in dev: the browser only talks to Vite, which forwards these to FastAPI
    proxy: {
      '/api': backend,
      '/auth': backend,
      '/webhook': backend,
      '/healthz': backend,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
