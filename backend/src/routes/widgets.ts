import { Router, Request, Response, NextFunction } from "express";
import { getService, getWidget } from "../services/registry";
import { requireAuth, type AuthedRequest } from "../middleware/auth";
import { getProviderCredentials } from "../services/oauth/credentials";
import type { ServiceCredentials } from "../types/widget";

export const widgetsRouter = Router();

/**
 * Generic data endpoints: given a service + widget + config, run that
 * widget's fetchData. Works for any widget in the registry — no per-widget
 * route exists or should ever be added here.
 */
async function runWidget(req: Request, res: Response, userId: number | undefined) {
  const { service, widget, config } = req.body as {
    service?: string;
    widget?: string;
    config?: unknown;
  };

  if (!service || !widget) {
    return res.status(400).json({ error: "service and widget are required" });
  }

  const definition = getWidget(service, widget);
  const serviceDefinition = getService(service);
  if (!definition || !serviceDefinition) {
    return res.status(404).json({ error: `Unknown widget: ${service}.${widget}` });
  }

  const parsedConfig = definition.configSchema.parse(config ?? {});

  // oauth2 services run with the token of the account the user linked;
  // throws ProviderNotConnectedError (-> 409) when there is none.
  let credentials: ServiceCredentials | null = null;
  if (serviceDefinition.authType === "oauth2") {
    if (userId === undefined) {
      return res.status(401).json({ error: "Log in to use this widget" });
    }
    credentials = await getProviderCredentials(userId, serviceDefinition.oauthProvider as string);
  }

  const data = await definition.fetchData(parsedConfig, credentials);
  res.json({ service, widget, data });
}

// Anonymous: only works for services that need no account (weather, rss).
widgetsRouter.post("/widgets/preview", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await runWidget(req, res, undefined);
  } catch (err) {
    next(err);
  }
});

// What the dashboard uses: same thing, as the logged-in user.
widgetsRouter.post("/api/widgets/data", requireAuth, async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    await runWidget(req, res, req.userId);
  } catch (err) {
    next(err);
  }
});
