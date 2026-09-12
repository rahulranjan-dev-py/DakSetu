import { useState } from 'react'
import { ChevronDown, ChevronUp, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CalcResult } from '@/domain/engine.ts'
import { formatINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'
import { CONFIG } from '@/domain/config.ts'
import { cn } from '@/lib/utils'

export function YearTable({ result, compact = true }: { result: CalcResult; compact?: boolean }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(!compact)
  const rows = open ? result.years : result.years.slice(0, 5)
  const showGst = CONFIG.gst.firstYear > 0 || CONFIG.gst.renewal > 0
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>
          <Table2 size={14} /> {t('table.title')}
        </CardTitle>
        {compact && (
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
            {open ? t('table.hide') : t('table.show')} {open ? <ChevronUp /> : <ChevronDown />}
          </Button>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-2">
        <table className="w-full min-w-[520px] text-xs">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="px-3 py-1.5 text-left">{t('table.year')}</th>
              <th className="px-2 py-1.5 text-left">{t('table.age')}</th>
              <th className="px-2 py-1.5 text-right">{t('table.premium')}</th>
              {showGst && <th className="px-2 py-1.5 text-right">{t('table.gst')}</th>}
              <th className="px-2 py-1.5 text-right">{t('table.total')}</th>
              <th className="px-2 py-1.5 text-right">{t('table.cumulative')}</th>
              <th className="px-2 py-1.5 text-right">{t('table.benefit')}</th>
              <th className="px-3 py-1.5 text-right">{t('table.cover')}</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.map((r) => (
              <tr key={r.year} className={cn('border-t border-slate-100', r.inflow > 0 && 'bg-gold-50/60')}>
                <td className="px-3 py-1.5 font-semibold text-slate-700">{r.year}</td>
                <td className="px-2 py-1.5 text-slate-500">{r.age}</td>
                <td className="px-2 py-1.5 text-right">{r.base ? formatINR(r.base) : '—'}</td>
                {showGst && <td className="px-2 py-1.5 text-right text-slate-500">{r.gst ? formatINR(r.gst, { decimals: true }) : '—'}</td>}
                <td className="px-2 py-1.5 text-right font-semibold">{r.total ? formatINR(r.total, { decimals: true }) : '—'}</td>
                <td className="px-2 py-1.5 text-right text-slate-500">{formatINR(r.cumulative)}</td>
                <td className="px-2 py-1.5 text-right font-bold text-postal-700">{r.inflow ? formatINR(r.inflow) : '—'}</td>
                <td className="px-3 py-1.5 text-right text-slate-500">{formatINR(r.lifeCover)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
