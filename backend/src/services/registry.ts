import { ServiceDefinition } from "../types/widget";
import weather from "./weather";
import rss from "./rss";

// --- Adding a new service --------------------------------------------
// 1. Create ./<service-name>/index.ts exporting a ServiceDefinition
// 2. Create ./<service-name>/widgets/*.ts exporting its WidgetDefinitions
// 3. Add it to this array. That's it — /about.json, config validation,
//    and the generic widget data route all pick it up automatically.
const allServices: ServiceDefinition[] = [weather, rss];

export const registry = new Map<string, ServiceDefinition>(
  allServices.map((service) => [service.name, service])
);

export function getService(name: string): ServiceDefinition | undefined {
  return registry.get(name);
}

export function getWidget(serviceName: string, widgetName: string) {
  return getService(serviceName)?.widgets.find((w) => w.name === widgetName);
}

export function listServices(): ServiceDefinition[] {
  return Array.from(registry.values());
}
