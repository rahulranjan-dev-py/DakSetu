import { useMemo, useState } from 'react'
import { AlertTriangle, CircleCheck, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { StatRow } from '@/components/ui/stat'
import { calculateFine, monthsBetween } from '@/domain/fine.ts'
import { formatINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function FineCalculator() {
  const { t } = useI18n()
  const today = new Date()
  const threeBack = new Date(today.getFullYear(), today.getMonth() - 3, 1)
  const [premium, setPremium] = useState(1250)
  const [dueMonth, setDueMonth] = useState(ym(threeBack))
  const [payDate, setPayDate] = useState(today.toISOString().slice(0, 10))
  const [instalments, setInstalments] = useState(3)
  const [over3, setOver3] = useState(true)

  const months = useMemo(() => {
    const due = new Date(dueMonth + '-01T00:00:00')
    const paid = new Date(payDate + 'T00:00:00')
    if (Number.isNaN(due.getTime()) || Number.isNaN(paid.getTime())) return 0
    return monthsBetween(due, paid)
  }, [dueMonth, payDate])

  const fine = useMemo(
    () =>
      calculateFine({
        premium,
        monthsOverdue: months,
        instalmentsDue: Math.min(instalments, Math.max(1, months + 1)),
        policyOverThreeYears: over3,
      }),
    [premium, months, instalments, over3],
  )

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            <Clock size={14} /> {t('fine.title')}
          </CardTitle>
          <CardDescription>{t('fine.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div>
            <Label htmlFor="fine-premium">{t('fine.premium')}</Label>
            <Input
              id="fine-premium"
              type="number"
              inputMode="numeric"
              prefix="₹"
              value={premium}
              onChange={(e) => setPremium(Math.max(0, parseInt(e.target.value || '0', 10)))}
            />
          </div>
          <div>
            <Label htmlFor="fine-due">{t('fine.dueDate')}</Label>
            <Input id="fine-due" type="month" value={dueMonth} onChange={(e) => setDueMonth(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fine-paid">{t('fine.payDate')}</Label>
              <Input id="fine-paid" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="fine-inst">{t('fine.instalments')}</Label>
              <Input
                id="fine-inst"
                type="number"
                inputMode="numeric"
                value={instalments}
                min={1}
                onChange={(e) => setInstalments(Math.max(1, parseInt(e.target.value || '1', 10)))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('fine.over3')}</span>
            <Switch checked={over3} onCheckedChange={setOver3} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('fine.rule')}</p>
        </CardContent>
      </Card>

      <Card className={cn(fine.lapsed ? 'border-red-300 dark:border-red-700' : 'border-emerald-200 dark:border-emerald-800')}>
        <CardContent className="pt-4">
          <div
            className={cn(
              'mb-3 flex items-start gap-2 rounded-xl p-3 text-sm',
              fine.lapsed ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200',
            )}
          >
            {fine.lapsed ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <CircleCheck size={18} className="mt-0.5 shrink-0" />}
            <span>{fine.lapsed ? t('fine.lapsed', { n: fine.lapseAfterMonths }) : t('fine.lapseIn', { n: fine.monthsToLapse })}</span>
          </div>
          <StatRow label={t('fine.monthsOverdue')} value={months} />
          <StatRow label={t('fine.arrears')} value={formatINR(fine.arrears)} />
          {fine.gstOnArrears > 0 && <StatRow label={t('fine.gst')} value={formatINR(fine.gstOnArrears, { decimals: true })} />}
          {fine.lapsed ? (
            <StatRow
              label={t('fine.revivalInterest', { pct: fine.revivalInterestRate * 100 })}
              value={formatINR(fine.revivalInterest, { decimals: true })}
            />
          ) : (
            <>
              <StatRow label={t('fine.feePerMonth')} value={formatINR(fine.feePerInstalmentPerMonth)} />
              <StatRow label={t('fine.totalFee')} value={formatINR(fine.totalFee)} />
            </>
          )}
          <div className="my-2 border-t border-dashed" />
          <StatRow label={t('fine.total')} value={formatINR(fine.totalPayable, { decimals: true })} emphasis />
          {fine.lapsed && !fine.revivable && (
            <p className="mt-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-2 text-[11px] font-semibold text-red-700 dark:text-red-300">{t('fine.notRevivable', { n: fine.revivalWindowMonths })}</p>
          )}
          {fine.lapsed && fine.revivable && <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{t('fine.revivalNote')}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
