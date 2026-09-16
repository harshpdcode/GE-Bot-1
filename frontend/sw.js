// GE-Bot-1 Progressive Web App Service Worker
const CACHE_NAME = 'ge-bot-1-v1';
const STATIC_ASSETS = [
    '/',
    '/login.html',
    '/dashboard.html',
    '/admin-portal.html',
    '/manifest.json',
    '/utils.js',
    '/i18n.js',
    '/assets/logo.png',
    '/assets/icon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[PWA SW] Pre-cache warning:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Network-first for dynamic navigation, cache fallback for offline
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    // Ignore non-http/https schemes (e.g. chrome-extension://, moz-extension://)
    if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) return;
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && response.type === 'basic' && event.request.url.startsWith('http')) {
                    try {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone).catch(() => {});
                        }).catch(() => {});
                    } catch (e) {}
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    if (event.request.headers.get('accept')?.includes('text/html')) {
                        return caches.match('/login.html');
                    }
                });
            })
    );
});
