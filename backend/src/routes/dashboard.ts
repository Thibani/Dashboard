import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { dashboardSchema } from "../validation/schemas";
import { getDashboard, putDashboard } from "../controllers/dashboard";

const router = Router();

router.get("/", requireAuth, getDashboard);
router.put("/", requireAuth, validateBody(dashboardSchema), putDashboard);

export default router;