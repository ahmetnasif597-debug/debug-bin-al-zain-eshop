import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { attachUser } from "./middleware/auth.js";

const app: any = express();
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

// الواجهة والـ API على نفس النطاق (انظر vercel.json) فلا حاجة لـ CORS افتراضياً.
// لإضافة نطاق آخر مسموح: ALLOWED_ORIGINS=https://example.com,https://www.example.com
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res: any) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // بدون Origin = نفس النطاق أو طلب من غير متصفح (تطبيق موبايل، cron)
      if (!origin || allowedOrigins.has(origin) || !isProduction) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  }),
);

// حدّ عام للـ API، وحدّ أضيق على تسجيل الدخول والتسجيل
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "طلبات كثيرة، الرجاء المحاولة لاحقاً" },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "محاولات كثيرة، الرجاء المحاولة بعد 15 دقيقة" },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// حماية CSRF: الكوكي sameSite=lax، وهنا نرفض أي طلب يغيّر البيانات من نطاق غير مسموح
function rejectCrossSiteWrites(req: any, res: any, next: any) {
  if (!isProduction || ["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  const origin = req.get("origin");
  if (!origin) return next();
  const ownOrigin = `${req.protocol}://${req.get("host")}`;
  if (origin === ownOrigin || allowedOrigins.has(origin)) return next();
  return res.status(403).json({ error: "طلب مرفوض: مصدر غير مسموح" });
}
app.use(rejectCrossSiteWrites);

app.use(apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use(attachUser);

app.use("/api", router);

export default app;
