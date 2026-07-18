import { Router } from "express";
import { db, ordersTable, dailySalesSummaryTable } from "../db";
import { sql, desc } from "drizzle-orm";
import type { ProductSalesBreakdown } from "../db/schema/dailySalesSummary";

const router = Router();

// ينشئ الجدول تلقائيًا أول مرة إذا مو موجود - ما بيحتاج تشغيل migration يدوي
async function ensureTableExists() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS daily_sales_summary (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      total_sales NUMERIC(12,2) NOT NULL,
      order_count INTEGER NOT NULL,
      product_breakdown JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD بتوقيت UTC
}

async function computeAndSaveSummaryForDate(targetDateKey: string) {
  await ensureTableExists();

  const dayStart = new Date(`${targetDateKey}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const orders = await db
    .select()
    .from(ordersTable)
    .where(sql`${ordersTable.createdAt} >= ${dayStart} AND ${ordersTable.createdAt} < ${dayEnd}`);

  let totalSales = 0;
  const breakdownMap = new Map<number, ProductSalesBreakdown>();

  for (const order of orders) {
    totalSales += Number(order.totalPrice);
    for (const item of order.items ?? []) {
      const revenue = item.lineTotal ?? item.price * item.quantity;
      const existing = breakdownMap.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += revenue;
      } else {
        breakdownMap.set(item.productId, {
          productId: item.productId,
          nameAr: item.nameAr,
          quantity: item.quantity,
          revenue,
        });
      }
    }
  }

  const productBreakdown = Array.from(breakdownMap.values());

  await db
    .insert(dailySalesSummaryTable)
    .values({
      date: targetDateKey,
      totalSales: String(totalSales),
      orderCount: orders.length,
      productBreakdown,
    })
    .onConflictDoUpdate({
      target: dailySalesSummaryTable.date,
      set: {
        totalSales: String(totalSales),
        orderCount: orders.length,
        productBreakdown,
      },
    });

  return { date: targetDateKey, totalSales, orderCount: orders.length, productBreakdown };
}

// يستدعيه Vercel Cron تلقائيًا كل يوم منتصف الليل - محمي بمفتاح سري (CRON_SECRET)
router.post("/cron/daily-rollup", async (req: any, res: any) => {
  const authHeader = req.headers["authorization"];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await computeAndSaveSummaryForDate(dateKey(yesterday));
    return res.json({ ok: true, ...result });
  } catch (err) {
    req.log.error({ err }, "Failed to run daily rollup");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// تشغيل يدوي فوري من لوحة الإدارة (تحديث ملخص اليوم بدون انتظار منتصف الليل)
router.post("/admin/reports/rollup-today", async (req: any, res: any) => {
  if (!req.user?.isAdmin) return res.status(401).json({ error: "Unauthorized" });
  try {
    const result = await computeAndSaveSummaryForDate(dateKey(new Date()));
    return res.json({ ok: true, ...result });
  } catch (err) {
    req.log.error({ err }, "Failed to run manual rollup");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/reports/daily", async (req: any, res: any) => {
  if (!req.user?.isAdmin) return res.status(401).json({ error: "Unauthorized" });
  try {
    await ensureTableExists();
    const rows = await db
      .select()
      .from(dailySalesSummaryTable)
      .orderBy(desc(dailySalesSummaryTable.date))
      .limit(90);
    return res.json(
      rows.map((r) => ({ ...r, totalSales: Number(r.totalSales), createdAt: r.createdAt.toISOString() }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list daily reports");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/reports/monthly", async (req: any, res: any) => {
  if (!req.user?.isAdmin) return res.status(401).json({ error: "Unauthorized" });
  try {
    const month = req.query.month as string | undefined; // "YYYY-MM"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "Missing or invalid 'month' query parameter (format YYYY-MM)" });
    }
    await ensureTableExists();
    const rows = await db
      .select()
      .from(dailySalesSummaryTable)
      .where(sql`${dailySalesSummaryTable.date} LIKE ${month + "-%"}`)
      .orderBy(dailySalesSummaryTable.date);

    let totalSales = 0;
    let orderCount = 0;
    const productMap = new Map<number, ProductSalesBreakdown>();

    for (const row of rows) {
      totalSales += Number(row.totalSales);
      orderCount += row.orderCount;
      for (const p of (row.productBreakdown as ProductSalesBreakdown[]) ?? []) {
        const existing = productMap.get(p.productId);
        if (existing) {
          existing.quantity += p.quantity;
          existing.revenue += p.revenue;
        } else {
          productMap.set(p.productId, { ...p });
        }
      }
    }

    const topProducts = Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);

    return res.json({
      month,
      totalSales,
      orderCount,
      days: rows.map((r) => ({ date: r.date, totalSales: Number(r.totalSales), orderCount: r.orderCount })),
      topProducts,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to compute monthly report");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
