import { useEffect, useState } from 'react'
import { getHorarios } from './api'
import type { Horario } from './types'

export function useHorarios() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    getHorarios()
      .then((h) => vivo && setHorarios(h))
      .catch((e: unknown) => vivo && setError(e instanceof Error ? e.message : 'No pudimos cargar los horarios'))
    return () => {
      vivo = false
    }
  }, [intento])

  const recargar = () => {
    setError(null)
    setIntento((n) => n + 1)
  }

  return { horarios, error, recargar }
}
