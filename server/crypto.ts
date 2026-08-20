import { randomBytes, scryptSync } from "node:crypto";

/** Hash "salt:hash" con scrypt (64 bytes), sin dependencias externas. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
