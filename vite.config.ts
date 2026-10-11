/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Azure Static Web Apps deploys `build/` (see .github/workflows).
    outDir: 'build',
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        // React + router change rarely: one long-cached vendor chunk.
        manualChunks(id) {
          if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run)[\\/]/.test(id)) {
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    environment: 'node',
    testTimeout: 30000,
  },
});
