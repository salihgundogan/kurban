// Service Worker for PWA
const CACHE_NAME = 'kurban-takip-v1';

// Install event
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Fetch event - Network first strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});
