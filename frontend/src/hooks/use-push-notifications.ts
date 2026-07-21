import { useEffect, useRef } from "react";

interface Options {
  enabled: boolean;
  role: "admin" | "customer";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registerPush(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    alert("[Push] المتصفح لا يدعم Service Worker أو PushManager");
    return;
  }

  await navigator.serviceWorker.register("/sw.js");
  const readyReg = await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("[Push] الإذن مرفوض أو معلّق: " + permission);
    return;
  }

  const existingSub = await readyReg.pushManager.getSubscription();

  const keyRes = await fetch("/api/push/vapid-key", { credentials: "include" });
  if (!keyRes.ok) {
    alert("[Push] فشل جلب VAPID public key: " + keyRes.status);
    return;
  }
  const { publicKey } = await keyRes.json();
  if (!publicKey) {
    alert("[Push] VAPID public key فارغ");
    return;
  }

  let subscription = existingSub;
  const existingKey = existingSub
    ? btoa(String.fromCharCode(...new Uint8Array(existingSub.options.applicationServerKey!)))
    : null;
  if (!subscription || existingKey !== publicKey) {
    if (existingSub) await existingSub.unsubscribe();
    subscription = await readyReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const saveRes = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(subscription),
  });
  if (!saveRes.ok) {
    const body = await saveRes.text();
    alert("[Push] فشل حفظ الاشتراك: " + saveRes.status + " - " + body);
    return;
  }

  alert("[Push] تم تسجيل اشتراك Push بنجاح");
}

export function usePushNotifications(options: Options): void {
  const enabled = options.enabled;
  const role = options.role;
  const attempted = useRef(false);

  useEffect(() => {
    if (!enabled || attempted.current) {
      return;
    }

    const delayMs = role === "admin" ? 2000 : 3000;

    const timer = setTimeout(function () {
      registerPush()
        .catch(function (err) {
          alert("[Push] خطأ غير متوقع: " + (err instanceof Error ? err.message : String(err)));
        })
        .finally(function () {
          attempted.current = true;
        });
    }, delayMs);

    return function () {
      clearTimeout(timer);
    };
  }, [enabled, role]);
}
