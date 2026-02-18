import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'FoodTech Emergency Platform',
        short_name: 'FoodTech',
        description: 'Emergency Food Supply Chain Management System',
        theme_color: '#10b981', // Emerald-500
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3522/3522533.png', // Using a placeholder online icon
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3522/3522533.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Caches Google Maps tiles and API responses so they work offline-ish
        runtimeCaching: [{
          urlPattern: ({ url }) => url.origin === 'https://tile.openstreetmap.org',
          handler: 'CacheFirst',
          options: {
            cacheName: 'map-tiles',
            expiration: {
              maxEntries: 500,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 Year
            }
          }
        }]
      }
    })
  ],
})