-- One row per linked provider account. provider_user_id is TEXT because
-- Google's "sub" is a long numeric string that does not fit in an INTEGER.
CREATE TABLE IF NOT EXISTS oauth_accounts (
    provider VARCHAR(32) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (provider, provider_user_id)
);

-- The provider tokens widgets use to call GitHub / Google for the user.
-- Stored encrypted (see services/oauth/token-crypto.ts), never in clear.
ALTER TABLE oauth_accounts ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE oauth_accounts ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE oauth_accounts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE oauth_accounts ADD COLUMN IF NOT EXISTS scope TEXT;

-- A user links at most one account per provider, so widgets know which token to use.
CREATE UNIQUE INDEX IF NOT EXISTS oauth_accounts_user_provider ON oauth_accounts (user_id, provider);

-- Carry over the GitHub links stored in the old users.github_id column.
INSERT INTO oauth_accounts (provider, provider_user_id, user_id)
    SELECT 'github', github_id::text, id FROM users WHERE github_id IS NOT NULL
    ON CONFLICT DO NOTHING;
