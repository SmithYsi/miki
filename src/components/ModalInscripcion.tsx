import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { inscribirseEvento } from '../lib/api'
import type { EventItem, EventJoin } from '../lib/types'
import { Button } from './Button'

const schema = z.object({
  name: z.string().min(2, 'Escribe tu nombre completo'),
  email: z.email('Escribe un correo válido'),
})

interface Valores {
  name: string
  email: string
}
type Errores = Partial<Record<keyof Valores, string>>

interface Props {
  /** Evento a inscribir; `null` cierra el modal. */
  evento: EventItem | null
  onCerrar: () => void
  /** Se llama con la respuesta al éxito para refrescar el contador del card. */
  onInscrito: (r: EventJoin) => void
}

const fmtFecha = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

export function ModalInscripcion({ evento, onCerrar, onInscrito }: Props) {
  const reduce = useReducedMotion()
  const abierto = evento !== null
  const dialogo = useRef<HTMLDivElement>(null)
  const [valores, setValores] = useState<Valores>({ name: '', email: '' })
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState<EventJoin | null>(null)

  const enfocarables = () => {
    if (!dialogo.current) return []
    return Array.from(
      dialogo.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'))
  }

  const prevAbierto = useRef(false)

  // Reset del estado solo al abrir
  useEffect(() => {
    if (abierto && !prevAbierto.current) {
      setValores({ name: '', email: '' })
      setErrores({})
      setError(null)
      setConfirmado(null)
    }
    prevAbierto.current = abierto
  }, [abierto])

  // Enfoque inicial, Escape, trampa de foco, bloqueo de scroll
  useEffect(() => {
    if (!abierto) return
    enfocarables()[0]?.focus()
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
  }, [abierto, onCerrar, confirmado])

  const set = (campo: keyof Valores) => (e: { target: { value: string } }) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!evento) return
    setError(null)
    const r = schema.safeParse(valores)
    if (!r.success) {
      const er: Errores = {}
      for (const issue of r.error.issues) {
        const campo = issue.path[0] as keyof Valores
        if (campo !== undefined && !er[campo]) er[campo] = issue.message
      }
      setErrores(er)
      return
    }
    setEnviando(true)
    try {
      const res = await inscribirseEvento(evento.id, r.data)
      setConfirmado(res)
      onInscrito(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos apartar tu lugar. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AnimatePresence>
      {abierto && evento && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-espresso/60 dark:bg-black/70"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCerrar}
          />
          <motion.div
            ref={dialogo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inscripcion-titulo"
            className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto border border-espresso/15 bg-cream p-6 text-espresso sm:p-10 dark:border-bone/15 dark:bg-night dark:text-bone"
            initial={reduce ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="inscripcion-titulo" className="font-display text-3xl font-medium tracking-tight">
                Apartar lugar
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

            {confirmado ? (
              <div className="mt-8">
                <p
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl text-cream dark:bg-accent-soft dark:text-night"
                  aria-hidden="true"
                >
                  ✓
                </p>
                <h3 className="mt-4 font-display text-2xl font-medium">¡Listo, {confirmado.name.split(' ')[0]}!</h3>
                <p className="mt-3 leading-relaxed text-mocha dark:text-bone-dim">
                  Apartaste tu lugar para{' '}
                  <strong className="text-espresso dark:text-bone">{evento.title}</strong>, el{' '}
                  {fmtFecha(evento.date)} a las {evento.time} h. Te esperamos.
                </p>
                <Button className="mt-8 w-full" onClick={onCerrar}>
                  Entendido
                </Button>
              </div>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={alEnviar} noValidate>
                <p className="border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-espresso dark:border-accent-soft/30 dark:bg-accent-soft/5 dark:text-bone">
                  {evento.title} — {fmtFecha(evento.date)} · {evento.time} h
                </p>

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

                {error && (
                  <p role="alert" className="text-sm text-red-800 dark:text-red-300">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando ? 'Apartando…' : 'Apartar lugar'}
                </Button>
                <p className="text-center text-xs text-mocha dark:text-bone-dim">
                  Te confirmamos por correo. Sin anticipo.
                </p>
              </form>
            )}
          </motion.div>
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
