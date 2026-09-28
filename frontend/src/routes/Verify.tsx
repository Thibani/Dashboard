import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyRequest } from "../lib/api";

type Status = "loading" | "success" | "error";

export function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "This confirmation link is missing its token.");
  // The token is single-use: StrictMode runs effects twice in dev, and the
  // second call would fail once the first has consumed the token.
  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;
    hasRun.current = true;
    verifyRequest(token)
      .then((res) => {
        setMessage(res.message);
        setStatus("success");
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : "Could not verify your account");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-status">
        {status === "loading" && <h1>Verifying your account…</h1>}

        {status === "success" && (
          <>
            <h1>Account confirmed</h1>
            <p>{message}</p>
            <Link to="/login">Log in</Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1>Verification failed</h1>
            <p className="widget-error">{message}</p>
            <Link to="/register">Create a new account</Link>
          </>
        )}
      </div>
    </div>
  );
}