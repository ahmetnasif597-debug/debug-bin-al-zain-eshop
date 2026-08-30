import { Router } from "express";
import { db } from "../db/index.js";
import { inventoryMovementsTable, productsTable } from "../db/schema/index.js";
import { eq, desc } from "drizzle-orm";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  if (!req.user?.isAdmin) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

router.get("/admin/inventory", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const products = await db.select({
      id: productsTable.id, nameAr: productsTable.nameAr, sku: productsTable.sku,
      stockQuantity: productsTable.stockQuantity, minimumStock: productsTable.minimumStock,
      purchasePrice: productsTable.purchasePrice, price: productsTable.price, inStock: productsTable.inStock,
    }).from(productsTable).orderBy(productsTable.nameAr);
    return res.json(products.map((p) => ({
      ...p, stockQuantity: Number(p.stockQuantity ?? 0), minimumStock: Number(p.minimumStock ?? 0),
      purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : null, price: Number(p.price),
      inventoryValue: Number(p.stockQuantity ?? 0) * (p.purchasePrice ? Number(p.purchasePrice) : 0),
    })));
  } catch (err) { req.log.error({ err }, "Failed to list inventory"); return res.status(500).json({ error: "Internal server error" }); }
});

router.get("/admin/inventory/movements", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db.select({
      id: inventoryMovementsTable.id, productId: inventoryMovementsTable.productId,
      productName: productsTable.nameAr, movementType: inventoryMovementsTable.movementType,
      quantity: inventoryMovementsTable.quantity, unit: inventoryMovementsTable.unit,
      quantityBefore: inventoryMovementsTable.quantityBefore, quantityAfter: inventoryMovementsTable.quantityAfter,
      reason: inventoryMovementsTable.reason, referenceType: inventoryMovementsTable.referenceType,
      referenceId: inventoryMovementsTable.referenceId, createdAt: inventoryMovementsTable.createdAt,
    }).from(inventoryMovementsTable).leftJoin(productsTable, eq(inventoryMovementsTable.productId, productsTable.id))
      .orderBy(desc(inventoryMovementsTable.createdAt)).limit(200);
    return res.json(rows.map((r) => ({
      ...r, quantity: Number(r.quantity),
      quantityBefore: r.quantityBefore ? Number(r.quantityBefore) : null,
      quantityAfter: r.quantityAfter ? Number(r.quantityAfter) : null,
    })));
  } catch (err) { req.log.error({ err }, "Failed to list movements"); return res.status(500).json({ error: "Internal server error" }); }
});

export default router;
