import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { Reveal } from './Reveal'
import { IMAGES } from '../lib/images'

const FOTOS = [
  { src: IMAGES.gallery[0], alt: 'Latte art vertiéndose sobre una taza de cerámica', caption: 'Latte art, todos los días' },
  { src: IMAGES.gallery[1], alt: 'Grano de café tostado en la tostadora', caption: 'Tueste propio en lotes pequeños' },
  { src: IMAGES.gallery[2], alt: 'Repostería recién horneada en la vitrina', caption: 'Horneado cada mañana' },
  { src: IMAGES.gallery[3], alt: 'Noche de jazz en el local', caption: 'Noches de jazz en la sala' },
  { src: IMAGES.gallery[4], alt: 'Catación de café de origen', caption: 'Catación semanal de orígenes' },
]

const GRID: string[] = ['sm:col-span-2 sm:row-span-2', '', '', '', 'sm:col-span-2']

export function Galeria() {
  const [abierta, setAbierta] = useState<number | null>(null)
  const reduce = useReducedMotion()

  const cerrar = useCallback(() => setAbierta(null), [])

  useEffect(() => {
    if (abierta === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [abierta, cerrar])

  return (
    <section className="bg-raise py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-soft">Galería</p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-bone md:text-5xl">
            La casa por dentro
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:grid-rows-2">
          {FOTOS.map((foto, i) => (
            <Reveal key={foto.src} delay={Math.min(i * 0.05, 0.2)} className={GRID[i]}>
              <button
                type="button"
                onClick={() => setAbierta(i)}
                aria-label={`Ampliar foto: ${foto.alt}`}
                className="group relative block h-full w-full overflow-hidden text-left"
              >
                <img
                  src={foto.src}
                  alt={foto.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  width={800}
                  height={600}
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-xs uppercase tracking-[0.16em] text-bone opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {foto.caption}
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {abierta !== null && (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cerrar}
            role="dialog"
            aria-modal="true"
            aria-label={FOTOS[abierta].alt}
          >
            <m.figure
              initial={reduce ? false : { scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-h-[90dvh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={FOTOS[abierta].src}
                alt={FOTOS[abierta].alt}
                className="max-h-[82dvh] w-auto object-contain"
              />
              <figcaption className="mt-3 text-center text-xs uppercase tracking-[0.16em] text-bone/80">
                {FOTOS[abierta].caption}
              </figcaption>
            </m.figure>
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar galería"
              className="absolute right-5 top-5 text-3xl leading-none text-bone transition-colors hover:text-accent-soft"
            >
              ×
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  )
}
