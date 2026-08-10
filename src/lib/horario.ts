import type { Horario } from './types'

const ORDEN = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

const unirDias = (dias: string[]) =>
  dias.length === 1 ? dias[0] : `${dias.slice(0, -1).join(', ')} y ${dias[dias.length - 1]}`

/** Resumen de horario en una línea, derivado de la API: días con mismo horario agrupados. */
export function resumenHorario(horarios: Horario[]) {
  const abiertos = horarios.filter((h) => !h.closed && h.open && h.close)
  if (abiertos.length === 0) return 'Consulta nuestros horarios'

  const orden = (h: Horario) => ORDEN.indexOf(h.day.toLowerCase())
  const grupos = new Map<string, string[]>()
  for (const h of [...abiertos].sort((a, b) => orden(a) - orden(b))) {
    const k = `${h.open}–${h.close}`
    grupos.set(k, [...(grupos.get(k) ?? []), h.day])
  }

  const partes = [...grupos.entries()].map(([horario, dias]) => `${unirDias(dias)} ${horario}`)
  const cerrados = horarios.filter((h) => h.closed).sort((a, b) => orden(a) - orden(b))
  if (cerrados.length) partes.push(`${unirDias(cerrados.map((h) => h.day))} cerrado`)
  return partes.join(' · ')
}
