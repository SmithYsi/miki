// server/asistente.ts
// Asistente de conversación para Café Miki.
// Máquina de diálogo multi-turno con slots para reservas.

import { randomBytes } from "node:crypto";
import { classifyIntent, extractSlots } from "./ai.js";
import { getMenu, getEvents, getHorarios, insertReserva, DuplicateReservaError } from "./db.js";
import { validarReglasReserva } from "./reservas.js";
import type { Intent } from "./ai.js";

// --- Estado de conversación ---

interface Turno {
  intent: Intent;
  slots: Record<string, string>;
  missing: string[];
  askCount: number;
}

interface Conversacion {
  id: string;
  turno?: Turno;
  lastActive: number;
}

const MAX_CONVERSACIONES = 200;
const conversaciones = new Map<string, Conversacion>();
const TTL_MS = 30 * 60 * 1000;

function eviction() {
  if (conversaciones.size < MAX_CONVERSACIONES) return;
  const now = Date.now();
  for (const [id, c] of conversaciones) {
    if (now - c.lastActive > TTL_MS) conversaciones.delete(id);
  }
}

function getOrCreate(conversationId?: string): Conversacion {
  eviction();
  const id = conversationId || randomBytes(16).toString("hex");
  let c = conversaciones.get(id);
  if (!c) {
    if (conversaciones.size >= MAX_CONVERSACIONES) {
      return { id, lastActive: Date.now() };
    }
    c = { id, lastActive: Date.now() };
    conversaciones.set(id, c);
  }
  c.lastActive = Date.now();
  return c;
}

// --- Slots de reserva ---

const RESERVA_SLOTS = ["fecha", "hora", "personas", "nombre"] as const;
const SLOT_PROMPTS: Record<string, string> = {
  fecha: "¿Para qué día te gustaría la reserva?",
  hora: "¿A qué hora?",
  personas: "¿Cuántas personas serán?",
  nombre: "¿A nombre de quién quedó la reserva?",
};

const MAX_ASK = 4;

// --- Formateadores ---

let _horariosCache: ReturnType<typeof getHorarios> | null = null;
function getCachedHorarios() {
  if (!_horariosCache) _horariosCache = getHorarios();
  return _horariosCache;
}

function formatHorarios(): string {
  const horarios = getCachedHorarios();
  const lineas = horarios.map((h) => {
    if (h.closed) return `  ${h.day}: cerrado`;
    return `  ${h.day}: ${h.open}–${h.close}`;
  });
  return `Nuestros horarios:\n${lineas.join("\n")}`;
}

function formatPrecios(query: string): string {
  const { categories, items } = getMenu();
  const q = query.toLowerCase();
  if (!q) return "¿Qué artículo te interesa? Puedo buscarte el precio de cualquier cosa de nuestra carta.";
  const encontrados = items.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.tags.some((tag: string) => tag.toLowerCase().includes(q)),
  );
  if (encontrados.length === 0) {
    const cat = categories.find((c) => String(c.name).toLowerCase().includes(q));
    if (cat) {
      const catItems = items.filter((i) => i.category_id === cat.id);
      return `${cat.name}:\n${catItems.map((i) => `  ${i.name} — $${i.price}`).join("\n")}`;
    }
    return "No encontré ese artículo en nuestra carta. ¿Puedes ser más específico?";
  }
  return encontrados.map((i) => `${i.name} — $${i.price}`).join("\n");
}

function formatEventos(): string {
  const eventos = getEvents();
  if (eventos.length === 0) return "No hay eventos próximos por el momento.";
  return eventos
    .slice(0, 5)
    .map((e) => {
      const libres = e.capacity ? `${e.capacity - e.spots_taken} lugares` : "sin límite";
      return `  ${e.title} — ${e.date} ${e.time}h — ${e.price === 0 ? "Gratis" : `$${e.price}`} (${libres})`;
    })
    .join("\n");
}

// --- Lógica de diálogo ---

function faltantes(slots: Record<string, string>): string[] {
  return RESERVA_SLOTS.filter((s) => !slots[s]);
}

async function procesarReserva(con: Conversacion, userMsg: string): Promise<string> {
  const extracted = extractSlots(userMsg);
  const slots = { ...con.turno?.slots, ...extracted };
  const missing = faltantes(slots);

  if (!con.turno || con.turno.intent !== "reserva") {
    con.turno = { intent: "reserva", slots, missing, askCount: 0 };
  } else {
    con.turno.slots = slots;
    con.turno.missing = missing;
  }

  if (missing.length === 0) {
    return crearReserva(con);
  }

  con.turno.askCount++;
  if (con.turno.askCount > MAX_ASK) {
    con.turno = undefined;
    return "Parece que tenemos problemas completando tu reserva. ¿Te gustaría llamarnos directamente o intentarlo más tarde?";
  }

  const slotActual = missing[0];
  return SLOT_PROMPTS[slotActual] || "¿Puedes darme más detalles?";
}

function crearReserva(con: Conversacion): string {
  const s = con.turno!.slots;
  const date = normalizarFecha(s.fecha);
  if (!date) {
    con.turno = undefined;
    return "No pude entender la fecha. ¿Puedes darme una fecha concreta como '2026-10-15' o un día de la semana?";
  }

  const data = {
    name: s.nombre || "Cliente",
    email: "asistente@cafemiki.mx",
    phone: "0000000000",
    date,
    time: s.hora || "12:00",
    guests: parseInt(s.personas || "2", 10),
  };

  const horarios = getCachedHorarios();
  const error = validarReglasReserva(data as any, horarios);
  if (error) {
    con.turno = undefined;
    return `No pude hacer la reserva: ${error}. ¿Quieres intentar con otra fecha u hora?`;
  }

  try {
    const reserva = insertReserva(data);
    con.turno = undefined;
    return `¡Listo! Tu reserva quedó registrada para el ${reserva.date} a las ${reserva.time} para ${reserva.guests} persona(s). Te esperamos en Café Miki.`;
  } catch (err) {
    if (err instanceof DuplicateReservaError) {
      con.turno = undefined;
      return "Ya existe una reserva con ese nombre, fecha y hora. ¿Quieres elegir otra fecha u hora?";
    }
    con.turno = undefined;
    return "Hubo un problema al crear tu reserva. Por favor, intenta de nuevo o llámanos directamente.";
  }
}

function normalizarFecha(raw: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (raw === "mañana") {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const dias: Record<string, number> = {
    lunes: 1, martes: 2, miércoles: 3, miercoles: 3,
    jueves: 4, viernes: 5, sábado: 6, sabado: 6, domingo: 0,
  };
  const num = dias[raw.toLowerCase()];
  if (num !== undefined) {
    const hoy = new Date();
    const actual = hoy.getDay();
    let diff = num - actual;
    if (diff <= 0) diff += 7;
    hoy.setDate(hoy.getDate() + diff);
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  }
  return null;
}

// --- API pública ---

export interface AsistenteInput {
  conversationId?: string;
  message: string;
}

export interface AsistenteOutput {
  conversationId: string;
  reply: string;
}

const SALUDO = "¡Hola! Soy el asistente de Café Miki. Puedo ayudarte con:\n  • Hacer una reserva\n  • Consultar horarios\n  • Conocer precios del menú\n  • Ver eventos próximos\n\n¿En qué te puedo ayudar?";

/** Extrae la palabra clave de búsqueda de una pregunta de precios. */
function extraerBusqueda(text: string): string {
  return text
    .replace(/[¿?¡!]/g, "")
    .replace(/\b(cuánto|cuesta|sale|vale|costo|precio|precios|el|la|los|las|de|del|un|una|unos|unas|quiero|saber|cuanto)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export async function procesarMensaje(input: AsistenteInput): Promise<AsistenteOutput> {
  const con = getOrCreate(input.conversationId);
  const msg = input.message.trim();

  if (!msg) {
    return { conversationId: con.id, reply: "¿En qué te puedo ayudar?" };
  }

  if (con.turno?.intent === "reserva") {
    const reply = await procesarReserva(con, msg);
    return { conversationId: con.id, reply };
  }

  const intent = await classifyIntent(msg);
  let reply: string;

  switch (intent) {
    case "reserva":
      reply = await procesarReserva(con, msg);
      break;
    case "horarios":
      reply = formatHorarios();
      break;
    case "precios":
      reply = formatPrecios(extraerBusqueda(msg));
      break;
    case "eventos":
      reply = formatEventos();
      break;
    case "saludo":
      reply = SALUDO;
      break;
    default:
      reply = "No estoy seguro de entenderte. Puedo ayudarte con reservas, horarios, precios o eventos. ¿Qué necesitas?";
  }

  return { conversationId: con.id, reply };
}
