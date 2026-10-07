import { Router } from "express";
import { register, login, verifyAccount, deleteAccount } from "../controllers/auth";
import { requireAuth } from "../middleware/auth";


const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify", verifyAccount);
router.delete("/account", requireAuth, deleteAccount);

export default router;