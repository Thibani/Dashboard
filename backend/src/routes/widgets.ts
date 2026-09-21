import { Router, Request, Response, NextFunction } from "express";
import { getWidget } from "../services/registry";

export const widgetsRouter = Router();

/**
 * Generic preview/data endpoint: given a service + widget + config, run
 * that widget's fetchData. Works for any widget in the registry — no
 * per-widget route exists or should ever be added here.
 *
 * TODO once auth + widget_instances land: add GET /widgets/:instanceId/data
 * that loads the saved instance (config, service, widget, owner), looks up
 * that owner's stored credentials for the service, and calls this same
 * fetchData. This route is the template for that one.
 */
widgetsRouter.post("/widgets/preview", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { service, widget, config } = req.body as {
      service?: string;
      widget?: string;
      config?: unknown;
    };

    if (!service || !widget) {
      return res.status(400).json({ error: "service and widget are required" });
    }

    const definition = getWidget(service, widget);
    if (!definition) {
      return res.status(404).json({ error: `Unknown widget: ${service}.${widget}` });
    }

    const parsedConfig = definition.configSchema.parse(config ?? {});

    // credentials is null here since only authType "none" services (weather,
    // rss) are wired up so far — oauth2/credentials services will pass the
    // caller's stored ServiceCredentials once that module exists.
    const data = await definition.fetchData(parsedConfig, null);

    res.json({ service, widget, data });
  } catch (err) {
    next(err);
  }
});
