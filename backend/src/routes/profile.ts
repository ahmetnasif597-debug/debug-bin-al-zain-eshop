import { Router } from "express";
import { db, ordersTable } from "../db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/profile/orders", async (req, res) => {
  if (!req.session.customerId) {
    return res.status(401).json({ error: "غير مسجل الدخول" });
  }
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerId, req.session.customerId))
      .orderBy(desc(ordersTable.createdAt));
    return res.json(
      orders.map((o) => ({
        ...o,
        totalPrice: Number(o.totalPrice),
        createdAt: o.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch profile orders");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
