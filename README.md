# Café Miki

Landing page de una cafetería de especialidad con **carta, reservas, eventos, horarios y panel admin**, construida por un equipo multi-agente (Architect → Frontend/Backend/Researcher → Quality/Security → Docs → Ponytail).

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4 + Framer Motion
- **Backend:** Express 5 + `node:sqlite` (SQLite nativo de Node 24, sin dependencias nativas)
- **Validación:** zod (cliente y servidor)
- **Base de datos:** SQLite en `server/data/miki.db` (auto-creada + seed al primer arranque; ruta configurable con `MIKI_DB_PATH`, los tests usan `:memory:`)

## Puesta en marcha

```bash
npm install
npm run dev   # Arranca API (http://localhost:4000) + Frontend (http://localhost:5173) juntos vía concurrently
```

Solo la API (opcional): `npm run dev:server`.

Verificación:

```bash
npm run build   # type-check (incluye server/) + build de producción
npm test        # tests (node:test): reservas, auth, inscripciones, contacto y cancelación
npm run lint    # oxlint
```

## Módulos

| Sección | Descripción | Datos |
|---|---|---|
| Hero | Portada editorial con imagen real y CTA a reserva | estático |
| Historia | Copy de la marca | estático |
| Carta | Menú con tabs por categoría (Café, Especialidades, Repostería, Brunch) | `GET /api/menu` |
| Eventos | Catas, talleres, fiestas y programas con filtro por tipo (servidor); "Apartar lugar" y cancelar inscripción por correo | `GET /api/events`, `POST /api/events/:id/join`, `POST /api/events/:id/cancel` |
| Horarios | Tabla de horarios por día (resumen derivado que agrupa días por horario real) | `GET /api/horarios` |
| Galería | Fotos reales (Unsplash, verificadas) | estático |
| Testimonios | Frases de clientes servidas por la API (antes const hardcodeado en frontend) | `GET /api/testimonios` |
| Contacto | Mapa Google embebido sin API key (dirección de `src/lib/contact.ts`), tarjeta overlay con dirección y "Cómo llegar", formulario de contacto con newsletter | `POST /api/contacto` |
| Reserva | Modal con validación en cliente y servidor | `POST /api/reservas` |
| Panel admin | Login y gestión de reservas en `#/admin` (roles admin/empleado; solo admin cambia estado) | `POST /api/auth/login`, `GET /api/admin/reservas`, `PATCH /api/admin/reservas/:id` |

## API

- `GET /api/menu` → `{ categories, items }`
- `GET /api/events` → solo eventos futuros (`date >= hoy`), ordenados por fecha; opcional `?type=evento|fiesta|programa` (400 si inválido)
- `GET /api/testimonios` → `[{ id, cita, nombre, rol }]`
- `GET /api/horarios` → horario por día (con `closed`)
- `POST /api/reservas` → crea reserva (valida email, fecha real, hora dentro del horario del día, 1–20 personas; 409 si duplicado; rate limit 10/10min por IP)
- `POST /api/events/:id/join` → aparta un lugar en el evento (201 con `spots_taken`/`spots_left`; 404; 409 lleno o duplicado; rate limit 10/10min)
- `POST /api/events/:id/cancel` → cancela la inscripción: body `{ email }` → 200 `{ ok: true }` (404 si no hay inscripción con ese correo; rate limit 10/10min)
- `POST /api/contacto` → guarda mensaje en `mensajes` y, si `newsletter: true`, suscribe en `newsletter` (duplicado silencioso): `{ nombre, email, mensaje?, newsletter? }` → 201 `{ ok: true }` (rate limit 10/10min)
- `POST /api/auth/login` → 200 `{ token, user }` (401 genérico; rate limit 5/10min por IP + backoff por cuenta)
- `POST /api/auth/logout` → 204 (auth requerido)
- `GET /api/auth/me` → usuario actual (auth requerido)
- `GET /api/admin/reservas` → todas las reservas, opcional `?status=` (solo admin)
- `PATCH /api/admin/reservas/:id` → cambia `status` (solo admin)

## Panel admin

Entra en `#/admin` (hash de la URL, sin ruta propia) y loguéate con el usuario admin. Las credenciales salen de `ADMIN_EMAIL`/`ADMIN_PASS` (fallback dev: `admin@cafemiki.mx` / `admin123`; en producción `ADMIN_PASS` es obligatorio). El panel lista todas las reservas con filtro por estado; solo el rol admin puede cambiar el estado de una reserva.

El contrato de API y las decisiones quedan documentadas en `server/` y este README.

## Seguridad

- Prepared statements en todo el acceso a SQL (sin SQL injection)
- Validación zod en cada boundary (server) + cliente
- CORS restringido a orígenes permitidos (`CORS_ORIGINS`, default localhost:5173 y localhost:4173)
- Rate limiting en POST /api/reservas, POST /api/events/:id/join, POST /api/events/:id/cancel, POST /api/contacto y POST /api/auth/login
- Contraseñas con scrypt (hash `salt:hash` de 64 bytes) y comparación timing-safe; login con hash dummy para no filtrar emails por timing
- Sesiones por Bearer token de 7 días (expiración perezosa); token en `localStorage` (`cafe-miki-token`), el frontend lo limpia en 401
- Backoff de login por cuenta además del rate limit por IP
- `GET /api/admin/reservas` y `PATCH /api/admin/reservas/:id` requieren rol admin (no empleado) — decisión por PII
- Errores de API sin exponer stack traces
- `server/data/*.db` excluida del repo
