import { useCallback, useState } from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { useHash } from './lib/useHash'
import { Admin } from './components/Admin'
import { Carta } from './components/Carta'
import { Contacto } from './components/Contacto'
import { Eventos } from './components/Eventos'
import { Footer } from './components/Footer'
import { Galeria } from './components/Galeria'
import { Hero } from './components/Hero'
import { Historia } from './components/Historia'
import { Horarios } from './components/Horarios'
import { ModalReserva } from './components/ModalReserva'
import { Navbar } from './components/Navbar'
import { Origenes } from './components/Origenes'
import { Taza } from './components/Taza'
import { Testimonios } from './components/Testimonios'
import { Asistente } from './components/Asistente'

function App() {
  const [reservaAbierta, setReservaAbierta] = useState(false)
  const cerrarReserva = useCallback(() => setReservaAbierta(false), [])
  const hash = useHash()

  // Vista admin completa (sin Navbar/Footer del landing)
  if (hash === '#/admin') return <Admin />

  return (
    <LazyMotion features={domAnimation}>
      <Navbar onReservar={() => setReservaAbierta(true)} />
      <main>
        <Hero onReservar={() => setReservaAbierta(true)} />
        <Taza />
        <Historia />
        <Origenes onReservar={() => setReservaAbierta(true)} />
        <Carta />
        <Eventos />
        <Horarios />
        <Galeria />
        <Testimonios />
        <Contacto onReservar={() => setReservaAbierta(true)} />
      </main>
      <Footer onReservar={() => setReservaAbierta(true)} />
      <ModalReserva key={reservaAbierta ? 'abierta' : 'cerrada'} abierto={reservaAbierta} onCerrar={cerrarReserva} />
      <Asistente />
    </LazyMotion>
  )
}

export default App
