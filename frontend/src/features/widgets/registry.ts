import {
  type WidgetDisplayComponent,
  type WidgetConfigFormComponent,
} from "./widget-component-types";

// Folder convention:
// services/<service>/<widget_name>/Display.tsx
// services/<service>/<widget_name>/ConfigForm.tsx

const displayModules = import.meta.glob(
  "../services/*/*/Display.tsx",
  { eager: true }
) as Record <string, { default: WidgetDisplayComponent }>;

const configFormModules = import.meta.glob(
  "../services/*/*/ConfigForm.tsx",
  { eager: true }
) as Record <string, { default: WidgetConfigFormComponent }>;

function keyFromPath(path: string): string {
  const match = path.match(/services\/([^/]+)\/([^/]+)\//);

  if (!match) {
    throw new Error(`Unexpected widget path: ${path}`);
  }

  const [, service, widget] = match;

  return `${service}.${widget}`;
}

const displays: Record<string, WidgetDisplayComponent> = {};

for (const [path, mod] of Object.entries(displayModules)) {
  displays[keyFromPath(path)] = mod.default;
}

const configForms: Record<string, WidgetConfigFormComponent> = {};

for (const [path, mod] of Object.entries(configFormModules)) {
  configForms[keyFromPath(path)] = mod.default;
}

export const getDisplay = (service: string, widget: string) =>
  displays[`${service}.${widget}`];

export const getConfigForm = (service: string, widget: string) =>
  configForms[`${service}.${widget}`];