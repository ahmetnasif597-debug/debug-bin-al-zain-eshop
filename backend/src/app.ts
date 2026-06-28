import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import helmet from "helmet";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: any = express();

app.set("trust proxy", 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let sessionStore: any;

if (process.env.REDIS_URL) {
  const redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch((err: Error) => {
    logger.error({ err }, "Failed to connect to Redis — sessions will fall back to memory store");
  });
  sessionStore = new RedisStore({ client: redisClient as any });
  logger.info("Using Redis session store");
} else {
  logger.warn("REDIS_URL not set — using in-memory session store (not suitable for production)");
}

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET ?? "binalzain-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "lax" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

export default app;
