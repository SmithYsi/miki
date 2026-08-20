import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import seed, { type EventType } from "./seed-data.js";
import { hashPassword } from "./crypto.js";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "data");
mkdirSync(dataDir, { recursive: true });

// timeout para esperar locks de otros procesos (tests en paralelo); sin esto muere con SQLITE_BUSY.
export const db = new DatabaseSync(process.env.MIKI_DB_PATH ?? join(dataDir, "miki.db"), { timeout: 5000 });

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  image_url TEXT NOT NULL DEFAULT '',
  available INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  intensidad INTEGER,
  dulzura INTEGER,
  con_leche INTEGER,
  temperatura TEXT,
  tipo TEXT NOT NULL DEFAULT 'otro'
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('evento','fiesta','programa')),
  price INTEGER,
  capacity INTEGER,
  spots_taken INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS reservas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  guests INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  created_at TEXT NOT NULL,
  UNIQUE(name, date, time)
);
CREATE TABLE IF NOT EXISTS horarios (
  day TEXT PRIMARY KEY,
  open TEXT,
  close TEXT,
  closed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'empleado' CHECK(role IN ('admin','empleado')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS event_inscripciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(event_id, email)
);
CREATE TABLE IF NOT EXISTS testimonios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cita TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS mensajes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  mensaje TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS newsletter (
  email TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inscripciones_event ON event_inscripciones(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
`);

// Migración incremental: agregar columnas nuevas si no existen (DB existente)
// ponytail: nombres hardcodeados, nunca pasar input de usuario
function migrateTable(table: string, columns: { name: string; type: string; def?: string }[]) {
  const existing = new Set(
    (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((r) => r.name),
  );
  for (const col of columns) {
    if (!existing.has(col.name)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}${col.def ? ` DEFAULT ${col.def}` : ''}`);
    }
  }
}

migrateTable("items", [
  { name: "intensidad", type: "INTEGER" },
  { name: "dulzura", type: "INTEGER" },
  { name: "con_leche", type: "INTEGER" },
  { name: "temperatura", type: "TEXT" },
  { name: "tipo", type: "TEXT NOT NULL", def: "'otro'" },
]);
migrateTable("events", [
  { name: "tags", type: "TEXT NOT NULL", def: "'[]'" },
]);

const count = (table: string) => (db.prepare(`SELECT COUNT(*) c FROM ${table}`).get() as { c: number }).c;

if (count("categories") === 0) {
  const insCat = db.prepare("INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)");
  const insItem = db.prepare(
    "INSERT INTO items (category_id, name, description, price, tags, image_url, available, sort_order, intensidad, dulzura, con_leche, temperatura, tipo) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)"
  );
  const insEvent = db.prepare(
    "INSERT INTO events (title, description, date, time, type, price, capacity, spots_taken, image_url, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insHorario = db.prepare("INSERT INTO horarios (day, open, close, closed) VALUES (?, ?, ?, ?)");

  seed.categories.forEach((cat, ci) => {
    insCat.run(cat.name, cat.description, ci + 1);
    cat.items.forEach((item, ii) => {
      insItem.run(
        ci + 1, item.name, item.description, item.price,
        JSON.stringify(item.tags ?? []), item.image_url ?? "", ii + 1,
        item.intensidad ?? null, item.dulzura ?? null,
        item.con_leche === true ? 1 : item.con_leche === false ? 0 : null,
        item.temperatura ?? null, item.tipo ?? "otro",
      );
    });
  });

  seed.events.forEach((e) => {
    insEvent.run(
      e.title, e.description, e.date, e.time, e.type,
      e.price, e.capacity, e.spots_taken, e.image,
      JSON.stringify(e.tags ?? []),
    );
  });

  seed.horarios.forEach((h) => insHorario.run(h.day, h.open, h.close, h.closed ? 1 : 0));
}

if (count("testimonios") === 0) {
  const insTestimonio = db.prepare("INSERT INTO testimonios (cita, nombre, rol, sort_order) VALUES (?, ?, ?, ?)");
  seed.testimonios.forEach((t, i) => insTestimonio.run(t.cita, t.nombre, t.rol, i + 1));
}

if (count("users") === 0) {
  const email = (process.env.ADMIN_EMAIL ?? "admin@cafemiki.mx").trim().toLowerCase();
  const pass = process.env.ADMIN_PASS ?? "admin123";
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASS) {
    throw new Error("ADMIN_PASS es obligatorio en producción para crear el usuario admin.");
  }
  db.prepare("INSERT INTO users (email, password_hash, name, role, created_at) VALUES (?, ?, 'Admin', 'admin', ?)")
    .run(email, hashPassword(pass), new Date().toISOString());
}

export function getMenu() {
  const categories = db.prepare("SELECT id, name, description, sort_order FROM categories ORDER BY sort_order").all();
  const items = db
    .prepare("SELECT id, category_id, name, description, price, tags, image_url, available, sort_order, intensidad, dulzura, con_leche, temperatura, tipo FROM items ORDER BY category_id, sort_order")
    .all()
    .map((r: any) => ({
      ...r,
      tags: JSON.parse(r.tags),
      available: !!r.available,
      con_leche: r.con_leche === null ? null : !!r.con_leche,
    }));
  return { categories, items };
}

export function getEvents(type?: EventType) {
  // "hoy" en fecha local (CDMX), no date('now') que es UTC: entre 18:00 y 00:00 local
  // UTC ya es "mañana" y los eventos de hoy desaparecerían del listado.
  const ahora = new Date();
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
  const base = "SELECT id, title, description, date, time, type, price, capacity, spots_taken, image_url, tags FROM events WHERE date >= ?";
  const sql = type ? `${base} AND type = ? ORDER BY date, time` : `${base} ORDER BY date, time`;
  const stmt = db.prepare(sql);
  const rows = (type ? stmt.all(hoy, type) : stmt.all(hoy)) as any[];
  return rows.map((r) => ({ ...r, tags: JSON.parse(r.tags) }));
}

export function getTestimonios() {
  return db.prepare("SELECT id, cita, nombre, rol FROM testimonios ORDER BY sort_order").all();
}

export class DuplicateReservaError extends Error {}

export function insertReserva(r: {
  name: string; email: string; phone: string; date: string; time: string; guests: number; notes?: string;
}) {
  const created_at = new Date().toISOString();
  try {
    const { lastInsertRowid } = db
      .prepare("INSERT INTO reservas (name, email, phone, date, time, guests, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)")
      .run(r.name, r.email, r.phone, r.date, r.time, r.guests, r.notes ?? null, created_at);
    return { id: Number(lastInsertRowid), status: "pendiente", ...r };
  } catch (err) {
    if (String(err).includes("UNIQUE")) throw new DuplicateReservaError("Ya existe una reserva con ese nombre, fecha y hora.");
    throw err;
  }
}

export function getHorarios() {
  return db
    .prepare("SELECT day, open, close, closed FROM horarios ORDER BY CASE day WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 ELSE 7 END")
    .all()
    .map((r: any) => ({ day: r.day, open: r.open, close: r.close, closed: !!r.closed }));
}

export function createUser(email: string, passwordHash: string, name: string, role: "admin" | "empleado") {
  db.prepare("INSERT INTO users (email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(email, passwordHash, name, role, new Date().toISOString());
}

export function getUserByEmail(email: string) {
  return db.prepare("SELECT id, email, password_hash, name, role FROM users WHERE email = ?").get(email) as
    | { id: number; email: string; password_hash: string; name: string; role: "admin" | "empleado" }
    | undefined;
}

export function insertSession(token: string, userId: number, createdAt: string, expiresAt: string) {
  db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(token, userId, createdAt, expiresAt);
}

/** Devuelve el usuario de una sesión activa; borra sesiones expiradas (expiración perezosa). */
export function getSessionUser(token: string) {
  const row = db.prepare(
    "SELECT u.id, u.email, u.name, u.role, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?"
  ).get(token) as { id: number; email: string; name: string; role: "admin" | "empleado"; expires_at: string } | undefined;
  if (!row) return undefined;
  if (row.expires_at <= new Date().toISOString()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return undefined;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export function deleteSession(token: string) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export class JoinEventError extends Error {
  code: "duplicado" | "lleno" | "pasado";
  constructor(code: "duplicado" | "lleno" | "pasado") {
    const msg =
      code === "duplicado"
        ? "Ya tienes un lugar apartado en este evento con ese correo."
        : code === "lleno"
          ? "El evento está lleno."
          : "Este evento ya terminó.";
    super(msg);
    this.code = code;
  }
}

export function joinEvent(eventId: number, name: string, email: string) {
  const evento = db.prepare("SELECT id, date, time, capacity, spots_taken FROM events WHERE id = ?").get(eventId) as
    | { id: number; date: string; time: string; capacity: number | null; spots_taken: number }
    | undefined;
  if (!evento) return null;

  // Mismo cómputo de hoy/hora local que reservas.ts: un evento de hoy ya terminado no acepta inscripciones.
  const ahora = new Date();
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
  const ahoraStr = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  if (evento.date < hoy || (evento.date === hoy && evento.time <= ahoraStr)) throw new JoinEventError("pasado");

  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO event_inscripciones (event_id, name, email, created_at) VALUES (?, ?, ?, ?)")
      .run(eventId, name, email, new Date().toISOString());
    if (evento.capacity !== null) {
      const r = db.prepare("UPDATE events SET spots_taken = spots_taken + 1 WHERE id = ? AND spots_taken < capacity").run(eventId);
      if (r.changes === 0) throw new JoinEventError("lleno");
    } else {
      db.prepare("UPDATE events SET spots_taken = spots_taken + 1 WHERE id = ?").run(eventId);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    if (err instanceof JoinEventError) throw err;
    if (String(err).includes("UNIQUE")) throw new JoinEventError("duplicado");
    throw err;
  }

  const final = db.prepare("SELECT id, capacity, spots_taken FROM events WHERE id = ?").get(eventId) as
    | { id: number; capacity: number | null; spots_taken: number }
    | undefined;
  const inscripcion = db.prepare("SELECT id, event_id, name, email, created_at FROM event_inscripciones WHERE event_id = ? AND email = ? ORDER BY id DESC LIMIT 1").get(eventId, email) as
    | { id: number; event_id: number; name: string; email: string; created_at: string }
    | undefined;
  return {
    id: inscripcion!.id,
    event_id: inscripcion!.event_id,
    name: inscripcion!.name,
    email: inscripcion!.email,
    created_at: inscripcion!.created_at,
    spots_taken: final!.spots_taken,
    spots_left: final!.capacity === null ? null : final!.capacity - final!.spots_taken,
  };
}

/** Cancela una inscripción: borra el registro y decrementa spots_taken. Devuelve null si no existe. */
export function cancelJoinEvent(eventId: number, email: string) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const r = db.prepare("DELETE FROM event_inscripciones WHERE event_id = ? AND email = ?").run(eventId, email);
    if (r.changes === 0) {
      db.exec("ROLLBACK");
      return null;
    }
    db.prepare("UPDATE events SET spots_taken = MAX(0, spots_taken - 1) WHERE id = ?").run(eventId);
    db.exec("COMMIT");
    // Mismo shape que joinEvent: SELECT post-cambio para spots_taken y spots_left.
    const final = db.prepare("SELECT capacity, spots_taken FROM events WHERE id = ?").get(eventId) as
      | { capacity: number | null; spots_taken: number }
      | undefined;
    if (!final) return null;
    return {
      ok: true,
      spots_taken: final.spots_taken,
      spots_left: final.capacity === null ? null : final.capacity - final.spots_taken,
    };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function insertMensaje(nombre: string, email: string, mensaje: string | null) {
  db.prepare("INSERT INTO mensajes (nombre, email, mensaje, created_at) VALUES (?, ?, ?, ?)")
    .run(nombre, email, mensaje, new Date().toISOString());
}

/** Suscribe al newsletter; el duplicado se ignora silenciosamente (INSERT OR IGNORE). */
export function subscribeNewsletter(email: string) {
  db.prepare("INSERT OR IGNORE INTO newsletter (email, created_at) VALUES (?, ?)").run(email, new Date().toISOString());
}

const RESERVA_FIELDS = "id, name, email, phone, date, time, guests, notes, status, created_at";
export function getReservas(status?: string) {
  const rows = status
    ? db.prepare(`SELECT ${RESERVA_FIELDS} FROM reservas WHERE status = ? ORDER BY date, time`).all(status)
    : db.prepare(`SELECT ${RESERVA_FIELDS} FROM reservas ORDER BY date, time`).all();
  return rows as unknown as ReservaRow[];
}

export function setReservaStatus(id: number, status: string) {
  const r = db.prepare(`UPDATE reservas SET status = ? WHERE id = ?`).run(status, id);
  if (r.changes === 0) return null;
  return db.prepare(`SELECT ${RESERVA_FIELDS} FROM reservas WHERE id = ?`).get(id) as unknown as ReservaRow;
}

export interface ReservaRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes: string | null;
  status: string;
  created_at: string;
}
