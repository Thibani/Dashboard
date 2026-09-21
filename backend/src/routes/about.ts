import { Router, Request, Response } from "express";
import { listServices } from "../services/registry";

export const aboutRouter = Router();

aboutRouter.get("/about.json", (req: Request, res: Response) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const clientHost = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0].trim() || req.socket.remoteAddress || "";

  res.json({
    client: {
      host: clientHost,
    },
    server: {
      current_time: Math.floor(Date.now() / 1000),
      services: listServices().map((service) => ({
        name: service.name,
        widgets: service.widgets.map((widget) => ({
          name: widget.name,
          description: widget.description,
          params: widget.params,
        })),
      })),
    },
  });
});
