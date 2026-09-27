import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Сборка идёт в www/ — эту папку Capacitor упаковывает в iOS-приложение,
// её же можно выкладывать на Netlify как сайт.
export default defineConfig({
  plugins: [svelte()],
  base: './',
  build: {
    outDir: 'www',
    emptyOutDir: true,
    target: 'es2019',
  },
});
