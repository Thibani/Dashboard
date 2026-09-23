import { useQuery } from "@tanstack/react-query";
import { fetchWidgetData } from "../lib/api";
import { type WidgetInstance } from "../features/widgets/types";

export function useWidgetData(instance: WidgetInstance) {
  return useQuery({
    queryKey: ["widget-data", instance.id, instance.service, instance.widget, instance.config],
    queryFn: () => fetchWidgetData(instance.service, instance.widget, instance.config),
    refetchInterval: instance.refreshRateSeconds * 1000,
    retry: 1,
  });
}