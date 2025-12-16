import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false, // Don't delete main.js when building this
    lib: {
      entry: 'src/preload.js',
      fileName: () => '[name].js',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['electron'],
    },
  },
});