import { listServices } from "./services/registry";

export type ParamType = "string" | "integer";

export interface WidgetParam {
  name: string;
  type: ParamType;
}

export interface WidgetDefinition {
  name: string;
  description: string;
  params: WidgetParam[];
}

export interface ServiceDefinition {
  name: string;
  widgets: WidgetDefinition[];
}

// The public /about.json view of services/registry.ts. Derived rather than
// written by hand, so a new service or widget can't be forgotten here.
export const services: ServiceDefinition[] = listServices().map((service) => ({
  name: service.name,
  widgets: service.widgets.map((widget) => ({
    name: widget.name,
    description: widget.description,
    params: widget.params,
  })),
}));

export function findWidget(service: string, widget: string): WidgetDefinition | undefined {
  return services.find((s) => s.name === service)?.widgets.find((w) => w.name === widget);
}
