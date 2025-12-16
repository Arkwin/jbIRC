import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Write to disk so we can see the files
    emptyOutDir: true, 
    lib: {
      entry: 'src/main.js',
      fileName: () => '[name].js',
      formats: ['cjs'],
    },
    rollupOptions: {
      // Don't bundle these; require them at runtime
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