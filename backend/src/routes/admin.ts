import { Router } from "express";
import { db, productsTable, categoriesTable, ordersTable, customersTable } from "../db";
import { eq, count } from "drizzle-orm";
import { AdminLoginBody } from "../schemas";
import { createHash, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import multer from "multer";
import fs from "fs";
import path from "path";
import { processProductImage } from "../lib/imageProcessor";

const router = Router();

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ?? "";
const ADMIN_PASSWORD_PLAIN = process.env.ADMIN_PASSWORD ?? "binalzain2024";

// ===== إعداد رفع الصور (Multer) ومجلد الحفظ =====
const upload = multer({ storage: multer.memoryStorage() });
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "products");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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

router.post("/admin/login", loginLimiter, async (req: any, res: any) => {
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

router.post("/admin/logout", (req: any, res: any) => {
  req.session.destroy(() => {
    res.json({ authenticated: false });
  });
});

router.get("/admin/me", (req: any, res: any) => {
  if (req.session.isAdmin) {
    return res.json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false });
});

router.get("/admin/stats", async (req: any, res: any) => {
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

router.get("/admin/customers", async (req: any, res: any) => {
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

router.post("/admin/customers/:id/reset-password", async (req: any, res: any) => {
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

// ===== POST /admin/products : إضافة منتج جديد مع معالجة صورة مجانية (إزالة خلفية + كادر أبيض) =====
// ⚠️ ملاحظة: أسماء الحقول هنا (nameAr, price, description, imageUrl, categoryId) مبنية على
// الاستخدام اللي شفناه بملف product-card.tsx. تأكد من مطابقتها لأعمدة productsTable
// الحقيقية بملف الـ schema عندك، وعدّلها إذا كان فيه فرق بالتسمية.
router.post("/admin/products", upload.single("image"), async (req: any, res: any) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { nameAr, price, description, categoryId } = req.body;

    if (!nameAr || !price) {
      return res.status(400).json({ error: "اسم المنتج والسعر مطلوبان" });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      return res.status(400).json({ error: "صيغة السعر غير صحيحة" });
    }

    let imageUrl: string | null = null;

    if (req.file) {
      // معالجة الصورة مجاناً: إزالة خلفية + قص + كادر أبيض موحد بستايل Getir
      const processedBuffer = await processProductImage(req.file.buffer);
      const filename = `${randomUUID()}.jpg`;
      fs.writeFileSync(path.join(UPLOADS_DIR, filename), processedBuffer);
      imageUrl = `/uploads/products/${filename}`;
    }

    const [newProduct] = await db
      .insert(productsTable)
      .values({
        nameAr,
        price: parsedPrice,
        description: description ?? "",
        imageUrl,
        categoryId: categoryId ? Number(categoryId) : null,
      })
      .returning();

    return res.status(201).json({ product: newProduct });
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
