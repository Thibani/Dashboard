import { useState, type SyntheticEvent } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { loginRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { OAuthButtons } from "../features/oauth/OAuthButtons";
import { oauthErrorMessage } from "../features/oauth/errors";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  // A failed GitHub/Google sign-in comes back as /login?error=<code>.
  const [error, setError] = useState<string | null>(() => oauthErrorMessage(searchParams.get("error")));
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } = await loginRequest(email, password);
      login(token, user);
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Log in</h1>

        <label className="field">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="field">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="widget-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>

        <OAuthButtons />

        <p className="auth-switch">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}