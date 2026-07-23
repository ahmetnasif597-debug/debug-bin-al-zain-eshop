import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";

/**
 * Reads the JWT from the httpOnly cookie "token",
 * verifies it, and attaches the decoded payload to req.user.
 * Never rejects the request — routes decide what to do with an absent user.
 */
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  // تم تصحيح الكلمة إلى undefined هنا:
  const token: string | undefined = (req as any).cookies?.token;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      (req as any).user = payload;
    }
  }
  next();
}
