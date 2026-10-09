// Codes the backend puts in /oauth/callback#error=... (controllers/oauth.ts).
const MESSAGES: Record<string, string> = {
  provider_unavailable: "This sign-in method is not available right now.",
  access_denied: "You cancelled the authorization.",
  invalid_state: "The sign-in took too long or came from another tab. Please try again.",
  link_expired: "The connection request expired. Please try again.",
  already_linked: "That account is already connected to another dashboard user.",
  oauth_failed: "Something went wrong while talking to the provider. Please try again.",
};

export function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? MESSAGES.oauth_failed;
}
