import { useState, type SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { registerRequest } from "../lib/api";
import { OAuthButtons } from "../features/oauth/OAuthButtons";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerRequest(email, password);
      setRegisteredEmail(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setSubmitting(false);
    }
  }

  if (registeredEmail) {
    return (
      <div className="auth-page">
        <div className="auth-status">
          <h1>Check your email</h1>
          <p>
            We sent a confirmation link to <strong>{registeredEmail}</strong>. Open it to activate your
            account, then log in. The link expires in 24 hours.
          </p>
          <Link to="/login">Go to log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Create account</h1>

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
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {error && <p className="widget-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>

        <OAuthButtons />

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}