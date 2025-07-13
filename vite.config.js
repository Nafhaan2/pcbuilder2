import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // build straight into ../pc-builder/build so PHP can enqueue it
  build: {
    outDir: '../plugin-build',   // temporary local path (see below)
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',    // no hashes – keeps PHP enqueue simple
        assetFileNames: 'index[extname]'
      }
    }
  }
});
