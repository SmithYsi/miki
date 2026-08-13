import "./test-setup.js";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { joinEvent, cancelJoinEvent, getEvents, db } from "./db.js";

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

test("cancelar inscripción la borra y decrementa spots_taken", () => {
  withCleanEvent((evento) => {
    const email = `cancel-ok-${Date.now()}@test.com`;
    emailsCreados.push(email);
    assert.ok(joinEvent(evento.id, "Ana Torres", email));
    const r = cancelJoinEvent(evento.id, email);
    assert.ok(r);
    assert.equal(r.ok, true);
    assert.equal(r.spots_taken, 0);
    const c = db
      .prepare("SELECT COUNT(*) c FROM event_inscripciones WHERE event_id = ? AND email = ?")
      .get(evento.id, email) as { c: number };
    assert.equal(c.c, 0);
    const spots = db.prepare("SELECT spots_taken FROM events WHERE id = ?").get(evento.id) as { spots_taken: number };
    assert.equal(spots.spots_taken, 0);
  });
});

test("cancelar devuelve spots_taken decrementado y spots_left correcto", () => {
  withCleanEvent((evento) => {
    const email = `cancel-spots-${Date.now()}@test.com`;
    emailsCreados.push(email);
    assert.ok(joinEvent(evento.id, "Ana Torres", email));
    const r = cancelJoinEvent(evento.id, email);
    assert.ok(r);
    // tras join: spots_taken = 1, spots_left = capacity - 1; tras cancelar: -1 y capacity - 0.
    assert.equal(r.spots_taken, 0);
    assert.equal(r.spots_left, evento.capacity === null ? null : evento.capacity);
  });
});

test("cancelar sin inscripción previa devuelve null", () => {
  withCleanEvent((evento) => {
    assert.equal(cancelJoinEvent(evento.id, `cancel-none-${Date.now()}@test.com`), null);
  });
});

test("cancelar en evento inexistente devuelve null", () => {
  assert.equal(cancelJoinEvent(999999, "nadie@test.com"), null);
});
