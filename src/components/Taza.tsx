import { motion, useReducedMotion } from 'framer-motion'
import { Reveal } from './Reveal'

export function Taza() {
  const reduce = useReducedMotion()
  return (
    <section className="bg-black py-24 text-cream md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 md:px-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
        <div className="text-center lg:text-right">
          <Reveal from="left">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent-soft">
              La taza de la casa
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium leading-tight tracking-tight md:text-4xl">
              Hecho a mano,
              <br />
              servido con calma
            </h2>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mx-auto w-full max-w-[340px]">
          <CupAnimated reduce={reduce} />
        </Reveal>

        <div className="text-center lg:text-left">
          <Reveal from="right">
            <p className="max-w-md leading-relaxed text-cream/80">
              Cada taza empieza en el grano y termina en tu mesa: latte art, métodos
              de filtrado y la repostería que horneamos cada mañana. Ven a probar la
              diferencia que hace el tiempo.
            </p>
            <p className="mt-4 font-display text-lg text-cream/60">
              Espresso · V60 · prensa · chemex
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function CupAnimated({ reduce }: { reduce: boolean | null }) {
  return (
    <svg viewBox="0 0 200 220" fill="none" className="w-full" aria-hidden="true">
      {/* humo */}
      <g>
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M${78 + i * 22} 108 C ${66 + i * 22} 84, ${94 + i * 22} 66, ${80 + i * 22} 40`}
            stroke="#e08a55"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={reduce ? undefined : { opacity: [0, 0.8, 0], y: [-4, -10] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }}
          />
        ))}
      </g>

      {/* superficie del café */}
      <ellipse cx="100" cy="116" rx="52" ry="12" fill="#1a1a1a" />
      <ellipse cx="100" cy="113" rx="46" ry="9" fill="#2e2e2e" />

      {/* cuerpo de la taza */}
      <path d="M48 112 C 48 150, 60 170, 100 170 C 140 170, 152 150, 152 112 Z" fill="#ffffff" />
      <path d="M48 112 C 48 150, 60 170, 100 170 C 140 170, 152 150, 152 112 Z" fill="url(#tazaShade)" opacity="0.35" />

      {/* asa */}
      <path d="M152 122 C 180 124, 180 152, 152 156" stroke="#ffffff" strokeWidth="10" fill="none" strokeLinecap="round" />

      {/* borde superior */}
      <path d="M48 112 C 48 124, 152 124, 152 112" stroke="#d4d4d4" strokeWidth="3" fill="none" />

      {/* platillo */}
      <ellipse cx="100" cy="180" rx="74" ry="16" fill="#ffffff" />
      <ellipse cx="100" cy="176" rx="64" ry="12" fill="#d4d4d4" />

      <defs>
        <linearGradient id="tazaShade" x1="48" y1="112" x2="152" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#000000" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
