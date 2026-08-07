import { Reveal } from './Reveal'

const HISTORIA_IMG =
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80'

const PILARES = [
  { n: '01', titulo: 'Tueste propio', texto: 'Lotes pequeños, cada semana' },
  { n: '02', titulo: 'Granos de origen', texto: 'Directo de productores' },
  { n: '03', titulo: 'Fermentación natural', texto: 'Notas de temporada' },
]

export function Historia() {
  return (
    <section id="historia" className="bg-cream py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 md:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="order-2 lg:order-1">
          <Reveal from="left">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Nuestra casa</p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-[1.08] tracking-tight text-espresso md:text-5xl">
              Una tostadora, una barra, <em className="italic text-accent">un barrio</em>
            </h2>
            <p className="mt-6 max-w-lg leading-relaxed text-coffee">
              Café Miki nació de una pregunta simple: por qué el buen café siempre se toma de
              prisa. Aquí los granos llegan verdes, se tuestan en casa y se sirven en la barra
              con el método que mejor les sienta — espresso, V60 o prensa.
            </p>
            <p className="mt-4 max-w-lg leading-relaxed text-coffee">
              La sala es nuestra: mesas de madera, luz de tarde y una carta que cambia con la
              temporada de cosechas.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="mt-10 max-w-lg">
              {PILARES.map((p) => (
                <li
                  key={p.n}
                  className="flex items-baseline gap-4 border-t border-espresso/15 py-4"
                >
                  <span className="font-display text-xl text-accent" aria-hidden="true">
                    {p.n}
                  </span>
                  <div>
                    <p className="font-display text-lg text-espresso">{p.titulo}</p>
                    <p className="text-sm text-mocha">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal from="right" className="order-1 lg:order-2">
          <figure>
            <img
              src={HISTORIA_IMG}
              alt="Granos de café verde y tostado en la tostadora de Café Miki"
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
              width={800}
              height={600}
            />
            <figcaption className="mt-3 text-xs uppercase tracking-[0.18em] text-mocha">
              Tostamos en lotes pequeños, cada semana
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}
