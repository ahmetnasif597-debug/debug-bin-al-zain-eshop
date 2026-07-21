import { useEffect, useRef } from "react";

interface Options {
  /** هل المستخدم مسجّل الدخول (زبون أو أدمن)؟ */
  enabled: boolean;
  /**
   * admin  → نطلب الإذن بعد 2 ثانية (Push صميم عمله)
   * customer → نؤخّر 3 ثواني (مؤقتاً للاختبار)
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
      app
