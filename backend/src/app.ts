import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import helmet from "helmet";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let sessionStore: session.Store | undefined;

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

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET ?? "binalzain-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

export default app;
