import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { takeReturnTo } from "../features/oauth/return-to";

/**
 * Where the backend sends the browser at the end of a GitHub/Google flow.
 * The result is in the URL fragment (#token=... / #linked=... / #error=...),
 * which never reaches any server.
 */
export function OAuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice; the fragment must only be consumed once.
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");
    const email = params.get("email");
    const linked = params.get("linked");
    const error = params.get("error");

    // `replace` everywhere: the token must not stay in the history.
    if (token && email) {
      login(token, { email });
      navigate("/", { replace: true });
    } else if (linked) {
      navigate(takeReturnTo(), { replace: true });
    } else if (error && params.get("mode") === "link") {
      takeReturnTo();
      navigate(`/connections?error=${encodeURIComponent(error)}`, { replace: true });
    } else {
      navigate(`/login?error=${encodeURIComponent(error ?? "oauth_failed")}`, { replace: true });
    }
  }, [login, navigate]);

  return <p className="auth-page">Signing you in…</p>;
}
