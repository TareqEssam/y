/**
 * Service Worker - للعمل بدون إنترنت
 */

const CACHE_NAME = 'committee-assistant-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/chat.css',
  '/css/animations.css',
  '/js/app.js',
  '/manifest.json'
];

// التثبيت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// التفعيل
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// الاستجابة للطلبات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});