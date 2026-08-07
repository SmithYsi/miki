import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost'
type Tone = 'light' | 'dark'

const styles: Record<Variant, { light: string; dark: string }> = {
  primary: {
    light: 'bg-espresso text-cream hover:bg-accent',
    dark: 'bg-cream text-night hover:bg-accent-soft',
  },
  ghost: {
    light: 'border border-espresso/25 text-espresso hover:border-accent hover:text-accent',
    dark: 'border border-cream/40 text-cream hover:border-cream hover:text-cream',
  },
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** 'light' para fondos claros, 'dark' para fondos oscuros. Default: light. */
  tone?: Tone
}

export function Button({ variant = 'primary', tone = 'light', className = '', children, ...rest }: Props) {
  // Flecha → solo en primary y si el label no la incluye ya
  const conFlecha = variant === 'primary' && typeof children === 'string' && !children.includes('→')
  return (
    <button
      type="button"
      className={`group inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium tracking-wide transition-colors duration-200 active:scale-[0.98] ${styles[variant][tone]} ${className}`}
      {...rest}
    >
      {children}
      {conFlecha && (
        <span
          aria-hidden="true"
          className="inline-block transition-transform duration-200 motion-safe:group-hover:translate-x-1"
        >
          →
        </span>
      )}
    </button>
  )
}
