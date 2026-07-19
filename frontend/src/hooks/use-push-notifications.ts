import { useEffect, useRef } from "react";

interface Options {
  /** هل المستخدم مسجّل الدخول (زبون أو أدمن)؟ */
  enabled: boolean;
  /**
   * أدمن  → نطلب الإذن فوراً (Push صميم عمله)
   * customer → نؤخّر 12 ثانية حتى لا يكون الطلب مزعجاً
   */
  role: "admin" | "customer";
}

/** يُحوّل مفتاح VAPID العام (Base64 URL) إلى Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registerPush(): Promise<void> {
  // 1. تأكد من دعم المتصفح
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  // 2. سجّل Service Worker
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  // 3. اطلب إذن الإشعارات
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  // 4. اجلب مفتاح VAPID العام من الباك‑إند
  const keyRes = await fetch("/api/push/vapid-key", { credentials: "include" });
  if (!keyRes.ok) return;
  const { publicKey } = await keyRes.json();

  // 5. اشترك عبر PushManager
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // 6. أرسل الاشتراك للباك‑إند
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(subscription),
  });
}

export function usePushNotifications({ enabled, role }: Options): void {
  const attempted = useRef(false);

  useEffect(() => {
    if (!enabled || attempted.current) return;

    const delayMs = role === "admin" ? 2_000 : 12_000;

    const timer = setTimeout(async () => {
      attempted.current = true;
      try {
        await registerPush();
      } catch {
        // فشل صامت — Push اختياري ولا يكسر أي وظيفة
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [enabled, role]);
}
