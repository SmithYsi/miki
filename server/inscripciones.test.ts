import "./test-setup.js";
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

test("inscripción a evento de hoy con hora pasada lanza error pasado; con fecha futura es aceptada", () => {
  const ahora = new Date();
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hoy = fmt(ahora);
  const futura = fmt(new Date(ahora.getFullYear() + 1, ahora.getMonth(), ahora.getDate()));
  const ins = db.prepare(
    "INSERT INTO events (title, description, date, time, type, price, capacity, spots_taken, image_url) VALUES (?, ?, ?, ?, 'evento', 0, null, 0, '')"
  );
  // "00:00" siempre es <= a la hora actual local, así que el evento de hoy ya pasó sin importar la hora de corrida.
  const idPasado = Number(ins.run("Test de hoy pasado", "hora ya pasó", hoy, "00:00").lastInsertRowid);
  const idFuturo = Number(ins.run("Test de futuro", "año que viene", futura, "20:00").lastInsertRowid);
  try {
    const email = `join-pasado-${Date.now()}@test.com`;
    assert.throws(
      () => joinEvent(idPasado, "Ana Torres", email),
      (e: unknown) => e instanceof JoinEventError && e.code === "pasado",
    );
    emailsCreados.push(email);
    const r = joinEvent(idFuturo, "Ana Torres", email);
    assert.ok(r, "evento futuro acepta inscripción");
    assert.equal(r.event_id, idFuturo);
  } finally {
    db.prepare("DELETE FROM events WHERE id IN (?, ?)").run(idPasado, idFuturo);
  }
});

test("getEvents filtra con hoy local: el evento de hoy aparece y el de ayer no", () => {
  const ahora = new Date();
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hoy = fmt(ahora);
  const ayer = fmt(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1));
  const ins = db.prepare(
    "INSERT INTO events (title, description, date, time, type, price, capacity, spots_taken, image_url) VALUES (?, ?, ?, '20:00', 'evento', 0, null, 0, '')"
  );
  const idHoy = Number(ins.run("Test de hoy", "hoy", hoy).lastInsertRowid);
  const idAyer = Number(ins.run("Test de ayer", "ayer", ayer).lastInsertRowid);
  try {
    const eventos = getEvents() as unknown as Array<{ id: number }>;
    assert.ok(eventos.some((e) => e.id === idHoy), "el evento de hoy local aparece en getEvents()");
    assert.ok(!eventos.some((e) => e.id === idAyer), "el evento de ayer no aparece");
  } finally {
    db.prepare("DELETE FROM events WHERE id IN (?, ?)").run(idHoy, idAyer);
  }
});
