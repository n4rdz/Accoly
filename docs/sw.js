// Service Worker — Accoly v3
// Network-first for JS/HTML/CSS, cache-first for images/fonts

const CACHE_NAME = 'accoly-v3';

self.addEventListener('install', function(e) {
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(e) {
    var req = e.request;
    if (req.method !== 'GET') return;

    var url = req.url;

    // Skip Supabase and CDN requests — always network
    if (url.includes('supabase.co') || url.includes('jsdelivr.net') || url.includes('cdn.')) {
        return;
    }

    // Network-first for JS, HTML, CSS — always get fresh files
    if (url.match(/\.(js|html|css)(\?.*)?$/) || url.endsWith('/')) {
        e.respondWith(
            fetch(req, { cache: 'no-store' })
                .then(function(res) {
                    var copy = res.clone();
                    caches.open(CACHE_NAME).then(function(cache) { cache.put(req, copy); });
                    return res;
                })
                .catch(function() {
                    return caches.match(req);
                })
        );
        return;
    }

    // Cache-first for everything else (images, fonts)
    e.respondWith(
        caches.match(req).then(function(cached) {
            return cached || fetch(req).then(function(res) {
                var copy = res.clone();
                caches.open(CACHE_NAME).then(function(cache) { cache.put(req, copy); });
                return res;
            });
        })
    );
});