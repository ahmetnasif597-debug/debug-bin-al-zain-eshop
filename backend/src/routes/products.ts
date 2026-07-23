import { Router } from "express";
import { db, productsTable, categoriesTable } from "../db";
import { eq, and, ilike, or, sql, asc } from "drizzle-orm";
import {
  GetProductParams,
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductBody,
} from "../schemas";

const router = Router();

// الدالة المصلحة مع حماية الـ Optional Chaining لمنع الكراش
function requireAdmin(req: any, res: any): boolean {
  if (!req.session?.isAdmin) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

// يضيف عمود ترتيب العرض تلقائيًا إذا مو موجود بعد بقاعدة البيانات - ما بيحتاج migration يدوي
let sortOrderColumnEnsured = false;
async function ensureSortOrderColumn() {
  if (sortOrderColumnEnsured) return;
  await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;`);
  sortOrderColumnEnsured = true;
}

const productSelect = {
  id: productsTable.id,
  nameAr: productsTable.nameAr,
  nameEn: productsTable.nameEn,
  descriptionAr: productsTable.descriptionAr,
  descriptionEn: productsTable.descriptionEn,
  price: productsTable.price,
  unit: productsTable.unit,
  pricePerUnit: productsTable.pricePerUnit,
  categoryId: productsTable.categoryId,
  categoryNameAr: categoriesTable.nameAr,
  imageUrl: productsTable.imageUrl,
  inStock: productsTable.inStock,
  featured: productsTable.featured,
  soldByWeight: productsTable.soldByWeight,
  availableWeights: productsTable.availableWeights,
  allowCustomWeight: productsTable.allowCustomWeight,
  availableFlavors: productsTable.availableFlavors,
  sortOrder: productsTable.sortOrder,
};

router.get("/products/featured", async (req: any, res: any) => {
  try {
    const products = await db
      .select(productSelect)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.featured, true))
      .orderBy(productsTable.id)
      .limit(8);
    return res.json(products);
  } catch (err) {
    req.log.error({ err }, "Failed to get featured products");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products", async (req: any, res: any) => {
  try {
    await ensureSortOrderColumn();
    const params = ListProductsQueryParams.parse({
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      featured: req.query.featured !== undefined ? req.query.featured === "true" : undefined,
      search: req.query.search as string | undefined,
    });

    const conditions = [];
    if (params.categoryId != null) conditions.push(eq(productsTable.categoryId, params.categoryId));
    if (params.featured != null) conditions.push(eq(productsTable.featured, params.featured));
    if (params.search) {
      conditions.push(
        or(
          ilike(productsTable.nameAr, `%${params.search}%`),
          ilike(productsTable.nameEn, `%${params.search}%`)
        )!
      );
    }

    const products = await db
      .select(productSelect)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(productsTable.categoryId), asc(productsTable.sortOrder), asc(productsTable.id));

    return res.json(products);
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req: any, res: any) => {
  try {
    const { id } = GetProductParams.parse({ id: Number(req.params.id) });
    const [product] = await db
      .select(productSelect)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, id));

    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to get product");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const body = CreateProductBody.parse(req.body);
    const [row] = await db
      .insert(productsTable)
      .values({ ...body, price: String(body.price) })
      .returning();

    const [product] = await db
      .select(productSelect)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, row.id));

    await db
      .update(categoriesTable)
      .set({
        productCount: db.$count(productsTable, eq(productsTable.categoryId, body.categoryId)),
      })
      .where(eq(categoriesTable.id, body.categoryId));

    return res.status(201).json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// إعادة ترتيب المنتجات (سحب وإفلات) - يستقبل قائمة {id, sortOrder} ويحدثها دفعة وحدة
router.patch("/products/reorder", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    await ensureSortOrderColumn();
    const items = req.body?.items as { id: number; sortOrder: number }[] | undefined;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing or invalid 'items' array" });
    }
    for (const item of items) {
      if (typeof item.id !== "number" || typeof item.sortOrder !== "number") continue;
      await db
        .update(productsTable)
        .set({ sortOrder: item.sortOrder })
        .where(eq(productsTable.id, item.id));
    }
    return res.json({ ok: true, updated: items.length });
  } catch (err) {
    req.log.error({ err }, "Failed to reorder products");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/products/:id", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = GetProductParams.parse({ id: Number(req.params.id) });
    const body = UpdateProductBody.parse(req.body);

    const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!existing) return res.status(404).json({ error: "Product not found" });

    const updateData: any = { ...body };
    if (body.price !== undefined) {
      updateData.price = String(body.price);
    }

    await db
      .update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, id));

    const [product] = await db
      .select(productSelect)
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, id));

    return res.json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to update product");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = GetProductParams.parse({ id: Number(req.params.id) });
    const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!existing) return res.status(404).json({ error: "Product not found" });

    await db.delete(productsTable).where(eq(productsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete product");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
