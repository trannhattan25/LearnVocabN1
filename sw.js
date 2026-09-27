const CACHE_NAME = 'learnvocab-v1';
const APP_ROOT = new URL('./', self.location.href);
const CORE_FILES = ['.', 'index.html', 'manifest.webmanifest', 'catalog.json', 'css/style.css', 'js/loader.js', 'js/script.js', 'icons/icon.svg'];

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(CORE_FILES.map(path => new URL(path, APP_ROOT)));
        self.skipWaiting();
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const names = await caches.keys();
        await Promise.all(names.filter(name => name.startsWith('learnvocab-') && name !== CACHE_NAME).map(name => caches.delete(name)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME);
        const isCatalog = url.pathname.endsWith('/catalog.json');
        if (isCatalog) {
            try {
                const fresh = await fetch(request);
                if (fresh.ok) await cache.put(request, fresh.clone());
                return fresh;
            } catch {
                return (await cache.match(request)) || Response.error();
            }
        }

        try {
            const response = await fetch(request);
            if (response.ok) await cache.put(request, response.clone());
            return response;
        } catch {
            const cached = await cache.match(request);
            if (cached) return cached;
            if (request.mode === 'navigate') return (await cache.match(new URL('index.html', APP_ROOT))) || Response.error();
            return Response.error();
        }
    })());
});
