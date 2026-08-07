import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initLenis, scrollTo } from './lib/lenis'
import './index.css'
import App from './App.tsx'

initLenis()
// El scroll programático (anclas #sección) debe pasar por Lenis para que no haga salto.
// Respetamos Ctrl/Cmd+Click (nueva pestaña) y anclas vacías.
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
  if (a) {
    const href = a.getAttribute('href')!
    if (!href || href === '#') return
    const el = document.querySelector(href)
    if (el) {
      e.preventDefault()
      scrollTo(href)
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
