import { useEffect, useRef } from "react";

interface Options {
  enabled: boolean;
  /**
   * admin  → نطلب الإذن بعد 2 ثانية
   * customer → نؤخّر 12 ثانية حتى لا يكون الطلب مزعجاً
   */
  role: "admin" | "customer";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registerPush(): Promise<void> {
  console.log("[Push] 🚀 بدء registerPush()");

  // 1. تأكد من دعم المتصفح
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[Push] ⚠️ المتصفح لا يدعم Service Worker أو PushManager");
    return;
  }

  // 2. تحقق مسبقاً من حالة الإذن
  if (Notification.permission === "denied") {
    console.warn(
      "[Push] 🚫 الإشعارات محجوبة في إعدادات المتصفح. " +
      "افتح إعدادات الموقع (🔒 بجانب الرابط) وأعد السماح بالإشعارات ثم أعد تحميل الصفحة.",
    );
    return;
  }

  // 3. سجّل Service Worker واستخدم نتيجة ready (يضمن SW نشط)
  console.log("[Push] 📋 تسجيل Service Worker من /sw.js ...");
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch (regErr) {
    console.error(
      "[Push] ❌ فشل تسجيل /sw.js — قد يكون الملف غير موجود أو نوع MIME خاطئ:",
      regErr,
    );
    throw regErr;
  }

  const readyReg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("navigator.serviceWorker.ready timeout (10s)")), 10_000),
    ),
  ]);
  console.log("[Push] ✅ Service Worker نشط:", readyReg.active?.scriptURL);

  // 4. اطلب إذن الإشعارات
  console.log("[Push] 🔔 طلب إذن الإشعارات ...");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("[Push] ⚠️ الإذن لم يُمنح:", permission);
    return;
  }
  console.log("[Push] ✅ إذن الإشعارات مُمنح");

  // 5. تحقق من اشتراك موجود مسبقاً
  const existingSub = await readyReg.pushManager.getSubscription();

  // 6. اجلب مفتاح VAPID العام من الباك‑إند
  console.log("[Push] 🔑 جلب VAPID public key من /api/push/vapid-key ...");
  const keyRes = await fetch("/api/push/vapid-key", { credentials: "include" });
  if (!keyRes.ok) {
    console.error("[Push] ❌ فشل جلب VAPID public key — HTTP", keyRes.status);
    return;
  }
  const { publicKey } = await keyRes.json();
  if (!publicKey) {
    console.error("[Push] ❌ VAPID public key فارغ — تأكد من ضبط VAPID_PUBLIC_KEY في Vercel env");
    return;
  }
  console.log("[Push] ✅ VAPID public key:", publicKey.slice(0, 20) + "...");

  // 7. أنشئ اشتراكاً جديداً أو أعد استخدام القائم إذا كان المفتاح مطابقاً
  let subscription = existingSub;
  const existingKey = existingSub
    ? btoa(String.fromCharCode(...new Uint8Array(existingSub.options.applicationServerKey!)))
    : null;
  if (!subscription || existingKey !== publicKey) {
    console.log("[Push] 📡 إنشاء اشتراك Push جديد ...");
    if (existingSub) {
      await existingSub.unsubscribe();
      console.log("[Push] ℹ️ ألغيت الاشتراك القديم (تغيّر VAPID key)");
    }
    subscription = await readyReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    console.log("[Push] ✅ اشتراك Push جديد:", subscription.endpoint.slice(0, 50) + "...");
  } else {
    console.log("[Push] ℹ️ الاشتراك القائم لا يزال صالحاً");
  }

  // 8. أرسل الاشتراك للباك‑إند للحفظ
  console.log("[Push] 💾 حفظ الاشتراك في الباك‑إند ...");
  const saveRes = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(subscription),
  });
  if (!saveRes.ok) {
    const body = await saveRes.text();
    console.error("[Push] ❌ فشل حفظ الاشتراك — HTTP", saveRes.status, ":", body);
    return;
  }

  console.info("[Push] 🎉 تم تسجيل اشتراك Push بنجاح!");
}

export function usePushNotifications(options: Options): void {
  const enabled = options.enabled;
  const role = options.role;
  const attempted = useRef(false);

  useEffect(() => {
    console.log(`[Push] useEffect triggered — enabled=${enabled}, attempted=${attempted.current}, role=${role}`);

    if (!enabled || attempted.current) {
      if (!enabled) console.log("[Push] ⏸️ تخطّي: المستخدم غير مسجّل الدخول بعد");
      if (attempted.current) console.log("[Push] ⏸️ تخطّي: سبق محاولة التسجيل");
      return;
    }

    const delayMs = role === "admin" ? 2_000 : 12_000;
    console.log(`[Push] ⏱️ سيُطلب الإذن بعد ${delayMs / 1000} ثانية ...`);

    const timer = setTimeout(async () => {
      try {
        await registerPush();
      } catch (err) {
        console.error("[Push] ❌ خطأ غير متوقع أثناء تسجيل Push:", err);
      } finally {
        attempted.current = true;
      }
    }, delayMs);

    return () => {
      console.log("[Push] 🧹 تنظيف: إلغاء timer");
      clearTimeout(timer);
    };
  }, [enabled, role]);
}
