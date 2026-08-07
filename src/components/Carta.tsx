import { useCallback, useEffect, useState } from 'react'
import { getMenu } from '../lib/api'
import type { Category, MenuItem } from '../lib/types'
import { Button } from './Button'
import { Reveal } from './Reveal'
import { Tab } from './Tab'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; categories: Category[]; items: MenuItem[] }

export function Carta() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [activeId, setActiveId] = useState<number | null>(null)

  const load = useCallback(() => {
    setState({ status: 'loading' })
    getMenu()
      .then((menu) => {
        setState({ status: 'ready', categories: menu.categories, items: menu.items })
        setActiveId((cur) => cur ?? menu.categories[0]?.id ?? null)
      })
      .catch((e: unknown) =>
        setState({ status: 'error', message: e instanceof Error ? e.message : 'No pudimos cargar la carta' }),
      )
  }, [])

  useEffect(load, [load])

  if (state.status === 'loading') return <SkeletonCarta />
  if (state.status === 'error')
    return (
      <EstadoCarta>
        <p className="text-mocha">{state.message}</p>
        <Button className="mt-4" onClick={load}>
          Reintentar
        </Button>
      </EstadoCarta>
    )

  const { categories, items } = state
  const active = categories.find((c) => c.id === activeId) ?? categories[0]
  const visibles = items.filter((i) => i.available && i.category_id === active?.id)

  return (
    <section id="carta" className="bg-latte py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">La carta</p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-espresso md:text-5xl">
            De la barra a tu mesa
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-mocha">
            Precios en pesos, sin sorpresas.
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <div
            className="mt-10 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Categorías de la carta"
          >
            {categories.map((cat) => (
              <Tab key={cat.id} selected={cat.id === active?.id} onClick={() => setActiveId(cat.id)}>
                {cat.name}
              </Tab>
            ))}
          </div>
        </Reveal>

        {active?.description && (
          <p className="mt-6 text-sm font-medium text-coffee">{active.description}</p>
        )}

        {visibles.length === 0 ? (
          <EstadoCarta>
            <p className="text-mocha">Esta categoría está por llenarse. Vuelve en unos días.</p>
          </EstadoCarta>
        ) : (
          <div className="mt-10 grid gap-x-14 gap-y-9 md:grid-cols-2">
            {visibles.map((item, i) => (
              <Reveal key={item.id} delay={Math.min(i * 0.04, 0.3)}>
                <article className="group">
                  <div className="flex items-baseline">
                    <h3 className="font-display text-xl font-medium text-espresso transition-colors group-hover:text-accent">
                      {item.name}
                    </h3>
                    <span className="menu-leader" aria-hidden="true" />
                    <span className="font-display text-xl text-espresso">${item.price}</span>
                  </div>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-mocha">
                    {item.description}
                  </p>
                  {item.tags.length > 0 && (
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-mocha/85">
                      {item.tags.join(' · ')}
                    </p>
                  )}
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function EstadoCarta({ children }: { children: React.ReactNode }) {
  return (
    <section id="carta" className="bg-latte py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 text-center md:px-8">{children}</div>
    </section>
  )
}

function SkeletonCarta() {
  return (
    <section id="carta" className="bg-latte py-24 md:py-32" aria-busy="true">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="h-10 w-56 skeleton" />
        <div className="mt-10 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 w-24 skeleton" />
          ))}
        </div>
        <div className="mt-10 grid gap-x-14 gap-y-9 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-6 w-2/3 skeleton" />
              <div className="mt-3 h-4 w-full skeleton" />
              <div className="mt-2 h-4 w-1/2 skeleton" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
