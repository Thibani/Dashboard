export interface OAuthProfile {
    id: string;     // the provider's stable user id, as text
    email: string;  // an email the provider has verified
}

export interface OAuthTokens {
    accessToken: string;
    refreshToken?: string;
    /** Seconds until the access token expires; undefined = it never does. */
    expiresIn?: number;
    scope?: string;
}

export interface OAuthProvider {
    name: string;
    /** Shown in the UI ("Continue with GitHub"). */
    label: string;
    authorizeUrl: string;
    /** Login scopes + what the widgets of this provider need, so one consent covers both. */
    scope: string;
    /** Provider-specific extras for the consent URL. */
    authorizeParams?: Record<string, string>;
    clientId: () => string | undefined;
    clientSecret: () => string | undefined;
    /** Swaps the one-time `code` for tokens. */
    exchangeCode: (code: string, redirectUri: string) => Promise<OAuthTokens>;
    /** Gets a new access token once the old one expired. */
    refresh: (refreshToken: string) => Promise<OAuthTokens>;
    /** Returns who the user is, using the access token. */
    fetchProfile: (accessToken: string) => Promise<OAuthProfile>;
}

async function readJson<T>(res: Response, what: string): Promise<T> {
    if (!res.ok) throw new Error(`${what} failed with status ${res.status}`);
    return (await res.json()) as T;
}

interface TokenResponse {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
}

// GitHub and Google both speak standard OAuth2 on their token endpoint
// (GitHub only answers JSON when asked to).
async function requestToken(url: string, params: Record<string, string>, what: string): Promise<OAuthTokens> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams(params),
    });
    const data = await readJson<TokenResponse>(res, what);
    // GitHub reports a bad code with a 200 and an `error` field.
    if (!data.access_token) throw new Error(`${what} returned no access token (${data.error ?? "unknown error"})`);
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
    };
}

const github: OAuthProvider = {
    name: "github",
    label: "GitHub",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    // read:user + user:email = who you are; notifications = the notifications widget.
    scope: "read:user user:email notifications",
    clientId: () => process.env.GITHUB_CLIENT_ID,
    clientSecret: () => process.env.GITHUB_CLIENT_SECRET,

    exchangeCode(code, redirectUri) {
        return requestToken("https://github.com/login/oauth/access_token", {
            client_id: process.env.GITHUB_CLIENT_ID ?? "",
            client_secret: process.env.GITHUB_CLIENT_SECRET ?? "",
            code,
            redirect_uri: redirectUri,
        }, "GitHub token exchange");
    },

    // Only used if "expiring user tokens" is enabled on the GitHub app;
    // classic OAuth app tokens never expire.
    refresh(refreshToken) {
        return requestToken("https://github.com/login/oauth/access_token", {
            client_id: process.env.GITHUB_CLIENT_ID ?? "",
            client_secret: process.env.GITHUB_CLIENT_SECRET ?? "",
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }, "GitHub token refresh");
    },

    async fetchProfile(accessToken) {
        const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" };
        const [userRes, emailRes] = await Promise.all([
            fetch("https://api.github.com/user", { headers }),
            fetch("https://api.github.com/user/emails", { headers }),
        ]);
        const user = await readJson<{ id: number }>(userRes, "GitHub user lookup");
        const emails = await readJson<{ email: string; primary: boolean; verified: boolean }[]>(
            emailRes, "GitHub email lookup"
        );
        const primary = emails.find((e) => e.primary && e.verified);
        if (!primary) throw new Error("No verified primary email on this GitHub account");
        return { id: String(user.id), email: primary.email };
    },
};

const google: OAuthProvider = {
    name: "google",
    label: "Google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    // calendar.readonly = the calendar widget.
    scope: "openid email https://www.googleapis.com/auth/calendar.readonly",
    // offline + consent: without these Google sends no refresh token, and the
    // widgets would stop working one hour after login.
    authorizeParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,

    exchangeCode(code, redirectUri) {
        return requestToken("https://oauth2.googleapis.com/token", {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID ?? "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
        }, "Google token exchange");
    },

    refresh(refreshToken) {
        return requestToken("https://oauth2.googleapis.com/token", {
            client_id: process.env.GOOGLE_CLIENT_ID ?? "",
            client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }, "Google token refresh");
    },

    async fetchProfile(accessToken) {
        const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const info = await readJson<{ sub: string; email?: string; email_verified?: boolean }>(
            res, "Google user lookup"
        );
        if (!info.email || !info.email_verified) throw new Error("No verified email on this Google account");
        return { id: info.sub, email: info.email };
    },
};

// A Map (not a plain object) so a name like "constructor" can't match anything.
const providers = new Map<string, OAuthProvider>([
    [github.name, github],
    [google.name, google],
]);

export function getProvider(name: string): OAuthProvider | undefined {
    return providers.get(name);
}

export function listProviders(): OAuthProvider[] {
    return Array.from(providers.values());
}

export function isConfigured(provider: OAuthProvider): boolean {
    return Boolean(provider.clientId() && provider.clientSecret());
}
