import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { disconnectProvider, UnauthorizedError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useConnectProvider, useConnections, useOAuthProviders } from "../hooks/useOAuth";
import { oauthErrorMessage } from "../features/oauth/errors";
import { ServiceIcon } from "../components/ServiceIcon";
import "../style/OAuth.css";

export function Connections() {
  const { token, logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const providers = useOAuthProviders();
  const connections = useConnections();
  const connect = useConnectProvider();
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (connections.error instanceof UnauthorizedError) logout();
  }, [connections.error, logout]);

  async function handleDisconnect(provider: string) {
    setBusy(provider);
    setActionError(null);
    try {
      await disconnectProvider(token as string, provider);
      await queryClient.invalidateQueries({ queryKey: ["oauth-connections"] });
      // Widgets of this provider now need a reconnect.
      await queryClient.invalidateQueries({ queryKey: ["widget-data"] });
    } catch (err) {
      if (err instanceof UnauthorizedError) logout();
      else setActionError(err instanceof Error ? err.message : "Could not disconnect this account");
    } finally {
      setBusy(null);
    }
  }

  const flowError = oauthErrorMessage(searchParams.get("error"));
  const error = actionError ?? flowError ?? (connect.error instanceof Error ? connect.error.message : null);

  if (providers.isLoading || connections.isLoading) return <p>Loading…</p>;
  if (providers.error || connections.error) {
    return <p className="widget-error">Could not load your connected accounts.</p>;
  }

  return (
    <div className="connections">
      <h1>Connected accounts</h1>
      <p className="connections-intro">
        Connect an account to use its widgets on your dashboard. You can also use it to log in.
      </p>

      {error && <p className="widget-error">{error}</p>}

      <ul className="connections-list">
        {providers.data?.map((p) => {
          const connection = connections.data?.find((c) => c.provider === p.name);
          const status = !connection
            ? "Not connected"
            : connection.needsReconnect
              ? "Reconnect to use widgets"
              : "Connected";

          return (
            <li key={p.name} className="connections-item">
              <ServiceIcon service={p.name} size={32} />
              <div className="connections-info">
                <p className="connections-name">{p.label}</p>
                <p className="connections-status" data-connected={!!connection && !connection.needsReconnect}>
                  {p.configured ? status : "Not available on this server"}
                </p>
                {p.services.length > 0 && (
                  <p className="connections-services">Widgets: {p.services.join(", ")}</p>
                )}
              </div>
              {p.configured && (
                <div className="connections-actions">
                  {(!connection || connection.needsReconnect) && (
                    <button onClick={() => connect.mutate(p.name)} disabled={connect.isPending}>
                      {connection ? "Reconnect" : "Connect"}
                    </button>
                  )}
                  {connection && (
                    <button className="secondary" onClick={() => handleDisconnect(p.name)} disabled={busy === p.name}>
                      {busy === p.name ? "Disconnecting…" : "Disconnect"}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
