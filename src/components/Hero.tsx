import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { EASE } from '../lib/motion'
import { scrollTo } from '../lib/lenis'
import { Button } from './Button'

const FONDO =
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1920&q=80'

export function Hero({ onReservar }: { onReservar: () => void }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '18%'])
  const contenidoY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0])

  const up = (delay: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: EASE, delay } }

  return (
    <section ref={ref} id="inicio" className="relative flex min-h-[100dvh] items-center overflow-hidden bg-espresso">
      <motion.div
        aria-hidden="true"
        style={{ y: bgY, scale: 1.1 }}
        className="absolute inset-0"
        role="img"
        aria-label="Interior cálido de Café Miki"
      >
        {/* Ken burns lento; colapsa a estático con prefers-reduced-motion */}
        <motion.div
          className="h-full w-full"
          style={{ backgroundImage: `url(${FONDO})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          initial={reduce ? false : { scale: 1.02 }}
          animate={reduce ? undefined : { scale: 1.12 }}
          transition={{ duration: 20, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-espresso/70" />
      </motion.div>

      <motion.div
        style={{ y: contenidoY, opacity: fade }}
        className="relative z-10 mx-auto w-full max-w-3xl px-5 py-28 text-center md:px-8"
      >
        <motion.p
          {...up(0)}
          className="text-xs font-medium uppercase tracking-[0.3em] text-cream/70"
        >
          Café de especialidad · tueste propio
        </motion.p>
        <motion.h1
          {...up(0.1)}
          className="mt-6 font-display text-5xl font-medium leading-[1.05] tracking-tight text-cream md:text-7xl"
        >
          El café que se toma <em className="italic text-accent-soft">despacio</em>
        </motion.h1>
        <motion.p {...up(0.2)} className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-cream/80">
          Granos de origen, métodos de filtrado y una sala donde el tiempo se sirve por tazas.
          Te esperamos en el centro.
        </motion.p>
        <motion.div {...up(0.3)} className="mt-10 flex flex-wrap justify-center gap-3">
          <Button tone="dark" onClick={onReservar}>Reservar mesa</Button>
          <Button tone="dark" variant="ghost" onClick={() => scrollTo('#carta')}>
            Ver la carta
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        style={{ opacity: fade }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-cream/60"
      >
        <motion.span
          className="block h-10 w-px bg-cream/50"
          animate={reduce ? undefined : { scaleY: [0, 1, 0.6], originY: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  )
}
