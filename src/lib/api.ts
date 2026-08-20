import type {
  AsistenteInput,
  AsistenteResponse,
  CancelResponse,
  EventItem,
  EventJoin,
  Horario,
  Menu,
  Reserva,
  ReservaAdmin,
  ReservaInput,
  ReservaStatus,
  Testimonio,
  Usuario,
} from './types'

const TOKEN_KEY = 'cafe-miki-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string | null) => {
  if (token === null) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}

/** Error de API con status HTTP para distinguir 401/403/409 en la UI. */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}, authed = false): Promise<T> {
  const headers = new Headers(init.headers)
  if (authed) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  const res = await fetch(path, { ...init, headers })
  if (!res.ok) {
    let message = `Error del servidor (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      /* cuerpo no JSON */
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const getMenu = () => request<Menu>('/api/menu')

export const getEvents = () => request<EventItem[]>('/api/events')

export const getHorarios = () => request<Horario[]>('/api/horarios')

export const getTestimonios = () => request<Testimonio[]>('/api/testimonios')

export async function crearReserva(data: ReservaInput): Promise<Reserva> {
  return request<Reserva>('/api/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

/** Apartar lugar en un evento (contrato API v2). */
export const inscribirseEvento = (id: number, data: { name: string; email: string }) =>
  request<EventJoin>(`/api/events/${id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

/** Cancelar inscripción a un evento (contrato API v2: devuelve spots actualizados). */
export const cancelarInscripcion = (id: number, email: string) =>
  request<CancelResponse>(`/api/events/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

/** Enviar mensaje de contacto (contrato API v2). */
export const enviarContacto = (data: { nombre: string; email: string; mensaje?: string; newsletter?: boolean }) =>
  request<{ ok: true }>('/api/contacto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const login = (email: string, password: string) =>
  request<{ token: string; user: Usuario }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

export const logout = () => request<void>('/api/auth/logout', { method: 'POST' }, true)

export const getMe = () => request<Usuario>('/api/auth/me', {}, true)

export const getReservasAdmin = () => request<ReservaAdmin[]>('/api/admin/reservas', {}, true)

export const actualizarStatusReserva = (id: number, status: ReservaStatus) =>
  request<ReservaAdmin>(
    `/api/admin/reservas/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
    true,
  )

/** Enviar mensaje al asistente IA. */
export const enviarAsistente = (data: AsistenteInput) =>
  request<AsistenteResponse>('/api/asistente', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
