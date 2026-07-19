import { useEffect, useRef } from "react";

interface Options {
  /** هل المستخدم مسجّل الدخول (زبون أو أدمن)؟ */
  enabled: boolean;
  /**
   * admin  → نطلب الإذن بعد 2 ثانية (Push صميم عمله)
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
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[Push] المتصفح لا يدعم Service Worker أو PushManager");
    return;
  }

  // 2. سجّل Service Worker واستخدم نتيجة ready (يضمن SW نشط)
  await navigator.serviceWorker.register("/sw.js");
  const readyReg = await navigator.serviceWorker.ready;

  // 3. اطلب إذن الإشعارات (أو اقرأ الحالة الحالية)
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("[Push] الإذن مرفوض أو معلّق:", permission);
    return;
  }

  // 4. تحقق من اشتراك موجود مسبقاً — تجنّب إعادة التسجيل بلا داعٍ
  const existingSub = await readyReg.pushManager.getSubscription();

  // 5. اجلب مفتاح VAPID العام من الباك‑إند
  const keyRes = await fetch("/api/push/vapid-key", { credentials: "include" });
  if (!keyRes.ok) {
    console.error("[Push] فشل جلب VAPID public key:", keyRes.status);
    return;
  }
  const { publicKey } = await keyRes.json();
  if (!publicKey) {
    console.error("[Push] VAPID public key فارغ");
    return;
  }

  // 6. أنشئ اشتراكاً جديداً (أو أعد استخدام القائم إذا كان المفتاح مطابقاً)
  let subscription = existingSub;
  const existingKey = existingSub
    ? btoa(String.fromCharCode(...new Uint8Array(existingSub.options.applicationServerKey!)))
    : null;
  if (!subscription || existingKey !== publicKey) {
    if (existingSub) await existingSub.unsubscribe(); // ألغِ القديم إذا تغيّر المفتاح
    subscription = await readyReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  // 7. أرسل الاشتراك للباك‑إند للحفظ
  const saveRes = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(subscription),
  });
  if (!saveRes.ok) {
    const body = await saveRes.text();
    console.error("[Push] فشل حفظ الاشتراك في الباك‑إند:", saveRes.status, body);
    return;
  }

  console.info("[Push] ✅ تم تسجيل اشتراك Push بنجاح");
}

export function usePushNotifications({ enabled, role }: Options): void {
  const attempted = useRef(false);

  useEffect(() => {
    if (!enabled || attempted.current) return;

    const delayMs = role === "admin" ? 2_000 : 12_000;

    const timer = setTimeout(async () => {
      // نضع العلامة بعد المحاولة لا قبلها
      try {
        await registerPush();
      } catch (err) {
        console.error("[Push] خطأ غير متوقع أثناء تسجيل Push:", err);
      } finally {
        attempted.current = true;
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [enabled, role]);
}
