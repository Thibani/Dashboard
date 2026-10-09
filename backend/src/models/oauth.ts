import { pool } from "../db";
import type { OAuthTokens } from "../services/oauth/providers";
import { encryptToken, decryptToken } from "../services/oauth/token-crypto";

export interface StoredOAuthAccount {
    provider: string;
    providerUserId: string;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
}

export async function findUserByOAuth(provider: string, providerUserId: string) {
    const result = await pool.query(
        `SELECT u.* FROM users u
         JOIN oauth_accounts o ON o.user_id = u.id
         WHERE o.provider = $1 AND o.provider_user_id = $2`,
        [provider, providerUserId]
    );
    return result.rows[0];
}

// Links the provider account to the user (replacing any other account of the
// same provider they had linked) and stores its tokens.
export async function linkOAuthAccount(userId: number, provider: string, providerUserId: string, tokens: OAuthTokens) {
    const expiresAt = tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null;
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(
            "DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2 AND provider_user_id <> $3",
            [userId, provider, providerUserId]
        );
        // The WHERE stops this from ever moving an account that belongs to someone else.
        // A refresh can come back without a refresh token: keep the one we have.
        await client.query(
            `INSERT INTO oauth_accounts (provider, provider_user_id, user_id, access_token, refresh_token, expires_at, scope)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (provider, provider_user_id) DO UPDATE SET
                 access_token = EXCLUDED.access_token,
                 refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_accounts.refresh_token),
                 expires_at = EXCLUDED.expires_at,
                 scope = EXCLUDED.scope
             WHERE oauth_accounts.user_id = EXCLUDED.user_id`,
            [
                provider,
                providerUserId,
                userId,
                encryptToken(tokens.accessToken),
                tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
                expiresAt,
                tokens.scope ?? null,
            ]
        );
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function updateOAuthTokens(userId: number, provider: string, tokens: OAuthTokens) {
    const expiresAt = tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null;
    await pool.query(
        `UPDATE oauth_accounts SET
             access_token = $3,
             refresh_token = COALESCE($4, refresh_token),
             expires_at = $5
         WHERE user_id = $1 AND provider = $2`,
        [
            userId,
            provider,
            encryptToken(tokens.accessToken),
            tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
            expiresAt,
        ]
    );
}

export async function findOAuthAccount(userId: number, provider: string): Promise<StoredOAuthAccount | undefined> {
    const result = await pool.query(
        `SELECT provider, provider_user_id, access_token, refresh_token, expires_at
         FROM oauth_accounts WHERE user_id = $1 AND provider = $2`,
        [userId, provider]
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
        provider: row.provider,
        providerUserId: row.provider_user_id,
        accessToken: row.access_token ? decryptToken(row.access_token) : null,
        refreshToken: row.refresh_token ? decryptToken(row.refresh_token) : null,
        expiresAt: row.expires_at,
    };
}

// Which providers the user has linked. Rows migrated from the old github_id
// column have no token yet: they can log in, but widgets need a reconnect.
export async function listOAuthAccounts(userId: number): Promise<{ provider: string; hasToken: boolean }[]> {
    const result = await pool.query(
        "SELECT provider, access_token IS NOT NULL AS has_token FROM oauth_accounts WHERE user_id = $1",
        [userId]
    );
    return result.rows.map((row) => ({ provider: row.provider, hasToken: row.has_token }));
}

export async function unlinkOAuthAccount(userId: number, provider: string) {
    const result = await pool.query(
        "DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2",
        [userId, provider]
    );
    return result.rowCount ?? 0;
}

// The provider already verified the email, so the account starts confirmed.
export async function createOAuthUser(email: string) {
    const result = await pool.query(
        'INSERT INTO users(email, is_confirmed) VALUES ($1, TRUE) RETURNING *',
        [email]
    );
    return result.rows[0];
}

// Someone may have registered this email with a password of their own choice
// without ever confirming it. Once the real owner proves the email through a
// provider, that password must stop working.
export async function claimUnconfirmedUser(userId: number) {
    await pool.query(
        'UPDATE users SET password = NULL, is_confirmed = TRUE, token = NULL, date = NULL WHERE id = $1',
        [userId]
    );
}
