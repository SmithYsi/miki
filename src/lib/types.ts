/** Tipos del contrato API v1 — ver MEMORY.md */

export interface Category {
  id: number
  name: string
  description: string
  sort_order: number
}

export interface MenuItem {
  id: number
  category_id: number
  name: string
  description: string
  price: number
  tags: string[]
  image_url: string | null
  available: boolean
  sort_order: number
}

export interface Menu {
  categories: Category[]
  items: MenuItem[]
}

export type EventType = 'evento' | 'fiesta' | 'programa'

export interface EventItem {
  id: number
  title: string
  description: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  type: EventType
  price: number | null
  capacity: number | null
  spots_taken: number
  image_url: string | null
}

export interface Horario {
  day: string
  open: string | null
  close: string | null
  closed: boolean
}

export interface ReservaInput {
  name: string
  email: string
  phone: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  guests: number
  notes?: string
}

export interface Reserva extends ReservaInput {
  id: number
  status: 'pendiente'
}

/** Respuesta de POST /api/events/:id/join */
export interface EventJoin {
  id: number
  event_id: number
  name: string
  email: string
  created_at: string
  spots_taken: number
  spots_left: number | null
}

/** Respuesta de POST /api/events/:id/cancel. */
export interface CancelResponse {
  ok: true
  spots_taken: number
  spots_left: number | null
}

/** `event_id` lo agrega el cliente (el endpoint no lo devuelve). */
export type EventCancel = CancelResponse & { event_id: number }

/** Testimonio de GET /api/testimonios */
export interface Testimonio {
  id: number
  cita: string
  nombre: string
  rol: string
}

export type Rol = 'admin' | 'empleado'

export interface Usuario {
  id: number
  email: string
  name: string
  role: Rol
}

export type ReservaStatus = 'pendiente' | 'confirmada' | 'cancelada'

/** Reserva vista en el panel admin (contrato API v2). */
export interface ReservaAdmin {
  id: number
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: number
  notes: string | null
  status: ReservaStatus
  created_at: string
}
