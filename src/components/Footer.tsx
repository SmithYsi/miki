import { Button } from './Button'
import { useHorarios } from '../lib/useHorarios'
import { resumenHorario } from '../lib/horario'
import { CONTACT } from '../lib/contact'

export function Footer({ onReservar }: { onReservar: () => void }) {
  const { horarios } = useHorarios()
  const resumen = resumenHorario(horarios)
  return (
    <footer className="bg-black text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3 md:px-8">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight">
            Café <span className="italic text-accent-soft">Miki</span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
            Café de especialidad, tueste propio y una sala para tomarse el tiempo.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/50">Visítanos</h3>
          <address className="mt-4 space-y-2 text-sm not-italic leading-relaxed text-cream/80">
            <p>{CONTACT.address}</p>
            <p>
              <a href={CONTACT.phoneHref} className="transition-colors hover:text-accent-soft">
                {CONTACT.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${CONTACT.email}`} className="transition-colors hover:text-accent-soft">
                {CONTACT.email}
              </a>
            </p>
          </address>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-cream/50">Horario</h3>
          <p className="mt-4 text-sm text-cream/80">
            {resumen}
          </p>
          <Button tone="dark" className="mt-6" onClick={onReservar}>
            Reservar mesa
          </Button>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-xs text-cream/50 md:px-8">
          <p>© {new Date().getFullYear()} Café Miki. Hecho con café.</p>
          <a href="#inicio" className="transition-colors hover:text-cream">
            Volver arriba
          </a>
        </div>
      </div>
    </footer>
  )
}
