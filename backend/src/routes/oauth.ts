import { Router } from "express";

const router = Router();

router.get("/github", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`);
});

router.get("/github/callback", async (req, res) => {
    const code = req.query.code as string;

    if (!code) {
        return res.status(400).json({ message: "Missing code" });
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json"},
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
        }),
    });
    const tokenData = await tokenRes.json() as { access_token: string };
    const accessToken = tokenData.access_token;

    if (!tokenData.access_token) {
        return res.status(401).json({ message: "GitHub OAuth failed" });
    }

    const githubUser = await fetch("https://api.github.com/user", {
        method: "GET",
        headers: { "Authorization": `Bearer ${accessToken}` },
    });
    const userData = await githubUser.json() as { email: string; login: string };
    res.json(userData);
})

export default router;