import { findOAuthAccount, updateOAuthTokens } from "../../models/oauth";
import type { ServiceCredentials } from "../../types/widget";
import { getProvider } from "./providers";

// Thrown when a widget needs a provider account the user hasn't connected,
// or whose access was revoked/expired. The widget route turns it into a
// response the frontend shows as a "Connect GitHub" button.
export class ProviderNotConnectedError extends Error {
    constructor(public provider: string) {
        super(`Connect your ${getProvider(provider)?.label ?? provider} account to use this widget`);
    }
}

// Refresh a little early so the token doesn't expire mid-request.
const EXPIRY_MARGIN_MS = 60 * 1000;

export async function getProviderCredentials(userId: number, providerName: string): Promise<ServiceCredentials> {
    const provider = getProvider(providerName);
    const account = await findOAuthAccount(userId, providerName);
    if (!provider || !account?.accessToken) throw new ProviderNotConnectedError(providerName);

    const expired = account.expiresAt && account.expiresAt.getTime() - EXPIRY_MARGIN_MS < Date.now();
    if (!expired) return { accessToken: account.accessToken };

    if (!account.refreshToken) throw new ProviderNotConnectedError(providerName);
    try {
        const tokens = await provider.refresh(account.refreshToken);
        await updateOAuthTokens(userId, providerName, tokens);
        return { accessToken: tokens.accessToken };
    } catch (err) {
        // Usually the user revoked our access on the provider's side.
        console.error(`Refreshing the ${providerName} token failed:`, err);
        throw new ProviderNotConnectedError(providerName);
    }
}

// fetch() for widgets calling a provider API: a 401/403 means the token is no
// longer valid (revoked, or a scope was refused), so ask the user to reconnect.
export async function providerFetch<T>(providerName: string, url: string, accessToken: string): Promise<T> {
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    if (res.status === 401 || res.status === 403) throw new ProviderNotConnectedError(providerName);
    if (!res.ok) throw new Error(`${getProvider(providerName)?.label ?? providerName} API error (${res.status})`);
    return (await res.json()) as T;
}
