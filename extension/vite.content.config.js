import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'chrome110',
    rollupOptions: {
      input: here('content/mediaBridge.js'),
      output: {
        format: 'iife',
        entryFileNames: 'mediaBridge.js',
        inlineDynamicImports: true,
      },
    },
  },
});
