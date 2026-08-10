import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { enviarContacto } from '../lib/api'
import { Button } from './Button'

const schema = z.object({
  nombre: z.string().min(2, 'Escribe tu nombre'),
  email: z.email('Escribe un correo válido'),
  mensaje: z.string().max(1000, 'El mensaje es muy largo').optional(),
  newsletter: z.boolean(),
})

interface Valores {
  nombre: string
  email: string
  mensaje: string
  newsletter: boolean
}
type Errores = Partial<Record<keyof Valores, string>>

const INICIAL: Valores = { nombre: '', email: '', mensaje: '', newsletter: false }

export function FormularioContacto() {
  const [valores, setValores] = useState<Valores>(INICIAL)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  const set = (campo: keyof Valores) => (e: { target: { value: string } }) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const r = schema.safeParse(valores)
    if (!r.success) {
      const er: Errores = {}
      for (const issue of r.error.issues) {
        const campo = issue.path[0] as keyof Valores
        if (campo !== undefined && !er[campo]) er[campo] = issue.message
      }
      setErrores(er)
      return
    }
    setEnviando(true)
    try {
      await enviarContacto(r.data)
      setEnviado(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos enviar tu mensaje. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="w-full max-w-md border border-espresso/10 bg-cream p-6 sm:p-8">
      {enviado ? (
        <div>
          <p
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl text-cream"
            aria-hidden="true"
          >
            ✓
          </p>
          <h3 className="mt-4 font-display text-2xl font-medium text-espresso">
            ¡Gracias, {valores.nombre.split(' ')[0]}!
          </h3>
          <p className="mt-3 leading-relaxed text-mocha">
            Recibimos tu mensaje. Te contestamos pronto
            {valores.newsletter ? ' y te avisaremos de novedades y eventos' : ''}.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setEnviado(false)
              setValores(INICIAL)
            }}
          >
            Escribir otro mensaje
          </Button>
        </div>
      ) : (
        <form onSubmit={alEnviar} noValidate>
          <h3 className="font-display text-2xl font-medium text-espresso">Escríbenos</h3>
          <p className="mt-2 text-sm leading-relaxed text-mocha">
            Dudas, pedidos especiales o solo saludar. Respondemos en menos de 24 h.
          </p>
          <div className="mt-6 space-y-5">
            <Campo label="Nombre" error={errores.nombre}>
              <input
                type="text"
                autoComplete="name"
                value={valores.nombre}
                onChange={set('nombre')}
                className={inputCls(!!errores.nombre)}
                placeholder="Tu nombre"
              />
            </Campo>
            <Campo label="Correo" error={errores.email}>
              <input
                type="email"
                autoComplete="email"
                value={valores.email}
                onChange={set('email')}
                className={inputCls(!!errores.email)}
                placeholder="tucorreo@ejemplo.mx"
              />
            </Campo>
            <Campo label="Mensaje (opcional)" error={errores.mensaje}>
              <textarea
                rows={4}
                value={valores.mensaje}
                onChange={set('mensaje')}
                className={inputCls(!!errores.mensaje)}
                placeholder="Cuéntanos en qué te podemos ayudar…"
              />
            </Campo>

            <label className="flex items-start gap-3 text-sm text-mocha">
              <input
                type="checkbox"
                checked={valores.newsletter}
                onChange={(e) => setValores((v) => ({ ...v, newsletter: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
              />
              <span>Quiero recibir novedades y eventos por correo</span>
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-800">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? 'Enviando…' : 'Enviar mensaje'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-espresso">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error && (
        <span role="alert" className="mt-1.5 block text-sm text-red-800">
          {error}
        </span>
      )}
    </label>
  )
}

const inputCls = (invalido: boolean) =>
  `w-full border bg-cream px-3 py-2.5 text-base text-espresso placeholder:text-mocha/50 focus:outline-none focus:ring-2 focus:ring-accent ${
    invalido ? 'border-red-700' : 'border-espresso/25'
  }`
