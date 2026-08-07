import { useReducedMotion } from 'framer-motion'
import { Reveal } from './Reveal'

const TESTIMONIOS = [
  {
    cita: 'El mejor cold brew de la Roma, y la sala es perfecta para trabajar una tarde entera.',
    nombre: 'Karla G.',
    rol: 'Clienta de la colonia',
  },
  {
    cita: 'Fui a la catación de orígenes y salí entendiendo el café de otra manera. Guiada y cercana.',
    nombre: 'Diego M.',
    rol: 'Asistente a la catación',
  },
  {
    cita: 'El brunch de domingo se volvió nuestro plan fijo. El pan francés con cajeta es imperdible.',
    nombre: 'Ana y Luis',
    rol: 'Clientes frecuentes',
  },
  {
    cita: 'Reservé una mesa para una fecha especial y todo salió perfecto: el trato, el café y la música.',
    nombre: 'Sofía R.',
    rol: 'Reserva para aniversario',
  },
]

type Testimonio = (typeof TESTIMONIOS)[number]

export function Testimonios() {
  const reduce = useReducedMotion()

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

      {/* prefers-reduced-motion → grilla estática */}
      {reduce ? (
        <div className="mx-auto mt-12 grid max-w-6xl gap-6 px-5 md:grid-cols-2 md:px-8 lg:grid-cols-4">
          {TESTIMONIOS.map((t) => (
            <Tarjeta key={t.nombre} t={t} ancho="w-full" />
          ))}
        </div>
      ) : (
        <div className="marquee mt-12 overflow-hidden">
          <div className="marquee-track flex w-max">
            {[0, 1].map((mitad) => (
              <div key={mitad} aria-hidden={mitad === 1} className="flex shrink-0 gap-6 pr-6">
                {TESTIMONIOS.map((t) => (
                  <Tarjeta key={t.nombre} t={t} ancho="w-[82vw] sm:w-[22rem]" />
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
