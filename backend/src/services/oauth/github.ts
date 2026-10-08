export async function getGithubAccessToken(code: string) {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
        }),
    });
    const tokenData = await tokenRes.json() as { access_token: string };

    if (!tokenData.access_token) {
        throw new Error("GitHub OAuth failed");
    }

    return tokenData.access_token;
}

export async function getGithubUserInfo(accessToken: string) {
    const [userRes, emailRes] = await Promise.all([
        fetch("https://api.github.com/user", {
            headers: { "Authorization": `Bearer ${accessToken}` },
        }),
        fetch("https://api.github.com/user/emails", {
            headers: { "Authorization": `Bearer ${accessToken}` },
        }),
    ]);
    const emails = await emailRes.json() as { email: string; primary: boolean; verified: boolean }[];
    const primaryEmail = emails.find(e => e.primary && e.verified)?.email;
    if (!primaryEmail) {
        throw new Error("No verified email found on Github.");
    }
    const userData = await userRes.json() as { id: number };

    return {id: userData.id, email:primaryEmail};
}