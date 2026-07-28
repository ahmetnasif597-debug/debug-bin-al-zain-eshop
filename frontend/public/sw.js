// Service Worker — بن الزين
// يتولى: استقبال Push notifications + التعامل مع الضغط عليها

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// ─── استقبال Push ────────────────────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let payload = { title: "بن الزين", body: "إشعار جديد", url: "/", tag: "default", type: "general" };

  if (e.data) {
    try {
      payload = { ...payload, ...e.data.json() };
    } catch {
      payload.body = e.data.text();
    }
  }

  // إشعار الأدمن (طلب جديد) — أقوى وأبقى على الشاشة حتى يضغط عليه
  const isAdminNotification = payload.type === "admin_order" || (payload.url ?? "").startsWith("/admin");

  const notificationOptions = {
    body:             payload.body,
    icon:             "/icon-192.png",
    badge:            "/favicon-192.png",
    tag:              payload.tag,
    renotify:         true,
    dir:              "rtl",
    lang:             "ar",
    data:             { url: payload.url },

    // اهتزاز: pattern بـ ms  [اهتزاز, توقف, اهتزاز, ...]
    vibrate: isAdminNotification
      ? [300, 100, 300, 100, 300]   // 3 نبضات قوية للأدمن
      : [200, 100, 200],            // نبضتان للزبون

    // requireInteraction: يبقى الإشعار ظاهراً حتى يضغط عليه (سطح المكتب)
    requireInteraction: isAdminNotification,

    // actions — زر سريع للأدمن
    actions: isAdminNotification
      ? [{ action: "open", title: "📋 عرض الطلبات" }]
      : [],
  };

  e.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// ─── ضغط على الإشعار ─────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  // الضغط على الزر السريع أو على الإشعار نفسه
  const targetUrl = e.notification.data?.url ?? "/";

  e.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // لو التطبيق مفتوح بالفعل — نُنقل إليه ونفتح الصفحة المطلوبة
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
