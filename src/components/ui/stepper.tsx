import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  id?: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  className?: string
  'aria-label'?: string
}

/** Numeric input with large −/+ touch targets (replaces sliders on the field form). */
export function Stepper({ id, value, onChange, min, max, step = 1, className, ...rest }: Props) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  return (
    <div className={cn('flex h-11 items-stretch overflow-hidden rounded-xl border border-input bg-white shadow-sm dark:bg-slate-900', className)}>
      <button
        type="button"
        aria-label="decrease"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="flex w-11 items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Minus size={16} />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!Number.isNaN(n)) onChange(n)
        }}
        onBlur={() => onChange(clamp(value))}
        className="w-full min-w-0 border-x border-input bg-transparent text-center text-lg font-bold tabular focus:outline-none"
        aria-label={rest['aria-label']}
      />
      <button
        type="button"
        aria-label="increase"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="flex w-11 items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
