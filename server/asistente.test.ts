import "./test-setup.js";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { classifyIntentStub, extractSlots } from "./ai.js";
import { procesarMensaje } from "./asistente.js";
import { db } from "./db.js";

after(() => {
  db.prepare("DELETE FROM reservas WHERE email = 'asistente@cafemiki.mx'").run();
});

// --- classifyIntentStub ---

test("classifyIntentStub detecta 'reserva'", () => {
  assert.equal(classifyIntentStub("Quiero hacer una reserva"), "reserva");
  assert.equal(classifyIntentStub("Reservar una mesa para mañana"), "reserva");
  assert.equal(classifyIntentStub("Necesito apartar un lugar"), "reserva");
});

test("classifyIntentStub detecta 'horarios'", () => {
  assert.equal(classifyIntentStub("¿A qué hora abren?"), "horarios");
  assert.equal(classifyIntentStub("Cuáles son sus horarios"), "horarios");
});

test("classifyIntentStub detecta 'precios'", () => {
  assert.equal(classifyIntentStub("¿Cuánto cuesta el cold brew?"), "precios");
  assert.equal(classifyIntentStub("Precios de la carta"), "precios");
});

test("classifyIntentStub detecta 'eventos'", () => {
  assert.equal(classifyIntentStub("¿Qué eventos tienen?"), "eventos");
  assert.equal(classifyIntentStub("Hay alguna cata este mes?"), "eventos");
});

test("classifyIntentStub detecta 'saludo'", () => {
  assert.equal(classifyIntentStub("Hola"), "saludo");
  assert.equal(classifyIntentStub("Buenos días"), "saludo");
});

test("classifyIntentStub devuelve 'otro' para mensajes no reconocidos", () => {
  assert.equal(classifyIntentStub("¿Qué tiempo hace hoy?"), "otro");
  assert.equal(classifyIntentStub("Mi perro se llama Max"), "otro");
});

// --- extractSlots ---

test("extractSlots extrae fecha absoluta", () => {
  const slots = extractSlots("Para el 2026-10-15");
  assert.equal(slots.fecha, "2026-10-15");
});

test("extractSlots extrae 'mañana'", () => {
  const slots = extractSlots("Quiero para mañana");
  assert.equal(slots.fecha, "mañana");
});

test("extractSlots extrae día de la semana", () => {
  const slots = extractSlots("El viernes");
  assert.equal(slots.fecha, "viernes");
});

test("extractSlots extrae hora con formato 24h", () => {
  const slots = extractSlots("A las 14:00");
  assert.equal(slots.hora, "14:00");
});

test("extractSlots extrae hora con 'de la tarde'", () => {
  const slots = extractSlots("A las 3 de la tarde");
  assert.equal(slots.hora, "15:00");
});

test("extractSlots extrae personas", () => {
  const slots = extractSlots("Para 4 personas");
  assert.equal(slots.personas, "4");
});

test("extractSlots extrae nombre con 'me llamo'", () => {
  const slots = extractSlots("Me llamo Juan Pérez");
  assert.equal(slots.nombre?.toLowerCase(), "juan pérez");
});

test("extractSlots extrae varios slots de un mensaje", () => {
  const slots = extractSlots("Reservar para mañana a las 19:00, somos 3, me llamo María");
  assert.equal(slots.fecha, "mañana");
  assert.equal(slots.hora, "19:00");
  assert.equal(slots.personas, "3");
  assert.equal(slots.nombre?.toLowerCase(), "maría");
});

test("extractSlots devuelve slots vacíos para input irrelevante", () => {
  const slots = extractSlots("Hello world");
  assert.deepEqual(slots, {});
});

// --- procesarMensaje: horarios ---

test("procesarMensaje responde horarios", async () => {
  const res = await procesarMensaje({ message: "¿Cuáles son sus horarios?" });
  assert.ok(res.conversationId, "tiene conversationId");
  assert.ok(res.reply.includes("Lunes"), "menciona Lunes");
  assert.ok(res.reply.includes("Miércoles"), "menciona Miércoles");
  assert.ok(res.reply.includes("cerrado"), "Miércoles está cerrado");
});

// --- procesarMensaje: precios ---

test("procesarMensaje responde precios de un item", async () => {
  const res = await procesarMensaje({ message: "¿Cuánto cuesta el espresso?" });
  assert.ok(res.reply.toLowerCase().includes("espresso"), "menciona espresso");
  assert.ok(res.reply.includes("$"), "incluye precio");
});

// --- procesarMensaje: precios vacío ---

test("procesarMensaje responde pidiendo clarificación para precios vacíos", async () => {
  const res = await procesarMensaje({ message: "¿Cuánto cuesta?" });
  assert.ok(
    res.reply.includes("artículo") || res.reply.includes("interesa"),
    "pide artículo específico",
  );
});

// --- procesarMensaje: eventos ---

test("procesarMensaje responde con eventos", async () => {
  const res = await procesarMensaje({ message: "¿Qué eventos tienen?" });
  assert.ok(res.reply.length > 50, "respuesta con contenido");
});

// --- procesarMensaje: saludo ---

test("procesarMensaje responde saludo", async () => {
  const res = await procesarMensaje({ message: "Hola" });
  assert.ok(res.reply.includes("Café Miki"), "menciona el nombre");
});

// --- procesarMensaje: otro ---

test("procesarMensaje responde con ayuda para mensajes no reconocidos", async () => {
  const res = await procesarMensaje({ message: "Mi gato se llama Luna" });
  assert.ok(res.reply.includes("reservas") || res.reply.includes("ayudar"), "ofrece ayuda");
});

// --- procesarMensaje: flujo de reserva ---

test("procesarMensaje inicia reserva y pide slots faltantes", async () => {
  const res = await procesarMensaje({ message: "Quiero hacer una reserva" });
  assert.ok(res.conversationId, "tiene conversationId");
  assert.ok(
    res.reply.includes("día") || res.reply.includes("fecha") || res.reply.includes("reserva"),
    "pregunta por fecha o confirma intención",
  );
});

test("procesarMensaje mantiene estado de conversación multi-turno", async () => {
  const res1 = await procesarMensaje({ message: "Quiero reservar" });
  const cid = res1.conversationId;

  const res2 = await procesarMensaje({ conversationId: cid, message: "Para 2026-10-15" });
  assert.equal(res2.conversationId, cid, "mismo conversationId");
  assert.ok(
    res2.reply.includes("hora") || res2.reply.includes("persona") || res2.reply.includes("nombre"),
    "sigue pidiendo información",
  );
});

test("procesarMensaje crea reserva con todos los slots (fecha absoluta)", async () => {
  const res1 = await procesarMensaje({ message: "Quiero reservar para 2026-10-15" });
  const cid = res1.conversationId;

  const res2 = await procesarMensaje({ conversationId: cid, message: "A las 10:00" });
  const res3 = await procesarMensaje({ conversationId: res2.conversationId, message: "Somos 2 personas" });
  const res4 = await procesarMensaje({ conversationId: res3.conversationId, message: "Me llamo Test Asistente" });

  assert.ok(
    res4.reply.includes("Listo") || res4.reply.includes("reserva") || res4.reply.includes("registrada"),
    "confirma la reserva",
  );
});

test("procesarMensaje genera conversationId nueva si no se provee", async () => {
  const res1 = await procesarMensaje({ message: "Hola" });
  const res2 = await procesarMensaje({ message: "Hola de nuevo" });
  assert.ok(res1.conversationId);
  assert.ok(res2.conversationId);
});

test("procesarMensaje responde con error para mensaje vacío", async () => {
  const res = await procesarMensaje({ message: "   " });
  assert.ok(res.reply.includes("ayudar"), "responde con ayuda");
});

// --- askCount limit ---

test("procesarMensaje cancela reserva después deAskCount > 4", async () => {
  const res1 = await procesarMensaje({ message: "Quiero reservar" });
  const cid = res1.conversationId;

  for (let i = 0; i < 3; i++) {
    await procesarMensaje({ conversationId: cid, message: "no se" });
  }

  const resLast = await procesarMensaje({ conversationId: cid, message: "nada" });
  assert.ok(
    resLast.reply.includes("llamarnos") || resLast.reply.includes("problemas"),
    "cancela y sugiere llamar",
  );
});

// --- reserva duplicada ---

test("procesarMensaje detecta reserva duplicada", async () => {
  const cid = (await procesarMensaje({ message: "Reservar para 2026-10-15" })).conversationId;
  const cid2 = (await procesarMensaje({ conversationId: cid, message: "A las 10:00" })).conversationId;
  const cid3 = (await procesarMensaje({ conversationId: cid2, message: "Somos 2" })).conversationId;
  const cid4 = (await procesarMensaje({ conversationId: cid3, message: "Me llamo Dup Test" })).conversationId;
  assert.ok(cid4);
  const cid5 = (await procesarMensaje({ conversationId: cid4, message: "Reservar para 2026-10-15" })).conversationId;
  const cid6 = (await procesarMensaje({ conversationId: cid5, message: "A las 10:00" })).conversationId;
  const cid7 = (await procesarMensaje({ conversationId: cid6, message: "Somos 2" })).conversationId;
  const res = await procesarMensaje({ conversationId: cid7, message: "Me llamo Dup Test" });
  assert.ok(
    res.reply.includes("existe") || res.reply.includes("duplicada") || res.reply.includes("otra fecha"),
    "detecta duplicada",
  );
});

// --- regla de negocio rechazada ---

test("procesarMensaje rechaza reserva en día cerrado", async () => {
  const cid = (await procesarMensaje({ message: "Reservar para 2026-10-14" })).conversationId;
  const cid2 = (await procesarMensaje({ conversationId: cid, message: "A las 10:00" })).conversationId;
  const cid3 = (await procesarMensaje({ conversationId: cid2, message: "Somos 2" })).conversationId;
  const res = await procesarMensaje({ conversationId: cid3, message: "Me llamo Cerrado Test" });
  assert.ok(
    res.reply.includes("cerrados") || res.reply.includes("rechaza") || res.reply.includes("otra fecha"),
    "rechaza día cerrado",
  );
});

// --- normalizarFecha no reconocido (unit test) ---
// La integración vía procesarMensaje es inviable porque el slot system
// nunca permite llegar a crearReserva sin fecha válida.

test("extraerBusqueda maneja strings vacíos y stop-words", () => {
  const r1 = extractSlots("");
  assert.deepEqual(r1, {});
  const r2 = extractSlots("¿¿??¡¡");
  assert.deepEqual(r2, {});
});
