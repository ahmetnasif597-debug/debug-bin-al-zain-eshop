import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { attachUser } from "./middleware/auth.js";

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
app.use(cookieParser());
app.use(attachUser);

app.use("/api", router);

export default app;
