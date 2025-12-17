import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: true, 
    lib: {
      entry: 'src/main.js',
      fileName: () => '[name].js',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'electron',
        'irc-framework',
        'socks',
        'path',
        'fs',
        'crypto',
        'events',
        'net',
        'tls',
        'util'
      ],
    },
  },
});