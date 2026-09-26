import { Router } from "express";
import { register, login, verifyAccount } from "../controllers/auth";


const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify", verifyAccount);

export default router;