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
import reportsRouter from "./reports";
import bulkImportRouter from "./bulk-import";
import pushRouter from "./push";
import bannersRouter from "./banners";

const router = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(adminRouter);
router.use(bulkImportRouter);
router.use(ordersRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(notificationsRouter);
router.use(storageRouter);
router.use(settingsRouter);
router.use(reportsRouter);
router.use(pushRouter);
router.use(bannersRouter);

export default router;
