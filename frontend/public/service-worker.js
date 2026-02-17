// Minimal Service Worker for PWA Installability
// This service worker exists ONLY to trigger the PWA install prompt.
// It uses a strict Network-Only strategy to ensure NO caching of data occurs.

const CACHE_NAME = 'househunt-offline-v1';
// Only cache offline page if we were to implement one, but for now we keep it empty
// to respect the user's strict "no caching" rule.

self.addEventListener('install', (event) => {
    // Force immediate activation
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Create an empty cache just to satisfy PWA heuristics if needed,
    // but we won't put anything in it that causes stale data.
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Optional: cache a static offline page here if desired
        })
    );
    // Become the controller for all clients immediately
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // We MUST provide a fetch handler for the app to be installable.
    // However, we strictly rely on the network to avoid "previously used sample data" issues.

    // For navigation requests (loading pages), strictly network.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // If network fails, we could show an offline page, 
                // but for now we just let it fail or return a simple message
                return new Response('You are offline. Please check your connection.', {
                    headers: { 'Content-Type': 'text/plain' }
                });
            })
        );
        return;
    }

    // For everything else (API, assets, etc.), direct network usage.
    // We do NOT look in the cache.
    event.respondWith(
        fetch(event.request)
    );
});
