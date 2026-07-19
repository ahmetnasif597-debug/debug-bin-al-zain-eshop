// Service Worker — بن الزين
// يتولى: استقبال Push notifications + التعامل مع الضغط عليها

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// ─── استقبال Push ────────────────────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let payload = { title: "بن الزين", body: "إشعار جديد", url: "/", tag: "default" };

  if (e.data) {
    try {
      payload = { ...payload, ...e.data.json() };
    } catch {
      payload.body = e.data.text();
    }
  }

  e.waitUntil(
    self.registration.showNotification(payload.title, {
      body:    payload.body,
      icon:    "/icon-192.png",
      badge:   "/favicon-192.png",
      tag:     payload.tag,
      renotify: true,
      dir:     "rtl",
      lang:    "ar",
      data:    { url: payload.url },
    })
  );
});

// ─── ضغط على الإشعار ─────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url ?? "/";

  e.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // لو التطبيق مفتوح بالفعل — نفتح الصفحة المطلوبة فيه
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // لو مغلق — نفتح نافذة جديدة
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
