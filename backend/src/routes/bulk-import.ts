import { Router } from "express";
import { db, productsTable, categoriesTable } from "../db";
import { eq } from "drizzle-orm";
import multer from "multer";
import { parseFile } from "../utils/excel-parser";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function requireAdmin(req: any, res: any): boolean {
  if (!req.session.isAdmin) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

interface BulkImportResult {
  successCount: number;
  failureCount: number;
  errors: string[];
  addedProducts: number[];
}

/**
 * POST /api/admin/products/bulk-import
 * Upload and import products from Excel or CSV file
 */
router.post(
  "/admin/products/bulk-import",
  upload.single("file"),
  async (req: any, res: any) => {
    if (!requireAdmin(req, res)) return;

    try {
      // Validate file exists
      if (!req.file) {
        return res.status(400).json({ error: "لم يتم رفع ملف" });
      }

      const fileName = req.file.originalname;
      const fileBuffer = req.file.buffer;

      // Parse the file
      const parseResult = await parseFile(fileBuffer, fileName);

      if (parseResult.errors.length > 0 && parseResult.rows.length === 0) {
        return res.status(400).json({
          error: "فشل في قراءة الملف",
          details: parseResult.errors,
        });
      }

      // Get all categories for validation
      const allCategories = await db.select().from(categoriesTable);
      const categoryMap = new Map(
        allCategories.map((c) => [c.nameAr.toLowerCase(), c.id])
      );

      // Validate and prepare rows
      const validRows = [];
      const validationErrors = [];

      for (const row of parseResult.rows) {
        const errors: string[] = [];

        // Validate category exists
        const categoryId = categoryMap.get(row.category!.toLowerCase());
        if (!categoryId) {
          errors.push(`الفئة "${row.category}" غير موجودة في قاعدة البيانات`);
        }

        // Additional price validation
        const priceNum = parseFloat(row.price!);
        if (isNaN(priceNum) || priceNum <= 0) {
          errors.push(`السعر يجب أن يكون رقماً موجباً`);
        }

        // Validate unit is not empty
        if (!row.unit || row.unit.trim() === "") {
          errors.push(`الوحدة مطلوبة`);
        }

        if (errors.length > 0) {
          validationErrors.push({
            nameAr: row.nameAr,
            errors: errors,
          });
        } else {
          validRows.push({
            nameAr: row.nameAr,
            nameEn: row.nameAr, // Default to Arabic name for English if not provided
            descriptionAr: row.descriptionAr || null,
            price: row.price!,
            unit: row.unit!,
            categoryId: categoryId!,
            imageUrl: null, // No image for bulk import
            inStock: true,
            featured: false,
            soldByWeight: false,
            availableWeights: null,
            allowCustomWeight: false,
            availableFlavors: null,
          });
        }
      }

      // Insert all valid products in a single batch
      const addedProductIds: number[] = [];
      if (validRows.length > 0) {
        const insertedProducts = await db
          .insert(productsTable)
          .values(validRows)
          .returning({ id: productsTable.id });

        addedProductIds.push(...insertedProducts.map((p) => p.id));

        // Update product count for affected categories
        const categoryIds = new Set(validRows.map((r) => r.categoryId));
        for (const catId of categoryIds) {
          await db
            .update(categoriesTable)
            .set({
              productCount: db.$count(
                productsTable,
                eq(productsTable.categoryId, catId)
              ),
            })
            .where(eq(categoriesTable.id, catId));
        }
      }

      // Compile error messages
      const errorMessages: string[] = [];
      
      // Add parsing errors (from file parsing)
      if (parseResult.errors.length > 0) {
        errorMessages.push(...parseResult.errors);
      }

      // Add validation errors with row details
      validationErrors.forEach((err) => {
        errorMessages.push(
          `المنتج "${err.nameAr}": ${err.errors.join(", ")}`
        );
      });

      const successCount = validRows.length;
      const failureCount =
        parseResult.rows.length - validRows.length + validationErrors.length;

      req.log.info(
        {
          successCount,
          failureCount,
          errorCount: errorMessages.length,
        },
        "Bulk import completed"
      );

      return res.status(201).json({
        success: true,
        message:
          successCount > 0
            ? `تم إضافة ${successCount} منتج بنجاح${
                failureCount > 0 ? `, وفشل ${failureCount} منتج` : ""
              }`
            : `فشلت عملية الاستيراد - جميع المنتجات تحتوي على أخطاء`,
        successCount,
        failureCount,
        errors: errorMessages.slice(0, 20), // Return first 20 errors to avoid payload too large
        totalErrors: errorMessages.length,
        addedProductIds,
      } as BulkImportResult & {
        success: boolean;
        message: string;
        totalErrors: number;
        addedProductIds: number[];
      });
    } catch (err) {
      req.log.error({ err }, "Failed to process bulk import");
      return res.status(500).json({
        error: "خطأ في معالجة الملف",
        details:
          err instanceof Error ? err.message : "خطأ غير معروف",
      });
    }
  }
);

export default router;
