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
