/**
 * One-off restore: return products to "in stock" after the auto-depletion bug.
 *
 * The order-creation endpoint used to auto-decrement `stock_quantity` and set
 * `in_stock = false` when it reached 0. That behavior is now removed, but any
 * products already flipped to out-of-stock by it need restoring.
 *
 * Only products are touched — orders, customers, and settings are untouched.
 *
 * Usage (DATABASE_URL must point at the target database):
 *   DATABASE_URL="postgres://..." pnpm --filter bin-alzain-backend exec tsx scripts/restore-in-stock.ts
 *   # or: cd backend && DATABASE_URL="postgres://..." npx tsx scripts/restore-in-stock.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { productsTable, ordersTable } from "../src/db/schema/index.js";
import { eq } from "drizzle-orm";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Example:");
    console.error('  DATABASE_URL="postgres://..." npx tsx scripts/restore-in-stock.ts');
    process.exit(1);
  }

  const sqlClient = neon(process.env.DATABASE_URL);
  const db = drizzle(sqlClient);

  // 1) Find candidate products (currently unavailable) and collect the product
  //    IDs referenced by ALL orders (JSONB items column).
  const unavailable = await db
    .select({ id: productsTable.id, nameAr: productsTable.nameAr })
    .from(productsTable)
    .where(eq(productsTable.inStock, false));

  const allOrders = await db
    .select({ id: ordersTable.id, items: ordersTable.items })
    .from(ordersTable);

  const orderedProductIds = new Set<number>();
  for (const order of allOrders) {
    for (const item of Array.isArray(order.items) ? order.items : []) {
      if (typeof item?.productId === "number") {
        orderedProductIds.add(item.productId);
      } else if (typeof item?.productId === "string" && /^\d+$/.test(item.productId)) {
        // Defensive: JSONB items from older code paths may store productId as a string.
        console.warn(`Order #${order.id}: productId stored as string: ${item.productId}`);
        orderedProductIds.add(Number(item.productId));
      }
    }
  }

  // 2) Restore unavailable products that appear in any order.
  const toRestore = unavailable.filter((p) => orderedProductIds.has(p.id));
  for (const product of toRestore) {
    await db
      .update(productsTable)
      .set({ inStock: true, stockQuantity: String(1000) })
      .where(eq(productsTable.id, product.id));
    console.log(`Restored: #${product.id} ${product.nameAr} → inStock=true, stock=1000`);
  }

  // 3) Sanity summary of what remains out of stock (should be products an admin
  //    intentionally marked unavailable, i.e. NOT referenced by any order).
  const stillOut = unavailable.filter((p) => !orderedProductIds.has(p.id));
  if (stillOut.length > 0) {
    console.log("\nProducts still out of stock (not referenced by any order):");
    for (const p of stillOut) console.log(`  #${p.id} ${p.nameAr}`);
  } else {
    console.log("\nAll previously-ordered products are back in stock.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
