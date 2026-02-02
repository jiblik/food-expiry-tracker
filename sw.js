// Service Worker for Food Expiry Tracker
const CACHE_NAME = 'food-expiry-v1';
const STORAGE_KEY = 'foodExpiryProducts';

// Files to cache
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/notifications.js',
    '/manifest.json'
];

// Install event - cache files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});

// Periodic sync for checking expiry dates (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-expiry') {
        event.waitUntil(checkExpiringProducts());
    }
});

// Message from main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CHECK_EXPIRY') {
        checkExpiringProducts();
    }
});

// Check for expiring products
async function checkExpiringProducts() {
    // Get all clients
    const clients = await self.clients.matchAll();

    if (clients.length > 0) {
        // App is open, let it handle notifications
        return;
    }

    // App is closed, we need to check and notify
    // Note: This requires the app to be a PWA and installed
    // For a simple web app, notifications will only work when the app is open
}

// Show notification
function showNotification(title, body, tag) {
    return self.registration.showNotification(title, {
        body: body,
        tag: tag,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        actions: [
            { action: 'open', title: 'פתח אפליקציה' },
            { action: 'dismiss', title: 'סגור' }
        ]
    });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            self.clients.matchAll({ type: 'window' }).then((clients) => {
                // If app is already open, focus it
                for (const client of clients) {
                    if (client.url.includes('/') && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise, open new window
                if (self.clients.openWindow) {
                    return self.clients.openWindow('/');
                }
            })
        );
    }
});
