import { defineConfig } from 'vite';
import pluginReact from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [pluginReact()],
  build: {
    minify: 'terser', 
    terserOptions: {
      compress: {
        drop_console: true, 
        drop_debugger: true
      }
    },
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'irc-framework',
        'electron',
        'socks',
        'net',
        'tls'
      ]
    }
  },
});