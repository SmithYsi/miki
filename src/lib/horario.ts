import type { Horario } from './types'

/** Resumen de horario en una línea, derivado de la API. */
export function resumenHorario(horarios: Horario[]) {
  const abiertos = horarios.filter((h) => !h.closed && h.open && h.close)
  if (abiertos.length === 0) return 'Consulta nuestros horarios'
  const primero = abiertos[0].open!
  const ultimo = abiertos[abiertos.length - 1].close!
  const cerrados = horarios.filter((h) => h.closed).map((h) => h.day)
  const cierre = cerrados.length ? ` · ${cerrados.join(', ')} cerrado` : ''
  return `Lunes a domingo · ${primero} a ${ultimo}${cierre}`
}
