import { z } from "zod";
import { validateWidgetConfig } from "./widget-config";

// bcrypt only uses the first 72 bytes, and an unbounded password would let
// anyone make the server hash megabytes of data.
const PASSWORD_MAX = 72;

// trim + lowercase so "A@x.com" and "a@x.com" can't become two accounts
const email = z
  .string({ message: "Email is required" })
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .email("Invalid email address");

export const registerSchema = z.object({
  email,
  password: z
    .string({ message: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`),
});

export const loginSchema = z.object({
  email,
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required")
    .max(PASSWORD_MAX, "Invalid email or password"),
});

// The widest dashboard grid has 5 columns (frontend Dashboard.css).
const MAX_WIDGET_COLUMNS = 5;
const MAX_WIDGET_ROWS = 8;

const widgetInstanceSchema = z
  .object({
    id: z.string().min(1).max(64),
    service: z.string().min(1).max(64),
    widget: z.string().min(1).max(64),
    config: z.record(z.string(), z.unknown()),
    refreshRateSeconds: z.number().int().min(10).max(86400),
    // Size on the grid, in columns/rows. Must be listed here: zod drops
    // unknown keys, so without these the size was lost on every save.
    width: z.number().int().min(1).max(MAX_WIDGET_COLUMNS).optional(),
    height: z.number().int().min(1).max(MAX_WIDGET_ROWS).optional(),
  })
  .superRefine((instance, ctx) => {
    // The config must match what /about.json declares for this widget.
    const result = validateWidgetConfig(instance.service, instance.widget, instance.config);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.error, path: ["config"] });
    }
  });

export const dashboardSchema = z.object({
  instances: z.array(widgetInstanceSchema).max(50, "Too many widgets"),
});

export const widgetPreviewSchema = z
  .object({
    service: z.string().min(1).max(64),
    widget: z.string().min(1).max(64),
    config: z.record(z.string(), z.unknown()),
  })
  .superRefine((body, ctx) => {
    const result = validateWidgetConfig(body.service, body.widget, body.config);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.error, path: ["config"] });
    }
  });