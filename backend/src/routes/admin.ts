import { Router } from "express";
import { db, productsTable, categoriesTable, ordersTable, customersTable } from "../db";
import { eq, count } from "drizzle-orm";
import { AdminLoginBody } from "../schemas";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

const router = Router();

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ?? "";
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD ?? "binalzain2024";

function hashPasswordLegacy(password: string): string {
  return createHash("sha256").update(password + "binalzain-salt").digest("hex");
}

async function verifyAdminPassword(password: string): Promise<boolean> {
  if (ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  }
  return password === ADMIN_PASSWORD_PLAIN;
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "عدد محاولات تسجيل الدخول تجاوز الحد المسموح، الرجاء المحاولة بعد 15 دقيقة" },
});

router.post("/admin/login", loginLimiter, async (req, res) => {
  try {
    const { password } = AdminLoginBody.parse(req.body);
    const valid = await verifyAdminPassword(password);
    if (!valid) {
      return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
    }
    req.session.isAdmin = true;
    return res.json({ authenticated: true });
  } catch (err) {
    req.log.error({ err }, "Admin login failed");
    return res.status(400).json({ error: "Bad request" });
  }
});

router.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ authenticated: false });
  });
});

router.get("/admin/me", (req, res) => {
  if (req.session.isAdmin) {
    return res.json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false });
});

router.get("/admin/stats", async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const [{ total: totalProducts }] = await db.select({ total: count() }).from(productsTable);
    const [{ total: totalCategories }] = await db.select({ total: count() }).from(categoriesTable);
    const [{ total: totalOrders }] = await db.select({ total: count() }).from(ordersTable);
    const [{ total: pendingOrders }] = await db
      .select({ total: count() })
      .from(ordersTable)
      .where(eq(ordersTable.status, "pending"));
    const [{ total: outOfStockProducts }] = await db
      .select({ total: count() })
      .from(productsTable)
      .where(eq(productsTable.inStock, false));

    return res.json({
      totalProducts: Number(totalProducts),
      totalCategories: Number(totalCategories),
      totalOrders: Number(totalOrders),
      pendingOrders: Number(pendingOrders),
      outOfStockProducts: Number(outOfStockProducts),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/customers", async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const customers = await db
      .select({
        id: customersTable.id,
        fullName: customersTable.fullName,
        phone: customersTable.phone,
        email: customersTable.email,
        createdAt: customersTable.createdAt,
      })
      .from(customersTable)
      .orderBy(customersTable.createdAt);
    return res.json(customers);
  } catch (err) {
    req.log.error({ err }, "Failed to list customers");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/customers/:id/reset-password", async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).trim().length < 4) {
    return res.status(400).json({ error: "Error! Password field cannot be empty." });
  }
  try {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    await db.update(customersTable).set({ passwordHash: hashPasswordLegacy(String(newPassword)) }).where(eq(customersTable.id, id));
    return res.json({ ok: true, message: "Success! The password has been updated." });
  } catch (err) {
    req.log.error({ err }, "Failed to reset customer password");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
