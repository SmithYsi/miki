import "./test-setup.js";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { insertMensaje, subscribeNewsletter, db } from "./db.js";

const emailsCreados: string[] = [];

after(() => {
  // ponytail: no ensuciar la DB de dev con mensajes de test
  for (const email of emailsCreados) {
    db.prepare("DELETE FROM mensajes WHERE email = ?").run(email);
    db.prepare("DELETE FROM newsletter WHERE email = ?").run(email);
  }
});

test("insertMensaje guarda nombre, email y mensaje", () => {
  const email = `contacto-ok-${Date.now()}@test.com`;
  emailsCreados.push(email);
  insertMensaje("Ana Torres", email, "Hola, quiero saber horarios.");
  const row = db.prepare("SELECT nombre, email, mensaje FROM mensajes WHERE email = ?").get(email) as {
    nombre: string;
    email: string;
    mensaje: string;
  };
  assert.deepEqual({ ...row }, { nombre: "Ana Torres", email, mensaje: "Hola, quiero saber horarios." });
});

test("insertMensaje acepta mensaje nulo (solo newsletter)", () => {
  const email = `contacto-nomessage-${Date.now()}@test.com`;
  emailsCreados.push(email);
  insertMensaje("Luis", email, null);
  const row = db.prepare("SELECT mensaje FROM mensajes WHERE email = ?").get(email) as { mensaje: string | null };
  assert.equal(row.mensaje, null);
});

test("subscribeNewsletter ignora duplicados silenciosamente", () => {
  const email = `newsletter-${Date.now()}@test.com`;
  emailsCreados.push(email);
  subscribeNewsletter(email);
  subscribeNewsletter(email);
  const c = (db.prepare("SELECT COUNT(*) c FROM newsletter WHERE email = ?").get(email) as { c: number }).c;
  assert.equal(c, 1);
});
