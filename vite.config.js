import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'BantuDengar - Alat Bantu Komunikasi',
        short_name: 'BantuDengar',
        description: 'Ubah suara menjadi teks untuk membantu komunikasi tuna rungu dan lansia.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
