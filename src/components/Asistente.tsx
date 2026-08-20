import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { enviarAsistente } from '../lib/api'
import type { AsistenteResponse } from '../lib/types'

interface Mensaje {
  role: 'user' | 'assistant'
  content: string
}

export function Asistente() {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { role: 'assistant', content: '¡Hola! Soy el asistente de Café Miki. Puedo ayudarte con reservas, horarios, precios o eventos. ¿En qué te puedo ayudar?' },
  ])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensajes, cargando])

  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [abierto])

  const enviar = useCallback(async () => {
    const texto = input.trim()
    if (!texto || cargando) return

    const userMsg: Mensaje = { role: 'user', content: texto }
    setMensajes((prev) => [...prev, userMsg])
    setInput('')
    setCargando(true)

    try {
      const res: AsistenteResponse = await enviarAsistente({ conversationId, message: texto })
      setConversationId(res.conversationId)
      setMensajes((prev) => [...prev, { role: 'assistant', content: res.reply }])
    } catch {
      setMensajes((prev) => [
        ...prev,
        { role: 'assistant', content: 'Hubo un error de conexión. Intenta de nuevo.' },
      ])
    } finally {
      setCargando(false)
    }
  }, [input, cargando, conversationId])

  const alEnviar = (e: React.FormEvent) => {
    e.preventDefault()
    enviar()
  }

  const alKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto((a) => !a)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-espresso text-cream shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 motion-safe:transition-none dark:bg-cream dark:text-night"
        aria-label={abierto ? 'Cerrar chat' : 'Abrir asistente de chat'}
      >
        {abierto ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {abierto && (
          <m.div
            initial={reduced ? false : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-50 flex w-[340px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-bone/15 bg-night shadow-2xl sm:w-[380px]"
          >
            <div className="flex items-center gap-3 border-b border-bone/10 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-cream">
                CM
              </div>
              <div>
                <p className="font-display text-sm font-medium text-bone">Café Miki</p>
                <p className="text-xs text-bone-dim">Asistente virtual</p>
              </div>
            </div>

            <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: '360px' }}>
              <div className="flex flex-col gap-3">
                {mensajes.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-accent text-cream rounded-br-md'
                          : 'bg-raise text-bone border border-bone/10 rounded-bl-md'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {cargando && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md border border-bone/10 bg-raise px-4 py-3">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-bone-dim [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-bone-dim [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-bone-dim [animation-delay:300ms]" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={alEnviar} className="border-t border-bone/10 px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={alKeyDown}
                  placeholder="Escribe tu mensaje..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-bone/15 bg-raise px-3 py-2 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none"
                  style={{ minHeight: '38px', maxHeight: '100px' }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || cargando}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-cream transition-colors hover:bg-accent/80 disabled:opacity-40"
                  aria-label="Enviar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </form>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
