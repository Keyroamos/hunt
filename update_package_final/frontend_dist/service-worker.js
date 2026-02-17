// Service Worker for PWA functionality
const CACHE_NAME = 'househunt-v2' // Incremented version to force update
const urlsToCache = [
    '/',
    '/explore',
    '/index.css',
    '/logo.png',
    '/icon-192.png',
    '/icon-512.png'
]

// Install event - cache essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache')
                return cache.addAll(urlsToCache)
            })
            .catch((error) => {
                console.log('Cache installation failed:', error)
            })
    )
    self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName)
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
    self.clients.claim()
})

// Fetch event - Smart Strategy
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return
    }

    // 1. API Requests: Network Only (Never cache)
    if (event.request.url.includes('/api/')) {
        return
    }

    // 2. Navigation/HTML Requests: Network First, then Cache
    // Ensures user always gets the latest version of the app
    if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Update cache for offline usage
                    const responseToCache = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache)
                    })
                    return response
                })
                .catch(() => {
                    // Return offline page if available
                    return caches.match(event.request).then((response) => {
                        return response || caches.match('/offline.html')
                    })
                })
        )
        return
    }

    // 3. Static Assets (JS, CSS, Images): Cache First, then Network
    // These files are hashed in production, so they are safe to cache aggressively
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((response) => {
                const responseToCache = response.clone()
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache)
                })
                return response
            })
        })
    )
})

// Push notification event
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'househunt-notification',
        requireInteraction: false
    }

    event.waitUntil(
        self.registration.showNotification('House Hunt', options)
    )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    event.waitUntil(
        clients.openWindow('/')
    )
})

// Background sync event (for offline message sending)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages())
    }
})

async function syncMessages() {
    // Implement message syncing logic here
    console.log('Syncing messages...')
}
