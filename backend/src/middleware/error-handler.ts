import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ProviderNotConnectedError } from "../services/oauth/credentials";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Invalid input", details: err.flatten() });
  }
  // The frontend shows a "Connect <provider>" button for this code.
  if (err instanceof ProviderNotConnectedError) {
    return res.status(409).json({ error: err.message, code: "provider_not_connected", provider: err.provider });
  }
  if (err instanceof Error) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Unknown error" });
}
