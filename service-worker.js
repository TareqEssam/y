// service-worker.js - إصدار مبسط
const CACHE_NAME = 'committee-assistant-v1';
const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/chat.css',
  './css/animations.css',
  './js/app.js'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: تثبيت التطبيق');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🗂️ Service Worker: تخزين الملفات الأساسية');
        // تخزين الملفات الأساسية فقط
        return cache.addAll(APP_FILES);
      })
      .catch((error) => {
        console.warn('⚠️ Service Worker: فشل في تخزين بعض الملفات', error);
      })
  );
  
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: تم التفعيل');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // حذف الذاكرات القديمة
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Service Worker: حذف ذاكرة قديمة ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// اعتراض الطلبات
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات غير HTTP/HTTPS
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // إذا كان الملف مخزناً، استخدمه
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // إذا لم يكن مخزناً، احصل عليه من الشبكة
        return fetch(event.request)
          .then((response) => {
            // تأكد أن الاستجابة صالحة
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // نسخ الاستجابة للتخزين
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => {
                console.warn('⚠️ Service Worker: فشل في تخزين الملف', error);
              });
            
            return response;
          })
          .catch((error) => {
            console.warn('🌐 Service Worker: فشل في جلب الملف', error);
            
            // عرض رسالة وضع عدم الاتصال
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            return new Response('عذراً، أنت غير متصل بالإنترنت', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html; charset=utf-8'
              })
            });
          });
      })
  );
});

// معالجة رسائل التطبيق
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// معالجة تحديث التطبيق
self.addEventListener('updatefound', () => {
  console.log('🔄 Service Worker: هناك تحديث جديد');
});

// معالجة حالة عدم الاتصال
self.addEventListener('offline', () => {
  console.log('📴 Service Worker: أنت الآن غير متصل');
});

// معالجة حالة الاتصال
self.addEventListener('online', () => {
  console.log('📱 Service Worker: أنت الآن متصل');
});
