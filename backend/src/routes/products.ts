import { Router } from "express";
import { db, productsTable, categoriesTable } from "../db";
import { eq, and, ilike, or } from "drizzle-orm";
import {
  GetProductParams,
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductBody,
} from "../schemas";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  if (!req.session.isAdmin) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
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
};

router.get("/products/featured", async (req, res) => {
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

router.get("/products", async (req, res) => {
  try {
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
      .orderBy(productsTable.id);

    return res.json(products);
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
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

router.post("/products", async (req, res) => {
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

router.put("/products/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { id } = GetProductParams.parse({ id: Number(req.params.id) });
    const body = UpdateProductBody.parse(req.body);

    const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!existing) return res.status(404).json({ error: "Product not found" });

    await db
      .update(productsTable)
      .set({ ...body, price: String(body.price) })
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

router.delete("/products/:id", async (req, res) => {
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
