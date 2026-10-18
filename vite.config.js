import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Generate the worker from the actual build so every hashed asset is available offline.
function offlineApp() {
  return {
    name: 'post2market-offline',
    apply: 'build',
    generateBundle(_, bundle) {
      const publicFiles = ['manifest.webmanifest', 'favicon.svg', 'icons.svg',
        'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']
      const files = [...new Set(['index.html', ...Object.keys(bundle), ...publicFiles])].map((file) => `/${file}`)
      const hash = createHash('sha256')
      hash.update(readFileSync(new URL('./index.html', import.meta.url)))
      for (const item of Object.values(bundle)) hash.update(item.type === 'chunk' ? item.code : item.source)
      for (const file of publicFiles) hash.update(readFileSync(new URL(`./public/${file}`, import.meta.url)))
      const version = hash.digest('hex').slice(0, 16)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `
const CACHE = 'post2market-${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
});
// Let an update wait until existing app windows close to protect unsaved designs.
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('post2market-') && key !== CACHE)
      .map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match('/index.html'))
      .then((cached) => cached || fetch(request)));
  } else if (FILES.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(url.pathname))
      .then((cached) => cached || fetch(request)));
  }
});
`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), offlineApp()],
})
