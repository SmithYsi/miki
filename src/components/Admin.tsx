import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import {
  ApiError,
  actualizarStatusReserva,
  getMe,
  getReservasAdmin,
  getToken,
  login,
  logout,
  setToken,
} from '../lib/api'
import type { ReservaAdmin, ReservaStatus, Usuario } from '../lib/types'
import { Tab } from './Tab'

const ESTADOS: Record<ReservaStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
}

const FILTROS: { key: ReservaStatus | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'confirmada', label: 'Confirmadas' },
  { key: 'cancelada', label: 'Canceladas' },
]

const loginSchema = z.object({
  email: z.email('Escribe un correo válido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
})

type AuthState =
  | { status: 'validando' }
  | { status: 'anonimo' }
  | { status: 'logueado'; user: Usuario }

type ReservasState =
  | { status: 'cargando' }
  | { status: 'error'; message: string }
  | { status: 'lista'; reservas: ReservaAdmin[] }

const fmtFecha = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtCreado = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function Admin() {
  const [auth, setAuth] = useState<AuthState>({ status: 'validando' })
  const [reservas, setReservas] = useState<ReservasState>({ status: 'cargando' })
  const [filtro, setFiltro] = useState<ReservaStatus | 'todas'>('todas')
  const [cambiando, setCambiando] = useState<number | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  // Valida el token guardado al montar; 401 → login
  useEffect(() => {
    let vivo = true
    if (!getToken()) {
      setAuth({ status: 'anonimo' })
      return
    }
    getMe()
      .then((user) => vivo && setAuth({ status: 'logueado', user }))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) setToken(null)
        if (vivo) setAuth({ status: 'anonimo' })
      })
    return () => {
      vivo = false
    }
  }, [])

  const cargar = useCallback(() => {
    setReservas({ status: 'cargando' })
    getReservasAdmin()
      .then((r) =>
        setReservas({
          status: 'lista',
          reservas: [...r].sort((a, b) => b.created_at.localeCompare(a.created_at)),
        }),
      )
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          setToken(null)
          setAuth({ status: 'anonimo' })
          return
        }
        setReservas({ status: 'error', message: e instanceof Error ? e.message : 'No pudimos cargar las reservas' })
      })
  }, [])

  useEffect(() => {
    if (auth.status === 'logueado') cargar()
  }, [auth.status, cargar])

  const cambiarEstado = async (reserva: ReservaAdmin, status: ReservaStatus) => {
    if (status === 'cancelada' && !window.confirm(`¿Cancelar la reserva de ${reserva.name} para el ${reserva.date}?`)) return
    setCambiando(reserva.id)
    setErrorAccion(null)
    try {
      await actualizarStatusReserva(reserva.id, status)
      setReservas((s) =>
        s.status === 'lista'
          ? { ...s, reservas: s.reservas.map((x) => (x.id === reserva.id ? { ...x, status } : x)) }
          : s,
      )
    } catch (e) {
      setErrorAccion(e instanceof Error ? e.message : 'No pudimos actualizar la reserva')
    } finally {
      setCambiando(null)
    }
  }

  const salir = async () => {
    try {
      await logout()
    } catch {
      /* el token se limpia igual */
    }
    setToken(null)
    setAuth({ status: 'anonimo' })
  }

  const volverAlSitio = () => {
    window.location.hash = ''
  }

  return (
    <div className="min-h-dvh bg-night font-sans text-bone">
      <header className="border-b border-bone/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <button
              type="button"
              onClick={volverAlSitio}
              className="text-xs uppercase tracking-[0.18em] text-bone-dim transition-colors hover:text-accent-soft"
            >
              ← Volver al sitio
            </button>
            <h1 className="mt-1 font-display text-2xl font-medium tracking-tight">
              Café <span className="italic text-accent-soft">Miki</span> · Panel
            </h1>
          </div>
          {auth.status === 'logueado' && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-bone-dim">{auth.user.name}</span>
              <span className="border border-bone/25 px-2 py-0.5 text-xs uppercase tracking-[0.14em] text-bone">
                {auth.user.role}
              </span>
              <button
                type="button"
                onClick={salir}
                className="border border-bone/25 px-3 py-1.5 text-sm transition-colors hover:border-accent-soft hover:text-accent-soft"
              >
                Salir
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        {auth.status === 'validando' && (
          <div className="flex min-h-[40dvh] items-center justify-center" aria-busy="true">
            <div className="h-8 w-48 skeleton-dark" />
          </div>
        )}

        {auth.status === 'anonimo' && <LoginForm onLogueado={(user) => setAuth({ status: 'logueado', user })} />}

        {auth.status === 'logueado' && (
          <section aria-label="Reservas">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2" aria-label="Filtrar por estado">
                {FILTROS.map((f) => (
                  <Tab key={f.key} tone="dark" selected={filtro === f.key} onClick={() => setFiltro(f.key)}>
                    {f.label}
                  </Tab>
                ))}
              </div>
              <button
                type="button"
                onClick={cargar}
                className="text-xs uppercase tracking-[0.16em] text-bone-dim transition-colors hover:text-accent-soft"
              >
                Actualizar
              </button>
            </div>

            {errorAccion && (
              <p role="alert" className="mt-4 text-sm text-red-300">
                {errorAccion}
              </p>
            )}

            <div className="mt-6">
              {reservas.status === 'cargando' && <SkeletonTabla />}
              {reservas.status === 'error' && (
                <div className="border border-bone/15 bg-raise p-8 text-center">
                  <p className="text-bone-dim">{reservas.message}</p>
                  <button
                    type="button"
                    onClick={cargar}
                    className="mt-4 border border-bone/25 px-4 py-2 text-sm text-bone transition-colors hover:border-accent-soft hover:text-accent-soft"
                  >
                    Reintentar
                  </button>
                </div>
              )}
              {reservas.status === 'lista' && (
                <TablaReservas
                  reservas={reservas.reservas}
                  filtro={filtro}
                  esAdmin={auth.user.role === 'admin'}
                  cambiando={cambiando}
                  onCambiarEstado={cambiarEstado}
                />
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function LoginForm({ onLogueado }: { onLogueado: (user: Usuario) => void }) {
  const [valores, setValores] = useState({ email: '', password: '' })
  const [errores, setErrores] = useState<{ email?: string; password?: string; general?: string }>({})
  const [enviando, setEnviando] = useState(false)

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    const r = loginSchema.safeParse(valores)
    if (!r.success) {
      const er: typeof errores = {}
      for (const issue of r.error.issues) {
        const campo = issue.path[0] as keyof typeof valores
        if (campo !== undefined && !er[campo]) er[campo] = issue.message
      }
      setErrores(er)
      return
    }
    setEnviando(true)
    try {
      const { token, user } = await login(r.data.email, r.data.password)
      setToken(token)
      onLogueado(user)
    } catch (err) {
      setErrores({ general: err instanceof Error ? err.message : 'No pudimos iniciar sesión' })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="border border-bone/15 bg-raise p-8">
        <h2 className="font-display text-2xl font-medium">Iniciar sesión</h2>
        <p className="mt-2 text-sm text-bone-dim">Acceso para el equipo de Café Miki.</p>
        <form className="mt-6 space-y-5" onSubmit={alEnviar} noValidate>
          <label className="block">
            <span className="text-sm font-medium">Correo</span>
            <input
              type="email"
              autoComplete="email"
              value={valores.email}
              onChange={(e) => setValores((v) => ({ ...v, email: e.target.value }))}
              className={inputCls(!!errores.email)}
              placeholder="tucorreo@cafemiki.mx"
            />
            {errores.email && (
              <span role="alert" className="mt-1.5 block text-sm text-red-300">
                {errores.email}
              </span>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={valores.password}
              onChange={(e) => setValores((v) => ({ ...v, password: e.target.value }))}
              className={inputCls(!!errores.password)}
              placeholder="••••••••"
            />
            {errores.password && (
              <span role="alert" className="mt-1.5 block text-sm text-red-300">
                {errores.password}
              </span>
            )}
          </label>
          {errores.general && (
            <p role="alert" className="text-sm text-red-300">
              {errores.general}
            </p>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-cream px-6 py-3 text-sm font-medium tracking-wide text-night transition-colors hover:bg-accent-soft disabled:opacity-60"
          >
            {enviando ? 'Entrando…' : 'Entrar al panel'}
          </button>
        </form>
      </div>
    </div>
  )
}

function TablaReservas({
  reservas,
  filtro,
  esAdmin,
  cambiando,
  onCambiarEstado,
}: {
  reservas: ReservaAdmin[]
  filtro: ReservaStatus | 'todas'
  esAdmin: boolean
  cambiando: number | null
  onCambiarEstado: (r: ReservaAdmin, s: ReservaStatus) => void
}) {
  const visibles = filtro === 'todas' ? reservas : reservas.filter((r) => r.status === filtro)

  if (visibles.length === 0) {
    return (
      <p className="border border-bone/15 bg-raise p-8 text-center text-bone-dim">
        {filtro === 'todas' ? 'No hay reservas todavía.' : 'No hay reservas con este estado.'}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto border border-bone/15">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <caption className="sr-only">Reservas registradas en Café Miki</caption>
        <thead>
          <tr className="border-b border-bone/15 text-xs uppercase tracking-[0.14em] text-bone-dim">
            <th scope="col" className="px-4 py-3 font-medium">Nombre</th>
            <th scope="col" className="px-4 py-3 font-medium">Correo</th>
            <th scope="col" className="px-4 py-3 font-medium">Teléfono</th>
            <th scope="col" className="px-4 py-3 font-medium">Fecha</th>
            <th scope="col" className="px-4 py-3 font-medium">Hora</th>
            <th scope="col" className="px-4 py-3 font-medium">Comensales</th>
            <th scope="col" className="px-4 py-3 font-medium">Notas</th>
            <th scope="col" className="px-4 py-3 font-medium">Estado</th>
            <th scope="col" className="px-4 py-3 font-medium">Creada</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((r) => (
            <tr key={r.id} className="border-b border-bone/10 last:border-0">
              <td className="px-4 py-3 font-medium text-bone">{r.name}</td>
              <td className="px-4 py-3 text-bone-dim">{r.email}</td>
              <td className="px-4 py-3 text-bone-dim">{r.phone}</td>
              <td className="px-4 py-3 text-bone-dim">{fmtFecha(r.date)}</td>
              <td className="px-4 py-3 text-bone-dim">{r.time}</td>
              <td className="px-4 py-3 text-bone-dim">{r.guests}</td>
              <td className="max-w-[14rem] truncate px-4 py-3 text-bone-dim" title={r.notes ?? undefined}>
                {r.notes || '—'}
              </td>
              <td className="px-4 py-3">
                {esAdmin ? (
                  <select
                    value={r.status}
                    disabled={cambiando === r.id}
                    onChange={(e) => onCambiarEstado(r, e.target.value as ReservaStatus)}
                    aria-label={`Estado de la reserva de ${r.name}`}
                    className="border border-bone/25 bg-night px-2 py-1 text-sm text-bone focus:outline-none focus:ring-2 focus:ring-accent-soft"
                  >
                    {(Object.keys(ESTADOS) as ReservaStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {ESTADOS[s]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-bone-dim">{ESTADOS[r.status]}</span>
                )}
              </td>
              <td className="px-4 py-3 text-bone-dim">{fmtCreado(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SkeletonTabla() {
  return (
    <div aria-busy="true">
      <div className="h-10 skeleton-dark" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="grid grid-cols-8 gap-4 border-b border-bone/10 py-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((c) => (
            <div key={c} className="h-4 skeleton-dark" />
          ))}
        </div>
      ))}
    </div>
  )
}

const inputCls = (invalido: boolean) =>
  `w-full border bg-night px-3 py-2.5 text-base text-bone placeholder:text-bone-dim/50 focus:outline-none focus:ring-2 focus:ring-accent-soft ${
    invalido ? 'border-red-400' : 'border-bone/25'
  }`
