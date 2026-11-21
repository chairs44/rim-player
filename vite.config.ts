import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: { input: { original: 'index.html', variants: 'variants/index.html' } },
  },
});
