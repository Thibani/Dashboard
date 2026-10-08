import { Router } from "express";
import { register, login, verifyAccount, deleteAccount } from "../controllers/auth";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { registerSchema, loginSchema } from "../validation/schemas";



const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/verify", verifyAccount);
router.delete("/account", requireAuth, deleteAccount);

export default router;