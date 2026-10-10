import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ProviderNotConnectedError } from "../services/oauth/credentials";
import { UnsafeUrlError } from "../validation/ssrf-guard";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Invalid input", details: err.flatten() });
  }
  // The frontend shows a "Connect <provider>" button for this code.
  if (err instanceof ProviderNotConnectedError) {
    return res.status(409).json({ error: err.message, code: "provider_not_connected", provider: err.provider });
  }
  // A URL pointing to an internal address: the user's input is wrong, not the server.
  if (err instanceof UnsafeUrlError) {
    return res.status(400).json({ error: `This URL is not allowed: ${err.message}` });
  }
  if (err instanceof Error) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Unknown error" });
}
