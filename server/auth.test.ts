import { test, after } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, generateToken, createSession } from "./auth.js";
import { createUser, deleteSession, getSessionUser, getUserByEmail, db } from "./db.js";

const emailsCreados: string[] = [];

after(() => {
  // ponytail: no ensuciar la DB de dev con usuarios de test
  for (const email of emailsCreados) db.prepare("DELETE FROM users WHERE email = ?").run(email);
});

test("hash/verify roundtrip correcto", () => {
  const stored = hashPassword("secreto-123");
  assert.ok(stored.includes(":"));
  assert.equal(verifyPassword("secreto-123", stored), true);
});

test("verify falla con password incorrecto", () => {
  const stored = hashPassword("secreto-123");
  assert.equal(verifyPassword("mal-password", stored), false);
});

test("hash produce valores únicos (salt aleatorio)", () => {
  assert.notEqual(hashPassword("secreto-123"), hashPassword("secreto-123"));
});

test("token generado tiene 64 chars hex", () => {
  assert.match(generateToken(), /^[0-9a-f]{64}$/);
});

test("sesión: crear → resolver → borrar", () => {
  const email = `test-sesion-${Date.now()}@test.com`;
  emailsCreados.push(email);
  createUser(email, hashPassword("secreto-123"), "Test", "admin");
  const user = getUserByEmail(email) as { id: number; email: string; role: "admin" | "empleado" };

  const token = createSession(user.id);
  const resolved = getSessionUser(token);
  assert.equal(resolved?.email, email);
  assert.equal(resolved?.role, "admin");

  deleteSession(token);
  assert.equal(getSessionUser(token), undefined);
});
