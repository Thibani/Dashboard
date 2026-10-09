import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import type { AuthedRequest } from "../middleware/auth";
import { findUserByEmail, findUserById } from "../models/user";
import {
    findUserByOAuth,
    linkOAuthAccount,
    createOAuthUser,
    claimUnconfirmedUser,
    listOAuthAccounts,
    unlinkOAuthAccount,
} from "../models/oauth";
import { getProvider, isConfigured, listProviders, type OAuthProfile, type OAuthProvider } from "../services/oauth/providers";
import { listServices } from "../services/registry";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";
const STATE_COOKIE = "oauth_state";

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set — add it to your .env before starting the server");
}

// The link ticket and the state are signed with a different key than session
// tokens, so requireAuth can never mistake one of them for a login.
const FLOW_SECRET = `${JWT_SECRET}:oauth-flow`;

type Mode = "login" | "link";

interface StatePayload {
    nonce: string;
    provider: string;
    mode: Mode;
    uid?: number; // set in link mode: the dashboard user connecting the account
}

const frontendUrl = () => process.env.FRONTEND_URL || "http://localhost:3000";
const apiUrl = () => process.env.API_URL || "http://localhost:8080";

// This exact URL must be registered in the GitHub / Google developer console.
const callbackUrl = (provider: string) => `${apiUrl()}/api/oauth/${provider}/callback`;

const stateCookieOptions = () => ({
    httpOnly: true,
    sameSite: "lax" as const, // still sent when the provider redirects the browser back
    secure: apiUrl().startsWith("https://"),
    path: "/api/oauth",
});

// The browser is mid-navigation, so results can't be JSON: everything goes back
// to the frontend's /oauth/callback page, in the URL *fragment* (#...), which
// browsers never send to any server or write to access logs.
function backToFrontend(res: Response, params: Record<string, string>) {
    return res.redirect(`${frontendUrl()}/oauth/callback#${new URLSearchParams(params).toString()}`);
}

function failWith(res: Response, mode: Mode, code: string) {
    return backToFrontend(res, { error: code, mode });
}

function readCookie(req: Request, name: string): string | undefined {
    for (const part of (req.headers.cookie ?? "").split(";")) {
        const [key, ...value] = part.trim().split("=");
        if (key === name) return decodeURIComponent(value.join("="));
    }
    return undefined;
}

function configuredProvider(name: string): OAuthProvider | undefined {
    const provider = getProvider(name);
    return provider && isConfigured(provider) ? provider : undefined;
}

// GET /api/oauth/providers — which "Continue with ..." buttons to show, and
// which dashboard services need which provider.
export function listOAuthProviders(_req: Request, res: Response) {
    const services = listServices();
    return res.json({
        providers: listProviders().map((p) => ({
            name: p.name,
            label: p.label,
            configured: isConfigured(p),
            services: services.filter((s) => s.oauthProvider === p.name).map((s) => s.name),
        })),
    });
}

// GET /api/oauth/connections — the providers the logged-in user has linked.
export async function listConnections(req: AuthedRequest, res: Response) {
    const accounts = await listOAuthAccounts(req.userId as number);
    return res.json({
        connections: accounts.map((a) => ({
            provider: a.provider,
            // Old GitHub links (from users.github_id) have no token yet.
            needsReconnect: !a.hasToken,
        })),
    });
}

// POST /api/oauth/:provider/link — step 0 of "connect my account" for a
// logged-in user. The browser navigation that follows can't carry the
// Authorization header, so it carries this short-lived ticket instead.
export function startLink(req: AuthedRequest, res: Response) {
    const provider = configuredProvider(req.params.provider as string);
    if (!provider) return res.status(404).json({ message: "This provider is not available" });

    const ticket = jwt.sign({ uid: req.userId, purpose: "oauth_link" }, FLOW_SECRET, { expiresIn: "2m" });
    return res.json({ url: `${apiUrl()}/api/oauth/${provider.name}?link=${encodeURIComponent(ticket)}` });
}

// DELETE /api/oauth/:provider — disconnect.
export async function unlink(req: AuthedRequest, res: Response) {
    const providerName = req.params.provider as string;
    if (!getProvider(providerName)) return res.status(404).json({ message: "Unknown provider" });

    const userId = req.userId as number;
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Never remove the last way this user has to sign in.
    const accounts = await listOAuthAccounts(userId);
    if (!user.password && accounts.length === 1 && accounts[0].provider === providerName) {
        return res.status(400).json({
            message: "This is the only way you can sign in, so it can't be disconnected.",
        });
    }

    const removed = await unlinkOAuthAccount(userId, providerName);
    if (removed === 0) return res.status(404).json({ message: "This account is not connected" });
    return res.status(204).send();
}

// Step 1: send the browser to the provider's consent page.
export function oauthRedirect(req: Request, res: Response) {
    const linkTicket = req.query.link;
    const mode: Mode = linkTicket === undefined ? "login" : "link";

    const provider = configuredProvider(req.params.provider as string);
    if (!provider) return failWith(res, mode, "provider_unavailable");

    let uid: number | undefined;
    if (mode === "link") {
        try {
            const ticket = jwt.verify(String(linkTicket), FLOW_SECRET) as { uid?: number; purpose?: string };
            if (ticket.purpose !== "oauth_link" || typeof ticket.uid !== "number") throw new Error("bad ticket");
            uid = ticket.uid;
        } catch {
            return failWith(res, mode, "link_expired");
        }
    }

    // The nonce ties the callback to THIS browser (cookie). Without it, an
    // attacker could make a victim finish the attacker's login or link the
    // attacker's GitHub to the victim's dashboard (login CSRF).
    const nonce = crypto.randomBytes(32).toString("hex");
    res.cookie(STATE_COOKIE, nonce, { ...stateCookieOptions(), maxAge: 10 * 60 * 1000 });

    const payload: StatePayload = { nonce, provider: provider.name, mode, uid };
    const state = jwt.sign(payload, FLOW_SECRET, { expiresIn: "10m" });

    const url = new URL(provider.authorizeUrl);
    url.search = new URLSearchParams({
        client_id: provider.clientId() as string,
        redirect_uri: callbackUrl(provider.name),
        response_type: "code",
        scope: provider.scope,
        state,
        ...provider.authorizeParams,
    }).toString();
    return res.redirect(url.toString());
}

async function resolveLoginUser(providerName: string, profile: OAuthProfile) {
    const linked = await findUserByOAuth(providerName, profile.id);
    if (linked) return linked;

    const email = profile.email.toLowerCase();
    const existing = await findUserByEmail(email);
    if (existing) {
        // Safe because the provider verified this email belongs to the person logging in.
        if (!existing.is_confirmed) await claimUnconfirmedUser(existing.id);
        return existing;
    }
    return createOAuthUser(email);
}

function readState(req: Request, providerName: string): StatePayload | undefined {
    const { state } = req.query;
    const nonce = readCookie(req, STATE_COOKIE);
    if (typeof state !== "string" || !nonce) return undefined;
    try {
        const payload = jwt.verify(state, FLOW_SECRET) as StatePayload;
        if (payload.nonce !== nonce || payload.provider !== providerName) return undefined;
        return payload;
    } catch {
        return undefined;
    }
}

// Step 2: the provider sends the browser back here with ?code=...&state=...
export async function oauthCallback(req: Request, res: Response) {
    const provider = configuredProvider(req.params.provider as string);
    const state = provider && readState(req, provider.name);
    res.clearCookie(STATE_COOKIE, stateCookieOptions());

    const mode: Mode = state ? state.mode : "login";
    if (!provider) return failWith(res, mode, "provider_unavailable");
    if (req.query.error) return failWith(res, mode, "access_denied"); // e.g. the user clicked "Cancel"
    if (!state || typeof req.query.code !== "string") return failWith(res, mode, "invalid_state");

    try {
        const tokens = await provider.exchangeCode(req.query.code, callbackUrl(provider.name));
        const profile = await provider.fetchProfile(tokens.accessToken);

        if (state.mode === "link") {
            const owner = await findUserByOAuth(provider.name, profile.id);
            if (owner && owner.id !== state.uid) return failWith(res, mode, "already_linked");
            await linkOAuthAccount(state.uid as number, provider.name, profile.id, tokens);
            return backToFrontend(res, { linked: provider.name });
        }

        const user = await resolveLoginUser(provider.name, profile);
        await linkOAuthAccount(user.id, provider.name, profile.id, tokens);

        const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET as string, {
            expiresIn: JWT_EXPIRES_IN,
        });
        // Step 3: hand the session token to the frontend.
        return backToFrontend(res, { token, email: user.email });
    } catch (err) {
        console.error(`OAuth ${provider.name} failed:`, err);
        return failWith(res, mode, "oauth_failed");
    }
}
