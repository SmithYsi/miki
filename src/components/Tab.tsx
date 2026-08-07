interface Props {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  /** 'light' para secciones claras (fondo latte), 'dark' para oscuras (fondo night). */
  tone?: 'light' | 'dark'
}

export function Tab({ selected, onClick, children, tone = 'light' }: Props) {
  const cls =
    tone === 'dark'
      ? selected
        ? 'border-cream bg-cream text-night'
        : 'border-cream/30 text-cream hover:border-accent-soft hover:text-accent-soft'
      : selected
        ? 'border-espresso bg-espresso text-cream'
        : 'border-espresso/25 text-espresso hover:border-accent hover:text-accent'
  return (
    <button role="tab" aria-selected={selected} onClick={onClick} className={`border px-4 py-2 text-sm transition-colors ${cls}`}>
      {children}
    </button>
  )
}
