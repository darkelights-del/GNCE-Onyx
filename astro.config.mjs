// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages project site: served under /GNCE-Onyx/
  site: 'https://darkelights-del.github.io',
  base: '/GNCE-Onyx',
  vite: {
    plugins: [tailwindcss()]
  }
});
