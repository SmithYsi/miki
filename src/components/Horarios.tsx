import { useHorarios } from '../lib/useHorarios'
import { Reveal } from './Reveal'

export function Horarios() {
  const { horarios, error } = useHorarios()
  const cerrado = horarios.find((h) => h.closed)
  return (
    <section className="border-y border-espresso/10 bg-cream py-20 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <h2 className="font-display text-3xl font-medium tracking-tight text-espresso md:text-4xl">Horarios</h2>
          <p className="mt-4 max-w-sm text-mocha">
            Abrimos de lunes a domingo.
            {cerrado && <> Los {cerrado.day} la tostadora descansa.</>}
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          {error ? (
            <p className="text-mocha">{error}</p>
          ) : horarios.length === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 skeleton" />
              ))}
            </div>
          ) : (
            <dl className="grid gap-x-12 gap-y-6 sm:grid-cols-2">
              {horarios.map((h) => (
                <div
                  key={h.day}
                  className="flex items-baseline justify-between border-t border-espresso/15 pt-2"
                >
                  <dt className={h.closed ? 'text-mocha/60 line-through' : 'font-medium text-espresso'}>
                    {h.day}
                  </dt>
                  <dd className="text-mocha">{h.closed ? 'Cerrado' : `${h.open} – ${h.close}`}</dd>
                </div>
              ))}
            </dl>
          )}
        </Reveal>
      </div>
    </section>
  )
}
