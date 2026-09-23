import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthedRequest extends Request {
  userId?: number;
  userEmail?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ message: "Missing authentication token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as unknown as { sub: number; email: string };
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}