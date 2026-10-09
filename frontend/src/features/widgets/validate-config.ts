import { type WidgetParam } from "./types";

// Same limits as the backend (backend/src/validation/widget-config.ts).
const MAX_STRING_LENGTH = 2048;
const MAX_INTEGER = 1000;

export type ConfigCheck = { ok: true; config: Record<string, unknown> } | { ok: false; error: string };

/** Checks every param /about.json declares is filled in with the right type, and trims strings. */
export function validateConfig(params: WidgetParam[], config: Record<string, unknown>): ConfigCheck {
  const clean: Record<string, unknown> = {};
  for (const param of params) {
    const value = config[param.name];
    const label = param.name.replace(/_/g, " ");

    if (param.type === "string") {
      const text = typeof value === "string" ? value.trim() : "";
      if (text.length === 0) return { ok: false, error: `Please fill in the ${label}.` };
      if (text.length > MAX_STRING_LENGTH) return { ok: false, error: `The ${label} is too long.` };
      clean[param.name] = text;
    } else {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_INTEGER) {
        return { ok: false, error: `The ${label} must be a whole number between 1 and ${MAX_INTEGER}.` };
      }
      clean[param.name] = value;
    }
  }
  return { ok: true, config: clean };
}
