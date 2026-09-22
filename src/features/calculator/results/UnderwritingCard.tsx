import { BadgeCheck, Stethoscope } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CalcResult } from '@/domain/engine.ts'
import { formatINR } from '@/domain/format.ts'
import { useI18n } from '@/i18n'

export function UnderwritingCard({ result }: { result: CalcResult }) {
  const { t } = useI18n()
  const m = result.medical
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Stethoscope size={14} /> {t('uw.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={m.required ? 'amber' : 'green'}>
            {m.required ? <Stethoscope size={12} /> : <BadgeCheck size={12} />}
            {m.required ? t('uw.medical') : t('uw.nonMedical')}
          </Badge>
          <span>
            {result.plan.kind === 'AEA'
              ? t('uw.aea')
              : m.nonMedicalLimit > 0
                ? t('uw.limit', { amt: formatINR(m.nonMedicalLimit) })
                : t('uw.medical')}
          </span>
        </div>
        <p>{t('uw.tax')}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('uw.income')}</p>
      </CardContent>
    </Card>
  )
}
