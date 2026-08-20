import { m, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'
import { IMAGES } from '../lib/images'
import { Button } from './Button'

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
  const [altura, setAltura] = useState(0)
  const [dist, setDist] = useState(0)

  // Pin horizontal: contenedor alto = viewport + desplazamiento del track; el
  // track se mueve con el progreso de scroll. Colapsa a grid estático con
  // prefers-reduced-motion.
  useLayoutEffect(() => {
    if (reduce) return
    const medir = () => {
      if (!track.current) return
      const d = Math.max(0, track.current.scrollWidth - window.innerWidth)
      setDist(d)
      setAltura(window.innerHeight + d)
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [reduce])

  const { scrollYProgress } = useScroll({ target: contenedor, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist])

  const tarjetas = (modo: 'grid' | 'scroll') => {
    const card =
      modo === 'grid'
        ? 'w-full border border-cream/15 bg-night/40 p-6'
        : 'w-[78vw] max-w-md shrink-0 border border-cream/15 bg-night/40 p-6 sm:w-[40vw] lg:w-[30vw]'
    const cta =
      modo === 'grid'
        ? 'flex w-full flex-col items-start justify-center border border-accent-soft/40 bg-gradient-to-br from-night to-espresso p-8'
        : 'flex w-[78vw] max-w-md shrink-0 flex-col items-start justify-center border border-accent-soft/40 bg-gradient-to-br from-night to-espresso p-8 sm:w-[40vw] lg:w-[32vw]'
    return (
      <>
        {ORIGENES.map((o, i) => (
          <li key={o.estado} className={card}>
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

        <li className={cta}>
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
      </>
    )
  }

  return (
    <div className="relative bg-espresso">
      {reduce ? (
        <div className="py-24">
          <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-soft">
              Granos de origen único
            </p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
              Tres estados, <em className="italic text-accent-soft">una taza</em>
            </h2>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-2">{tarjetas('grid')}</ul>
        </div>
      ) : (
        <div ref={contenedor} style={{ height: altura }} className="relative">
          <div className="sticky top-0 flex h-screen items-center overflow-hidden bg-espresso text-cream">
            <div className="w-full">
              <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-soft">
                  Granos de origen único
                </p>
                <h2 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
                  Tres estados, <em className="italic text-accent-soft">una taza</em>
                </h2>
              </div>
              <m.ul ref={track} style={{ x }} className="mt-12 flex w-max gap-6 px-5 md:px-8">
                {tarjetas('scroll')}
              </m.ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
