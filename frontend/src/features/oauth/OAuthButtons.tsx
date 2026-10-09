import { oauthLoginUrl } from "../../lib/api";
import { useOAuthProviders } from "../../hooks/useOAuth";
import "../../style/OAuth.css";

/** "Continue with GitHub / Google" on the login and register pages. */
export function OAuthButtons() {
  const { data: providers } = useOAuthProviders();
  const available = providers?.filter((p) => p.configured) ?? [];
  if (available.length === 0) return null;

  return (
    <div className="oauth-buttons">
      <div className="oauth-divider"><span>or</span></div>
      {available.map((p) => (
        <a key={p.name} className={`oauth-button oauth-button-${p.name}`} href={oauthLoginUrl(p.name)}>
          Continue with {p.label}
        </a>
      ))}
    </div>
  );
}
