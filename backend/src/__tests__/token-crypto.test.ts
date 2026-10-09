import { encryptToken, decryptToken } from "../services/oauth/token-crypto";

describe("token-crypto", () => {
    it("round-trips a token without storing it in clear", () => {
        const stored = encryptToken("gho_secret");
        expect(stored).not.toContain("gho_secret");
        expect(decryptToken(stored)).toBe("gho_secret");
    });

    it("rejects a tampered value", () => {
        const [iv, tag, data] = encryptToken("gho_secret").split(".");
        const flipped = Buffer.from(data, "base64url");
        flipped[0] ^= 1;
        expect(() => decryptToken([iv, tag, flipped.toString("base64url")].join("."))).toThrow();
    });
});
