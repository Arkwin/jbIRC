import { defineConfig } from 'vite';
import pluginReact from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // Makes paths relative (e.g. "./assets/index.js")
  plugins: [pluginReact()],
  build: {
    emptyOutDir: true,
  },
});