import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { oauthRedirect, oauthCallback, startLink, unlink } from "../controllers/oauth";
import * as userModel from "../models/user";
import * as oauthModel from "../models/oauth";
import * as providers from "../services/oauth/providers";
import type { AuthedRequest } from "../middleware/auth";

jest.mock("../models/user");
jest.mock("../models/oauth");
jest.mock("../db", () => ({ pool: {} }));

const FRONTEND = "http://localhost:3000";

const fakeProvider: providers.OAuthProvider = {
    name: "github",
    label: "GitHub",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    scope: "read:user",
    clientId: () => "client-id",
    clientSecret: () => "client-secret",
    exchangeCode: jest.fn(),
    refresh: jest.fn(),
    fetchProfile: jest.fn(),
};

function mockRes() {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
}

function redirectedTo(res: Response): URL {
    return new URL((res.redirect as jest.Mock).mock.calls[0][0]);
}

function fragment(res: Response): URLSearchParams {
    return new URLSearchParams(redirectedTo(res).hash.slice(1));
}

// Runs step 1 and returns what the browser would bring back to step 2.
function begin(query: Record<string, unknown> = {}) {
    const res = mockRes();
    oauthRedirect({ params: { provider: "github" }, query } as unknown as Request, res);
    const nonce = (res.cookie as jest.Mock).mock.calls[0]?.[1] as string;
    const state = redirectedTo(res).searchParams.get("state") as string;
    return { res, nonce, state };
}

function callbackReq(query: Record<string, unknown>, cookie?: string) {
    return {
        params: { provider: "github" },
        query,
        headers: cookie ? { cookie: `oauth_state=${cookie}` } : {},
    } as unknown as Request;
}

beforeEach(() => {
    jest.spyOn(providers, "getProvider").mockImplementation((name) => (name === "github" ? fakeProvider : undefined));
    (fakeProvider.exchangeCode as jest.Mock).mockResolvedValue({ accessToken: "gh-token" });
    (fakeProvider.fetchProfile as jest.Mock).mockResolvedValue({ id: "123", email: "Dev@Example.com" });
});

describe("oauthRedirect", () => {
    it("sends the browser to the provider with a state bound to a cookie", () => {
        const { res, nonce, state } = begin();
        const url = redirectedTo(res);
        expect(url.origin + url.pathname).toBe("https://github.com/login/oauth/authorize");
        expect(url.searchParams.get("client_id")).toBe("client-id");
        expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:8080/api/oauth/github/callback");
        expect(nonce).toMatch(/^[a-f0-9]{64}$/);
        expect(state).toBeTruthy();
    });

    it("refuses an unknown provider", () => {
        const res = mockRes();
        oauthRedirect({ params: { provider: "nope" }, query: {} } as unknown as Request, res);
        expect(fragment(res).get("error")).toBe("provider_unavailable");
        expect(res.cookie).not.toHaveBeenCalled();
    });

    it("refuses a link request with a forged ticket", () => {
        const forged = jwt.sign({ uid: 1, purpose: "oauth_link" }, "not-the-secret");
        const res = mockRes();
        oauthRedirect({ params: { provider: "github" }, query: { link: forged } } as unknown as Request, res);
        expect(fragment(res).get("error")).toBe("link_expired");
        expect(fragment(res).get("mode")).toBe("link");
    });

    it("refuses a session token used as a link ticket", () => {
        const session = jwt.sign({ sub: 1, uid: 1, purpose: "oauth_link" }, process.env.JWT_SECRET as string);
        const res = mockRes();
        oauthRedirect({ params: { provider: "github" }, query: { link: session } } as unknown as Request, res);
        expect(fragment(res).get("error")).toBe("link_expired");
    });
});

describe("oauthCallback (login)", () => {
    it("logs in, stores the provider tokens and hands a session token to the frontend", async () => {
        const { nonce, state } = begin();
        (oauthModel.findUserByOAuth as jest.Mock).mockResolvedValue(undefined);
        (userModel.findUserByEmail as jest.Mock).mockResolvedValue(undefined);
        (oauthModel.createOAuthUser as jest.Mock).mockResolvedValue({ id: 7, email: "dev@example.com", role: "user" });

        const res = mockRes();
        await oauthCallback(callbackReq({ code: "the-code", state }, nonce), res);

        expect(oauthModel.createOAuthUser).toHaveBeenCalledWith("dev@example.com");
        expect(oauthModel.linkOAuthAccount).toHaveBeenCalledWith(7, "github", "123", { accessToken: "gh-token" });
        expect(redirectedTo(res).origin + redirectedTo(res).pathname).toBe(`${FRONTEND}/oauth/callback`);
        const params = fragment(res);
        expect(params.get("email")).toBe("dev@example.com");
        expect((jwt.verify(params.get("token") as string, process.env.JWT_SECRET as string) as unknown as { sub: number }).sub).toBe(7);
    });

    it("rejects a callback whose state doesn't match this browser's cookie (login CSRF)", async () => {
        const { state } = begin();
        const res = mockRes();
        await oauthCallback(callbackReq({ code: "the-code", state }, "a".repeat(64)), res);
        expect(fragment(res).get("error")).toBe("invalid_state");
        expect(fakeProvider.exchangeCode).not.toHaveBeenCalled();
    });

    it("rejects a callback without the cookie", async () => {
        const { state } = begin();
        const res = mockRes();
        await oauthCallback(callbackReq({ code: "the-code", state }), res);
        expect(fragment(res).get("error")).toBe("invalid_state");
    });

    it("reports a cancelled consent", async () => {
        const { nonce, state } = begin();
        const res = mockRes();
        await oauthCallback(callbackReq({ error: "access_denied", state }, nonce), res);
        expect(fragment(res).get("error")).toBe("access_denied");
    });

    it("redirects with an error (instead of crashing) when the provider fails", async () => {
        const { nonce, state } = begin();
        (fakeProvider.exchangeCode as jest.Mock).mockRejectedValue(new Error("bad code"));
        jest.spyOn(console, "error").mockImplementation(() => {});
        const res = mockRes();
        await oauthCallback(callbackReq({ code: "the-code", state }, nonce), res);
        expect(fragment(res).get("error")).toBe("oauth_failed");
    });
});

describe("oauthCallback (link)", () => {
    function beginLink(uid: number) {
        const res = mockRes();
        startLink({ params: { provider: "github" }, userId: uid } as unknown as AuthedRequest, res);
        const { url } = (res.json as jest.Mock).mock.calls[0][0];
        return begin({ link: new URL(url).searchParams.get("link") });
    }

    it("links the provider account to the logged-in user, whatever its email", async () => {
        const { nonce, state } = beginLink(42);
        (oauthModel.findUserByOAuth as jest.Mock).mockResolvedValue(undefined);

        const res = mockRes();
        await oauthCallback(callbackReq({ code: "the-code", state }, nonce), res);

        expect(oauthModel.linkOAuthAccount).toHaveBeenCalledWith(42, "github", "123", { accessToken: "gh-token" });
        expect(userModel.findUserByEmail).not.toHaveBeenCalled();
        expect(fragment(res).get("linked")).toBe("github");
        expect(fragment(res).get("token")).toBeNull();
    });

    it("refuses to take over a provider account linked to someone else", async () => {
        const { nonce, state } = beginLink(42);
        (oauthModel.findUserByOAuth as jest.Mock).mockResolvedValue({ id: 99 });

        const res = mockRes();
        await oauthCallback(callbackReq({ code: "the-code", state }, nonce), res);

        expect(oauthModel.linkOAuthAccount).not.toHaveBeenCalled();
        expect(fragment(res).get("error")).toBe("already_linked");
        expect(fragment(res).get("mode")).toBe("link");
    });
});

describe("unlink", () => {
    const req = (userId: number) => ({ params: { provider: "github" }, userId }) as unknown as AuthedRequest;

    it("refuses to remove the only way a password-less user can sign in", async () => {
        (userModel.findUserById as jest.Mock).mockResolvedValue({ id: 1, password: null });
        (oauthModel.listOAuthAccounts as jest.Mock).mockResolvedValue([{ provider: "github", hasToken: true }]);

        const res = mockRes();
        await unlink(req(1), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(oauthModel.unlinkOAuthAccount).not.toHaveBeenCalled();
    });

    it("disconnects when the user has a password", async () => {
        (userModel.findUserById as jest.Mock).mockResolvedValue({ id: 1, password: "hash" });
        (oauthModel.listOAuthAccounts as jest.Mock).mockResolvedValue([{ provider: "github", hasToken: true }]);
        (oauthModel.unlinkOAuthAccount as jest.Mock).mockResolvedValue(1);

        const res = mockRes();
        await unlink(req(1), res);

        expect(oauthModel.unlinkOAuthAccount).toHaveBeenCalledWith(1, "github");
        expect(res.status).toHaveBeenCalledWith(204);
    });
});
