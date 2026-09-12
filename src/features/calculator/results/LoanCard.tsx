import { Landmark } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CalcResult } from '@/domain/engine.ts'
import { CONFIG } from '@/domain/config.ts'
import { formatINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'

export function LoanCard({ result }: { result: CalcResult }) {
  const { t } = useI18n()
  const rows = result.loan.schedule
  const loanAllowed = result.loan.eligibleAfterYears !== null
  const picks = [3, 4, 5, 10, 15, 20, 25, 30]
  const shown = rows.filter((r, i) => picks.includes(r.year) || i === rows.length - 1).slice(0, 7)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Landmark size={14} /> {t('loan.title')}
        </CardTitle>
        <CardDescription className="flex flex-wrap gap-1.5 pt-1">
          {loanAllowed ? (
            <Badge variant="green">{t('loan.eligibleAfter', { n: result.loan.eligibleAfterYears ?? 0 })}</Badge>
          ) : (
            <Badge variant="red">{t('loan.notAvailable')}</Badge>
          )}
          <Badge variant="slate">{t('loan.surrenderAfter', { n: result.plan.surrenderAfterYears })}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-slate-500">
              <th className="py-1 text-left font-semibold">{t('loan.year')}</th>
              <th className="py-1 text-right font-semibold">{t('loan.surrender')}</th>
              {loanAllowed && (
                <th className="py-1 text-right font-semibold">{t('loan.loan', { pct: CONFIG.loan.pctOfSurrender * 100 })}</th>
              )}
            </tr>
          </thead>
          <tbody className="tabular">
            {shown.map((r) => (
              <tr key={r.year} className="border-t border-slate-100">
                <td className="py-1.5 font-semibold text-slate-700">{r.year}</td>
                <td className="py-1.5 text-right text-slate-700">{formatINR(r.surrenderValue)}</td>
                {loanAllowed && <td className="py-1.5 text-right font-bold text-emerald-700">{formatINR(r.loanValue)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-slate-400">{t('loan.note')}</p>
      </CardContent>
    </Card>
  )
}
