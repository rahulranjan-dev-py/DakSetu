import { Baby, CalendarClock, Check, Coins, HeartHandshake, RefreshCw, Shield, Smile } from 'lucide-react'
import { plansFor } from '@/domain/catalog.ts'
import type { PlanId, PlanSpec, Product } from '@/domain/types.ts'
import { formatShortINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

const ICONS: Record<PlanSpec['icon'], typeof Shield> = {
  Shield,
  Smile,
  RefreshCw,
  Coins,
  HeartHandshake,
  Baby,
  CalendarClock,
}

export function PlanPicker({
  product,
  planId,
  onSelect,
}: {
  product: Product
  planId: PlanId
  onSelect: (id: PlanId) => void
}) {
  const { t, l, lang } = useI18n()
  const plans = plansFor(product)
  return (
    <section aria-label={t('plan.choose')}>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('plan.choose')}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {plans.map((plan) => {
          const Icon = ICONS[plan.icon]
          const active = plan.id === planId
          const ageLabel =
            plan.kind === 'CHILD'
              ? t('plan.childAge', { min: plan.child!.minChildAge, max: plan.child!.maxChildAge })
              : t('plan.entryAge', { min: plan.minAge, max: plan.maxAge })
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan.id)}
              aria-pressed={active}
              className={cn(
                'group relative flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-postal-600 bg-postal-50 dark:bg-postal-950/40 shadow-sm ring-1 ring-postal-600/30'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm',
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    active ? 'bg-postal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700',
                  )}
                >
                  <Icon className="h-4.5 w-4.5" size={18} />
                </span>
                {active && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-postal-600 text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div>
                <div className={cn('text-sm font-bold leading-tight', active ? 'text-postal-800 dark:text-postal-200' : 'text-slate-900 dark:text-slate-100')}>
                  {l(plan.name)}
                </div>
                <div className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">{l(plan.tagline)}</div>
              </div>
              <div className="mt-auto flex flex-wrap gap-x-2 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                <span>{ageLabel}</span>
                <span>·</span>
                <span>{t('plan.bonus', { n: plan.bonusRate })}</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                {t('plan.sa', { min: formatShortINR(plan.minSA, lang), max: formatShortINR(plan.maxSA, lang) })}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
