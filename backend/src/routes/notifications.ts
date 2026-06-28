import { Router } from "express";
import { db, notificationsTable, notificationReadsTable, customersTable } from "../db";
import { eq, and, or, isNull, inArray, desc } from "drizzle-orm";

const router = Router();

function requireCustomer(req: any, res: any): boolean {
  if (!req.session.customerId) {
    res.status(401).json({ error: "غير مسجل الدخول" });
    return false;
  }
  return true;
}

function requireAdmin(req: any, res: any): boolean {
  if (!req.session.isAdmin) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.get("/notifications", async (req: any, res: any) => {
  if (!requireCustomer(req, res)) return;
  const customerId = req.session.customerId!;
  try {
    const notifications = await db
      .select()
      .from(notificationsTable)
      .where(or(isNull(notificationsTable.customerId), eq(notificationsTable.customerId, customerId)))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    if (notifications.length === 0) {
      return res.json([]);
    }

    const notifIds = notifications.map((n) => n.id);
    const reads = await db
      .select()
      .from(notificationReadsTable)
      .where(
        and(
          eq(notificationReadsTable.customerId, customerId),
          inArray(notificationReadsTable.notificationId, notifIds)
        )
      );

    const readSet = new Set(reads.map((r) => r.notificationId));
    return res.json(
      notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        isRead: readSet.has(n.id),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch notifications");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/notifications/read-all", async (req: any, res: any) => {
  if (!requireCustomer(req, res)) return;
  const customerId = req.session.customerId!;
  try {
    const notifications = await db
      .select({ id: notificationsTable.id })
      .from(notificationsTable)
      .where(or(isNull(notificationsTable.customerId), eq(notificationsTable.customerId, customerId)));

    if (notifications.length === 0) return res.json({ ok: true });

    const notifIds = notifications.map((n) => n.id);
    const alreadyRead = await db
      .select({ notificationId: notificationReadsTable.notificationId })
      .from(notificationReadsTable)
      .where(
        and(
          eq(notificationReadsTable.customerId, customerId),
          inArray(notificationReadsTable.notificationId, notifIds)
        )
      );

    const alreadyReadIds = new Set(alreadyRead.map((r) => r.notificationId));
    const unreadIds = notifIds.filter((id) => !alreadyReadIds.has(id));

    if (unreadIds.length > 0) {
      await db.insert(notificationReadsTable).values(
        unreadIds.map((notificationId) => ({ notificationId, customerId }))
      );
    }
    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to mark notifications as read");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/notifications/read/:id", async (req: any, res: any) => {
  if (!requireCustomer(req, res)) return;
  const customerId = req.session.customerId!;
  const notificationId = Number(req.params.id);
  if (isNaN(notificationId)) return res.status(400).json({ error: "Invalid id" });
  try {
    const existing = await db
      .select()
      .from(notificationReadsTable)
      .where(
        and(
          eq(notificationReadsTable.notificationId, notificationId),
          eq(notificationReadsTable.customerId, customerId)
        )
      )
      .limit(1);
    if (existing.length === 0) {
      await db.insert(notificationReadsTable).values({ notificationId, customerId });
    }
    return res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to mark notification as read");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.get("/admin/notifications", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const notifications = await db
      .select({
        id: notificationsTable.id,
        type: notificationsTable.type,
        title: notificationsTable.title,
        body: notificationsTable.body,
        customerId: notificationsTable.customerId,
        customerName: customersTable.fullName,
        createdAt: notificationsTable.createdAt,
      })
      .from(notificationsTable)
      .leftJoin(customersTable, eq(notificationsTable.customerId, customersTable.id))
      .orderBy(desc(notificationsTable.createdAt));

    return res.json(
      notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list admin notifications");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/notifications", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { type, title, body, customerId } = req.body;
    if (!type || !title || !body) {
      return res.status(400).json({ error: "النوع والعنوان والمحتوى مطلوبة" });
    }
    if (!["offer", "discount", "warning"].includes(type)) {
      return res.status(400).json({ error: "نوع الإشعار غير صحيح" });
    }

    const [notification] = await db
      .insert(notificationsTable)
      .values({
        type,
        title,
        body,
        customerId: customerId ? Number(customerId) : null,
      })
      .returning();

    return res.status(201).json({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create notification");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/notifications/:id", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
    return res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete notification");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
