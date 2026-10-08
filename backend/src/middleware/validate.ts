import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      // `message` first: the frontend shows body.message directly.
      return res.status(400).json({ message: errors[0]?.message ?? "Invalid request", errors });
    }

    // Controllers only ever see the validated, normalized data.
    req.body = result.data;
    next();
  };
}