self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const fallback = {
    title: 'بازارینو',
    body: 'اعلان جدید دارید.',
    href: '/notifications',
    data: {},
  };

  const payload = event.data ? event.data.json() : fallback;
  const title = payload.title || fallback.title;
  const options = {
    body: payload.body || fallback.body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    data: {
      href: payload.href || fallback.href,
      ...(payload.data || {}),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const href = event.notification.data?.href || '/notifications';
  const url = new URL(href, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url === url) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }

      return undefined;
    })
  );
});
