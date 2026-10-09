import { useQuery } from "@tanstack/react-query";
import { fetchWidgetData, ProviderNotConnectedError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { type WidgetInstance } from "../features/widgets/types";

export function useWidgetData(instance: WidgetInstance) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["widget-data", instance.id, instance.service, instance.widget, instance.config],
    queryFn: () => fetchWidgetData(token as string, instance.service, instance.widget, instance.config),
    enabled: !!token,
    refetchInterval: instance.refreshRateSeconds * 1000,
    // Retrying won't connect the account for the user.
    retry: (failureCount, error) => !(error instanceof ProviderNotConnectedError) && failureCount < 1,
  });
}
