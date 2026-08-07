import { test, after } from "node:test";
import assert from "node:assert/strict";
import { joinEvent, JoinEventError, getEvents, db } from "./db.js";

interface TestEvent {
  id: number;
  capacity: number | null;
  spots_taken: number;
}

const emailsCreados: string[] = [];

after(() => {
  // ponytail: no ensuciar la DB de dev con inscripciones de test
  for (const email of emailsCreados) db.prepare("DELETE FROM event_inscripciones WHERE email = ?").run(email);
});

// ponytail: la DB es persistente (server/data/miki.db); los tests resetean spots_taken
// para ser deterministas sin importar cuántas corridas hubo antes.
function withCleanEvent(fn: (e: TestEvent) => void) {
  const evs = getEvents() as unknown as TestEvent[];
  const evento = evs.find((e) => e.capacity === 12) ?? evs[evs.length - 1];
  const original = evento.spots_taken;
  db.prepare("UPDATE events SET spots_taken = 0 WHERE id = ?").run(evento.id);
  try {
    fn(evento);
  } finally {
    db.prepare("UPDATE events SET spots_taken = ? WHERE id = ?").run(original, evento.id);
  }
}

test("inscripción exitosa suma spots_taken y devuelve spots_left", () => {
  withCleanEvent((evento) => {
    const email = `join-ok-${Date.now()}@test.com`;
    emailsCreados.push(email);
    const r = joinEvent(evento.id, "Ana Torres", email);
    assert.ok(r, "inscripción creada");
    assert.equal(r.spots_taken, 1);
    assert.equal(r.spots_left, 11);
  });
});

test("inscripción duplicada (mismo email) lanza error duplicado", () => {
  withCleanEvent((evento) => {
    const email = `join-dup-${Date.now()}@test.com`;
    emailsCreados.push(email);
    assert.ok(joinEvent(evento.id, "Ana Torres", email));
    assert.throws(
      () => joinEvent(evento.id, "Ana Torres", email),
      (e: unknown) => e instanceof JoinEventError && e.code === "duplicado",
    );
  });
});

test("evento inexistente devuelve null", () => {
  assert.equal(joinEvent(999999, "Ana", "a@b.com"), null);
});

test("evento lleno lanza error lleno", () => {
  const evs = getEvents() as unknown as TestEvent[];
  const evento = evs.find((e) => e.capacity === 12) ?? evs[evs.length - 1];
  const original = evento.spots_taken;
  db.prepare("UPDATE events SET spots_taken = capacity WHERE id = ?").run(evento.id);
  try {
    assert.throws(
      () => joinEvent(evento.id, "Ana Torres", `join-full-${Date.now()}@test.com`),
      (e: unknown) => e instanceof JoinEventError && e.code === "lleno",
    );
  } finally {
    db.prepare("UPDATE events SET spots_taken = ? WHERE id = ?").run(original, evento.id);
  }
});

test("evento con capacity null permite inscribirse y devuelve spots_left null", () => {
  const evs = getEvents() as unknown as TestEvent[];
  const evento = evs.find((e) => e.capacity === null);
  if (!evento) return; // el seed siempre tiene uno con capacity null; si no, se omite
  const email = `join-nolimit-${Date.now()}@test.com`;
  emailsCreados.push(email);
  const r = joinEvent(evento.id, "Ana Torres", email);
  assert.ok(r);
  assert.equal(r.spots_left, null);
});
