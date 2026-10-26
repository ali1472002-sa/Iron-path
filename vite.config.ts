import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { swPlugin } from './sw-plugin';
export default defineConfig({
  base: './',
  plugins: [react(), swPlugin(['manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'])],
});
