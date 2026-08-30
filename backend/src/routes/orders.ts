import { Router } from "express";
import { db } from "../db/index.js";
import { ordersTable, productsTable, customersTable, pushSubscriptionsTable } from "../db/schema/index.js";
import { eq, desc, gt, lt, isNull, sql } from "drizzle-orm";
import {
  CreateOrderBody, GetOrderParams, ListOrdersQueryParams,
  UpdateOrderStatusBody, UpdateOrderStatusParams,
} from "../schemas/index.js";
import { sendPushToSubscriptions } from "../lib/webpush.js";
import { logger } from "../lib/logger.js";
import {
  ensureDefaultAccounts, createJournalEntry, getAccountByCode,
  recordInventoryMovement, recordCashTransaction, recordPayment,
} from "../lib/accounting.js";

const router = Router();

const STATUS_PUSH_TEXT: Record<string, string> = {
  pending: "طلبك قيد المراجعة",
  confirmed: "تم تأكيد طلبك ✅",
  processing: "طلبك جاري التجهيز الآن",
  delivering: "طلبك في الطريق إليك الآن 🚚",
  completed: "تم تسليم طلبك بنجاح ✅",
  cancelled: "تم إلغاء طلبك",
};

router.get("/admin/orders/new-since", async (req: any, res: any) => {
  if (!req.user?.isAdmin) return res.status(401).json({ error: "Unauthorized" });
  try {
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0);
    if (isNaN(since.getTime())) return res.status(400).json({ error: "Invalid since" });
    const newOrders = await db.select({ id: ordersTable.id, customerName: ordersTable.customerName, createdAt: ordersTable.createdAt })
      .from(ordersTable).where(gt(ordersTable.createdAt, since)).orderBy(desc(ordersTable.createdAt)).limit(10);
    return res.json({ count: newOrders.length, orders: newOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })) });
  } catch (err) { req.log.error({ err }, "new-since failed"); return res.status(500).json({ error: "Internal server error" }); }
});

router.get("/orders", async (req: any, res: any) => {
  try {
    const params = ListOrdersQueryParams.parse({ status: req.query.status });
    const orders = await db.select().from(ordersTable)
      .where(params.status ? eq(ordersTable.status, params.status) : undefined)
      .orderBy(desc(ordersTable.createdAt));
    return res.json(orders.map((o) => ({ ...o, totalPrice: Number(o.totalPrice), paidAmount: Number(o.paidAmount), remainingAmount: Number(o.remainingAmount), createdAt: o.createdAt.toISOString() })));
  } catch (err) { req.log.error({ err }, "list orders failed"); return res.status(500).json({ error: "Internal server error" }); }
});

router.post("/orders", async (req: any, res: any) => {
  try {
    const rawBody = req.body ?? {};
    const coercedBody = {
      ...rawBody,
      totalPrice: Number(rawBody.totalPrice),
      paidAmount: Number(rawBody.paidAmount ?? rawBody.totalPrice),
      paymentMethod: rawBody.paymentMethod ?? "cash",
      isDebt: Boolean(rawBody.isDebt),
      items: Array.isArray(rawBody.items) ? rawBody.items.map((item: any) => ({
        ...item, price: Number(item.price), quantity: Number(item.quantity),
        selectedWeight: item.selectedWeight != null ? Number(item.selectedWeight) : item.selectedWeight,
        lineTotal: item.lineTotal != null ? Number(item.lineTotal) : item.lineTotal,
      })) : rawBody.items,
    };
    const hasInvalid = Number.isNaN(coercedBody.totalPrice) || Number.isNaN(coercedBody.paidAmount) ||
      (Array.isArray(coercedBody.items) && coercedBody.items.some((i: any) => Number.isNaN(i.price) || Number.isNaN(i.quantity)));
    if (hasInvalid) return res.status(400).json({ error: "Invalid numeric value" });

    const remaining = Math.max(0, coercedBody.totalPrice - coercedBody.paidAmount);
    const body = CreateOrderBody.parse(coercedBody);

    const [order] = await db.insert(ordersTable).values({
      customerId: req.user?.customerId ?? null,
      customerName: body.customerName ?? null,
      customerPhone: body.customerPhone ?? null,
      items: body.items.map((item) => ({
        productId: item.productId, nameAr: item.nameAr, price: item.price,
        quantity: item.quantity, selectedWeight: item.selectedWeight ?? null,
        lineTotal: item.lineTotal ?? item.price * item.quantity,
      })),
      totalPrice: String(body.totalPrice),
      paidAmount: String(coercedBody.paidAmount),
      remainingAmount: String(remaining),
      paymentMethod: coercedBody.paymentMethod,
      isDebt: remaining > 0,
      status: "pending",
      notes: body.notes ?? null,
    }).returning();

    if (remaining > 0 && order.customerId) {
      await db.update(customersTable).set({
        balance: sql`${customersTable.balance} + ${String(remaining)}`,
        totalPurchases: sql`${customersTable.totalPurchases} + ${String(body.totalPrice)}`,
        totalPaid: sql`${customersTable.totalPaid} + ${String(coercedBody.paidAmount)}`,
      }).where(eq(customersTable.id, order.customerId));
    }

    await ensureDefaultAccounts();
    const cashAcc = await getAccountByCode("101");
    const customersAcc = await getAccountByCode("110");
    const salesAcc = await getAccountByCode("401");

    for (const item of body.items) {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
      if (product) {
        const oldStock = Number(product.stockQuantity ?? 0);
        const qty = item.quantity * (item.selectedWeight ?? 1);
        const newStock = Math.max(0, oldStock - qty);
        await db.update(productsTable).set({ stockQuantity: String(newStock), inStock: newStock > 0 }).where(eq(productsTable.id, item.productId));
        await recordInventoryMovement({
          productId: item.productId, movementType: "out", quantity: qty, unit: product.unit,
          baseQuantity: qty, quantityBefore: oldStock, quantityAfter: newStock,
          reason: `بيع - طلب #${order.id}`, referenceType: "order", referenceId: order.id,
          createdBy: req.user?.customerId ?? null,
        });
      }
    }

    if (salesAcc) {
      const lines = [{ accountId: salesAcc.id, debit: 0, credit: Number(body.totalPrice), description: `مبيعات - طلب #${order.id}` }];
      if (coercedBody.paidAmount > 0 && cashAcc) {
        lines.push({ accountId: cashAcc.id, debit: coercedBody.paidAmount, credit: 0, description: "نقدي" });
        await recordCashTransaction({ transactionType: "in", amount: coercedBody.paidAmount, description: `بيع - طلب #${order.id}`, referenceType: "order", referenceId: order.id });
      }
      if (remaining > 0 && customersAcc) {
        lines.push({ accountId: customersAcc.id, debit: remaining, credit: 0, description: "دين عميل" });
        await recordPayment({ direction: "in", amount: remaining, paymentMethod: "debt", customerId: order.customerId ?? undefined, referenceType: "order", referenceId: order.id, notes: `دين - طلب #${order.id}` });
      }
      await createJournalEntry({ description: `طلب بيع #${order.id} - ${body.customerName || "زبون"}`, sourceType: "order", sourceId: order.id, lines, createdBy: req.user?.customerId ?? null });
    }

    db.select().from(pushSubscriptionsTable).where(isNull(pushSubscriptionsTable.customerId))
      .then((adminSubs) => sendPushToSubscriptions(adminSubs, {
        title: "🛒 طلب جديد", body: `${body.customerName ?? "زبون"} — ${Number(body.totalPrice).toFixed(2)} ر.س`,
        url: "/admin/orders", tag: `new-order-${order.id}`, type: "admin_order",
      })).catch((err: unknown) => logger.warn({ err }, "Push failed"));

    return res.status(201).json({
      ...order, totalPrice: Number(order.totalPrice), paidAmount: Number(order.paidAmount),
      remainingAmount: Number(order.remainingAmount), createdAt: order.createdAt.toISOString(),
    });
  } catch (err: any) {
    if (err?.name === "ZodError") { req.log.warn({ err }, "Invalid order"); return res.status(400).json({ error: "Invalid order data", details: err.issues }); }
    req.log.error({ err }, "Create order failed"); return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", async (req: any, res: any) => {
  try {
    const { id } = GetOrderParams.parse({ id: Number(req.params.id) });
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json({ ...order, totalPrice: Number(order.totalPrice), paidAmount: Number(order.paidAmount), remainingAmount: Number(order.remainingAmount), createdAt: order.createdAt.toISOString() });
  } catch (err) { req.log.error({ err }, "Get order failed"); return res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/orders/:id", async (req: any, res: any) => {
  try {
    const { id } = UpdateOrderStatusParams.parse({ id: Number(req.params.id) });
    const body = UpdateOrderStatusBody.parse(req.body);
    const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!existing) return res.status(404).json({ error: "Order not found" });
    const [order] = await db.update(ordersTable).set(body).where(eq(ordersTable.id, id)).returning();
    if (body.status && body.status !== existing.status && existing.customerId) {
      const pushText = STATUS_PUSH_TEXT[body.status] ?? `حالة طلبك: ${body.status}`;
      db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.customerId, existing.customerId))
        .then((subs) => sendPushToSubscriptions(subs, { title: "تحديث طلبك 📦", body: `${pushText} (طلب #${id})`, url: "/profile", tag: `order-status-${id}` }))
        .catch((err: unknown) => logger.warn({ err }, "Push failed"));
    }
    return res.json({ ...order, totalPrice: Number(order.totalPrice), paidAmount: Number(order.paidAmount), remainingAmount: Number(order.remainingAmount), createdAt: order.createdAt.toISOString() });
  } catch (err) { req.log.error({ err }, "Update order failed"); return res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/orders/:id", async (req: any, res: any) => {
  if (!req.user?.isAdmin) return res.status(401).json({ error: "Unauthorized" });
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Order not found" });
    await db.delete(ordersTable).where(eq(ordersTable.id, id));
    return res.status(204).send();
  } catch (err) { req.log.error({ err }, "Delete order failed"); return res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/orders", async (req: any, res: any) => {
  if (!req.user?.isAdmin) return res.status(401).json({ error: "Unauthorized" });
  try {
    const beforeDateStr = req.query.before as string | undefined;
    if (!beforeDateStr) return res.status(400).json({ error: "Missing before" });
    const beforeDate = new Date(beforeDateStr);
    if (isNaN(beforeDate.getTime())) return res.status(400).json({ error: "Invalid before" });
    const deleted = await db.delete(ordersTable).where(lt(ordersTable.createdAt, beforeDate)).returning({ id: ordersTable.id });
    return res.json({ deletedCount: deleted.length });
  } catch (err) { req.log.error({ err }, "Bulk delete failed"); return res.status(500).json({ error: "Internal server error" }); }
});

export default router;
