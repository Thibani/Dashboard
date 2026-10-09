import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
    oauthRedirect,
    oauthCallback,
    listOAuthProviders,
    listConnections,
    startLink,
    unlink,
} from "../controllers/oauth";

const router = Router();

// Fixed paths first, so they are not read as a provider name.
router.get("/providers", listOAuthProviders);
router.get("/connections", requireAuth, listConnections);

// GET /api/oauth/github, /api/oauth/google ... (one set of routes serves every provider)
router.get("/:provider", oauthRedirect);
router.get("/:provider/callback", oauthCallback);
router.post("/:provider/link", requireAuth, startLink);
router.delete("/:provider", requireAuth, unlink);

export default router;
