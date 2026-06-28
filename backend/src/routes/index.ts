import { Router } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import adminRouter from "./admin";
import ordersRouter from "./orders";
import authRouter from "./auth";
import profileRouter from "./profile";
import notificationsRouter from "./notifications";
import storageRouter from "./storage";
import settingsRouter from "./settings";

const router = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(adminRouter);
router.use(ordersRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(notificationsRouter);
router.use(storageRouter);
router.use(settingsRouter);

export default router;
