import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { insertSession, getSessionUser } from "./db.js";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "admin" | "empleado";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const SESSION_DAYS = 7;

/** Hash "salt:hash" con scrypt (64 bytes), sin dependencias externas. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash || !/^[0-9a-f]{128}$/i.test(hash)) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function createSession(userId: number): string {
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  insertSession(token, userId, now.toISOString(), expiresAt.toISOString());
  return token;
}

/** Auth requerido: valida Bearer token, adjunta req.user. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "No autenticado." });
    return;
  }
  const user = getSessionUser(token);
  if (!user) {
    res.status(401).json({ error: "No autenticado." });
    return;
  }
  req.user = user;
  next();
}

/** Solo admin. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "No autorizado. Se requiere rol de administrador." });
    return;
  }
  next();
}
