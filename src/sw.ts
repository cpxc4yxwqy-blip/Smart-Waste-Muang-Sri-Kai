/// <reference lib="webworker" />
/* Custom Service Worker (Workbox Inject Manifest) */

declare const self: ServiceWorkerGlobalScope;

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Precache all build assets
precacheAndRoute(self.__WB_MANIFEST);

// Images Cache
registerRoute(
  /.*\.(?:png|jpg|jpeg|gif|svg|webp|ico)/,
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 })
    ]
  })
);

// Static built assets (JS/CSS chunks)
registerRoute(
  ({url}) => url.origin === self.location.origin && url.pathname.startsWith('/Smart-Waste-Muang-Sri-Kai/assets/'),
  new StaleWhileRevalidate({ cacheName: 'static-assets-cache' })
);

// API GET/Document requests
registerRoute(
  /https:\/\/.*\/(api|data)\//,
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 10 })
    ]
  })
);

// Navigation fallback (offline.html)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async (options) => {
    try {
      // FetchEvent has request, but TS may not infer; cast for safety
      const fetchEvent: any = options.event;
      return await fetch(fetchEvent.request);
    } catch (err) {
      return await caches.match('/Smart-Waste-Muang-Sri-Kai/offline.html');
    }
  }
);

// Background Sync for failed POST requests to /api/
const postQueue = new BackgroundSyncPlugin('post-queue', { maxRetentionTime: 24 * 60 }); // minutes
registerRoute(
  ({url, request}) => url.pathname.includes('/api/') && request.method === 'POST',
  new NetworkFirst({
    cacheName: 'api-post-cache',
    plugins: [postQueue]
  }),
  'POST'
);

// Push Notifications handler
self.addEventListener('push', (event: PushEvent) => {
  const data = (() => {
    try { return event.data ? event.data.json() : {}; } catch { return {}; }
  })();
  const title = data.title || 'Smart Waste Update';
  const body = data.body || 'มีข้อมูลใหม่ หรือการแจ้งเตือนจากระบบ';
  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data.payload || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = '/Smart-Waste-Muang-Sri-Kai/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      let client = allClients.find(c => (c as WindowClient).url.includes(targetUrl)) as WindowClient | undefined;
      if (client) {
        client.focus();
      } else {
        client = await self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// Lifecycle logging (optional)
self.addEventListener('install', () => { console.log('[SW] Installed'); });
self.addEventListener('activate', () => { console.log('[SW] Activated'); });

// Notify clients when subscription changes (browser may rotate keys)
self.addEventListener('pushsubscriptionchange', async (event) => {
  console.log('[SW] pushsubscriptionchange detected');
  const current = await self.registration.pushManager.getSubscription();
  if (!current) {
    try {
      // Attempt auto re-subscribe if public key available
      // Access Vite env via global placeholder (may be injected at build time)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vapidKey = (self as any).VITE_VAPID_PUBLIC_KEY || (self as any).import?.meta?.env?.VITE_VAPID_PUBLIC_KEY;
      if (vapidKey) {
        const appServerKey = (() => {
          const padding = '='.repeat((4 - (vapidKey.length % 4)) % 4);
          const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
          return outputArray;
        })();
        const newSub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey });
        // Send to backend with default role
        try {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: newSub, role: 'default' })
          });
        } catch (e) { console.warn('[SW] auto subscribe backend failed', e); }
      }
    } catch (e) {
      console.warn('[SW] auto re-subscribe failed', e);
    } finally {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clientsList.forEach(client => client.postMessage({ type: 'PUSH_SUBSCRIPTION_EXPIRED' }));
    }
  }
});

export {};
