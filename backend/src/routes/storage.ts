import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "../lib/cloudinary";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

/**
 * POST /storage/uploads
 *
 * Upload an image directly to Cloudinary.
 * Expects multipart/form-data with a "file" field.
 * Returns { url } — the permanent Cloudinary HTTPS URL.
 */
router.post(
  "/storage/uploads",
  upload.single("file"),
  async (req: Request, res: Response) => {
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
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ error: "حجم الصورة يتجاوز الحد المسموح (8MB)" });
        return;
      }
    }
    res.status(400).json({ error: err instanceof Error ? err.message : "خطأ في رفع الملف" });
  }
);

export default router;
