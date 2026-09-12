import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

function copyManifest() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      copyFileSync(here('manifest.json'), here('dist/manifest.json'));
      mkdirSync(here('dist/icons'), { recursive: true });
      for (const file of readdirSync(here('icons'))) {
        if (file.endsWith('.png')) {
          copyFileSync(here(`icons/${file}`), here(`dist/icons/${file}`));
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyManifest()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome110',
    rollupOptions: {
      input: {
        popup: here('popup/index.html'),
        offscreen: here('offscreen/offscreen.html'),
        serviceWorker: here('background/serviceWorker.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
