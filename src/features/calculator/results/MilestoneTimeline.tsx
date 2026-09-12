import { Flag, Gift, Milestone as MilestoneIcon, PauseCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CalcResult } from '@/domain/engine.ts'
import { formatINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

export function MilestoneTimeline({ result }: { result: CalcResult }) {
  const { t } = useI18n()
  const isMoneyBack = result.milestones.some((m) => m.kind === 'survival')
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <MilestoneIcon size={14} /> {t('timeline.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative ml-3 border-l-2 border-dashed border-slate-200">
          {result.milestones.map((m, i) => {
            const isFinal = m.kind === 'maturity'
            const Icon = m.kind === 'survival' ? Gift : m.kind === 'conversion' ? RefreshCw : m.kind === 'premiumEnd' ? PauseCircle : Flag
            const title =
              m.kind === 'survival'
                ? t('timeline.survival', { pct: m.pct ?? 0 })
                : m.kind === 'conversion'
                  ? t('timeline.conversion')
                  : m.kind === 'premiumEnd'
                    ? t('timeline.premiumEnd')
                    : isMoneyBack
                      ? t('timeline.maturityFinal', { pct: m.pct ?? 100 })
                      : t('timeline.maturity')
            return (
              <li key={i} className={cn('relative pl-6', i < result.milestones.length - 1 ? 'pb-4' : '')}>
                <span
                  className={cn(
                    'absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white',
                    isFinal ? 'bg-postal-600 text-white' : m.kind === 'survival' ? 'bg-gold-500 text-slate-900' : 'bg-slate-200 text-slate-600',
                  )}
                >
                  <Icon size={12} />
                </span>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {t('timeline.year', { n: m.year })} · {t('timeline.age', { n: m.age })}
                    </div>
                    <div className={cn('text-sm font-semibold', isFinal ? 'text-postal-800' : 'text-slate-800')}>{title}</div>
                    {m.bonusPart ? <div className="text-[11px] text-slate-500">{t('timeline.bonusIncl', { amt: formatINR(m.bonusPart) })}</div> : null}
                    {m.kind === 'premiumEnd' && (
                      <div className="text-[11px] text-slate-500">{t('timeline.premiumEndValue', { age: result.maturityAge })}</div>
                    )}
                    {isFinal && result.maturity.survivalPaid > 0 && (
                      <div className="text-[11px] text-slate-500">{t('timeline.netFinal', { paid: formatINR(result.maturity.survivalPaid) })}</div>
                    )}
                  </div>
                  {m.amount > 0 && (
                    <div className={cn('shrink-0 tabular text-base font-bold', isFinal ? 'text-postal-700' : 'text-slate-900')}>{formatINR(m.amount)}</div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
