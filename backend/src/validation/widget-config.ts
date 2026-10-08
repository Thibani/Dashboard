import { findWidget } from "../services-registry";

const MAX_STRING_LENGTH = 2048;
const MAX_INTEGER = 1000;

export type ConfigResult =
  | { ok: true; config: Record<string, string | number> }
  | { ok: false; error: string };

/**
 * Checks that `config` matches exactly what /about.json declares for this widget:
 * every param present, right type, no extra keys, sane sizes.
 */
export function validateWidgetConfig(service: string, widget: string, config: unknown): ConfigResult {
  const definition = findWidget(service, widget);
  if (!definition) {
    return { ok: false, error: `Unknown widget: ${service}.${widget}` };
  }

  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    return { ok: false, error: "config must be an object" };
  }
  const input = config as Record<string, unknown>;

  const allowed = new Set(definition.params.map((p) => p.name));
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      return { ok: false, error: `Unexpected parameter: ${key}` };
    }
  }

  const clean: Record<string, string | number> = {};
  for (const param of definition.params) {
    const value = input[param.name];

    if (param.type === "string") {
      if (typeof value !== "string") {
        return { ok: false, error: `${param.name} must be a string` };
      }
      const trimmed = value.trim();
      if (trimmed.length === 0 || trimmed.length > MAX_STRING_LENGTH) {
        return { ok: false, error: `${param.name} must be between 1 and ${MAX_STRING_LENGTH} characters` };
      }
      clean[param.name] = trimmed;
    } else {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_INTEGER) {
        return { ok: false, error: `${param.name} must be an integer between 1 and ${MAX_INTEGER}` };
      }
      clean[param.name] = value;
    }
  }

  return { ok: true, config: clean };
}