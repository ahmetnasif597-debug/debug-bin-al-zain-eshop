import { Router } from "express";
import { db, ordersTable } from "../db";
import { pushSubscriptionsTable } from "../db/schema/pushSubscriptions.js";
import { eq, desc, gt, lt, isNull } from "drizzle-orm";
import {
  CreateOrderBody,
  GetOrderParams,
  ListOrdersQueryParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
} from "../schemas";
import { sendPushToSubscriptions } from "../lib/webpush.js";
import { logger } from "../lib/logger.js";

const router = Router();

// خريطة نصوص الإشعارات العربية لكل حالة طلب
const STATUS_PUSH_TEXT: Record<string, string> = {
  pending:    "طلبك قيد المراجعة",
  processing: "طلبك جاري التجهيز الآن",
  delivering: "طلبك في الطريق إليك الآن 🚚",
  completed:  "تم تسليم طلبك بنجاح ✅",
  cancelled:  "تم إلغاء طلبك",
};

router.get("/admin/orders/new-since", async (req: any, res: any) => {
  if (!req.user?.isAdmin) return res.status(401).json({ error: "Unauthorized" });
  try {
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
    if (isNaN(since.getTime())) return res.status(400).json({ error: "Invalid since parameter" });

    const newOrders = await db
      .select({ id: ordersTable.id, customerName: ordersTable.customerName, createdAt: ordersTable.createdAt })
      .from(ordersTable)
      .where(gt(ordersTable.createdAt, since))
      .orderBy(desc(ordersTable.createdAt))
      .limit(10);

    return res.json({
      count: newOrders.length,
      orders: newOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to check new orders");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders", async (req: any, res: any) => {
  try {
    const params = ListOrdersQueryParams.parse({ status: req.query.status });
    const orders = await db
      .select()
      .from(ordersTable)
      .where(params.status ? eq(ordersTable.status, params.status) : undefined)
      .orderBy(desc(ordersTable.createdAt));
    return res.json(
      orders.map((o) => ({ ...o, totalPrice: Number(o.totalPrice), createdAt: o.createdAt.toISOString() }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list orders");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req: any, res: any) => {
  try {
    // تحويل صريح للأرقام قبل التحقق - يمنع الـ 500 error إذا وصل نص بدل رقم
    const rawBody = req.body ?? {};
    const coercedBody = {
      ...rawBody,
      totalPrice: Number(rawBody.totalPrice),
      items: Array.isArray(rawBody.items)
        ? rawBody.items.map((item: any) => ({
            ...item,
            price: Number(item.price),
            quantity: Number(item.quantity),
            selectedWeight:
              item.selectedWeight != null ? Number(item.selectedWeight) : item.selectedWeight,
            lineTotal:
              item.lineTotal != null ? Number(item.lineTotal) : item.lineTotal,
          }))
        : rawBody.items,
    };

    // لو أي رقم طلع NaN بعد التحويل، هذا خطأ من العميل (400) مش خطأ سيرفر (500)
    const hasInvalidNumber =
      Number.isNaN(coercedBody.totalPrice) ||
      (Array.isArray(coercedBody.items) &&
        coercedBody.items.some(
          (item: any) => Number.isNaN(item.price) || Number.isNaN(item.quantity)
        ));
    if (hasInvalidNumber) {
      return res.status(400).json({ error: "Invalid numeric value in order data" });
    }

    const body = CreateOrderBody.parse(coercedBody);
    const [order] = await db
      .insert(ordersTable)
      .values({
        customerId: req.user?.customerId ?? null,
        customerName: body.customerName ?? null,
        customerPhone: body.customerPhone ?? null,
        items: body.items.map((item) => ({
          productId: item.productId,
          nameAr: item.nameAr,
          price: item.price,
          quantity: item.quantity,
          selectedWeight: item.selectedWeight ?? null,
          lineTotal: item.lineTotal ?? item.price * item.quantity,
        })),
        totalPrice: String(body.totalPrice),
        notes: body.notes ?? null,
      })
      .returning();

    // إرسال Push للأدمن — fire-and-forget (لا يؤخر الرد)
    db.select()
      .from(pushSubscriptionsTable)
      .where(isNull(pushSubscriptionsTable.customerId))
      .then((adminSubs) =>
        sendPushToSubscriptions(adminSubs, {
          title: "🛒 طلب جديد",
          body: `${body.customerName ?? "زبون"} — ${Number(body.totalPrice).toFixed(2)} ر.س`,
          url: "/admin/orders",
          tag: `new-order-${order.id}`,
        }),
      )
      .catch((err: unknown) => logger.warn({ err }, "فشل إرسال Push للأدمن عند طلب جديد"));

    return res.status(201).json({
      ...order,
      totalPrice: Number(order.totalPrice),
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err: any) {
    // خطأ تحقق (Zod) = طلب غلط من العميل، مش خطأ سيرفر
    if (err?.name === "ZodError") {
      req.log.warn({ err }, "Invalid order payload");
      return res.status(400).json({ error: "Invalid order data", details: err.issues });
    }
    req.log.error({ err }, "Failed to create order");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", async (req: any, res: any) => {
  try {
    const { id } = GetOrderParams.parse({ id: Number(req.params.id) });
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json({ ...order, totalPrice: Number(order.totalPrice), createdAt: order.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get order");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/orders/:id", async (req: any, res: any) => {
  try {
    const { id } = UpdateOrderStatusParams.parse({ id: Number(req.params.id) });
    const body = UpdateOrderStatusBody.parse(req.body);
    const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!existing) return res.status(404).json({ error: "Order not found" });

    const [order] = await db
      .update(ordersTable)
      .set(body)
      .where(eq(ordersTable.id, id))
      .returning();

    // إرسال Push للزبون فقط عند تغيّر الحالة تحديداً
    if (
      body.status &&
      body.status !== existing.status &&
      existing.customerId
    ) {
      const pushText = STATUS_PUSH_TEXT[body.status] ?? `حالة طلبك تغيّرت إلى ${body.status}`;
      db.select()
        .from(pushSubscriptionsTable)
        .where(eq(pushSubscriptionsTable.customerId, existing.customerId))
        .then((customerSubs) =>
          sendPushToSubscriptions(customerSubs, {
            title: "تحديث طلبك 📦",
            body: `${pushText} (طلب #${id})`,
            url: "/profile",
            tag: `order-status-${id}`,
          }),
        )
        .catch((err: unknown) => logger.warn({ err }, "فشل إرسال Push للزبون عند تغيّر الحالة"));
    }

    return res.json({ ...order, totalPrice: Number(order.totalPrice), createdAt: order.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update order status");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/orders/:id", async (req: any, res: any) => {
  if (!req.user?.isAdmin) return res.status(401).json({ error: "Unauthorized" });
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid order id" });

    const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!existing) return res.status(404).json({ error: "Order not found" });

    await db.delete(ordersTable).where(eq(ordersTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete order");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// حذف جماعي: كل الطلبات الأقدم من تاريخ معيّن
router.delete("/orders", async (req: any, res: any) => {
  if (!req.user?.isAdmin) return res.status(401).json({ error: "Unauthorized" });
  try {
    const beforeDateStr = req.query.before as string | undefined;
    if (!beforeDateStr) return res.status(400).json({ error: "Missing 'before' query parameter (ISO date)" });

    const beforeDate = new Date(beforeDateStr);
    if (isNaN(beforeDate.getTime())) return res.status(400).json({ error: "Invalid 'before' date" });

    const deleted = await db
      .delete(ordersTable)
      .where(lt(ordersTable.createdAt, beforeDate))
      .returning({ id: ordersTable.id });

    return res.json({ deletedCount: deleted.length });
  } catch (err) {
    req.log.error({ err }, "Failed to bulk delete orders");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
