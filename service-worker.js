// service-worker.js - Progressive Web App offline support

const CACHE_NAME = 'we-write-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/name.html',
  '/post.html',
  '/post-detail.html',
  '/reply.html',
  '/music.html',
  '/about.html',
  '/unlock.html',
  '/feed.js',
  '/firebase.js',
  '/share-utils.js',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // If some assets fail to cache, continue anyway
        return Promise.resolve();
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Ignore non-HTTP requests
  if (!event.request.url.startsWith('http')) return;

  // Don't cache API calls or Firebase requests
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('firebaseapp') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('cloudinary')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('Offline - Cannot fetch remote data', { status: 503 }))
    );
    return;
  }

  // For HTML pages, try network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cached version
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Return a fallback response
        return new Response('Offline - Resource not cached', { status: 503 });
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
