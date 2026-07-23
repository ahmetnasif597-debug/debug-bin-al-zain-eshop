import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";

/**
 * Reads the JWT from the httpOnly cookie "token" OR the Authorization header,
 * verifies it, and attaches the decoded payload to req.user.
 * Never rejects the request — routes decide what to do with an absent user.
 */
export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  // 1. محاولة قراءة التوكن من الكوكيز أولاً
  let token: string | undefined = (req as any).cookies?.token;

  // 2. إذا لم يجد كوكيز، يقرأ التوكن من الهيدر (حل مضمون لمشاكل Vercel)
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      (req as any).user = payload;
    }
  }
  next();
}
