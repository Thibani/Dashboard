import { Router } from "express";
import { githubCallBack, githubRedirect } from "../controllers/oauth";

const router = Router();

router.get("/github", githubRedirect);
router.get("/github/callback", githubCallBack);

export default router;