// Define the cache name and the list of assets to cache
const CACHE_NAME = 'healthcare-chatbot-v1';
const urlsToCache = [
  '/', // The root path (index.html)
  '/index.html',
  '/manifest.json',
  '/service-worker.js',
  // Add your icon paths here if you create them
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Note: Tailwind CSS is loaded from a CDN, so it won't be cached directly by this service worker.
  // API calls (to Gemini) are dynamic and will not be cached by this service worker.
];

// Install event: Cache all the necessary assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event triggered.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Caching failed during install:', error);
      })
  );
});

// Fetch event: Serve cached content when available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for caching purposes
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // If response is found in cache, return it
          if (response) {
            console.log('Service Worker: Serving from cache:', event.request.url);
            return response;
          }
          // If not in cache, fetch from network
          console.log('Service Worker: Fetching from network:', event.request.url);
          return fetch(event.request)
            .then(networkResponse => {
              // Optionally, cache new responses as they come in
              // This is a "Cache First, then Network" strategy for assets
              // For dynamic data (like API calls), you might not want to cache them here.
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseToCache);
                });
              }
              return networkResponse;
            })
            .catch(error => {
              console.error('Service Worker: Fetch failed for:', event.request.url, error);
              // You could return an offline page here if needed
              // For example: return caches.match('/offline.html');
            });
        })
    );
  }
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event triggered.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});