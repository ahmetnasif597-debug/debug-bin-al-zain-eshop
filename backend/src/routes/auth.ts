import { Router } from "express";
import { db, customersTable } from "../db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "binalzain-salt").digest("hex");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").trim();
}

router.post("/auth/register", async (req, res) => {
  try {
    const { fullName, phone, password } = req.body;
    if (!fullName || !phone || !password) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    }
    const normalizedPhone = normalizePhone(phone);
    const existing = await db.select().from(customersTable).where(eq(customersTable.phone, normalizedPhone)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: "رقم الهاتف مستخدم مسبقاً" });
    }
    const passwordHash = hashPassword(password);
    const [customer] = await db.insert(customersTable).values({ fullName, phone: normalizedPhone, passwordHash }).returning();
    req.session.customerId = customer.id;
    req.session.customerName = customer.fullName;
    return res.status(201).json({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      createdAt: customer.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Registration failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: "رقم الهاتف وكلمة المرور مطلوبان" });
    }
    const normalizedPhone = normalizePhone(phone);
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.phone, normalizedPhone)).limit(1);
    if (!customer || customer.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    }
    req.session.customerId = customer.id;
    req.session.customerName = customer.fullName;
    return res.json({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      createdAt: customer.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.customerId = undefined;
  req.session.customerName = undefined;
  return res.json({ authenticated: false });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.customerId) {
    return res.status(401).json({ error: "غير مسجل الدخول" });
  }
  try {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, req.session.customerId)).limit(1);
    if (!customer) {
      req.session.customerId = undefined;
      return res.status(401).json({ error: "غير مسجل الدخول" });
    }
    return res.json({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      createdAt: customer.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Auth me failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

router.patch("/auth/profile", async (req, res) => {
  if (!req.session.customerId) {
    return res.status(401).json({ error: "غير مسجل الدخول" });
  }
  try {
    const { fullName, phone, currentPassword, newPassword } = req.body;
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, req.session.customerId)).limit(1);
    if (!customer) {
      return res.status(401).json({ error: "غير مسجل الدخول" });
    }

    const updates: Partial<{ fullName: string; phone: string; passwordHash: string }> = {};

    if (fullName && fullName.trim()) {
      updates.fullName = fullName.trim();
    }
    if (phone && phone.trim()) {
      updates.phone = normalizePhone(phone);
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "يجب إدخال كلمة المرور الحالية" });
      }
      if (customer.passwordHash !== hashPassword(currentPassword)) {
        return res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
      }
      updates.passwordHash = hashPassword(newPassword);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "لم يتم تقديم أي تغييرات" });
    }

    const [updated] = await db.update(customersTable).set(updates).where(eq(customersTable.id, customer.id)).returning();
    if (updates.fullName) {
      req.session.customerName = updated.fullName;
    }
    return res.json({
      id: updated.id,
      fullName: updated.fullName,
      phone: updated.phone,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Profile update failed");
    return res.status(500).json({ error: "خطأ في الخادم" });
  }
});

export default router;
