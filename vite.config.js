import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/**/*.png', 'screenshots/**/*.jpg', 'model/**/*.json'],
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2,json,bin}'],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /\/model\/.*\.(json|bin)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ai-model-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'RootFacts - AI Vegetable Recognition',
        short_name: 'RootFacts',
        description: 'Aplikasi AI untuk mengenali tanaman dan memberikan fakta menarik',
        theme_color: '#10b981',
        background_color: '#f9fafb',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
        ],
        screenshots: [
          {
            src: '/screenshots/mobile.jpg',
            sizes: '750x1334',
            type: 'image/jpeg',
            form_factor: 'narrow'
          },
          {
            src: '/screenshots/desktop.jpg',
            sizes: '1920x1080',
            type: 'image/jpeg',
            form_factor: 'wide'
          }
        ]
      },
    })
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'tensorflow': ['@tensorflow/tfjs', '@tensorflow/tfjs-backend-webgpu'],
          'transformers': ['@huggingface/transformers']
        }
      }
    }
  },
  server: {
    port: 3001,
    host: true
  }
});
