import { cn } from '@/lib/utils'

export interface SegmentedOption<T extends string | number> {
  value: T
  label: string
  hint?: string
}

interface Props<T extends string | number> {
  value: T
  onChange: (v: T) => void
  options: SegmentedOption<T>[]
  className?: string
  columns?: number
}

/** Chip / segmented control – large touch targets for field use. */
export function Segmented<T extends string | number>({ value, onChange, options, className, columns }: Props<T>) {
  return (
    <div
      role="radiogroup"
      className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${columns ?? Math.min(options.length, 4)}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex min-h-11 flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'border-postal-600 bg-postal-50 dark:bg-postal-950/40 text-postal-700 dark:text-postal-300 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800',
            )}
          >
            <span className="tabular">{o.label}</span>
            {o.hint && <span className={cn('text-[10px] font-medium', active ? 'text-postal-600 dark:text-postal-300' : 'text-slate-500 dark:text-slate-400')}>{o.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}
