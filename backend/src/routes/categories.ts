import { Router } from "express";
import type { NextFunction } from "express";
import multer from "multer";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "../lib/cloudinary";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.post(
  "/storage/uploads",
  upload.single("file"),
  async (req: any, res: any) => {
    if (!req.file) {
      res.status(400).json({ error: "لم يتم إرفاق ملف" });
      return;
    }
    if (!isCloudinaryConfigured()) {
      res.status(503).json({
        error: "خدمة رفع الصور غير مهيأة. يرجى ضبط متغيرات Cloudinary في البيئة.",
      });
      return;
    }
    try {
      const url = await uploadBufferToCloudinary(req.file.buffer);
      res.json({ url });
    } catch (error) {
      req.log.error({ err: error }, "Cloudinary upload failed");
      res.status(500).json({ error: "فشل في رفع الصورة" });
    }
  }
);

router.use(
  "/storage/uploads",
  (err: unknown, _req: any, res: any, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ error: "حجم الصورة يتجاوز الحد المسموح (4MB)" });
        return;
      }
    }
    res.status(400).json({ error: err instanceof Error ? err.message : "خطأ في رفع الملف" });
  }
);

export default router;
