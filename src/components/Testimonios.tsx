import { useCallback, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { getTestimonios } from '../lib/api'
import type { Testimonio } from '../lib/types'
import { Button } from './Button'
import { Reveal } from './Reveal'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: Testimonio[] }

export function Testimonios() {
  const reduce = useReducedMotion()
  const [state, setState] = useState<State>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    getTestimonios()
      .then((items) => setState({ status: 'ready', items }))
      .catch((e: unknown) =>
        setState({ status: 'error', message: e instanceof Error ? e.message : 'No pudimos cargar los testimonios' }),
      )
  }, [])

  useEffect(load, [load])

  return (
    <section className="border-y border-bone/10 bg-night py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-soft">
            Lo que dicen de la casa
          </p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-bone md:text-5xl">
            Recomendado, taza a taza
          </h2>
        </Reveal>
      </div>

      {state.status === 'loading' ? (
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 px-5 md:grid-cols-2 md:px-8 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-64 skeleton-dark" />
          ))}
        </div>
      ) : state.status === 'error' ? (
        <div className="mx-auto mt-12 max-w-6xl px-5 text-center md:px-8">
          <p className="text-bone-dim">{state.message}</p>
          <Button tone="dark" className="mt-4" onClick={load}>
            Reintentar
          </Button>
        </div>
      ) : state.items.length === 0 ? (
        <p className="mx-auto mt-12 max-w-6xl px-5 text-bone-dim md:px-8">
          Aún no hay testimonios. Pronto compartiremos lo que dicen de la casa.
        </p>
      ) : reduce ? (
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 px-5 md:grid-cols-2 md:px-8 lg:grid-cols-4">
          {state.items.map((t) => (
            <Tarjeta key={t.id} t={t} ancho="w-full" />
          ))}
        </div>
      ) : (
        <div className="marquee mt-12 overflow-hidden">
          <div className="marquee-track flex w-max">
            {[0, 1].map((mitad) => (
              <div key={mitad} aria-hidden={mitad === 1} className="flex shrink-0 gap-6 pr-6">
                {state.items.map((t) => (
                  <Tarjeta key={t.id} t={t} ancho="w-[82vw] sm:w-[22rem]" />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function Tarjeta({ t, ancho }: { t: Testimonio; ancho: string }) {
  return (
    <figure className={`flex h-full shrink-0 flex-col border border-bone/15 bg-raise p-6 ${ancho}`}>
      <span className="font-display text-5xl leading-none text-accent-soft" aria-hidden="true">
        “
      </span>
      <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-bone-dim">{t.cita}</blockquote>
      <figcaption className="mt-5 border-t border-bone/15 pt-4">
        <p className="font-display text-base text-bone">{t.nombre}</p>
        <p className="text-xs uppercase tracking-[0.14em] text-bone-dim/70">{t.rol}</p>
      </figcaption>
    </figure>
  )
}
