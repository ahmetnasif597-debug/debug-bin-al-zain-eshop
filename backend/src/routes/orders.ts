import { Router } from "express";
import { db, ordersTable } from "../db";
import { eq, desc, gt } from "drizzle-orm";
import {
  CreateOrderBody,
  GetOrderParams,
  ListOrdersQueryParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
} from "../schemas";

const router = Router();

router.get("/admin/orders/new-since", async (req: any, res: any) => {
  if (!req.session.isAdmin) return res.status(401).json({ error: "Unauthorized" });
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
    const body = CreateOrderBody.parse(req.body);
    const [order] = await db
      .insert(ordersTable)
      .values({
        customerId: req.session.customerId ?? null,
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
    return res.status(201).json({
      ...order,
      totalPrice: Number(order.totalPrice),
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
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
    return res.json({ ...order, totalPrice: Number(order.totalPrice), createdAt: order.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update order status");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
