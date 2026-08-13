import { test } from "node:test";
import assert from "node:assert/strict";
import { reservaSchema, validarReglasReserva } from "./reservas.js";

const valido = {
  name: "Ana Torres",
  email: "ana@test.com",
  phone: "5512345678",
  date: "2026-09-15",
  time: "10:00",
  guests: 2,
};

const horarios = [
  { day: "Lunes", open: "08:00", close: "20:00", closed: false },
  { day: "Martes", open: "08:00", close: "20:00", closed: false },
  { day: "Miércoles", open: null, close: null, closed: true },
  { day: "Sábado", open: "09:00", close: "21:00", closed: false },
  { day: "Domingo", open: "09:00", close: "15:00", closed: false },
];

test("reserva válida pasa el schema", () => {
  assert.equal(reservaSchema.safeParse(valido).success, true);
});

test("email inválido es rechazado", () => {
  const r = reservaSchema.safeParse({ ...valido, email: "no-es-email" });
  assert.equal(r.success, false);
});

test("fecha inexistente es rechazada", () => {
  const r = reservaSchema.safeParse({ ...valido, date: "2026-02-31" });
  assert.equal(r.success, false);
});

test("guests fuera de rango es rechazado", () => {
  const r = reservaSchema.safeParse({ ...valido, guests: 21 });
  assert.equal(r.success, false);
});

test("regla: día cerrado es rechazado", () => {
  const error = validarReglasReserva({ ...valido, date: "2026-09-16" }, horarios); // miércoles
  assert.ok(error);
});

test("regla: hora fuera del horario del día es rechazada", () => {
  const error = validarReglasReserva({ ...valido, date: "2026-09-13", time: "21:30" }, horarios); // domingo cierra 15:00
  assert.ok(error);
  const ok = validarReglasReserva({ ...valido, date: "2026-09-13", time: "14:00" }, horarios);
  assert.equal(ok, null);
});

test("regla: fecha pasada es rechazada", () => {
  const error = validarReglasReserva({ ...valido, date: "2020-01-01" }, horarios);
  assert.ok(error);
});

const DIAS_HOY = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function hoyStr() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

test("regla: hoy con hora pasada o igual a ahora es rechazada", () => {
  const h = new Date();
  const ahoraStr = `${String(h.getHours()).padStart(2, "0")}:${String(h.getMinutes()).padStart(2, "0")}`;
  const horariosHoy = [{ day: DIAS_HOY[h.getDay()], open: "00:00", close: "23:59", closed: false }];

  assert.ok(validarReglasReserva({ ...valido, date: hoyStr(), time: "00:00" }, horariosHoy), "hora pasada debe rechazarse");
  assert.ok(validarReglasReserva({ ...valido, date: hoyStr(), time: ahoraStr }, horariosHoy), "la hora actual debe rechazarse");
});

test("regla: hoy con hora futura es aceptada", () => {
  const h = new Date();
  const fut = new Date(h.getTime() + 60_000);
  // ponytail: si son las 23:59 el minuto siguiente ya es mañana; no hay hora futura hoy que probar.
  if (hoyStr() !== `${fut.getFullYear()}-${String(fut.getMonth() + 1).padStart(2, "0")}-${String(fut.getDate()).padStart(2, "0")}`) return;
  const futStr = `${String(fut.getHours()).padStart(2, "0")}:${String(fut.getMinutes()).padStart(2, "0")}`;
  const horariosHoy = [{ day: DIAS_HOY[h.getDay()], open: "00:00", close: "23:59", closed: false }];

  assert.equal(validarReglasReserva({ ...valido, date: hoyStr(), time: futStr }, horariosHoy), null);
});
