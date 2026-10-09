import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchConnections, fetchOAuthProviders, startOAuthLink } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { rememberReturnTo } from "../features/oauth/return-to";

export function useOAuthProviders() {
  return useQuery({ queryKey: ["oauth-providers"], queryFn: fetchOAuthProviders, staleTime: Infinity });
}

export function useConnections() {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ["oauth-connections", user?.email],
    queryFn: () => fetchConnections(token as string),
    enabled: !!token,
  });
}

/** The provider (if any) whose account a service's widgets need. */
export function useServiceProvider(service: string) {
  const { data } = useOAuthProviders();
  return data?.find((p) => p.services.includes(service));
}

// Leaves the app for the provider's consent page; the browser comes back
// through /oauth/callback once the account is linked.
export function useConnectProvider() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (provider: string) => startOAuthLink(token as string, provider),
    onSuccess: (url) => {
      rememberReturnTo(window.location.pathname);
      window.location.assign(url);
    },
  });
}
