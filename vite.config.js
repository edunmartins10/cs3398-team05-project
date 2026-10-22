import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()

  ],
  server: {
    proxy: {
      '/api': `http://localhost:${process.env.API_PORT || '3001'}`,
    },
  },
});