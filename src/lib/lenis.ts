import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

/** Inicializa el smooth scroll global sincronizado con GSAP. Devuelve false si el usuario prefiere motion reducido. */
export function initLenis(): boolean {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return !!lenis
  lenis = new Lenis({ lerp: 0.09 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  return true
}

/** Scroll programático pasando por Lenis (anclas y botones). */
export function scrollTo(href: string) {
  const el = document.querySelector(href)
  if (!el) return
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -64 })
  else (el as HTMLElement).scrollIntoView()
}
