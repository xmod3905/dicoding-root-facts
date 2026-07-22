import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

precacheAndRoute(self.__WB_MANIFEST || []);

registerRoute(
  ({ url }) =>
    url.pathname.includes('/models/') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.bin') ||
    url.pathname.endsWith('.onnx') ||
    url.hostname.includes('huggingface.co') ||
    url.hostname.includes('cdn-lfs'),
  new CacheFirst({
    cacheName: 'ai-models-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 Hari
      })
    ]
  })
);

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages-cache'
  })
);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));