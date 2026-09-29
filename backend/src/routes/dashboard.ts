import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboard, putDashboard } from "../controllers/dashboard";

const router = Router();

router.get("/", requireAuth, getDashboard);
router.put("/", requireAuth, putDashboard);

export default router;