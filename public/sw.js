// ============================================================
// DHIC Portal — Service Worker
// Handles: offline caching, background sync, push notifications
// ============================================================

const CACHE_VERSION = 'v1';
const STATIC_CACHE  = `dhic-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dhic-dynamic-${CACHE_VERSION}`;
const OFFLINE_PAGE  = '/offline.html';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

// API routes to cache for offline use (stale-while-revalidate)
const CACHE_API_PATTERNS = [
  /\/api\/tasks/,
  /\/api\/announcements/,
  /\/api\/duties/,
  /\/api\/attendance/,
  /\/api\/reports/,
  /\/api\/user/,
];

// ── Install: pre-cache static shell ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: caching strategy ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // ① API calls → Stale-While-Revalidate
  const isApiCall = CACHE_API_PATTERNS.some((p) => p.test(url.pathname));
  if (isApiCall) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // ② Navigation requests → Network first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_PAGE).then((cached) => cached || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // ③ Static assets (JS/CSS/images) → Cache first
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// ── Strategy: Cache First ─────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ── Strategy: Stale While Revalidate ─────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || fetchPromise || new Response(JSON.stringify({ offline: true, data: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Push Notifications ────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'DHIC Portal', body: 'You have a new update.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    image: data.image || undefined,
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open Portal' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: false,
    tag: data.tag || 'dhic-notification',
  };

  event.waitUntil(self.registration.showNotification(data.title || 'DHIC Portal', options));
});

// ── Notification click ────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ── Background Sync ───────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncPendingReports());
  }
});

async function syncPendingReports() {
  try {
    const db = await openDB();
    const pending = await getAllPending(db);
    for (const item of pending) {
      try {
        await fetch('/api/reports', {
          method: 'POST',
          body: item.formData,
        });
        await deletePending(db, item.id);
      } catch {
        // Will retry on next sync
      }
    }
  } catch (err) {
    console.warn('[SW] Background sync failed:', err);
  }
}

// Simple IndexedDB helpers for pending queue
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('dhic-offline', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}

function getAllPending(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readonly');
    const req = tx.objectStore('pending').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

function deletePending(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    const req = tx.objectStore('pending').delete(id);
    req.onsuccess = resolve;
    req.onerror = reject;
  });
}
