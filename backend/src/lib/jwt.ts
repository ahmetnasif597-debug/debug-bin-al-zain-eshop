import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET ?? "binalzain-dev-secret";
const EXPIRES_IN = "7d";

export interface JwtPayload {
  isAdmin?: boolean;
  customerId?: number;
  customerName?: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
