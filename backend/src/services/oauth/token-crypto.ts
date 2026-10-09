import crypto from "crypto";

// Provider tokens give access to the user's GitHub / Google data, so they are
// encrypted at rest: a leaked database dump alone is not enough to use them.
// Set TOKEN_ENCRYPTION_KEY in production; JWT_SECRET is the fallback.
function key(): Buffer {
    const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!secret) throw new Error("TOKEN_ENCRYPTION_KEY (or JWT_SECRET) is not set");
    return crypto.createHash("sha256").update(secret).digest();
}

// Output: iv.authTag.ciphertext, each base64url.
export function encryptToken(plain: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
    const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decryptToken(stored: string): string {
    const [iv, tag, data] = stored.split(".").map((part) => Buffer.from(part, "base64url"));
    if (!iv || !tag || !data) throw new Error("Malformed stored token");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
