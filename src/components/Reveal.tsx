import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { EASE, viewportOnce } from '../lib/motion'

interface Props {
  children: ReactNode
  className?: string
  delay?: number
  /** Dirección de entrada. `up` (default) o desde los lados. */
  from?: 'up' | 'left' | 'right'
}

const OFFSET = { up: { y: 28 }, left: { x: -40 }, right: { x: 40 } }

/** Reveal al entrar en viewport; colapsa a estático con prefers-reduced-motion. */
export function Reveal({ children, className, delay = 0, from = 'up' }: Props) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, ...OFFSET[from] }}
      whileInView={reduce ? undefined : { opacity: 1, x: 0, y: 0 }}
      viewport={viewportOnce}
      transition={reduce ? undefined : { duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}
