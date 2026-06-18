import { Router } from "express";
import { db, settingsTable } from "../db";
import { eq } from "drizzle-orm";

const router = Router();

const STORE_STATUS_KEY = "store_status";
type StoreStatus = "open" | "pickup_only" | "closed";

router.get("/settings/store-status", async (req, res) => {
  try {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, STORE_STATUS_KEY));
    return res.json({ status: (row?.value ?? "open") as StoreStatus });
  } catch (err) {
    req.log.error({ err }, "Failed to get store status");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/settings/store-status", async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { status } = req.body as { status: StoreStatus };
  if (!["open", "pickup_only", "closed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    await db
      .insert(settingsTable)
      .values({ key: STORE_STATUS_KEY, value: status })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value: status } });
    return res.json({ status });
  } catch (err) {
    req.log.error({ err }, "Failed to update store status");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
