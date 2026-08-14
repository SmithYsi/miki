import Lenis from 'lenis'

let lenis: Lenis | null = null

/** Inicializa el smooth scroll. Devuelve false si el usuario prefiere motion reducido. */
export function initLenis(): boolean {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return !!lenis
  lenis = new Lenis({ lerp: 0.09 })
  const loop = (time: number) => {
    lenis?.raf(time)
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
  return true
}

/** Scroll programático pasando por Lenis (anclas y botones). */
export function scrollTo(href: string) {
  const el = document.querySelector(href)
  if (!el) return
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -64 })
  else (el as HTMLElement).scrollIntoView()
}
