const CACHE_NAME = 'dashboard-pwa-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon.svg'
];

// Install Event - Pre-cache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache First for static resources, Network First/Only for API
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // If request is for weather API, use Network-Only/Network-First strategy
  if (requestUrl.host.includes('api.openweathermap.org')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If offline and request fails, try to return a dummy response or let app handle it.
          // The app itself will handle offline state via localStorage cached weather, 
          // so we can just return a standard network error.
          return new Response(JSON.stringify({ error: 'Network request failed. Offline mode.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  } else {
    // For local assets, use Cache-First falling back to Network
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          // Check if it's a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cache the newly fetched asset
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
    );
  }
});
