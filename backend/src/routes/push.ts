import { Router } from "express";
import { db } from "../db";
import { pushSubscriptionsTable } from "../db/schema/pushSubscriptions.js";
import { eq } from "drizzle-orm";
import { vapidPublicKey } from "../lib/webpush.js";

const router = Router();

// ————————————————————————————————————————————————————
// GET /api/push/vapid-key
// يُعيد المفتاح العام VAPID للـ frontend ليُنشئ الاشتراك
// ————————————————————————————————————————————————————
router.get("/push/vapid-key", (_req: any, res: any) => {
  if (!vapidPublicKey) {
    return res.status(503).json({ error: "Web Push غير مفعّل على هذا الخادم" });
  }
  return res.json({ publicKey: vapidPublicKey });
});

// ————————————————————————————————————————————————————
// POST /api/push/subscribe
// يُسجّل اشتراك Push للمستخدم الحالي (زبون أو أدمن)
// ————————————————————————————————————————————————————
router.post("/push/subscribe", async (req: any, res: any) => {
  const customerId: number | null = req.user?.customerId ?? null;
  const isAdmin: boolean = req.user?.isAdmin ?? false;

  if (!customerId && !isAdmin) {
    return res.status(401).json({ error: "غير مسجل الدخول" });
  }

  const { endpoint, keys } = req.body ?? {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "بيانات الاشتراك غير مكتملة" });
  }

  try {
    await db
      .insert(pushSubscriptionsTable)
      .values({ endpoint, p256dh: keys.p256dh, auth: keys.auth, customerId })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: { p256dh: keys.p256dh, auth: keys.auth, customerId },
      });
    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "فشل حفظ اشتراك Push");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ————————————————————————————————————————————————————
// DELETE /api/push/unsubscribe
// يحذف الاشتراك (عند إلغاء الإذن من المتصفح)
// ————————————————————————————————————————————————————
router.delete("/push/unsubscribe", async (req: any, res: any) => {
  const { endpoint } = req.body ?? {};
  if (!endpoint) return res.status(400).json({ error: "endpoint مطلوب" });

  try {
    await db
      .delete(pushSubscriptionsTable)
      .where(eq(pushSubscriptionsTable.endpoint, endpoint));
    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "فشل حذف اشتراك Push");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
