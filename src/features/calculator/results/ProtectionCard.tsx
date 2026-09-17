import { HeartPulse } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CalcResult } from '@/domain/engine.ts'
import { formatINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'

export function ProtectionCard({ result }: { result: CalcResult }) {
  const { t } = useI18n()
  const years = [1, 5, 10, 20].filter((y) => y < result.term)
  const points = [...years.map((y) => result.years[y - 1]), result.years[result.term - 1]].filter(Boolean)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <HeartPulse size={14} /> {t('protection.title')}
        </CardTitle>
        <CardDescription>{t('protection.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {points.map((row) => (
          <div key={row.year} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{row.year === 1 ? t('protection.today') : t('protection.year', { n: row.year })}</div>
            <div className="tabular text-sm font-bold text-slate-900 dark:text-slate-100">{formatINR(row.lifeCover)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
