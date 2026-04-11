// ============================================================
// DHIC Portal — Service Worker
// Handles: offline caching, background sync, push notifications
// ============================================================

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log('[SW] Workbox loaded successfully');
  
  const { registerRoute, setCatchHandler } = workbox.routing;
  const { NetworkFirst, StaleWhileRevalidate, CacheFirst } = workbox.strategies;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;
  const { ExpirationPlugin } = workbox.expiration;

  // 1. Notifications specific cache: NetworkFirst, max 5 mins expiry
  registerRoute(
    ({ url }) => url.pathname.startsWith('/api/notifications'),
    new NetworkFirst({
      cacheName: 'dhic-notif-v3',
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxAgeSeconds: 300 }) // 5 minutes
      ]
    })
  );

  // 2. Other APIs: Stale-While-Revalidate
  const CACHE_API_PATTERNS = [
    /\/api\/tasks/, /\/api\/announcements/, /\/api\/duties/,
    /\/api\/attendance/, /\/api\/reports/, /\/api\/user/
  ];
  registerRoute(
    ({ url }) => CACHE_API_PATTERNS.some(p => p.test(url.pathname)),
    new StaleWhileRevalidate({
      cacheName: 'dhic-dynamic-v1'
    })
  );

  // 3. Static assets: Cache First
  registerRoute(
    ({ request }) => ['style', 'script', 'image', 'font'].includes(request.destination),
    new CacheFirst({
      cacheName: 'dhic-static-v1',
      plugins: [
        new ExpirationPlugin({ maxAgeSeconds: 30 * 24 * 60 * 60 }) // 30 Days
      ]
    })
  );

  // Fallback for document navigation when offline
  setCatchHandler(async ({ request }) => {
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    return Response.error();
  });
} else {
  console.warn('[SW] Workbox failed to load. Caching disabled.');
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

  // Register background sync for offline push sync if supported
  if ('sync' in self.registration) {
    self.registration.sync.register('notification-sync').catch(err => console.warn('[SW] Sync registration failed:', err));
  }

  // Show small console log for analytics/debugging
  console.log('[SW] Push Received:', data);

  const options = {
    body: data.body,
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
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

  const showPromise = self.registration.showNotification(data.title || 'DHIC Portal', options);
  
  // Also send postMessage to open clients for immediate UI updates
  const messagePromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(clientList => {
      clientList.forEach(client => {
        client.postMessage({ type: 'PUSH_RECEIVED', payload: data });
      });
    });

  // Ensure both promises resolve before SW sleeps
  event.waitUntil(Promise.all([showPromise, messagePromise]));
});

// ── Notification click ────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Use full absolute URL for reliable navigation (important for iOS)
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Find an existing window to focus and navigate
      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      // Fallback: open a new window
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
