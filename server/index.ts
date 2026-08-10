import express from "express";
import cors from "cors";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  getMenu,
  getEvents,
  getTestimonios,
  insertReserva,
  getHorarios,
  DuplicateReservaError,
  joinEvent,
  cancelJoinEvent,
  insertMensaje,
  subscribeNewsletter,
  JoinEventError,
  getUserByEmail,
  getReservas,
  setReservaStatus,
  deleteSession,
} from "./db.js";
import { reservaSchema, validarReglasReserva } from "./reservas.js";
import { verifyPassword, createSession, hashPassword, requireAuth, requireAdmin } from "./auth.js";

const app = express();

// ponytail: hash dummy para igualar el timing del verify con emails inexistentes.
const DUMMY_HASH = hashPassword(randomBytes(16).toString("hex"));

const ORIGINS = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:4173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: ORIGINS.length ? ORIGINS : false }));
app.use(express.json());

// ponytail: rate limit por IP en memoria. Reemplazar por store compartido
// (Redis) si el API se escala a varios procesos.
function makeRateLimit(limit: number, windowMs: number, message: string) {
  const hits = new Map<string, number[]>();
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip ?? "unknown";
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) return res.status(429).json({ error: message });
    recent.push(now);
    hits.set(ip, recent);
    // ponytail: evicción perezosa de IPs inactivas para no crecer sin límite.
    if (hits.size > 1000) {
      for (const [k, v] of hits) {
        if (v.length === 0 || now - v[v.length - 1] >= windowMs) hits.delete(k);
      }
    }
    next();
  };
}

const limitReservas = makeRateLimit(10, 10 * 60 * 1000, "Demasiadas reservas en poco tiempo. Inténtalo en unos minutos.");
const limitInscripciones = makeRateLimit(10, 10 * 60 * 1000, "Demasiadas solicitudes en poco tiempo. Inténtalo en unos minutos.");
const limitContacto = makeRateLimit(10, 10 * 60 * 1000, "Demasiados mensajes en poco tiempo. Inténtalo en unos minutos.");
const limitLogin = makeRateLimit(5, 10 * 60 * 1000, "Demasiados intentos. Inténtalo en unos minutos.");

// ponytail: backoff por cuenta (clave = email) contra fuerza bruta, además del límite por IP.
const loginFails = new Map<string, number[]>();
function limitLoginAccount(req: express.Request, res: express.Response, next: express.NextFunction) {
  const email = String((req.body as { email?: unknown })?.email ?? "").trim().toLowerCase();
  if (!email) return next();
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const fails = (loginFails.get(email) ?? []).filter((t) => now - t < windowMs);
  if (fails.length >= 10) return res.status(429).json({ error: "Demasiados intentos para esta cuenta. Inténtalo en unos minutos." });
  res.on("finish", () => {
    if (res.statusCode === 401) {
      fails.push(now);
      loginFails.set(email, fails);
    }
  });
  next();
}

app.get("/api/menu", (_req, res) => res.json(getMenu()));

const eventTypeSchema = z.enum(["evento", "fiesta", "programa"], { message: "Tipo de evento inválido." });

app.get("/api/events", (req, res) => {
  const raw = req.query.type;
  if (raw !== undefined) {
    const parsed = eventTypeSchema.safeParse(raw);
    if (!parsed.success) return res.status(400).json({ error: "Tipo de evento inválido." });
    return res.json(getEvents(parsed.data));
  }
  res.json(getEvents());
});

app.get("/api/testimonios", (_req, res) => res.json(getTestimonios()));

app.get("/api/horarios", (_req, res) => res.json(getHorarios()));

app.post("/api/reservas", limitReservas, (req, res) => {  const parsed = reservaSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return res.status(400).json({ error: msg });
  }

  const error = validarReglasReserva(parsed.data, getHorarios());
  if (error) return res.status(400).json({ error });

  try {
    const reserva = insertReserva(parsed.data);
    res.status(201).json(reserva);
  } catch (err) {
    if (err instanceof DuplicateReservaError) return res.status(409).json({ error: err.message });
    throw err;
  }
});

const inscripcionSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(80, "El nombre es demasiado largo."),
  email: z.email("Ingresa un correo electrónico válido."),
});

app.post("/api/events/:id/join", limitInscripciones, (req, res) => {
  const parsed = inscripcionSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return res.status(400).json({ error: msg });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ error: "Evento no encontrado." });

  try {
    const resultado = joinEvent(id, parsed.data.name, parsed.data.email);
    if (!resultado) return res.status(404).json({ error: "Evento no encontrado." });
    res.status(201).json(resultado);
  } catch (err) {
    if (err instanceof JoinEventError) return res.status(409).json({ error: err.message });
    throw err;
  }
});

const cancelSchema = z.object({
  email: z.email("Ingresa un correo electrónico válido."),
});

app.post("/api/events/:id/cancel", (req, res) => {
  const parsed = cancelSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return res.status(400).json({ error: msg });
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ error: "No encontramos una inscripción con ese correo." });

  const resultado = cancelJoinEvent(id, parsed.data.email);
  if (!resultado) return res.status(404).json({ error: "No encontramos una inscripción con ese correo." });
  res.json(resultado);
});

const contactoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(80, "El nombre es demasiado largo."),
  email: z.email("Ingresa un correo electrónico válido."),
  mensaje: z.string().max(1000, "El mensaje es demasiado largo.").optional(),
  newsletter: z.boolean().optional(),
});

app.post("/api/contacto", limitContacto, (req, res) => {
  const parsed = contactoSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return res.status(400).json({ error: msg });
  }
  const { nombre, email, mensaje, newsletter } = parsed.data;
  insertMensaje(nombre, email, mensaje ?? null);
  if (newsletter) subscribeNewsletter(email);
  res.status(201).json({ ok: true });
});

const loginSchema = z.object({
  email: z.email("Ingresa un correo electrónico válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

app.post("/api/auth/login", limitLogin, limitLoginAccount, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return res.status(400).json({ error: msg });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const user = getUserByEmail(email);
  // ponytail: verify contra hash dummy para no filtrar emails por timing (scrypt es lento).
  const stored = user ? user.password_hash : DUMMY_HASH;
  const ok = verifyPassword(parsed.data.password, stored);
  if (!user || !ok) {
    return res.status(401).json({ error: "Credenciales inválidas." });
  }
  const token = createSession(user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) deleteSession(token);
  res.status(204).end();
});

app.get("/api/auth/me", requireAuth, (_req, res) => {
  res.json(_req.user);
});

app.get("/api/admin/reservas", requireAuth, requireAdmin, (req, res) => {
  const status = req.query.status as string | undefined;
  if (status !== undefined && !["pendiente", "confirmada", "cancelada"].includes(status)) {
    return res.status(400).json({ error: "Estado inválido." });
  }
  res.json(getReservas(status));
});

const statusSchema = z.object({
  status: z.enum(["pendiente", "confirmada", "cancelada"], { message: "Estado inválido." }),
});

app.patch("/api/admin/reservas/:id", requireAuth, requireAdmin, (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return res.status(400).json({ error: msg });
  }
  const id = Number(req.params.id);
  const actualizada = Number.isInteger(id) && id > 0 ? setReservaStatus(id, parsed.data.status) : null;
  if (!actualizada) return res.status(404).json({ error: "Reserva no encontrada." });
  res.json(actualizada);
});

// En producción (dist/ presente), sirve el build del frontend y hace fallback SPA
// para navegación directa (solo GET con Accept: text/html; nunca para /api).
const dist = join(dirname(dirname(fileURLToPath(import.meta.url))), "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/*splat", (req, res, next) => {
    if (req.path.startsWith("/api") || !req.accepts("html")) return next();
    res.sendFile(join(dist, "index.html"));
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: "No encontrado." });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = typeof err?.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 500 ? err.statusCode : 500;
  if (status >= 500) console.error(err);
  const error = status === 400 ? "Cuerpo de la petición inválido." : "Error interno del servidor.";
  res.status(status).json({ error });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Café Miki API escuchando en http://localhost:${PORT}`));
