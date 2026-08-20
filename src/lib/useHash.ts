import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

/** Hash de la URL (p.ej. "#/admin") sincronizado con el navegador. */
export function useHash() {
  return useSyncExternalStore(subscribe, () => window.location.hash)
}
