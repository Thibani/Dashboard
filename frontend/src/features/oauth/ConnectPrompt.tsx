import { useConnectProvider, useOAuthProviders } from "../../hooks/useOAuth";
import "../../style/OAuth.css";

/** Shown in place of a widget whose service needs an account the user hasn't connected. */
export function ConnectPrompt({ provider, message }: { provider: string; message: string }) {
  const connect = useConnectProvider();
  const label = useOAuthProviders().data?.find((p) => p.name === provider)?.label ?? provider;

  return (
    <div className="connect-prompt">
      <p>{message}</p>
      <button onClick={() => connect.mutate(provider)} disabled={connect.isPending}>
        Connect {label}
      </button>
      {connect.error && <p className="widget-error">{connect.error.message}</p>}
    </div>
  );
}
