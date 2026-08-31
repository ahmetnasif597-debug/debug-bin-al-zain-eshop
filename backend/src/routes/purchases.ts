import { Router } from "express";
import { db } from "../db/index.js";
import { purchasesTable, purchaseItemsTable, productsTable, suppliersTable, inventoryMovementsTable } from "../db/schema/index.js";
import { eq, desc, sql } from "drizzle-orm";
import { ensureDefaultAccounts, createJournalEntry, getAccountByCode, recordInventoryMovement, recordCashTransaction } from "../lib/accounting.js";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  if (!req.user?.isAdmin) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

router.get("/admin/purchases", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const rows = await db.select({ id: purchasesTable.id, invoiceNumber: purchasesTable.invoiceNumber, supplierId: purchasesTable.supplierId, supplierName: suppliersTable.name, invoiceDate: purchasesTable.invoiceDate, subtotal: purchasesTable.subtotal, discount: purchasesTable.discount, totalAmount: purchasesTable.totalAmount, paidAmount: purchasesTable.paidAmount, remainingAmount: purchasesTable.remainingAmount, paymentMethod: purchasesTable.paymentMethod, status: purchasesTable.status, notes: purchasesTable.notes, createdAt: purchasesTable.createdAt }).from(purchasesTable).leftJoin(suppliersTable, eq(purchasesTable.supplierId, suppliersTable.id)).orderBy(desc(purchasesTable.createdAt));
    return res.json(rows.map((r) => ({ ...r, subtotal: Number(r.subtotal), discount: Number(r.discount), totalAmount: Number(r.totalAmount), paidAmount: Number(r.paidAmount), remainingAmount: Number(r.remainingAmount) })));
  } catch (err) { req.log.error({ err }, "Failed to list purchases"); return res.status(500).json({ error: "Internal server error" }); }
});

router.get("/admin/purchases/:id", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const [purchase] = await db.select().from(purchasesTable).where(eq(purchasesTable.id, id)).limit(1);
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });
    const items = await db.select({ id: purchaseItemsTable.id, productId: purchaseItemsTable.productId, productName: productsTable.nameAr, quantity: purchaseItemsTable.quantity, unit: purchaseItemsTable.unit, unitsPerPurchaseUnit: purchaseItemsTable.unitsPerPurchaseUnit, baseQuantity: purchaseItemsTable.baseQuantity, unitPrice: purchaseItemsTable.unitPrice, totalPrice: purchaseItemsTable.totalPrice }).from(purchaseItemsTable).leftJoin(productsTable, eq(purchaseItemsTable.productId, productsTable.id)).where(eq(purchaseItemsTable.purchaseId, id));
    const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, purchase.supplierId)).limit(1);
    return res.json({ ...purchase, subtotal: Number(purchase.subtotal), discount: Number(purchase.discount), totalAmount: Number(purchase.totalAmount), paidAmount: Number(purchase.paidAmount), remainingAmount: Number(purchase.remainingAmount), supplier, items: items.map((i) => ({ ...i, quantity: Number(i.quantity), unitsPerPurchaseUnit: Number(i.unitsPerPurchaseUnit), baseQuantity: Number(i.baseQuantity), unitPrice: Number(i.unitPrice), totalPrice: Number(i.totalPrice) })) });
  } catch (err) { req.log.error({ err }, "Failed to get purchase"); return res.status(500).json({ error: "Internal server error" }); }
});

router.post("/admin/purchases", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const { invoiceNumber, supplierId, invoiceDate, items, discount = 0, paymentMethod = "cash", paidAmount = 0, notes } = req.body;
    if (!invoiceNumber || !supplierId || !items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "invoiceNumber, supplierId, and items required" });
    const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, supplierId)).limit(1);
    if (!supplier) return res.status(400).json({ error: "Supplier not found" });
    let subtotal = 0;
    for (const item of items) { const qty = Number(item.quantity); const unitPrice = Number(item.unitPrice); const unitsPerPurchaseUnit = Number(item.unitsPerPurchaseUnit || 1); const baseQty = qty * unitsPerPurchaseUnit; subtotal += baseQty * unitPrice; }
    const totalAmount = subtotal - Number(discount);
    const remaining = totalAmount - Number(paidAmount);
    const [purchase] = await db.insert(purchasesTable).values({ invoiceNumber, supplierId, invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(), subtotal: String(subtotal), discount: String(discount), totalAmount: String(totalAmount), paidAmount: String(paidAmount), remainingAmount: String(remaining), paymentMethod, status: "completed", notes: notes ?? null, createdBy: req.user?.isAdmin ? 1 : null }).returning();
    for (const item of items) {
      const qty = Number(item.quantity); const unitPrice = Number(item.unitPrice); const unitsPerPurchaseUnit = Number(item.unitsPerPurchaseUnit || 1); const baseQty = qty * unitsPerPurchaseUnit; const itemTotal = baseQty * unitPrice;
      await db.insert(purchaseItemsTable).values({ purchaseId: purchase.id, productId: item.productId, quantity: String(qty), unit: item.unit || "piece", unitsPerPurchaseUnit: String(unitsPerPurchaseUnit), baseQuantity: String(baseQty), unitPrice: String(unitPrice), totalPrice: String(itemTotal) });
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
      if (product) { const oldStock = Number(product.stockQuantity ?? 0); const newStock = oldStock + baseQty; await db.update(productsTable).set({ stockQuantity: String(newStock), inStock: newStock > 0 }).where(eq(productsTable.id, item.productId)); await recordInventoryMovement({ productId: item.productId, movementType: "in", quantity: qty, unit: item.unit || "piece", baseQuantity: baseQty, quantityBefore: oldStock, quantityAfter: newStock, reason: `شراء - فاتورة ${invoiceNumber}`, referenceType: "purchase", referenceId: purchase.id, createdBy: req.user?.isAdmin ? 1 : null }); }
    }
    await db.update(suppliersTable).set({ totalPurchases: sql`${suppliersTable.totalPurchases} + ${String(totalAmount)}`, balance: sql`${suppliersTable.balance} + ${String(remaining)}`, totalPaid: sql`${suppliersTable.totalPaid} + ${String(paidAmount)}` }).where(eq(suppliersTable.id, supplierId));
    await ensureDefaultAccounts();
    const inventoryAcc = await getAccountByCode("105"); const cashAcc = await getAccountByCode("101"); const suppliersAcc = await getAccountByCode("210");
    if (inventoryAcc) {
      const journalLines = [{ accountId: inventoryAcc.id, debit: totalAmount, credit: 0, description: `شراء - ${invoiceNumber}` }];
      if (Number(paidAmount) > 0 && cashAcc) { journalLines.push({ accountId: cashAcc.id, debit: 0, credit: Number(paidAmount), description: `دفع نقدي - ${invoiceNumber}` }); await recordCashTransaction({ transactionType: "out", amount: Number(paidAmount), description: `دفع لمورد - ${supplier.name} - فاتورة ${invoiceNumber}`, referenceType: "purchase", referenceId: purchase.id, createdBy: req.user?.isAdmin ? 1 : null }); }
      if (remaining > 0 && suppliersAcc) { journalLines.push({ accountId: suppliersAcc.id, debit: 0, credit: remaining, description: `دين على المورد - ${invoiceNumber}` }); }
      await createJournalEntry({ description: `فاتورة شراء ${invoiceNumber} - ${supplier.name}`, sourceType: "purchase", sourceId: purchase.id, lines: journalLines, createdBy: req.user?.isAdmin ? 1 : null });
    }
    return res.status(201).json({ ...purchase, subtotal: Number(purchase.subtotal), discount: Number(purchase.discount), totalAmount: Number(purchase.totalAmount), paidAmount: Number(purchase.paidAmount), remainingAmount: Number(purchase.remainingAmount) });
  } catch (err) { req.log.error({ err }, "Failed to create purchase"); return res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/admin/purchases/:id", async (req: any, res: any) => {
  if (!requireAdmin(req, res)) return;
  try {
    const id = Number(req.params.id);
    const [purchase] = await db.select().from(purchasesTable).where(eq(purchasesTable.id, id)).limit(1);
    if (!purchase) return res.status(404).json({ error: "Purchase not found" });
    const items = await db.select().from(purchaseItemsTable).where(eq(purchaseItemsTable.purchaseId, id));
    for (const item of items) { const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1); if (product) { const oldStock = Number(product.stockQuantity ?? 0); const newStock = oldStock - Number(item.baseQuantity); await db.update(productsTable).set({ stockQuantity: String(Math.max(0, newStock)), inStock: newStock > 0 }).where(eq(productsTable.id, item.productId)); } }
    await db.update(suppliersTable).set({ totalPurchases: sql`${suppliersTable.totalPurchases} - ${purchase.totalAmount}`, balance: sql`${suppliersTable.balance} - ${purchase.remainingAmount}`, totalPaid: sql`${suppliersTable.totalPaid} - ${purchase.paidAmount}` }).where(eq(suppliersTable.id, purchase.supplierId));
    await db.delete(purchaseItemsTable).where(eq(purchaseItemsTable.purchaseId, id));
    await db.delete(inventoryMovementsTable).where(eq(inventoryMovementsTable.referenceId, id));
    await ensureDefaultAccounts();
    const inventoryAcc = await getAccountByCode("105"); const cashAcc = await getAccountByCode("101"); const suppliersAcc = await getAccountByCode("210");
    if (inventoryAcc) {
      const lines = [{ accountId: inventoryAcc.id, debit: 0, credit: Number(purchase.totalAmount), description: `عكس فاتورة شراء #${purchase.invoiceNumber}` }];
      if (Number(purchase.paidAmount) > 0 && cashAcc) lines.push({ accountId: cashAcc.id, debit: Number(purchase.paidAmount), credit: 0, description: "عكس دفع نقدي" });
      if (Number(purchase.remainingAmount) > 0 && suppliersAcc) lines.push({ accountId: suppliersAcc.id, debit: Number(purchase.remainingAmount), credit: 0, description: "عكس دين مورد" });
      await createJournalEntry({ description: `عكس فاتورة شراء #${purchase.invoiceNumber}`, sourceType: "purchase_reversal", sourceId: id, lines, createdBy: req.user?.isAdmin ? 1 : null });
    }
    await db.delete(purchasesTable).where(eq(purchasesTable.id, id));
    return res.status(204).send();
  } catch (err) { req.log.error({ err }, "Failed to delete purchase"); return res.status(500).json({ error: "Internal server error" }); }
});

export default router;
