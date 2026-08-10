import { Button } from './Button'
import { Reveal } from './Reveal'
import { useHorarios } from '../lib/useHorarios'
import { resumenHorario } from '../lib/horario'
import { CONTACT } from '../lib/contact'
import { FormularioContacto } from './FormularioContacto'

const DIRECCION_ENC = encodeURIComponent(`${CONTACT.address}, ${CONTACT.city}`)
const MAPA_URL = `https://maps.google.com/maps?q=${DIRECCION_ENC}&hl=es&z=16&output=embed`
const COMO_LLEGAR_URL = `https://www.google.com/maps/dir/?api=1&destination=${DIRECCION_ENC}`

const SOCIALES = [
  {
    nombre: 'Instagram',
    href: 'https://instagram.com',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  },
  {
    nombre: 'Facebook',
    href: 'https://facebook.com',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    nombre: 'X',
    href: 'https://x.com',
    path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  },
]

export function Contacto({ onReservar }: { onReservar: () => void }) {
  const { horarios } = useHorarios()
  const resumen = resumenHorario(horarios)
  return (
    <section id="contacto" className="bg-cream py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 md:px-8 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Contacto</p>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-tight text-espresso md:text-5xl">
            Ven a vernos
          </h2>
          <address className="mt-8 space-y-5 not-italic text-mocha">
            <p className="leading-relaxed">
              {CONTACT.address}
              <br />
              {CONTACT.city}
            </p>
            <p>
              <a href={CONTACT.phoneHref} className="font-medium text-espresso transition-colors hover:text-accent">
                {CONTACT.phone}
              </a>
              <br />
              <a
                href={`mailto:${CONTACT.email}`}
                className="font-medium text-espresso transition-colors hover:text-accent"
              >
                {CONTACT.email}
              </a>
            </p>
            <p>{resumen}</p>
          </address>

          <div className="mt-8 flex items-center gap-6">
            {SOCIALES.map((s) => (
              <a
                key={s.nombre}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.nombre}
                className="text-espresso transition-colors hover:text-accent"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>

          <div className="mt-10 border-t border-espresso/15 pt-8">
            <p className="max-w-sm text-sm leading-relaxed text-mocha">
              Para grupos grandes o catas privadas, escribe con dos semanas de anticipación.
            </p>
            <Button className="mt-5" onClick={onReservar}>
              Reservar mesa
            </Button>
          </div>
        </Reveal>

        <div className="space-y-10">
          <Reveal delay={0.1} className="min-h-[320px]">
            <div className="relative flex h-full min-h-[320px] flex-col lg:h-[520px]">
              <iframe
                src={MAPA_URL}
                title="Mapa de ubicación de Café Miki en la Colonia Roma Norte, Ciudad de México"
                aria-label="Mapa de ubicación de Café Miki"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="h-[320px] w-full flex-1 border-0 lg:h-full"
              />
              <div className="border border-espresso/10 bg-cream/95 p-5 backdrop-blur-sm lg:absolute lg:bottom-5 lg:left-5 lg:max-w-xs">
                <p className="font-display text-lg leading-snug text-espresso">{CONTACT.address}</p>
                <p className="mt-0.5 text-sm text-mocha">{CONTACT.city}</p>
                <a
                  href={COMO_LLEGAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 border border-espresso/25 px-5 py-2.5 text-sm font-medium tracking-wide text-espresso transition-colors hover:border-accent hover:text-accent"
                >
                  Cómo llegar →
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <FormularioContacto />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
