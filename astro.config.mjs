import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Emit `saved-texts.html` / `index.html` so existing links (e.g. window.location.href = 'saved-texts.html') keep working.
  build: { format: 'file' },

  vite: {
    plugins: [tailwindcss()],
  },
});