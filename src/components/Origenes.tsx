import { useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IMAGES } from '../lib/images'
import { Button } from './Button'

gsap.registerPlugin(ScrollTrigger)

const ORIGENES = [
  {
    estado: 'Chiapas',
    notas: 'Caramelizada, cítrica y con cuerpo de chocolate oscuro.',
    lote: 'Lote Sierra Madre',
    src: IMAGES.gallery[4],
  },
  {
    estado: 'Oaxaca',
    notas: 'Nuez, miel de agave y un final dulce y redondo.',
    lote: 'Lote Pluma Hidalgo',
    src: IMAGES.gallery[1],
  },
  {
    estado: 'Veracruz',
    notas: 'Floral, con acidez brillante y notas a frutos rojos.',
    lote: 'Lote Coatepec',
    src: IMAGES.gallery[3],
  },
]

export function Origenes({ onReservar }: { onReservar: () => void }) {
  const reduce = useReducedMotion()
  const contenedor = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLUListElement>(null)

  useLayoutEffect(() => {
    if (reduce || !contenedor.current || !track.current) return
    const ctx = gsap.context(() => {
      const distancia = () => track.current!.scrollWidth - window.innerWidth
      gsap.to(track.current, {
        x: () => -distancia(),
        ease: 'none',
        scrollTrigger: {
          trigger: contenedor.current,
          start: 'top top',
          end: () => `+=${distancia()}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
    }, contenedor)
    return () => ctx.revert()
  }, [reduce])

  return (
    <div ref={contenedor} className="relative bg-espresso">
      <div className={`${reduce ? 'py-24' : ''} flex h-[100vh] items-center overflow-hidden bg-espresso text-cream`}>
        <div className={reduce ? 'mx-auto w-full max-w-6xl px-5 md:px-8' : 'w-full'}>
          <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-soft">
              Granos de origen único
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
              Tres estados, <em className="italic text-accent-soft">una taza</em>
            </h2>
          </div>

          <ul
            ref={track}
            className={`${reduce ? 'mt-12 grid gap-6 md:grid-cols-2' : 'mt-12 flex w-max gap-6 px-5 md:px-8'}`}
          >
            {ORIGENES.map((o, i) => (
              <li
                key={o.estado}
                className={`${
                  reduce
                    ? 'w-full border border-cream/15 bg-night/40 p-6'
                    : 'w-[78vw] max-w-md shrink-0 border border-cream/15 bg-night/40 p-6 sm:w-[40vw] lg:w-[30vw]'
                }`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={o.src}
                    alt={`Café de origen de ${o.estado}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    width={600}
                    height={450}
                  />
                </div>
                <p className="mt-5 font-display text-2xl">{o.estado}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cream/60">{o.lote}</p>
                <p className="mt-3 text-sm leading-relaxed text-cream/80">{o.notas}</p>
                <span className="mt-4 block font-display text-3xl text-accent-soft" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </li>
            ))}

            <li
              className={`${
                reduce
                  ? 'flex w-full flex-col items-start justify-center border border-accent-soft/40 bg-gradient-to-br from-night to-espresso p-8'
                  : 'flex w-[78vw] max-w-md shrink-0 flex-col items-start justify-center border border-accent-soft/40 bg-gradient-to-br from-night to-espresso p-8 sm:w-[40vw] lg:w-[32vw]'
              }`}
            >
              <p className="font-display text-4xl leading-tight">
                ¿Cuál es <em className="italic text-accent-soft">tu origen</em>?
              </p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/80">
                Ven a catarlos en la barra y encuentra el que mejor le sienta a tu mañana.
              </p>
              <Button tone="dark" className="mt-8" onClick={onReservar}>
                Reserva una cata
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
