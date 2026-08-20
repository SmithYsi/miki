import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { crearReserva } from '../lib/api'
import type { Reserva } from '../lib/types'
import { useHorarios } from '../lib/useHorarios'
import { Button } from './Button'

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const schema = z.object({
  name: z.string().min(2, 'Escribe tu nombre completo'),
  email: z.email('Escribe un correo válido'),
  phone: z.string().min(7, 'Escribe un teléfono válido'),
  date: z
    .string()
    .min(1, 'Elige una fecha')
    .refine((d) => d >= hoy(), 'La fecha no puede ser anterior a hoy'),
  time: z.string().min(1, 'Elige una hora'),
  guests: z.coerce
    .number()
    .int('Número de comensales inválido')
    .min(1, 'Mínimo 1 comensal')
    .max(20, 'Máximo 20 comensales'),
  notes: z.string().optional(),
})

interface FormValues {
  name: string
  email: string
  phone: string
  date: string
  time: string
  guests: string
  notes?: string
}
type Errores = Partial<Record<keyof FormValues, string>>

const INICIAL: FormValues = { name: '', email: '', phone: '', date: '', time: '', guests: '2', notes: '' }

interface Props {
  abierto: boolean
  onCerrar: () => void
}

export function ModalReserva({ abierto, onCerrar }: Props) {
  const reduce = useReducedMotion()
  const { horarios, error: errorHorarios, recargar: recargarHorarios } = useHorarios()
  const [valores, setValores] = useState<FormValues>(INICIAL)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmada, setConfirmada] = useState<Reserva | null>(null)
  const dialogo = useRef<HTMLDivElement>(null)
  const enviandoRef = useRef(false)

  const horasDisponibles = useMemo(() => {
    if (!valores.date) return []
    const dia = DIAS[new Date(`${valores.date}T00:00:00`).getDay()]
    const h = horarios.find((x) => x.day.toLowerCase() === dia)
    if (!h || h.closed || !h.open || !h.close) return []
    const [a, b] = [h.open, h.close].map((t) => Number(t.slice(0, 2)))
    const ahora = new Date()
    const ahoraStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`
    const esHoy = valores.date === hoy()
    const horas: string[] = []
    for (let hh = a; hh <= b; hh++) {
      const t00 = `${String(hh).padStart(2, '0')}:00`
      const t30 = `${String(hh).padStart(2, '0')}:30`
      if (!esHoy || t00 > ahoraStr) horas.push(t00)
      if (hh < b && (!esHoy || t30 > ahoraStr)) horas.push(t30)
    }
    return horas
  }, [valores.date, horarios])

  const enfocarables = () => {
    if (!dialogo.current) return []
    return Array.from(
      dialogo.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hasAttribute('disabled'))
  }

  const prevAbierto = useRef(false)

  // Reset del estado solo al abrir (no al confirmar)
  useEffect(() => {
    if (abierto && !prevAbierto.current) reiniciar()
    prevAbierto.current = abierto
  }, [abierto])

  // Enfoque inicial, Escape, trampa de foco, bloqueo de scroll
  useEffect(() => {
    if (!abierto) return
    const primer = enfocarables()[0]
    primer?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCerrar()
        return
      }
      if (e.key !== 'Tab') return
      const els = enfocarables()
      if (els.length === 0) return
      const primero = els[0]
      const ultimo = els[els.length - 1]
      const activo = document.activeElement
      if (e.shiftKey && (activo === primero || !dialogo.current?.contains(activo))) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && (activo === ultimo || !dialogo.current?.contains(activo))) {
        e.preventDefault()
        primero.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [abierto, onCerrar, confirmada])

  const set = (campo: keyof FormValues) => (e: { target: { value: string } }) => {
    const value = e.target.value
    setValores((v) => {
      const next = { ...v, [campo]: value }
      if (campo === 'date' && value) {
        const dia = DIAS[new Date(`${value}T00:00:00`).getDay()]
        const h = horarios.find((x) => x.day.toLowerCase() === dia)
        if (!h || h.closed || !h.open || !h.close || (v.time && (v.time < h.open || v.time > h.close))) {
          next.time = ''
        }
      }
      return next
    })
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const reiniciar = () => {
    setValores(INICIAL)
    setErrores({})
    setError(null)
    setConfirmada(null)
  }

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const r = schema.safeParse(valores)
    if (!r.success) {
      const er: Errores = {}
      for (const issue of r.error.issues) {
        const campo = issue.path[0] as keyof FormValues
        if (campo !== undefined && !er[campo]) er[campo] = issue.message
      }
      setErrores(er)
      return
    }
    if (enviandoRef.current) return
    enviandoRef.current = true
    setEnviando(true)
    try {
      const res = await crearReserva(r.data)
      setConfirmada(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar tu reserva. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
      enviandoRef.current = false
    }
  }

  return (
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <m.div
            aria-hidden="true"
            className="absolute inset-0 bg-espresso/60 dark:bg-black/70"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCerrar}
          />
          <m.div
            ref={dialogo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reserva-titulo"
            className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto border border-espresso/15 bg-cream p-6 text-espresso sm:p-10 dark:border-bone/15 dark:bg-night dark:text-bone"
            initial={reduce ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="reserva-titulo" className="font-display text-3xl font-medium tracking-tight">
                Reservar mesa
              </h2>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar"
                className="px-1 text-2xl leading-none text-mocha transition-colors hover:text-espresso dark:text-bone-dim dark:hover:text-bone"
              >
                ×
              </button>
            </div>

            {confirmada ? (
              <div className="mt-8">
                <p
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl text-cream dark:bg-accent-soft dark:text-night"
                  aria-hidden="true"
                >
                  ✓
                </p>
                <h3 className="mt-4 font-display text-2xl font-medium">¡Listo, {confirmada.name.split(' ')[0]}!</h3>
                <p className="mt-3 leading-relaxed text-mocha dark:text-bone-dim">
                  Tu mesa quedó registrada para el{' '}
                  <strong className="text-espresso dark:text-bone">{confirmada.date}</strong> a las{' '}
                  <strong className="text-espresso dark:text-bone">{confirmada.time}</strong> para{' '}
                  {confirmada.guests} {confirmada.guests === 1 ? 'persona' : 'personas'}. Te
                  confirmamos por correo.
                </p>
                <Button className="mt-8 w-full" onClick={onCerrar}>
                  Entendido
                </Button>
              </div>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={alEnviar} noValidate>
                <Campo label="Nombre" error={errores.name}>
                  <input
                    type="text"
                    autoComplete="name"
                    value={valores.name}
                    onChange={set('name')}
                    className={inputCls(!!errores.name)}
                    placeholder="Tu nombre"
                  />
                </Campo>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Campo label="Correo" error={errores.email}>
                    <input
                      type="email"
                      autoComplete="email"
                      value={valores.email}
                      onChange={set('email')}
                      className={inputCls(!!errores.email)}
                      placeholder="tucorreo@ejemplo.mx"
                    />
                  </Campo>
                  <Campo label="Teléfono" error={errores.phone}>
                    <input
                      type="tel"
                      autoComplete="tel"
                      value={valores.phone}
                      onChange={set('phone')}
                      className={inputCls(!!errores.phone)}
                      placeholder="55 1234 5678"
                    />
                  </Campo>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <Campo label="Fecha" error={errores.date}>
                    <input
                      type="date"
                      min={hoy()}
                      value={valores.date}
                      onChange={set('date')}
                      className={inputCls(!!errores.date)}
                    />
                  </Campo>
                  <Campo label="Hora" error={errores.time}>
                    <select
                      value={valores.time}
                      onChange={set('time')}
                      className={inputCls(!!errores.time)}
                      disabled={horasDisponibles.length === 0}
                    >
                      {horasDisponibles.length === 0 ? (
                        <option value="">Elige un día abierto</option>
                      ) : (
                        horasDisponibles.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))
                      )}
                    </select>
                  </Campo>
                  <Campo label="Comensales" error={errores.guests}>
                    <select value={valores.guests} onChange={set('guests')} className={inputCls(!!errores.guests)}>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'persona' : 'personas'}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>

                {errorHorarios && horarios.length === 0 && (
                  <div className="space-y-3">
                    <p role="alert" className="text-sm text-red-800 dark:text-red-300">
                      {errorHorarios}
                    </p>
                    <Button variant="ghost" type="button" onClick={recargarHorarios}>
                      Reintentar
                    </Button>
                  </div>
                )}

                <Campo label="Notas (opcional)" error={errores.notes}>
                  <textarea
                    rows={3}
                    value={valores.notes}
                    onChange={set('notes')}
                    className={inputCls(!!errores.notes)}
                    placeholder="Alergias, ocasión especial, preferencias…"
                  />
                </Campo>

                {error && (
                  <p role="alert" className="text-sm text-red-800 dark:text-red-300">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando ? 'Registrando…' : 'Confirmar reserva'}
                </Button>
                <p className="text-center text-xs text-mocha dark:text-bone-dim">
                  Sin anticipo. Te avisamos por correo si hay algún cambio.
                </p>
              </form>
            )}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error && (
        <span role="alert" className="mt-1.5 block text-sm text-red-800 dark:text-red-300">
          {error}
        </span>
      )}
    </label>
  )
}

const inputCls = (invalido: boolean) =>
  `w-full border bg-cream px-3 py-2.5 text-base text-espresso placeholder:text-mocha/50 focus:outline-none focus:ring-2 focus:ring-accent dark:bg-night dark:text-bone dark:placeholder:text-bone-dim/50 dark:focus:ring-accent-soft ${
    invalido ? 'border-red-700 dark:border-red-400' : 'border-espresso/25 dark:border-bone/25'
  }`
