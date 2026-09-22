import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function StatRow({
  label,
  value,
  sub,
  emphasis,
  className,
}: {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  emphasis?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3 py-1.5', className)}>
      <div className="min-w-0">
        <div className={cn('text-sm', emphasis ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400')}>{label}</div>
        {sub && <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
      </div>
      <div className={cn('shrink-0 tabular', emphasis ? 'text-base font-bold text-slate-900 dark:text-slate-100' : 'text-sm font-semibold text-slate-800 dark:text-slate-200')}>
        {value}
      </div>
    </div>
  )
}
