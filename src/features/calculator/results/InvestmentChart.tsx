import { useState } from 'react'
import { PiggyBank, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CalcResult } from '@/domain/engine.ts'
import { formatINR, formatPct, formatShortINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

/**
 * Validated categorical palette (light surface): premiums, GST, sum assured, bonus.
 * Every segment is also direct-labelled, so identity never relies on colour alone.
 */
const COLORS = {
  premiums: '#951A23',
  gst: '#E3646E',
  sa: '#8D5B00',
  bonus: '#DE911D',
} as const

type SegKey = keyof typeof COLORS

interface Segment {
  key: SegKey
  label: string
  value: number
}

function Bar({
  title,
  total,
  segments,
  max,
  lang,
  accent,
}: {
  title: string
  total: number
  segments: Segment[]
  max: number
  lang: 'en' | 'hi'
  accent: string
}) {
  const [hover, setHover] = useState<SegKey | null>(null)
  const widthPct = max > 0 ? (total / max) * 100 : 0
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
        <span className={cn('tabular text-lg font-extrabold', accent)}>{formatINR(total)}</span>
      </div>
      <div className="h-7 w-full rounded-md bg-slate-100">
        <div className="flex h-full gap-[2px] overflow-hidden rounded-md" style={{ width: `${Math.max(widthPct, 2)}%` }}>
          {segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.key}
                role="img"
                aria-label={`${s.label}: ${formatINR(s.value)}`}
                title={`${s.label}: ${formatINR(s.value)}`}
                onMouseEnter={() => setHover(s.key)}
                onMouseLeave={() => setHover(null)}
                className="relative h-full min-w-[3px] transition-opacity"
                style={{
                  flex: `${s.value} 0 0`,
                  backgroundColor: COLORS[s.key],
                  opacity: hover && hover !== s.key ? 0.55 : 1,
                }}
              />
            ))}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
        {segments.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[s.key] }} />
            {s.label} <span className="tabular font-semibold text-slate-800">{formatShortINR(s.value, lang)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function InvestmentChart({ result }: { result: CalcResult }) {
  const { t, lang } = useI18n()
  const pay = result.totals.outgo
  const get = result.maturity.totalBenefit
  const max = Math.max(pay, get)
  const multiple = pay > 0 ? get / pay : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <PiggyBank size={14} /> {t('invest.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Bar
          title={t('invest.pay')}
          total={pay}
          max={max}
          lang={lang}
          accent="text-slate-900"
          segments={[
            { key: 'premiums', label: t('invest.premiums'), value: result.totals.basePremiums },
            { key: 'gst', label: t('invest.gst'), value: result.totals.gst },
          ]}
        />
        <Bar
          title={t('invest.get')}
          total={get}
          max={max}
          lang={lang}
          accent="text-postal-700"
          segments={[
            { key: 'sa', label: t('invest.sa'), value: result.maturity.sumAssured },
            { key: 'bonus', label: t('invest.bonus'), value: result.bonus.total },
          ]}
        />
        <div className="grid grid-cols-3 gap-2 border-t border-dashed border-slate-200 pt-3">
          <div>
            <div className="text-[11px] text-slate-500">{t('invest.gain')}</div>
            <div className="tabular text-sm font-bold text-emerald-700">{formatINR(result.maturity.netGain)}</div>
            <div className="text-[10px] text-slate-400">{t('invest.times', { n: multiple.toFixed(2) })}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">{t('invest.roi')}</div>
            <div className="tabular text-sm font-bold text-slate-900">{formatPct(result.returns.roi, 0)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <TrendingUp size={11} /> {t('invest.irr')}
            </div>
            <div className="tabular text-sm font-bold text-slate-900">
              {result.returns.irr === null ? t('common.na') : formatPct(result.returns.irr, 2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
