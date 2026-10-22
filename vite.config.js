import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Vite rejects requests whose Host header isn't localhost (DNS-rebinding protection).
// Allow ngrok tunnel domains so the app can be shared with `ngrok http <port>`.
// A leading dot matches every subdomain.
const allowedHosts = ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.dev', '.ngrok.io'];

export default defineConfig({
  server: { allowedHosts },
  preview: { allowedHosts },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new version waits until the user clicks "Reload", so an update
      // never reloads the page in the middle of a quiz session.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Skill Drills',
        short_name: 'Skill Drills',
        description:
          'Practice tricky HTML, CSS, JavaScript, React and TypeScript concepts for coding screenings.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0f1115',
        theme_color: '#4f46e5',
        categories: ['education', 'developer'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything so the whole app (questions, notebook, playground) works offline.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // The question banks are bundled into the JS; leave room for them to grow.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
