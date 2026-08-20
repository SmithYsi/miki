import { useCallback, useEffect, useState } from 'react'
import { getEvents } from '../lib/api'
import type { EventItem, EventType } from '../lib/types'
import { Button } from './Button'
import { ModalInscripcion } from './ModalInscripcion'
import { Reveal } from './Reveal'
import { Tab } from './Tab'

const FILTROS: { key: EventType | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'evento', label: 'Eventos' },
  { key: 'fiesta', label: 'Fiestas' },
  { key: 'programa', label: 'Programas' },
]

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; events: EventItem[] }

function formatearFecha(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function metaLugares(ev: EventItem): string {
  if (ev.capacity === null) return 'Lugar sin límite'
  const libres = ev.capacity - ev.spots_taken
  return libres > 0 ? `${libres} de ${ev.capacity} lugares` : 'Lleno'
}

export function Eventos() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [filtro, setFiltro] = useState<EventType | 'todos'>('todos')
  const [inscripcion, setInscripcion] = useState<EventItem | null>(null)
  const cerrarInscripcion = useCallback(() => setInscripcion(null), [])

  const load = useCallback(() => {
    setState({ status: 'loading' })
    getEvents()
      .then((events) => setState({ status: 'ready', events }))
      .catch((e: unknown) =>
        setState({ status: 'error', message: e instanceof Error ? e.message : 'No pudimos cargar los eventos' }),
      )
  }, [])

  useEffect(load, [load])

  // Actualiza spots_taken del evento (inscribirse o cancelar ocupa/libera lugar)
  const alActualizarSpots = useCallback((r: { event_id: number; spots_taken: number }) => {
    setState((s) =>
      s.status === 'ready'
        ? { ...s, events: s.events.map((e) => (e.id === r.event_id ? { ...e, spots_taken: r.spots_taken } : e)) }
        : s,
    )
  }, [])

  if (state.status === 'loading') return <SkeletonEventos />
  if (state.status === 'error')
    return (
      <section id="eventos" className="bg-night py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 text-center md:px-8">
          <p className="text-bone-dim">{state.message}</p>
          <Button tone="dark" className="mt-4" onClick={load}>
            Reintentar
          </Button>
        </div>
      </section>
    )

  const visibles = state.events.filter((e) => filtro === 'todos' || e.type === filtro)
  const [siguiente, ...resto] = visibles

  return (
    <section id="eventos" className="bg-night py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-soft">
            Agenda de la casa
          </p>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight text-bone md:text-5xl">
            Eventos y catas
          </h2>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mt-8 flex flex-wrap gap-2" aria-label="Filtrar eventos">
            {FILTROS.map((f) => (
              <Tab key={f.key} tone="dark" selected={filtro === f.key} onClick={() => setFiltro(f.key)}>
                {f.label}
              </Tab>
            ))}
          </div>
        </Reveal>

        {visibles.length === 0 ? (
          <p className="mt-12 text-bone-dim">
            Aún no hay eventos de este tipo. Sigue nuestras redes para enterarte primero.
          </p>
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {siguiente && (
              <Reveal className="lg:col-span-2">
                <EventCard evento={siguiente} destacado onInscribir={() => setInscripcion(siguiente)} />
              </Reveal>
            )}
            {resto.map((ev, i) => (
              <Reveal key={ev.id} delay={Math.min(i * 0.05, 0.25)}>
                <EventCard evento={ev} onInscribir={() => setInscripcion(ev)} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
      <ModalInscripcion
        key={inscripcion?.id ?? 'cerrado'}
        evento={inscripcion}
        onCerrar={cerrarInscripcion}
        onInscrito={alActualizarSpots}
        onCancelado={alActualizarSpots}
      />
    </section>
  )
}

function EventCard({
  evento,
  destacado = false,
  onInscribir,
}: {
  evento: EventItem
  destacado?: boolean
  onInscribir: () => void
}) {
  const ahora = new Date()
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
  const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`
  const terminado = evento.date === hoy && evento.time <= hora
  const lleno = evento.capacity !== null && evento.capacity - evento.spots_taken <= 0
  const conCupo = evento.capacity !== null && !lleno
  return (
    <article
      className={`group grid overflow-hidden border border-bone/15 bg-raise ${
        destacado ? 'md:grid-cols-[1.1fr_1fr]' : ''
      }`}
    >
      <div className={`overflow-hidden ${destacado ? '' : 'aspect-[16/9]'}`}>
        <img
          src={evento.image_url ?? DEFAULT_IMG}
          alt={`${evento.title} en Café Miki`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
          width={800}
          height={450}
        />
      </div>
      <div className={`flex flex-col gap-3 p-6 ${destacado ? 'justify-center' : ''}`}>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em]">
          <span className="text-accent-soft">{formatearFecha(evento.date)}</span>
          <span className="text-bone-dim/80">{evento.time} h</span>
          <span className="border border-bone/25 px-2 py-0.5 text-bone">{evento.type}</span>
        </div>
        <h3 className={`font-display font-medium leading-tight text-bone ${destacado ? 'text-3xl' : 'text-2xl'}`}>
          {evento.title}
        </h3>
        <p className="max-w-prose text-sm leading-relaxed text-bone-dim">{evento.description}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-bone/15 pt-3 text-sm text-bone-dim">
          <span className="font-display text-lg text-bone">
            {evento.price === null ? 'Entrada libre' : `$${evento.price}`}
          </span>
          <span>{metaLugares(evento)}</span>
        </div>
        {terminado ? (
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-bone-dim">Terminado</p>
        ) : lleno ? (
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-soft">Lleno</p>
        ) : conCupo ? (
          <Button tone="dark" className="self-start" onClick={onInscribir}>
            Apartar lugar
          </Button>
        ) : null}
      </div>
    </article>
  )
}

function SkeletonEventos() {
  return (
    <section id="eventos" className="bg-night py-24 md:py-32" aria-busy="true">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="h-10 w-64 skeleton-dark" />
        <div className="mt-8 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 skeleton-dark" />
          ))}
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={i === 0 ? 'col-span-full grid md:grid-cols-2' : ''}>
              <div className={`skeleton-dark ${i === 0 ? 'aspect-[16/9] md:aspect-auto' : 'aspect-[16/9]'}`} />
              <div className="space-y-3 p-6">
                <div className="h-4 w-1/2 skeleton-dark" />
                <div className="h-7 w-2/3 skeleton-dark" />
                <div className="h-4 w-full skeleton-dark" />
                <div className="h-4 w-3/4 skeleton-dark" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
