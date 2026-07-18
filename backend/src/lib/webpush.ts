import webpush from "web-push";
import { logger } from "./logger.js";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? "mailto:admin@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  logger.warn("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY غير مضبوطتين — Web Push معطّل");
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;   // الصفحة التي تُفتح عند الضغط على الإشعار
  tag?: string;   // يمنع تكرار الإشعار (نفس الـ tag يُستبدل بدل التراكم)
}

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * يُرسل push لمجموعة اشتراكات — fire-and-forget آمن.
 * الاشتراكات المنتهية (410 Gone) يُسجَّل تحذير فقط ولا ترفع استثناءً.
 */
export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payload: PushPayload,
): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || subscriptions.length === 0) return;

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 24 }, // يحتفظ بالرسالة يوم كامل لو الجهاز أوفلاين
      ),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    logger.warn({ failed, total: subscriptions.length }, "بعض إشعارات Push فشلت");
  }
}

export const vapidPublicKey = VAPID_PUBLIC_KEY;
